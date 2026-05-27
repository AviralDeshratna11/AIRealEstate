from __future__ import annotations

from typing import Any, TypedDict


class AgentState(TypedDict, total=False):
    session_id: str
    user_query: str
    channel: str
    user_profile: dict[str, Any]
    intent: str
    route: str
    answer: str
    data: dict[str, Any]
    sql_preview: str
    errors: list[str]
