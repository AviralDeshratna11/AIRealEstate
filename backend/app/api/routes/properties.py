from __future__ import annotations

import asyncio

from fastapi import APIRouter, Body, Query
from fastapi.responses import StreamingResponse

from app.agents.nl2sql import create_property_query_plan
from app.models import SearchRequest, SearchResponse
from app.services.property_repository import PropertyRepository
from app.services.property_intelligence import property_intelligence_service
from app.services.property_xr import property_xr_service
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


@router.get("/{property_id}/detail")
async def property_detail(property_id: str, role: str = Query("public")):
    return await property_intelligence_service.detail(property_id, role)


@router.get("/{property_id}/media")
async def property_media(property_id: str):
    return await property_intelligence_service.media(property_id)


@router.get("/{property_id}/documents")
async def property_documents(property_id: str, role: str = Query("public")):
    return await property_intelligence_service.documents(property_id, role)


@router.get("/{property_id}/market-intelligence")
async def property_market_intelligence(property_id: str):
    return await property_intelligence_service.market_intelligence(property_id)


@router.get("/{property_id}/finance")
async def property_finance(property_id: str):
    detail = await property_intelligence_service.detail(property_id, "buyer")
    return detail["finance"]


@router.get("/{property_id}/similar")
async def property_similar(property_id: str):
    return await property_intelligence_service.similar(property_id)


@router.get("/{property_id}/tour-route")
async def property_tour_route(property_id: str, role: str = Query("public")):
    return await property_intelligence_service.tour_route(property_id, role)


@router.post("/{property_id}/ask-ai")
async def property_ask_ai(property_id: str, message: str = Body(..., embed=True), role: str = Body("public", embed=True)):
    return await property_intelligence_service.ask_ai(property_id, message, role)


@router.post("/{property_id}/schedule-visit")
async def property_schedule_visit(property_id: str, payload: dict = Body(default_factory=dict)):
    return await property_intelligence_service.action_response(property_id, "schedule_visit", "buyer", payload)


@router.post("/{property_id}/shortlist")
async def property_shortlist(property_id: str, payload: dict = Body(default_factory=dict)):
    return await property_intelligence_service.action_response(property_id, "shortlist", "buyer", payload)


@router.post("/{property_id}/compare")
async def property_compare(property_id: str, payload: dict = Body(default_factory=dict)):
    return await property_intelligence_service.action_response(property_id, "compare", "buyer", payload)


@router.post("/{property_id}/request-documents")
async def property_request_documents(property_id: str, payload: dict = Body(default_factory=dict)):
    return await property_intelligence_service.action_response(property_id, "request_documents", "buyer", payload)


@router.post("/{property_id}/generate-negotiation")
async def property_generate_negotiation(property_id: str, payload: dict = Body(default_factory=dict)):
    return await property_intelligence_service.action_response(property_id, "generate_negotiation", "buyer", payload)


@router.post("/{property_id}/broker/request-tieup")
async def property_broker_request_tieup(property_id: str, payload: dict = Body(default_factory=dict)):
    return await property_intelligence_service.action_response(property_id, "broker_request_tieup", "broker", payload)


@router.post("/{property_id}/broker/create-propertypool")
async def property_broker_create_propertypool(property_id: str, payload: dict = Body(default_factory=dict)):
    return await property_intelligence_service.action_response(property_id, "broker_create_propertypool", "broker", payload)


@router.get("/{property_id}/xr")
async def property_xr(property_id: str, role: str = Query("public")):
    return await property_xr_service.xr_payload(property_id, role)


@router.get("/{property_id}/xr/assets")
async def property_xr_assets(property_id: str, role: str = Query("public")):
    payload = await property_xr_service.xr_payload(property_id, role)
    return payload["assets"]


@router.get("/{property_id}/xr/hotspots")
async def property_xr_hotspots(property_id: str, role: str = Query("public")):
    payload = await property_xr_service.xr_payload(property_id, role)
    return payload["hotspots"]


@router.post("/{property_id}/xr/guide/start")
async def property_xr_guide_start(property_id: str, payload: dict = Body(default_factory=dict)):
    return await property_xr_service.guide(property_id, payload, "start")


@router.post("/{property_id}/xr/guide/ask")
async def property_xr_guide_ask(property_id: str, payload: dict = Body(default_factory=dict)):
    return await property_xr_service.guide(property_id, payload, "ask")


@router.post("/{property_id}/xr/guide/navigate")
async def property_xr_guide_navigate(property_id: str, payload: dict = Body(default_factory=dict)):
    return await property_xr_service.navigate(property_id, payload)


@router.post("/{property_id}/xr/guide/voice")
async def property_xr_guide_voice(property_id: str, payload: dict = Body(default_factory=dict)):
    return await property_xr_service.guide(property_id, payload, "voice")


@router.post("/{property_id}/xr/session")
async def property_xr_session(property_id: str, payload: dict = Body(default_factory=dict)):
    return await property_xr_service.create_session(property_id, payload)


@router.post("/{property_id}/xr/session/{session_id}/event")
async def property_xr_session_event(property_id: str, session_id: str, payload: dict = Body(default_factory=dict)):
    return await property_xr_service.record_event(property_id, session_id, payload)


@router.post("/{property_id}/xr/session/{session_id}/feedback")
async def property_xr_session_feedback(property_id: str, session_id: str, payload: dict = Body(default_factory=dict)):
    return await property_xr_service.feedback(property_id, session_id, payload)


@router.get("/{property_id}/xr/tour-script")
async def property_xr_tour_script(property_id: str, role: str = Query("public")):
    payload = await property_xr_service.xr_payload(property_id, role)
    return payload["tour_script"]
