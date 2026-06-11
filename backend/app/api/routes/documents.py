from __future__ import annotations

from fastapi import APIRouter, Depends, File, UploadFile

from app.auth.dependencies import require_any_role
from app.models import DocumentExtraction
from app.services.document_extraction import DocumentExtractionService

router = APIRouter(prefix="/api/documents", tags=["documents"], dependencies=[Depends(require_any_role("manager", "broker", "crm_user"))])
service = DocumentExtractionService()


@router.post("/extract", response_model=DocumentExtraction)
async def extract_document(file: UploadFile = File(...)):
    return await service.extract(file)
