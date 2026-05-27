from __future__ import annotations

from fastapi import APIRouter, File, UploadFile

from app.models import DocumentExtraction
from app.services.document_extraction import DocumentExtractionService

router = APIRouter(prefix="/api/documents", tags=["documents"])
service = DocumentExtractionService()


@router.post("/extract", response_model=DocumentExtraction)
async def extract_document(file: UploadFile = File(...)):
    return await service.extract(file)
