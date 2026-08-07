from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.auth.dependencies import require_any_role
from app.manager_models import (
    ManagerAgentRunRequest,
    ManagerAutomationRunRequest,
    ManagerCreateListingRequest,
)
from app.services.manager_portal import manager_portal_service

router = APIRouter(prefix="/api/manager", tags=["manager"], dependencies=[Depends(require_any_role("manager"))])


@router.get("/dashboard")
async def get_dashboard():
    return (await manager_portal_service.dashboard()).model_dump(mode="json")


@router.get("/listings")
async def list_listings():
    items = await manager_portal_service.list_listings()
    return [item.model_dump(mode="json") for item in items]


@router.post("/listings")
async def create_listing(request: ManagerCreateListingRequest):
    listing = await manager_portal_service.create_listing(request)
    return listing.model_dump(mode="json")


@router.get("/listings/{listing_id}")
async def get_listing(listing_id: str):
    listing = await manager_portal_service.get_listing(listing_id)
    return listing.model_dump(mode="json")


@router.post("/listings/{listing_id}/publish")
async def publish_listing(listing_id: str):
    return (await manager_portal_service.publish_listing(listing_id)).model_dump(mode="json")


@router.post("/listings/{listing_id}/agent-run")
async def run_listing_agents(listing_id: str, request: ManagerAgentRunRequest):
    return await manager_portal_service.run_listing_agents(listing_id, request)


@router.post("/listings/{listing_id}/documents")
async def upload_documents(listing_id: str, files: list[UploadFile] = File(...), document_type: str = "mixed"):
    if not files:
        raise HTTPException(status_code=400, detail="At least one file is required")
    return await manager_portal_service.upload_documents(listing_id, files, document_type)


@router.post("/listings/{listing_id}/media")
async def upload_media(listing_id: str, files: list[UploadFile] = File(...), media_type: str = "image"):
    if not files:
        raise HTTPException(status_code=400, detail="At least one file is required")
    return await manager_portal_service.upload_media(listing_id, files, media_type)


@router.post("/listings/bulk-upload")
async def bulk_upload_listings(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Upload a .csv file")
    content = await file.read()
    return await manager_portal_service.bulk_upload_csv(content)


@router.get("/leads")
async def get_leads():
    leads = await manager_portal_service.leads()
    return [lead.model_dump(mode="json") for lead in leads]


@router.get("/leads/{lead_id}")
async def get_lead_detail(lead_id: str):
    return (await manager_portal_service.lead_detail(lead_id)).model_dump(mode="json")


@router.get("/tasks")
async def get_tasks():
    tasks = await manager_portal_service.tasks()
    return [task.model_dump(mode="json") for task in tasks]


@router.post("/automation/run")
async def run_full_automation(request: ManagerAutomationRunRequest):
    return await manager_portal_service.run_full_automation(request)


@router.get("/market/mumbai")
async def get_market():
    return await manager_portal_service.market()


@router.get("/audit-log")
async def get_audit_log():
    audit = await manager_portal_service.audit_log()
    return [item.model_dump(mode="json") for item in audit]
