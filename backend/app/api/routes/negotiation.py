from __future__ import annotations

from fastapi import APIRouter

from app.models import NegotiationRequest, NegotiationResponse
from app.tools.lp_solver import NegotiationOptimizer

router = APIRouter(prefix="/api/negotiation", tags=["negotiation"])
optimizer = NegotiationOptimizer()


@router.post("/optimize", response_model=NegotiationResponse)
async def optimize_negotiation(request: NegotiationRequest):
    return optimizer.optimize(request)
