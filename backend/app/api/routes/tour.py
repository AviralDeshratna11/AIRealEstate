from __future__ import annotations

from fastapi import APIRouter, Depends

from app.auth.dependencies import require_any_role
from app.agents.support_agents import TourGuideAgent
from app.models import TourGuideRequest, TourGuideResponse

router = APIRouter(prefix="/api/tour", tags=["tour"])
agent = TourGuideAgent()


@router.post("/guide", response_model=TourGuideResponse)
async def guide_property(request: TourGuideRequest, _=Depends(require_any_role("buyer", "manager", "broker", "crm_user"))):
    return await agent.guide(request)
