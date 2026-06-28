from __future__ import annotations

from typing import Any

from app.config import get_settings
from app.services.calcom import calcom_service
from app.services.google_calendar import google_calendar_service


class SchedulerService:
    """Provider-agnostic scheduler facade.

    Dispatches to Google Calendar or Cal.com based on ``SCHEDULER_PROVIDER`` so
    every caller (REST bookings, voice tools, agents) shares one booking backend.
    """

    def _provider(self):
        if get_settings().scheduler_provider.lower() == "google":
            return google_calendar_service
        return calcom_service

    async def get_slots(self, days: int = 7) -> list[dict[str, Any]]:
        return await self._provider().get_slots(days=days)

    async def create_booking(self, name: str, email: str, start_time: str, property_title: str) -> dict[str, Any]:
        return await self._provider().create_booking(name, email, start_time, property_title)


scheduler_service = SchedulerService()
