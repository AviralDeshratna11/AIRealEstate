from __future__ import annotations

from fastapi import APIRouter

from app.models import MarketInsightResponse
from app.services.mumbai_market import market_insights

router = APIRouter(prefix="/api/market", tags=["market"])


@router.get("/mumbai/insights", response_model=MarketInsightResponse)
async def mumbai_market_insights():
    return MarketInsightResponse(**market_insights())
