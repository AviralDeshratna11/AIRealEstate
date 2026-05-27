from __future__ import annotations

import asyncio

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.agents.nl2sql import create_property_query_plan
from app.models import SearchRequest, SearchResponse
from app.services.property_repository import PropertyRepository
from app.utils.sse import sse_event

router = APIRouter(prefix="/api/properties", tags=["properties"])
repo = PropertyRepository()


@router.get("")
async def list_properties(limit: int = 12):
    properties = await repo.list_properties(limit=limit)
    return [p.model_dump(mode="json") for p in properties]


@router.get("/geojson")
async def list_properties_geojson():
    return await repo.geojson()


@router.post("/search", response_model=SearchResponse)
async def search_properties(request: SearchRequest):
    plan = await create_property_query_plan(request.query, limit=request.limit)
    properties, sql_preview = await repo.search_by_plan(plan)
    return SearchResponse(
        query=request.query,
        sql_preview=sql_preview,
        properties=properties,
        explanation=plan.explanation,
    )


@router.get("/availability/stream")
async def availability_stream():
    async def events():
        for _ in range(30):
            snapshot = await repo.update_random_availability_snapshot()
            yield sse_event({"properties": snapshot}, event="availability")
            await asyncio.sleep(2)

    return StreamingResponse(events(), media_type="text/event-stream")
