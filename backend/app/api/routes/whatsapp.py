from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Request

from app.agents.support_agents import WhatsAppAssistantAgent
from app.models import LeadChannel, LeadQualificationRequest, LeadQualificationResponse

router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp"])
agent = WhatsAppAssistantAgent()


@router.post("/qualify", response_model=LeadQualificationResponse)
async def qualify_lead(request: LeadQualificationRequest):
    return await agent.qualify(request)


@router.post("/webhook")
async def whatsapp_webhook(request: Request):
    """Meta/Twilio-compatible webhook shim.

    In production, add signature validation and send the returned reply through Meta Cloud API
    or Twilio WhatsApp. For hackathon demos this returns the generated reply immediately.
    """
    payload: dict[str, Any] = await request.json()
    text = (
        payload.get("Body")
        or payload.get("message")
        or payload.get("text")
        or payload.get("entry", [{}])[0].get("changes", [{}])[0].get("value", {}).get("messages", [{}])[0].get("text", {}).get("body")
        or "I need help finding a Mumbai property"
    )
    phone = payload.get("From") or payload.get("phone")
    result = await agent.qualify(LeadQualificationRequest(channel=LeadChannel.whatsapp, phone=phone, message=str(text)))
    return {"reply": result.suggested_reply, "lead": result.model_dump()}
