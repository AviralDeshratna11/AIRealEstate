from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
import logging

from app.config import get_settings


class CalComService:
    """Thin wrapper around Cal.com v2 Slots and Bookings APIs with demo fallback."""

    def __init__(self) -> None:
        self.settings = get_settings()

    @property
    def headers(self) -> dict[str, str]:
        headers = {"cal-api-version": self.settings.calcom_api_version}
        if self.settings.calcom_api_key:
            headers["Authorization"] = f"Bearer {self.settings.calcom_api_key}"
        return headers

    async def get_slots(self, days: int = 7) -> list[dict[str, Any]]:
        if not self.settings.calcom_api_key:
            return self._demo_slots(days)

        now = datetime.now(timezone.utc)
        params: dict[str, Any] = {
            "start": now.date().isoformat(),
            "end": (now + timedelta(days=days)).date().isoformat(),
            "timeZone": self.settings.calcom_timezone,
        }
        if self.settings.calcom_event_type_id:
            params["eventTypeId"] = self.settings.calcom_event_type_id
        else:
            params["username"] = self.settings.calcom_username
            params["eventTypeSlug"] = self.settings.calcom_event_type_slug

        log = logging.getLogger(__name__)
        async with httpx.AsyncClient(timeout=20) as client:
            try:
                response = await client.get(
                    f"{self.settings.calcom_api_base.rstrip('/')}/v2/slots",
                    params=params,
                    headers=self.headers,
                )
                response.raise_for_status()
                payload = response.json()
                return payload.get("data") or payload.get("slots") or []
            except httpx.HTTPStatusError as e:
                try:
                    log.error("Cal.com slots request failed: %s %s", e.response.status_code, e.response.text)
                except Exception:
                    log.exception("Cal.com slots request failed with HTTPStatusError")
                return self._demo_slots(days)
            except httpx.HTTPError:
                log.exception("Cal.com slots request failed")
                return self._demo_slots(days)

    async def create_booking(self, name: str, email: str, start_time: str, property_title: str) -> dict[str, Any]:
        if not self.settings.calcom_api_key:
            return {
                "id": "demo-booking",
                "status": "accepted",
                "start": start_time,
                "title": f"Viewing: {property_title}",
                "demo": True,
            }

        body = {
            "eventTypeId": int(self.settings.calcom_event_type_id or 0),
            "start": start_time,
            "attendee": {
                "name": name,
                "email": email,
                "timeZone": self.settings.calcom_timezone,
            },
            "metadata": {"propertyTitle": property_title},
        }
        async with httpx.AsyncClient(timeout=20) as client:
            try:
                response = await client.post(
                    f"{self.settings.calcom_api_base.rstrip('/')}/v2/bookings",
                    headers={**self.headers, "Content-Type": "application/json"},
                    json=body,
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                try:
                    logging.getLogger(__name__).error("Cal.com booking failed: %s %s", e.response.status_code, e.response.text)
                except Exception:
                    logging.getLogger(__name__).exception("Cal.com booking HTTPStatusError")
                return {
                    "id": "demo-booking",
                    "status": "accepted",
                    "start": start_time,
                    "title": f"Viewing: {property_title}",
                    "demo": True,
                }
            except httpx.HTTPError:
                logging.getLogger(__name__).exception("Cal.com booking request failed")
                return {
                    "id": "demo-booking",
                    "status": "accepted",
                    "start": start_time,
                    "title": f"Viewing: {property_title}",
                    "demo": True,
                }

    @staticmethod
    def _demo_slots(days: int) -> list[dict[str, Any]]:
        base = datetime.now(timezone.utc).replace(hour=10, minute=0, second=0, microsecond=0)
        return [
            {"time": (base + timedelta(days=i, hours=i % 4)).isoformat(), "available": True}
            for i in range(1, min(days, 5) + 1)
        ]


calcom_service = CalComService()
