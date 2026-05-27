from __future__ import annotations

import asyncio
import json

from app.db.session import get_pool
from app.services.embeddings import EmbeddingService
from app.services.sample_data import SAMPLE_PROPERTIES


async def seed() -> None:
    pool = await get_pool()
    if pool is None:
        print("DATABASE_URL not set; in-memory Mumbai demo data will be used.")
        return
    embedder = EmbeddingService()
    async with pool.acquire() as conn:
        for item in SAMPLE_PROPERTIES:
            text = " ".join([item["title"], item["description"], " ".join(item["amenities"]), " ".join(item["tags"])])
            vector = await embedder.embed(text)
            vector_literal = "[" + ",".join(f"{x:.6f}" for x in vector) + "]"
            await conn.execute(
                """
                insert into properties (
                    id, title, address, city, locality, micro_market, property_type, transaction_type,
                    price, price_per_sqft, bedrooms, bathrooms, area_sqft, carpet_area_sqft, built_up_area_sqft,
                    latitude, longitude, status, availability, possession, builder, description, amenities, tags,
                    image_url, splat_url, rera_id, inventory_months, cost_bucket, redevelopment_score,
                    redevelopment_das_signed, construction_cost_low, construction_cost_high, material_estimate,
                    emi_20y_per_lakh, monthly_emi_estimate, expected_rent_yield, walkability_score, commute_score,
                    risk_flags, embedding
                ) values (
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,
                    $25,$26,$27,$28,$29,$30,$31,$32,$33,$34::jsonb,$35,$36,$37,$38,$39,$40,$41::vector
                )
                on conflict (id) do update set
                    title=excluded.title, price=excluded.price, status=excluded.status, availability=excluded.availability,
                    description=excluded.description, updated_at=now(), embedding=excluded.embedding
                """,
                item["id"], item["title"], item["address"], item["city"], item["locality"], item.get("micro_market"),
                item.get("property_type", "apartment"), item.get("transaction_type", "buy"), item["price"], item.get("price_per_sqft"),
                item["bedrooms"], item["bathrooms"], item["area_sqft"], item.get("carpet_area_sqft"), item.get("built_up_area_sqft"),
                item["latitude"], item["longitude"], item["status"], item["availability"], item.get("possession"), item.get("builder"),
                item["description"], item["amenities"], item["tags"], item.get("image_url"), item.get("splat_url"), item.get("rera_id"),
                item.get("inventory_months"), item.get("cost_bucket"), item.get("redevelopment_score"), item.get("redevelopment_das_signed"),
                item.get("construction_cost_low"), item.get("construction_cost_high"), json.dumps(item.get("material_estimate")),
                item.get("emi_20y_per_lakh"), item.get("monthly_emi_estimate"), item.get("expected_rent_yield"),
                item.get("walkability_score"), item.get("commute_score"), item.get("risk_flags", []), vector_literal,
            )
    print(f"Seeded {len(SAMPLE_PROPERTIES)} Mumbai properties.")


if __name__ == "__main__":
    asyncio.run(seed())
