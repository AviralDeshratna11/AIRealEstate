from __future__ import annotations

import asyncio
import logging
from typing import Any

try:  # Allows in-memory demo mode even before asyncpg is installed.
    import asyncpg
except Exception:  # pragma: no cover
    asyncpg = None  # type: ignore[assignment]

from app.config import get_settings

logger = logging.getLogger(__name__)

_pool: Any | None = None
# Set once the DB has proven unreachable so we stop retrying (and re-logging) the
# connection on every request. Cleared only on process restart.
_pool_unavailable = False
_CONNECT_TIMEOUT_SECONDS = 5


async def get_pool() -> Any | None:
    """Return an asyncpg pool, or None when DATABASE_URL/dependency is unavailable.

    A configured-but-unreachable ``DATABASE_URL`` (e.g. a paused/deleted Supabase
    project, DNS failure, or network outage) returns ``None`` instead of raising,
    so the app degrades to its in-memory demo mode rather than returning 500s.
    """
    global _pool, _pool_unavailable
    settings = get_settings()
    if not settings.database_url or asyncpg is None or _pool_unavailable:
        return None
    if _pool is None:
        try:
            _pool = await asyncio.wait_for(
                asyncpg.create_pool(settings.database_url, min_size=1, max_size=5),
                timeout=_CONNECT_TIMEOUT_SECONDS,
            )
        except Exception as exc:  # noqa: BLE001 - any failure means "run in-memory"
            _pool_unavailable = True
            logger.warning(
                "Database unreachable (%s: %s); falling back to in-memory demo mode.",
                type(exc).__name__,
                exc,
            )
            return None
    return _pool


async def close_pool() -> None:
    global _pool, _pool_unavailable
    if _pool is not None:
        await _pool.close()
        _pool = None
    _pool_unavailable = False
