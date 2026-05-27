from __future__ import annotations

from typing import Any

try:  # Allows in-memory demo mode even before asyncpg is installed.
    import asyncpg
except Exception:  # pragma: no cover
    asyncpg = None  # type: ignore[assignment]

from app.config import get_settings

_pool: Any | None = None


async def get_pool() -> Any | None:
    """Return an asyncpg pool, or None when DATABASE_URL/dependency is not configured."""
    global _pool
    settings = get_settings()
    if not settings.database_url or asyncpg is None:
        return None
    if _pool is None:
        _pool = await asyncpg.create_pool(settings.database_url, min_size=1, max_size=5)
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
