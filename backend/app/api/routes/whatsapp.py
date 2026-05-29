from __future__ import annotations

from typing import Any

from html import escape

import httpx
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, Response

from app.agents.support_agents import WhatsAppAssistantAgent
from app.config import get_settings
from app.models import LeadChannel, LeadQualificationRequest, LeadQualificationResponse
from app.models import WhatsAppSendRequest, WhatsAppSendResponse

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
    result = await agent.qualify(LeadQualificationRequest(channel=LeadChannel.whatsapp, phone=phone, message=str(text)))

    settings = get_settings()
    if settings.whatsapp_provider.lower() == "twilio":
        if phone:
            await _send_twilio_whatsapp(str(phone), result.suggested_reply)
        return Response(content="", media_type="text/plain")

    return JSONResponse({"reply": result.suggested_reply, "lead": result.model_dump(), "provider": settings.whatsapp_provider})


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
