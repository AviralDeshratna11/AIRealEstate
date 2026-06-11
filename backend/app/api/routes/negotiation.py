from __future__ import annotations

from fastapi import APIRouter, Depends

from app.auth.dependencies import require_any_role
from app.models import NegotiationRequest, NegotiationResponse
from app.tools.lp_solver import NegotiationOptimizer

router = APIRouter(prefix="/api/negotiation", tags=["negotiation"], dependencies=[Depends(require_any_role("buyer", "manager", "broker", "crm_user"))])
optimizer = NegotiationOptimizer()


@router.post("/optimize", response_model=NegotiationResponse)
async def optimize_negotiation(request: NegotiationRequest):
    return optimizer.optimize(request)
