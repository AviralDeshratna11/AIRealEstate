from __future__ import annotations

import hashlib
import math

from app.config import get_settings
from app.services.openai_client import get_openai_client


class EmbeddingService:
    """Embeds property text using OpenAI when available, otherwise deterministic hash vectors."""

    def __init__(self) -> None:
        self.settings = get_settings()

    async def embed(self, text: str) -> list[float]:
        client = get_openai_client()
        dimensions = self.settings.openai_embedding_dimensions
        if client:
            try:
                result = await client.embeddings.create(
                    model=self.settings.openai_embedding_model,
                    input=text[:8000],
                    dimensions=dimensions,
                )
                return list(result.data[0].embedding)
            except Exception:
                pass
        return self._hash_embedding(text, dimensions)

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
