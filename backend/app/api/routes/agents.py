from __future__ import annotations

from fastapi import APIRouter

from app.agents.graph import build_agent_graph
from app.models import AgentRunRequest, AgentRunResponse

router = APIRouter(prefix="/api/agents", tags=["agents"])
graph = build_agent_graph()


@router.post("/run", response_model=AgentRunResponse)
async def run_agent(request: AgentRunRequest):
    result = await graph.ainvoke(
        {
            "session_id": request.session_id or "web-session",
            "user_query": request.message,
            "channel": request.channel,
            "user_profile": request.user_profile,
            "data": {},
        }
    )
    return AgentRunResponse(
        route=result.get("route", "unknown"),
        answer=result.get("answer", "No answer generated."),
        data={**result.get("data", {}), "sql_preview": result.get("sql_preview"), "intent": result.get("intent")},
    )
