from __future__ import annotations

from fastapi import APIRouter, HTTPException
from httpx import HTTPError

from app.models import AssistantRequest, AssistantResponse
from app.services.assistant import answer_assistant

router = APIRouter(prefix="/api/assistant", tags=["assistant"])


@router.post("/chat", response_model=AssistantResponse)
async def chat(request: AssistantRequest):
    try:
        result = await answer_assistant(request.message, request.context, request.history)
    except HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"LLM provider error: {exc}") from exc
    return AssistantResponse(**result)
