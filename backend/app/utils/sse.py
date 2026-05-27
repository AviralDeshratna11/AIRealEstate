from __future__ import annotations

import json
from typing import Any, AsyncIterator


def sse_event(data: Any, event: str | None = None) -> str:
    payload = json.dumps(data, default=str)
    prefix = f"event: {event}\n" if event else ""
    return f"{prefix}data: {payload}\n\n"


async def stream_text_as_sse(text: str) -> AsyncIterator[str]:
    for token in text.split():
        yield sse_event({"delta": token + " "}, event="message")
    yield sse_event({"done": True}, event="done")
