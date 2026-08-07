from __future__ import annotations

from typing import Any

from html import escape

import httpx
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, Response

from app.agents.support_agents import WhatsAppAssistantAgent
from app.config import get_settings
from app.manager_models import ManagerCreateListingRequest
from app.models import LeadChannel, LeadQualificationRequest, LeadQualificationResponse
from app.models import WhatsAppSendRequest, WhatsAppSendResponse
from app.services.manager_portal import manager_portal_service
from app.services.storage import storage_service
from app.services.whatsapp_listing import locality_coords, whatsapp_listing_service

router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp"])
agent = WhatsAppAssistantAgent()


def _build_twiml(reply: str) -> str:
    return f"<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Message>{escape(reply)}</Message></Response>"


def _normalize_whatsapp_number(value: str) -> str:
    number = value.strip()
    if number.startswith("whatsapp:"):
        return number
    return f"whatsapp:{number}"


async def _send_twilio_whatsapp(to: str, message: str) -> dict[str, Any]:
    settings = get_settings()
    if not settings.twilio_account_sid or not settings.twilio_auth_token or not settings.twilio_whatsapp_from:
        raise RuntimeError("Twilio WhatsApp credentials are not configured")

    url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Messages.json"
    payload = {
        "To": _normalize_whatsapp_number(to),
        "From": _normalize_whatsapp_number(settings.twilio_whatsapp_from),
        "Body": message,
    }

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(url, data=payload, auth=(settings.twilio_account_sid, settings.twilio_auth_token))
        response.raise_for_status()
        return response.json()


async def _extract_payload(request: Request) -> dict[str, Any]:
    content_type = request.headers.get("content-type", "")
    if "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
        form = await request.form()
        return dict(form)
    try:
        return await request.json()
    except Exception:
        return {}


@router.post("/qualify", response_model=LeadQualificationResponse)
async def qualify_lead(request: LeadQualificationRequest):
    return await agent.qualify(request)


async def _maybe_handle_listing_submission(text: str, media_urls: list[str], phone: str | None) -> str | None:
    """Detects and drafts a listing from an inbound WhatsApp message. Returns a reply string
    if this message was handled as a listing submission, or None to fall through to the
    normal buyer-qualification flow."""
    raw_images = await whatsapp_listing_service.fetch_raw_images(media_urls)
    extraction = await whatsapp_listing_service.extract(text, raw_images)
    if not extraction or not extraction.is_listing:
        return None

    if not extraction.locality or not (extraction.title or extraction.asking_price):
        return (
            "Thanks for reaching out to list a property! I couldn't quite catch all the details. "
            "Could you share the locality, BHK, area (sq ft), and asking price in one message?"
        )

    lat, lng = locality_coords(extraction.locality)
    title = extraction.title or f"{extraction.bedrooms or ''} BHK in {extraction.locality}".strip()
    notes_parts = [p for p in [extraction.builder and f"Builder: {extraction.builder}", extraction.notes] if p]

    listing = await manager_portal_service.create_listing(
        ManagerCreateListingRequest(
            publish_immediately=False,
            title=title,
            property_type=extraction.property_type,
            transaction_type=extraction.transaction_type,
            locality=extraction.locality,
            address=f"{extraction.locality}, Mumbai",
            latitude=lat,
            longitude=lng,
            carpet_area_sqft=extraction.carpet_area_sqft,
            bedrooms=extraction.bedrooms,
            bathrooms=extraction.bathrooms,
            furnishing_status=extraction.furnishing_status,
            possession_status=extraction.possession_status,
            asking_price=extraction.asking_price,
            owner_name=extraction.owner_name,
            owner_phone=extraction.owner_phone or phone,
            notes=" | ".join(notes_parts) or None,
        )
    )

    if raw_images:
        photo_url = await storage_service.upload(raw_images[0], "listing.jpg", folder=f"listings/{listing.id}")
        if photo_url:
            await manager_portal_service.set_hero_image(listing.id, photo_url)

    price_label = f"INR {extraction.asking_price / 1_00_00_000:.2f} Cr" if extraction.asking_price else "price not captured"
    return (
        f"Got it! I've drafted a listing: {title} ({price_label}). "
        "It's saved as a draft and our team will review and publish it shortly. "
        f"Reference: {listing.id}"
    )


@router.post("/webhook")
async def whatsapp_webhook(request: Request):
    """Meta/Twilio-compatible webhook shim.

    In production, add signature validation and send the returned reply through Meta Cloud API
    or Twilio WhatsApp. For hackathon demos this returns the generated reply immediately.
    """
    payload = await _extract_payload(request)
    text = (
        payload.get("Body")
        or payload.get("message")
        or payload.get("text")
        or payload.get("entry", [{}])[0].get("changes", [{}])[0].get("value", {}).get("messages", [{}])[0].get("text", {}).get("body")
        or "I need help finding a Mumbai property"
    )
    phone = payload.get("From") or payload.get("phone")

    num_media = int(payload.get("NumMedia") or 0)
    media_urls = [payload[f"MediaUrl{i}"] for i in range(num_media) if payload.get(f"MediaUrl{i}")]

    listing_reply = await _maybe_handle_listing_submission(str(text), media_urls, phone)
    if listing_reply:
        settings = get_settings()
        if settings.whatsapp_provider.lower() == "twilio":
            return Response(content=_build_twiml(listing_reply), media_type="application/xml")
        return JSONResponse({"reply": listing_reply, "provider": settings.whatsapp_provider})

    try:
        result = await agent.qualify(LeadQualificationRequest(channel=LeadChannel.whatsapp, phone=phone, message=str(text)))
        reply_text = result.suggested_reply
        lead_payload = result.model_dump()
    except Exception:
        reply_text = "Thanks for your message. I can help with shortlist, EMI, and visit booking. Please share budget, locality, and preferred visit time."
        lead_payload = {
            "lead_score": 50,
            "intent": "information_request",
            "recommended_agent": "whatsapp_assistant",
            "suggested_reply": reply_text,
            "extracted_requirements": {},
        }

    settings = get_settings()
    if settings.whatsapp_provider.lower() == "twilio":
        # Twilio WhatsApp expects TwiML in the webhook response for immediate replies.
        return Response(content=_build_twiml(reply_text), media_type="application/xml")

    return JSONResponse({"reply": reply_text, "lead": lead_payload, "provider": settings.whatsapp_provider})


@router.post("/send", response_model=WhatsAppSendResponse)
async def send_whatsapp_message(request: WhatsAppSendRequest):
    settings = get_settings()
    from_number = settings.twilio_whatsapp_from

    if request.dry_run or settings.whatsapp_provider.lower() != "twilio":
        return WhatsAppSendResponse(
            provider=settings.whatsapp_provider,
            sent=False,
            to=_normalize_whatsapp_number(request.to),
            from_number=_normalize_whatsapp_number(from_number) if from_number else None,
            message=request.message,
            dry_run=True,
        )

    try:
        result = await _send_twilio_whatsapp(request.to, request.message)
        return WhatsAppSendResponse(
            provider="twilio",
            sent=True,
            to=_normalize_whatsapp_number(request.to),
            from_number=_normalize_whatsapp_number(from_number) if from_number else None,
            sid=result.get("sid"),
            status=result.get("status"),
            message=request.message,
            dry_run=False,
        )
    except httpx.HTTPStatusError as exc:
        error_code = None
        error_message = None
        try:
            payload = exc.response.json()
            error_code = payload.get("code")
            error_message = payload.get("message")
        except Exception:
            error_message = str(exc)

        status = "failed"
        if error_code:
            status = f"failed:{error_code}"

        user_message = request.message
        if error_message:
            user_message = f"{request.message} | send_error: {error_message}"

        return WhatsAppSendResponse(
            provider="twilio",
            sent=False,
            to=_normalize_whatsapp_number(request.to),
            from_number=_normalize_whatsapp_number(from_number) if from_number else None,
            sid=None,
            status=status,
            message=user_message,
            dry_run=False,
        )
