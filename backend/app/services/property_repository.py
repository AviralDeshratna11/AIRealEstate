from __future__ import annotations

from typing import Any

from app.agents.nl2sql import PropertyQueryPlan, compile_property_sql, property_select_columns
from app.db.session import get_pool
from app.models import Property
from app.services.embeddings import EmbeddingService
from app.services.mumbai_market import enrich_property_market_fields
from app.services.sample_data import SAMPLE_PROPERTIES


class PropertyRepository:
    def __init__(self) -> None:
        self.embedder = EmbeddingService()

    async def list_properties(self, limit: int = 12) -> list[Property]:
        try:
            pool = await get_pool()
        except Exception:
            pool = None
        if pool is None:
            return [Property(**p) for p in SAMPLE_PROPERTIES[:limit]]
        try:
            async with pool.acquire() as conn:
                rows = await conn.fetch(
                    f"""
                    select {property_select_columns()}
                    from properties
                    order by updated_at desc
                    limit $1
                    """,
                    limit,
                )
            if rows:
                return [Property(**self._normalize_row(dict(row))) for row in rows]
        except Exception:
            pass
        return [Property(**p) for p in SAMPLE_PROPERTIES[:limit]]

    async def get_property(self, property_id: str) -> Property | None:
        try:
            pool = await get_pool()
        except Exception:
            pool = None
        if pool is None:
            item = next((p for p in SAMPLE_PROPERTIES if str(p["id"]) == str(property_id)), None)
            return Property(**item) if item else None
        try:
            async with pool.acquire() as conn:
                row = await conn.fetchrow(
                    f"select {property_select_columns()} from properties where id::text = $1 limit 1",
                    property_id,
                )
            if row:
                return Property(**self._normalize_row(dict(row)))
        except Exception:
            pass
        item = next((p for p in SAMPLE_PROPERTIES if str(p["id"]) == str(property_id)), None)
        return Property(**item) if item else None

    async def search_by_plan(self, plan: PropertyQueryPlan) -> tuple[list[Property], str]:
        try:
            pool = await get_pool()
        except Exception:
            pool = None
        if pool is None:
            return self._search_in_memory(plan), "in_memory_mumbai_safe_plan"

        try:
            sql, params, sql_preview = compile_property_sql(plan)
            async with pool.acquire() as conn:
                rows = await conn.fetch(sql, *params)
            properties = [Property(**self._normalize_row(dict(row))) for row in rows]
            if properties:
                return properties, sql_preview
            semantic = await self.semantic_search(plan.semantic_query, plan.limit)
            return semantic, sql_preview + " /* fell back to semantic vector search */"
        except Exception:
            return self._search_in_memory(plan), "in_memory_mumbai_safe_plan"

    async def semantic_search(self, query: str, limit: int = 8) -> list[Property]:
        try:
            pool = await get_pool()
        except Exception:
            pool = None
        if pool is None:
            plan = PropertyQueryPlan(semantic_query=query, limit=limit, explanation="in-memory semantic fallback")
            return self._search_in_memory(plan)

        try:
            vector = await self.embedder.embed(query)
            vector_literal = "[" + ",".join(f"{x:.6f}" for x in vector) + "]"
            async with pool.acquire() as conn:
                rows = await conn.fetch(
                    f"""
                    select {property_select_columns(include_score=True)}
                    from properties
                    where status = 'available' and city ILIKE '%Mumbai%' and embedding is not null
                    order by embedding <=> $1::vector
                    limit $2
                    """,
                    vector_literal,
                    limit,
                )
            if rows:
                return [Property(**self._normalize_row(dict(row))) for row in rows]
        except Exception:
            pass
        plan = PropertyQueryPlan(semantic_query=query, limit=limit, explanation="in-memory semantic fallback")
        return self._search_in_memory(plan)

    async def geojson(self) -> dict[str, Any]:
        properties = await self.list_properties(limit=100)
        return {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [p.longitude, p.latitude]},
                    "properties": p.model_dump(mode="json"),
                }
                for p in properties
            ],
        }

    async def update_random_availability_snapshot(self) -> list[dict[str, Any]]:
        properties = await self.list_properties(limit=8)
        return [
            {
                "id": str(p.id),
                "title": p.title,
                "locality": p.locality,
                "status": p.status,
                "availability": p.availability,
                "next_best_agent": "WhatsApp" if p.status == "available" else "Call Agent",
            }
            for p in properties
        ]

    def _search_in_memory(self, plan: PropertyQueryPlan) -> list[Property]:
        query = plan.semantic_query.lower()
        scored: list[tuple[float, dict[str, Any]]] = []
        for item in SAMPLE_PROPERTIES:
            if not self._passes_filters(item, plan):
                continue
            corpus = " ".join(
                [
                    item.get("title", ""), item.get("city", ""), item.get("locality", ""),
                    item.get("micro_market", ""), item.get("description", ""),
                    " ".join(item.get("amenities", [])), " ".join(item.get("tags", [])),
                ]
            ).lower()
            score = sum(1.0 for token in set(query.split()) if token and token in corpus)
            score += 0.3 if item.get("status") == "available" else -1
            if "redevelopment" in query:
                score += float(item.get("redevelopment_score") or 0) / 100
            if "emi" in query or "loan" in query:
                score += 0.2 if float(item.get("price") or 0) < 50_000_000 else -0.2
            enriched = dict(item)
            enriched["score"] = round(score, 3)
            scored.append((score, enriched))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [Property(**item) for _, item in scored[: plan.limit]]

    @staticmethod
    def _passes_filters(item: dict[str, Any], plan: PropertyQueryPlan) -> bool:
        for cond in plan.filters:
            value = item.get(cond.column)
            target = cond.value
            if cond.operator.value == "=" and str(value).lower() != str(target).lower():
                return False
            if cond.operator.value == "<=" and not (float(value or 0) <= float(target)):
                return False
            if cond.operator.value == ">=" and not (float(value or 0) >= float(target)):
                return False
            if cond.operator.value == "<" and not (float(value or 0) < float(target)):
                return False
            if cond.operator.value == ">" and not (float(value or 0) > float(target)):
                return False
            if cond.operator.value == "ILIKE" and str(target).strip("%").lower() not in str(value).lower():
                return False
            if cond.operator.value == "CONTAINS_ANY":
                terms = target if isinstance(target, list) else [str(target)]
                if not any(t.lower() in [str(x).lower() for x in value or []] for t in terms):
                    return False
        return True

    @staticmethod
    def _normalize_row(row: dict[str, Any]) -> dict[str, Any]:
        row = enrich_property_market_fields(row)
        if isinstance(row.get("material_estimate"), dict):
            # Pydantic accepts dicts; this branch documents that JSONB is expected from DB.
            pass
        return row
