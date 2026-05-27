from __future__ import annotations

from functools import lru_cache
from typing import Any

try:  # Keeps no-key local demos alive before dependencies are installed.
    from openai import AsyncOpenAI
except Exception:  # pragma: no cover
    AsyncOpenAI = None  # type: ignore[assignment]

from app.config import get_settings


@lru_cache
def get_openai_client() -> Any | None:
    settings = get_settings()
    if not settings.openai_api_key or AsyncOpenAI is None:
        return None
    return AsyncOpenAI(api_key=settings.openai_api_key)
