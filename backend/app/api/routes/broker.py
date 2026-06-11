from __future__ import annotations

from fastapi import APIRouter, Body, Depends

from app.auth.dependencies import require_any_role
from app.broker_models import (
    BrokerAutomationRunRequest,
    BrokerBuyerCreate,
    BrokerLeadImportRequest,
    BrokerProfileUpsertRequest,
    BrokerTieupRequestCreate,
    ManagerTieupDecisionRequest,
    PropertyPoolCreateRequest,
)
from app.services.broker_portal import broker_portal_service

router = APIRouter(tags=["broker"], dependencies=[Depends(require_any_role("broker", "manager"))])


@router.get("/api/broker/dashboard")
async def get_broker_dashboard():
    return (await broker_portal_service.dashboard()).model_dump(mode="json")


@router.get("/api/broker/profile")
async def get_broker_profile():
    return (await broker_portal_service.profile()).model_dump(mode="json")


@router.post("/api/broker/profile")
async def upsert_broker_profile(request: BrokerProfileUpsertRequest):
    return (await broker_portal_service.upsert_profile(request)).model_dump(mode="json")


@router.get("/api/broker/properties")
async def get_broker_properties():
    return [item.model_dump(mode="json") for item in await broker_portal_service.properties()]


@router.get("/api/broker/properties/{property_id}")
async def get_broker_property(property_id: str):
    return await broker_portal_service.property_detail(property_id)


@router.post("/api/broker/tieups/request")
async def request_broker_tieup(request: BrokerTieupRequestCreate):
    return (await broker_portal_service.request_tieup(request)).model_dump(mode="json")


@router.get("/api/broker/tieups")
async def get_broker_tieups():
    return [item.model_dump(mode="json") for item in await broker_portal_service.tieups()]


@router.post("/api/broker/tieups/{tieup_id}/accept-terms")
async def accept_broker_tieup_terms(tieup_id: str):
    return (await broker_portal_service.accept_terms(tieup_id)).model_dump(mode="json")


@router.post("/api/broker/tieups/{tieup_id}/cancel")
async def cancel_broker_tieup(tieup_id: str):
    return (await broker_portal_service.cancel_tieup(tieup_id)).model_dump(mode="json")


@router.get("/api/broker/buyers")
async def get_broker_buyers():
    return [item.model_dump(mode="json") for item in await broker_portal_service.buyers()]


@router.post("/api/broker/buyers")
async def create_broker_buyer(request: BrokerBuyerCreate):
    return (await broker_portal_service.create_buyer(request)).model_dump(mode="json")


@router.get("/api/broker/leads")
async def get_broker_leads():
    return [item.model_dump(mode="json") for item in await broker_portal_service.leads()]


@router.post("/api/broker/leads/import")
async def import_broker_leads(request: BrokerLeadImportRequest):
    return await broker_portal_service.import_leads(request)


@router.post("/api/broker/leads/{lead_id}/qualify")
async def qualify_broker_lead(lead_id: str):
    return await broker_portal_service.qualify_lead(lead_id)


@router.get("/api/broker/propertypool")
async def get_propertypool_events():
    return [item.model_dump(mode="json") for item in await broker_portal_service.propertypool_events()]


@router.post("/api/broker/propertypool")
async def create_propertypool_event(request: PropertyPoolCreateRequest):
    return (await broker_portal_service.create_propertypool(request)).model_dump(mode="json")


@router.get("/api/broker/propertypool/{event_id}")
async def get_propertypool_event(event_id: str):
    return await broker_portal_service.propertypool_detail(event_id)


@router.post("/api/broker/propertypool/{event_id}/join")
async def join_propertypool_event(event_id: str, buyer_id: str = Body(..., embed=True), broker_id: str = Body("broker-demo-1", embed=True)):
    return (await broker_portal_service.join_propertypool(event_id, buyer_id, broker_id)).model_dump(mode="json")


@router.post("/api/broker/propertypool/{event_id}/invite-buyers")
async def invite_propertypool_buyers(event_id: str, buyer_ids: list[str] | None = Body(None, embed=True)):
    return await broker_portal_service.invite_buyers(event_id, buyer_ids)


@router.post("/api/broker/propertypool/{event_id}/check-in")
async def check_in_propertypool_buyer(event_id: str, buyer_id: str = Body(..., embed=True)):
    return (await broker_portal_service.check_in(event_id, buyer_id)).model_dump(mode="json")


@router.post("/api/broker/propertypool/{event_id}/feedback")
async def save_propertypool_feedback(event_id: str, buyer_id: str = Body(..., embed=True), feedback: dict = Body(default_factory=dict, embed=True)):
    return (await broker_portal_service.feedback(event_id, buyer_id, feedback)).model_dump(mode="json")


@router.post("/api/propertypool/{event_id}/xr/start")
async def start_propertypool_xr(event_id: str, payload: dict = Body(default_factory=dict)):
    from app.services.property_xr import property_xr_service

    return await property_xr_service.propertypool_xr(event_id, "start", payload)


@router.post("/api/propertypool/{event_id}/xr/broadcast-navigation")
async def broadcast_propertypool_xr_navigation(event_id: str, payload: dict = Body(default_factory=dict)):
    from app.services.property_xr import property_xr_service

    return await property_xr_service.propertypool_xr(event_id, "broadcast_navigation", payload)


@router.post("/api/propertypool/{event_id}/xr/question")
async def propertypool_xr_question(event_id: str, payload: dict = Body(default_factory=dict)):
    from app.services.property_xr import property_xr_service

    return await property_xr_service.propertypool_xr(event_id, "question", payload)


@router.post("/api/propertypool/{event_id}/xr/summary")
async def propertypool_xr_summary(event_id: str, payload: dict = Body(default_factory=dict)):
    from app.services.property_xr import property_xr_service

    return await property_xr_service.propertypool_xr(event_id, "summary", payload)


@router.get("/api/broker/commissions")
async def get_broker_commissions():
    return [item.model_dump(mode="json") for item in await broker_portal_service.commissions()]


@router.get("/api/broker/analytics")
async def get_broker_analytics():
    return await broker_portal_service.analytics()


@router.post("/api/broker/automation/run")
async def run_broker_automation(request: BrokerAutomationRunRequest):
    return await broker_portal_service.run_automation(request)


@router.get("/api/broker/audit-log")
async def get_broker_audit_log():
    return [item.model_dump(mode="json") for item in await broker_portal_service.audit_log()]


@router.get("/api/manager/tieup-requests")
async def get_manager_tieup_requests():
    return [item.model_dump(mode="json") for item in await broker_portal_service.manager_tieup_requests()]


@router.post("/api/manager/tieup-requests/{request_id}/approve")
async def approve_manager_tieup_request(request_id: str, request: ManagerTieupDecisionRequest):
    return (await broker_portal_service.manager_decide_tieup(request_id, request, "approved")).model_dump(mode="json")


@router.post("/api/manager/tieup-requests/{request_id}/reject")
async def reject_manager_tieup_request(request_id: str, request: ManagerTieupDecisionRequest):
    return (await broker_portal_service.manager_decide_tieup(request_id, request, "rejected")).model_dump(mode="json")


@router.post("/api/manager/tieup-requests/{request_id}/update-terms")
async def update_manager_tieup_terms(request_id: str, request: ManagerTieupDecisionRequest):
    return (await broker_portal_service.manager_decide_tieup(request_id, request, "terms_updated")).model_dump(mode="json")
