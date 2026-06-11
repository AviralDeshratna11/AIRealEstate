from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from app.auth.dependencies import require_any_role
from app.services.elevenlabs_service import elevenlabs_calling_service
from app.voice_models import BrokerBuyerCallRequest, ManualLeadCallRequest, VoiceInterestCallRequest, VoiceToolRequest

router = APIRouter(tags=["voice"])


@router.get("/api/voice/elevenlabs/config")
async def get_elevenlabs_config(_=Depends(require_any_role("manager", "crm_user", "admin"))):
    return elevenlabs_calling_service.config().model_dump(mode="json")


@router.get("/api/voice/elevenlabs/analytics")
async def get_voice_analytics(_=Depends(require_any_role("manager", "crm_user", "admin"))):
    return await elevenlabs_calling_service.analytics()


@router.post("/api/voice/elevenlabs/trigger-interest-call")
async def trigger_interest_call(request: VoiceInterestCallRequest, _=Depends(require_any_role("manager", "broker", "crm_user", "admin"))):
    return (await elevenlabs_calling_service.trigger_interest_call(request)).model_dump(mode="json")


@router.post("/api/crm/leads/{lead_id}/call")
async def call_crm_lead(lead_id: str, request: ManualLeadCallRequest, _=Depends(require_any_role("manager", "crm_user", "admin"))):
    return (await elevenlabs_calling_service.manual_lead_call(lead_id, request)).model_dump(mode="json")


@router.post("/api/broker/buyers/{buyer_id}/call")
async def call_broker_buyer(buyer_id: str, request: BrokerBuyerCallRequest, _=Depends(require_any_role("broker", "manager", "admin"))):
    return (await elevenlabs_calling_service.broker_buyer_call(buyer_id, request)).model_dump(mode="json")


@router.post("/api/voice/elevenlabs/webhook")
async def elevenlabs_webhook(request: Request):
    return await elevenlabs_calling_service.webhook(request)


@router.get("/api/voice/calls/{call_id}")
async def get_voice_call(call_id: str, _=Depends(require_any_role("manager", "broker", "crm_user", "admin"))):
    return (await elevenlabs_calling_service.get_call(call_id)).model_dump(mode="json")


@router.post("/api/voice/tools/get-property-details")
async def voice_tool_get_property_details(request: VoiceToolRequest):
    return await elevenlabs_calling_service.tool_get_property_details(request)


@router.post("/api/voice/tools/calculate-emi")
async def voice_tool_calculate_emi(request: VoiceToolRequest):
    return await elevenlabs_calling_service.tool_calculate_emi(request)


@router.post("/api/voice/tools/get-visit-slots")
async def voice_tool_get_visit_slots(request: VoiceToolRequest):
    return await elevenlabs_calling_service.tool_get_visit_slots(request)


@router.post("/api/voice/tools/book-site-visit")
async def voice_tool_book_site_visit(request: VoiceToolRequest):
    return await elevenlabs_calling_service.tool_book_site_visit(request)


@router.post("/api/voice/tools/send-whatsapp-summary")
async def voice_tool_send_whatsapp_summary(request: VoiceToolRequest):
    return await elevenlabs_calling_service.tool_send_whatsapp_summary(request)


@router.post("/api/voice/tools/escalate-human")
async def voice_tool_escalate_human(request: VoiceToolRequest):
    return await elevenlabs_calling_service.tool_escalate_human(request)


@router.post("/api/voice/tools/update-crm-lead")
async def voice_tool_update_crm_lead(request: VoiceToolRequest):
    return await elevenlabs_calling_service.tool_update_crm_lead(request)


@router.post("/api/voice/tools/opt-out")
async def voice_tool_opt_out(request: VoiceToolRequest):
    return await elevenlabs_calling_service.tool_opt_out(request)
