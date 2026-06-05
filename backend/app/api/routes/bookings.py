from __future__ import annotations

from pydantic import BaseModel, EmailStr
from fastapi import APIRouter

from app.services.calcom import CalComService
from app.config import get_settings

router = APIRouter(prefix="/api/bookings", tags=["bookings"])
calcom = CalComService()


class BookingRequest(BaseModel):
    name: str
    email: EmailStr
    start_time: str
    property_title: str


@router.get("/slots")
async def get_slots(days: int = 7):
    return {"slots": await calcom.get_slots(days=days)}


@router.post("")
async def create_booking(request: BookingRequest):
    booking = await calcom.create_booking(
        name=request.name,
        email=request.email,
        start_time=request.start_time,
        property_title=request.property_title,
    )
    result = {"booking": booking}
    # If we returned a demo booking, provide a direct Cal.com booking page URL
    try:
        if booking.get("demo"):
            settings = get_settings()
            if settings.calcom_username and settings.calcom_event_type_slug:
                result["booking_page"] = f"https://cal.com/{settings.calcom_username}/{settings.calcom_event_type_slug}"
    except Exception:
        pass

    return result
