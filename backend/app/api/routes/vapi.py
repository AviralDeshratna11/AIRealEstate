from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, StreamingResponse

from app.agents.graph import build_agent_graph
from app.models import VapiMessage
from app.utils.sse import sse_event

router = APIRouter(prefix="/api/vapi", tags=["vapi"])
graph = build_agent_graph()


def _latest_user_text(payload: dict[str, Any]) -> str:
    message = payload.get("message", payload)
    candidates = []
    if isinstance(message.get("messages"), list):
        candidates.extend(message["messages"])
    if isinstance(message.get("artifact"), dict):
        candidates.extend(message["artifact"].get("messages", []))
    for item in reversed(candidates):
        if item.get("role") in {"user", "customer"} and item.get("content"):
            return str(item["content"])
    if message.get("transcript"):
        return str(message["transcript"])
    return str(message.get("text") or message.get("content") or "I need help with a property viewing")


@router.post("/server-events")
async def vapi_server_events(payload: VapiMessage):
    """Receives Vapi server events.

    Most Vapi events are informational. For events that expect a response, this endpoint
    returns a compact assistant object and lets `/custom-llm` handle streamed generation.
    """
    event_type = payload.message.get("type")
    if event_type in {"assistant-request", "tool-calls"}:
        return JSONResponse(
            {
                "assistant": {
                    "firstMessage": "Hi, this is ASTRA Estate. I can help qualify your requirement and book a viewing.",
                    "serverMessages": ["end-of-call-report", "transcript"],
                }
            }
        )
    return {"ok": True, "received": event_type}


@router.post("/custom-llm")
async def vapi_custom_llm(request: Request):
    payload = await request.json()
    user_text = _latest_user_text(payload)

    async def events():
        result = await graph.ainvoke({"session_id": "vapi-call", "user_query": user_text, "data": {}})
        answer = result.get("answer", "I can help with that.")
        # Vapi custom LLM integrations commonly consume SSE deltas. This shape is intentionally simple.
        for word in answer.split():
            yield sse_event({"choices": [{"delta": {"content": word + " "}}]}, event="message")
        yield sse_event({"choices": [{"finish_reason": "stop"}]}, event="done")

    return StreamingResponse(events(), media_type="text/event-stream")
