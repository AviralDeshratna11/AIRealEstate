from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

from app.config import get_settings

log = logging.getLogger(__name__)

CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar"
FREEBUSY_URL = "https://www.googleapis.com/calendar/v3/freeBusy"
EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/{cal_id}/events"

try:  # zoneinfo ships with Python 3.9+; tzdata provides the DB on slim images.
    from zoneinfo import ZoneInfo
except Exception:  # pragma: no cover
    ZoneInfo = None  # type: ignore[assignment]


class GoogleCalendarService:
    """Direct Google Calendar scheduler: free/busy lookup + event creation.

    Uses a service account (shared with the target calendar). Returns the same
    shapes as the Cal.com service so existing callers/UI stay unchanged, and
    falls back to deterministic demo data on any misconfiguration or error.
    """

    def __init__(self) -> None:
        self.settings = get_settings()
        self._creds: Any | None = None

    @property
    def enabled(self) -> bool:
        return bool(
            self.settings.google_calendar_id
            and (self.settings.google_service_account_json or self.settings.google_service_account_file)
        )

    def _tzinfo(self):
        tz_name = self.settings.calcom_timezone or "Asia/Kolkata"
        if ZoneInfo is not None:
            try:
                return ZoneInfo(tz_name)
            except Exception:
                log.warning("Timezone %s unavailable; using +05:30", tz_name)
        return timezone(timedelta(hours=5, minutes=30))  # Asia/Kolkata fallback

    def _load_credentials(self):
        if self._creds is not None:
            return self._creds
        from google.oauth2 import service_account  # imported lazily

        if self.settings.google_service_account_json:
            info = json.loads(self.settings.google_service_account_json)
            creds = service_account.Credentials.from_service_account_info(info, scopes=[CALENDAR_SCOPE])
        else:
            creds = service_account.Credentials.from_service_account_file(
                self.settings.google_service_account_file, scopes=[CALENDAR_SCOPE]
            )
        self._creds = creds
        return creds

    async def _access_token(self) -> str:
        import google.auth.transport.requests

        def _refresh() -> str:
            creds = self._load_credentials()
            creds.refresh(google.auth.transport.requests.Request())
            return creds.token

        return await asyncio.to_thread(_refresh)

    async def get_slots(self, days: int = 7) -> list[dict[str, Any]]:
        if not self.enabled:
            return self._demo_slots(days)
        try:
            token = await self._access_token()
            tz = self._tzinfo()
            now = datetime.now(tz)
            time_min = now
            time_max = now + timedelta(days=days)
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.post(
                    FREEBUSY_URL,
                    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                    json={
                        "timeMin": time_min.isoformat(),
                        "timeMax": time_max.isoformat(),
                        "timeZone": self.settings.calcom_timezone,
                        "items": [{"id": self.settings.google_calendar_id}],
                    },
                )
                resp.raise_for_status()
                data = resp.json()
            cal = data.get("calendars", {}).get(self.settings.google_calendar_id, {})
            if cal.get("errors"):
                # e.g. the calendar isn't shared with the service account — don't
                # present fake "all free" availability; surface via fallback.
                raise RuntimeError(f"freeBusy calendar error: {cal['errors']}")
            busy = [
                (datetime.fromisoformat(b["start"].replace("Z", "+00:00")),
                 datetime.fromisoformat(b["end"].replace("Z", "+00:00")))
                for b in cal.get("busy", [])
            ]
            return self._candidate_slots(days, tz, busy)
        except Exception:
            log.exception("Google Calendar freeBusy failed; using demo slots")
            return self._demo_slots(days)

    async def create_booking(self, name: str, email: str, start_time: str, property_title: str) -> dict[str, Any]:
        if not self.enabled:
            return self._demo_booking(start_time, property_title)
        try:
            token = await self._access_token()
            start_dt = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
            if start_dt.tzinfo is None:
                start_dt = start_dt.replace(tzinfo=self._tzinfo())
            end_dt = start_dt + timedelta(minutes=self.settings.scheduler_slot_minutes)
            # Note: a service account cannot invite attendees / send updates without
            # domain-wide delegation (403 forbiddenForServiceAccounts), so the buyer's
            # contact details go in the description instead of the attendees list.
            body = {
                "summary": f"Property Viewing: {property_title}",
                "description": f"ASTRA Estate site visit.\nBuyer: {name}\nContact: {email}",
                "start": {"dateTime": start_dt.isoformat(), "timeZone": self.settings.calcom_timezone},
                "end": {"dateTime": end_dt.isoformat(), "timeZone": self.settings.calcom_timezone},
            }
            url = EVENTS_URL.format(cal_id=self.settings.google_calendar_id)
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.post(
                    url,
                    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                    json=body,
                )
                resp.raise_for_status()
                ev = resp.json()
            return {
                "id": ev.get("id"),
                "status": ev.get("status", "confirmed"),
                "start": start_dt.isoformat(),
                "title": body["summary"],
                "html_link": ev.get("htmlLink"),
                "provider": "google",
            }
        except Exception:
            log.exception("Google Calendar event insert failed; returning demo booking")
            return self._demo_booking(start_time, property_title)

    def _candidate_slots(self, days: int, tz, busy: list[tuple[datetime, datetime]]) -> list[dict[str, Any]]:
        now = datetime.now(tz)
        slots: list[dict[str, Any]] = []
        start_h, end_h = self.settings.scheduler_start_hour, self.settings.scheduler_end_hour
        step = self.settings.scheduler_slot_minutes
        for day in range(0, max(days, 1)):
            date = (now + timedelta(days=day)).date()
            t = datetime(date.year, date.month, date.day, start_h, 0, tzinfo=tz)
            day_end = datetime(date.year, date.month, date.day, end_h, 0, tzinfo=tz)
            while t < day_end:
                slot_end = t + timedelta(minutes=step)
                if t > now and not self._overlaps(t, slot_end, busy):
                    slots.append({"time": t.isoformat(), "start": t.isoformat(),
                                  "end": slot_end.isoformat(), "available": True})
                t = slot_end
        return slots[:40]

    @staticmethod
    def _overlaps(start: datetime, end: datetime, busy: list[tuple[datetime, datetime]]) -> bool:
        s = start.astimezone(timezone.utc)
        e = end.astimezone(timezone.utc)
        for b_start, b_end in busy:
            if s < b_end.astimezone(timezone.utc) and e > b_start.astimezone(timezone.utc):
                return True
        return False

    @staticmethod
    def _demo_slots(days: int) -> list[dict[str, Any]]:
        base = datetime.now(timezone.utc).replace(hour=10, minute=0, second=0, microsecond=0)
        return [
            {"time": (base + timedelta(days=i, hours=i % 4)).isoformat(), "available": True}
            for i in range(1, min(days, 5) + 1)
        ]

    @staticmethod
    def _demo_booking(start_time: str, property_title: str) -> dict[str, Any]:
        return {"id": "demo-booking", "status": "accepted", "start": start_time,
                "title": f"Viewing: {property_title}", "demo": True}


google_calendar_service = GoogleCalendarService()
