from __future__ import annotations

from fastapi import APIRouter, Body, Depends

from app.crm_models import (
    CRMAccountCreate,
    CRMActivityCreate,
    CRMAutomationRunRequest,
    CRMCampaignCreate,
    CRMContactCreate,
    CRMLeadCreate,
    CRMLeadImportRequest,
    CRMOpportunityCreate,
    OpportunityStageUpdateSchema,
)
from app.auth.dependencies import require_any_role
from app.services.crm_erp import crm_erp_service

router = APIRouter(tags=["crm"], dependencies=[Depends(require_any_role("crm_user", "manager"))])


@router.get("/api/crm/dashboard")
async def get_crm_dashboard():
    return (await crm_erp_service.dashboard()).model_dump(mode="json")


@router.get("/api/crm/pipeline")
async def get_crm_pipeline():
    return await crm_erp_service.pipeline()


@router.post("/api/crm/pipeline/stage")
async def post_crm_pipeline_stage(payload: dict = Body(default_factory=dict)):
    return {"stage": payload, "message": "Pipeline stage change accepted in CRM mock fallback."}


@router.get("/api/crm/leads")
async def get_crm_leads():
    return [item.model_dump(mode="json") for item in await crm_erp_service.leads()]


@router.post("/api/crm/leads")
async def post_crm_lead(request: CRMLeadCreate):
    return (await crm_erp_service.create_lead(request)).model_dump(mode="json")


@router.post("/api/crm/leads/import")
async def import_crm_leads(request: CRMLeadImportRequest):
    return await crm_erp_service.import_leads(request)


@router.post("/api/crm/leads/{lead_id}/score")
async def score_crm_lead(lead_id: str):
    return (await crm_erp_service.score_lead(lead_id)).model_dump(mode="json")


@router.post("/api/crm/leads/{lead_id}/convert")
async def convert_crm_lead(lead_id: str):
    return (await crm_erp_service.convert_lead(lead_id)).model_dump(mode="json")


@router.get("/api/crm/opportunities")
async def get_crm_opportunities():
    return [item.model_dump(mode="json") for item in await crm_erp_service.opportunities()]


@router.post("/api/crm/opportunities")
async def post_crm_opportunity(request: CRMOpportunityCreate):
    return (await crm_erp_service.create_opportunity(request)).model_dump(mode="json")


@router.patch("/api/crm/opportunities/{opportunity_id}")
async def patch_crm_opportunity(opportunity_id: str, payload: dict = Body(default_factory=dict)):
    return (await crm_erp_service.update_opportunity(opportunity_id, payload)).model_dump(mode="json")


@router.post("/api/crm/opportunities/{opportunity_id}/move-stage")
async def move_crm_opportunity_stage(opportunity_id: str, request: OpportunityStageUpdateSchema):
    return (await crm_erp_service.move_stage(opportunity_id, request.stage)).model_dump(mode="json")


@router.get("/api/crm/contacts")
async def get_crm_contacts():
    return [item.model_dump(mode="json") for item in await crm_erp_service.contacts()]


@router.post("/api/crm/contacts")
async def post_crm_contact(request: CRMContactCreate):
    return (await crm_erp_service.create_contact(request)).model_dump(mode="json")


@router.get("/api/crm/accounts")
async def get_crm_accounts():
    return [item.model_dump(mode="json") for item in await crm_erp_service.accounts()]


@router.post("/api/crm/accounts")
async def post_crm_account(request: CRMAccountCreate):
    return (await crm_erp_service.create_account(request)).model_dump(mode="json")


@router.get("/api/crm/activities")
async def get_crm_activities():
    return [item.model_dump(mode="json") for item in await crm_erp_service.activities()]


@router.post("/api/crm/activities")
async def post_crm_activity(request: CRMActivityCreate):
    return (await crm_erp_service.create_activity(request)).model_dump(mode="json")


@router.post("/api/crm/activities/{activity_id}/complete")
async def complete_crm_activity(activity_id: str):
    return (await crm_erp_service.complete_activity(activity_id)).model_dump(mode="json")


@router.get("/api/crm/calendar")
async def get_crm_calendar():
    return await crm_erp_service.calendar()


@router.post("/api/crm/site-visits")
async def post_crm_site_visit(payload: dict = Body(default_factory=dict)):
    return (await crm_erp_service.create_site_visit(payload)).model_dump(mode="json")


@router.get("/api/crm/quotations")
async def get_crm_quotations():
    return [item.model_dump(mode="json") for item in await crm_erp_service.quotations()]


@router.post("/api/crm/quotations")
async def post_crm_quotation(payload: dict = Body(default_factory=dict)):
    return (await crm_erp_service.create_quotation(payload)).model_dump(mode="json")


@router.get("/api/crm/offers")
async def get_crm_offers():
    return [item.model_dump(mode="json") for item in await crm_erp_service.offers()]


@router.post("/api/crm/offers")
async def post_crm_offer(payload: dict = Body(default_factory=dict)):
    return (await crm_erp_service.create_offer(payload)).model_dump(mode="json")


@router.get("/api/crm/commissions")
async def get_crm_commissions():
    return [item.model_dump(mode="json") for item in await crm_erp_service.commissions()]


@router.get("/api/crm/campaigns")
async def get_crm_campaigns():
    return [item.model_dump(mode="json") for item in await crm_erp_service.campaigns()]


@router.post("/api/crm/campaigns")
async def post_crm_campaign(request: CRMCampaignCreate):
    return (await crm_erp_service.create_campaign(request)).model_dump(mode="json")


@router.post("/api/crm/automation/run")
async def run_crm_automation(request: CRMAutomationRunRequest):
    return await crm_erp_service.run_automation(request)


@router.get("/api/crm/reports/sales")
async def get_crm_sales_report():
    return await crm_erp_service.reports_sales()


@router.get("/api/crm/reports/team")
async def get_crm_team_report():
    return await crm_erp_service.reports_team()


@router.get("/api/crm/reports/revenue")
async def get_crm_revenue_report():
    return await crm_erp_service.reports_revenue()


@router.get("/api/crm/audit-log")
async def get_crm_audit_log():
    return [item.model_dump(mode="json") for item in await crm_erp_service.audit_log()]
