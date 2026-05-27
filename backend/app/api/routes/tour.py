from __future__ import annotations

from fastapi import APIRouter

from app.agents.support_agents import TourGuideAgent
from app.models import TourGuideRequest, TourGuideResponse

router = APIRouter(prefix="/api/tour", tags=["tour"])
agent = TourGuideAgent()


@router.post("/guide", response_model=TourGuideResponse)
async def guide_property(request: TourGuideRequest):
    return await agent.guide(request)
