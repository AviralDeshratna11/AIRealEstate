from __future__ import annotations

import hashlib
import math

import httpx

from app.config import get_settings
from app.services.openai_client import get_openai_client

GEMINI_EMBED_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:embedContent"


class EmbeddingService:
    """Embeds property text via Gemini (default), OpenAI (when pointed at api.openai.com),
    or a deterministic hash vector as a last resort so the vector(N) DB column never breaks."""

    def __init__(self) -> None:
        self.settings = get_settings()

    async def embed(self, text: str) -> list[float]:
        dimensions = self.settings.openai_embedding_dimensions
        text = text[:8000]

        if self.settings.gemini_api_key:
            vector = await self._embed_with_gemini(text, dimensions)
            if vector:
                return vector

        # OpenRouter and other OpenAI-compatible gateways don't expose an embeddings
        # endpoint, so only try the OpenAI SDK path when it's actually pointed at OpenAI.
        client = get_openai_client()
        if client and not self.settings.openai_base_url:
            try:
                result = await client.embeddings.create(
                    model=self.settings.openai_embedding_model,
                    input=text,
                    dimensions=dimensions,
                )
                return list(result.data[0].embedding)
            except Exception:
                pass

        return self._hash_embedding(text, dimensions)

    async def _embed_with_gemini(self, text: str, dimensions: int) -> list[float] | None:
        url = GEMINI_EMBED_URL.format(model=self.settings.gemini_embedding_model)
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                response = await client.post(
                    url,
                    headers={
                        "x-goog-api-key": self.settings.gemini_api_key or "",
                        "Content-Type": "application/json",
                    },
                    json={
                        "content": {"parts": [{"text": text}]},
                        "outputDimensionality": dimensions,
                    },
                )
                response.raise_for_status()
                payload = response.json()
        except Exception:
            return None

        values = payload.get("embedding", {}).get("values")
        if not values:
            return None
        vector = [float(v) for v in values]
        norm = math.sqrt(sum(v * v for v in vector)) or 1.0
        return [v / norm for v in vector]

    @staticmethod
    def _hash_embedding(text: str, dimensions: int) -> list[float]:
        tokens = text.lower().split()
        vec = [0.0] * dimensions
        for token in tokens or [text.lower()]:
            digest = hashlib.sha256(token.encode("utf-8")).digest()
            for i, b in enumerate(digest[:32]):
                idx = (b + i * 131) % dimensions
                vec[idx] += 1.0 if b % 2 == 0 else -1.0
        norm = math.sqrt(sum(x * x for x in vec)) or 1.0
        return [x / norm for x in vec]
