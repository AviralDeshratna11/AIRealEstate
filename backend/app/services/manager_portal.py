from __future__ import annotations

import asyncio
import json
from copy import deepcopy
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import HTTPException

from app.agents.manager_graph import build_manager_graph
from app.db.session import get_pool
from app.manager_models import (
    AutomationRule,
    ComparableListing,
    ListingAuditLog,
    ListingCopyPack,
    ListingDocument,
    ListingLead,
    ListingMedia,
    ListingPricing,
    ManagerAgentRunRequest,
    ManagerAutomationRunRequest,
    ManagerCreateListingRequest,
    ManagerDashboard,
    ManagerFeedEvent,
    ManagerListingDetail,
    ManagerListingSummary,
    ManagerMapPin,
    ManagerPipelineColumn,
    ManagerProfile,
    ManagerPublishResponse,
    ManagerSummaryCard,
    ManagerTaskItem,
    SiteVisit,
)
from app.services.embeddings import EmbeddingService
from app.services.mumbai_market import market_insights
from app.services.sample_data import SAMPLE_PROPERTIES


DDL_STATEMENTS = [
    """
    create table if not exists manager_profiles (
      id text primary key default gen_random_uuid()::text,
      user_id text,
      full_name text not null,
      company_name text not null,
      phone text,
      email text,
      role text not null default 'manager',
      rera_agent_id text,
      operating_localities text[] not null default '{}',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
    """,
    """
    create table if not exists seller_listings (
      id text primary key default gen_random_uuid()::text,
      manager_id text references manager_profiles(id) on delete cascade,
      title text not null,
      slug text not null,
      status text not null default 'draft',
      property_type text not null,
      transaction_type text not null,
      locality text not null,
      address text not null,
      latitude double precision not null,
      longitude double precision not null,
      carpet_area_sqft int,
      builtup_area_sqft int,
      bedrooms int,
      bathrooms int,
      parking_count int,
      furnishing_status text,
      possession_status text,
      availability_date text,
      rera_number text,
      asking_price numeric,
      recommended_price numeric,
      fast_sale_price numeric,
      optimistic_price numeric,
      min_acceptable_price numeric,
      price_per_sqft numeric,
      market_heat_score numeric default 0,
      legal_risk_score numeric default 0,
      readiness_score numeric default 0,
      lead_quality_score numeric default 0,
      redevelopment_score numeric default 0,
      description_short text,
      description_long text,
      seo_title text,
      public_visibility boolean not null default false,
      owner_name text,
      owner_phone text,
      owner_email text,
      hero_image_url text,
      map_payload jsonb not null default '{}'::jsonb,
      pricing_json jsonb not null default '{}'::jsonb,
      copy_json jsonb not null default '{}'::jsonb,
      readiness_json jsonb not null default '{}'::jsonb,
      legal_notes jsonb not null default '[]'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      published_at timestamptz
    )
    """,
    """
    create table if not exists listing_documents (
      id text primary key default gen_random_uuid()::text,
      listing_id text references seller_listings(id) on delete cascade,
      document_type text not null,
      file_url text,
      file_name text,
      extraction_status text not null default 'pending',
      extracted_json jsonb not null default '{}'::jsonb,
      confidence_score numeric default 0,
      red_flags text[] not null default '{}',
      missing_items text[] not null default '{}',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
    """,
    """
    create table if not exists listing_media (
      id text primary key default gen_random_uuid()::text,
      listing_id text references seller_listings(id) on delete cascade,
      media_type text not null,
      room_type text,
      file_url text,
      thumbnail_url text,
      caption text,
      alt_text text,
      is_hero boolean not null default false,
      quality_score numeric default 0,
      created_at timestamptz not null default now()
    )
    """,
    """
    create table if not exists listing_leads (
      id text primary key default gen_random_uuid()::text,
      listing_id text references seller_listings(id) on delete cascade,
      name text not null,
      phone text,
      email text,
      source text not null,
      budget_min numeric,
      budget_max numeric,
      preferred_visit_time text,
      buyer_profile text,
      intent_score numeric default 0,
      qualification_score numeric default 0,
      status text not null default 'new',
      last_agent_summary text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
    """,
    """
    create table if not exists site_visits (
      id text primary key default gen_random_uuid()::text,
      listing_id text references seller_listings(id) on delete cascade,
      lead_id text references listing_leads(id) on delete set null,
      cal_booking_id text,
      scheduled_start timestamptz,
      scheduled_end timestamptz,
      status text not null default 'requested',
      notes text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
    """,
    """
    create table if not exists listing_agent_tasks (
      id text primary key default gen_random_uuid()::text,
      listing_id text references seller_listings(id) on delete cascade,
      agent_name text not null,
      task_type text not null,
      status text not null default 'open',
      priority text not null default 'medium',
      input_json jsonb not null default '{}'::jsonb,
      output_json jsonb not null default '{}'::jsonb,
      error_message text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      completed_at timestamptz
    )
    """,
    """
    create table if not exists listing_audit_logs (
      id text primary key default gen_random_uuid()::text,
      listing_id text references seller_listings(id) on delete cascade,
      actor_type text not null,
      actor_name text not null,
      action text not null,
      details_json jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )
    """,
    """
    create table if not exists market_comparables (
      id text primary key default gen_random_uuid()::text,
      locality text not null,
      property_type text not null,
      price numeric not null,
      price_per_sqft numeric not null,
      carpet_area_sqft int,
      bedrooms int,
      transaction_date text,
      source text not null,
      metadata_json jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )
    """,
    """
    create table if not exists listing_embeddings (
      id text primary key default gen_random_uuid()::text,
      listing_id text references seller_listings(id) on delete cascade,
      embedding vector(1536),
      content text not null,
      content_type text not null,
      created_at timestamptz not null default now()
    )
    """,
]


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _slugify(text: str) -> str:
    return "-".join(part for part in "".join(ch.lower() if ch.isalnum() else " " for ch in text).split() if part)[:80] or f"listing-{uuid4().hex[:8]}"


def _as_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except Exception:
        return default


def _as_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except Exception:
        return default


def _json_safe(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, dict):
        return {key: _json_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    return value


def _as_datetime(value: Any) -> datetime | None:
    if value is None or isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
    return None


def _json_dict(value: Any) -> dict[str, Any]:
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            return {}
    return {}


def _json_list(value: Any) -> list[Any]:
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, list) else []
        except json.JSONDecodeError:
            return []
    return []


class ManagerPortalService:
    def __init__(self) -> None:
        self.embedder = EmbeddingService()
        self._lock = asyncio.Lock()
        self._seeded = False
        self._manager = ManagerProfile(
            id="manager-demo-1",
            user_id="demo-user",
            full_name="Patel Panel Manager",
            company_name="Patel Panel Realty",
            phone="+91 90000 00001",
            email="manager@patelpanel.example",
            role="manager",
            rera_agent_id="A51800000001",
            operating_localities=["Bandra", "Andheri", "Borivali", "Malad", "Ghatkopar", "Powai", "Worli", "Chembur", "Dadar", "Lower Parel", "Thane", "Navi Mumbai"],
        )
        self._listings: dict[str, dict[str, Any]] = self._seed_listings()
        self._documents: dict[str, list[dict[str, Any]]] = {listing_id: [] for listing_id in self._listings}
        self._media: dict[str, list[dict[str, Any]]] = {listing_id: [] for listing_id in self._listings}
        self._leads: dict[str, list[dict[str, Any]]] = {listing_id: [] for listing_id in self._listings}
        self._visits: dict[str, list[dict[str, Any]]] = {listing_id: [] for listing_id in self._listings}
        self._tasks: dict[str, list[dict[str, Any]]] = {listing_id: [] for listing_id in self._listings}
        self._audit: dict[str, list[dict[str, Any]]] = {listing_id: [] for listing_id in self._listings}
        self._automation: dict[str, list[dict[str, Any]]] = {listing_id: self._default_automation_rules() for listing_id in self._listings}
        self._comparables = self._seed_comparables()

    async def ensure_ready(self) -> None:
        if self._seeded:
            return
        async with self._lock:
            if self._seeded:
                return
            try:
                pool = await get_pool()
            except Exception:
                pool = None
            if pool is None:
                return
            async with pool.acquire() as conn:
                await self._execute_optional_ddl(conn, "create extension if not exists pgcrypto")
                await self._execute_optional_ddl(conn, "create extension if not exists vector")
                for statement in DDL_STATEMENTS:
                    try:
                        await conn.execute(statement)
                    except Exception:
                        if "vector(1536)" not in statement:
                            raise
            await self._seed_database(pool)
            await self._load_database_state(pool)
            self._seeded = True

    async def _execute_optional_ddl(self, conn: Any, statement: str) -> bool:
        try:
            await conn.execute(statement)
            return True
        except Exception:
            return False

    def _seed_listings(self) -> dict[str, dict[str, Any]]:
        listings: dict[str, dict[str, Any]] = {}
        statuses = ["draft", "needs_review", "ready_to_publish", "published", "leads_active", "offer_stage"]
        for index, property_item in enumerate(SAMPLE_PROPERTIES[:6]):
            listing_id = f"seller-{property_item['id']}"
            price = float(property_item["price"])
            carpet = _as_int(property_item.get("carpet_area_sqft") or property_item.get("area_sqft"))
            legal_risk = 16.0 if property_item.get("rera_id") else 52.0
            readiness = 76 + (4 if property_item.get("image_url") else 0) + (4 if property_item.get("rera_id") else -10)
            listings[listing_id] = {
                "id": listing_id,
                "manager_id": self._manager.id,
                "title": property_item["title"],
                "slug": _slugify(property_item["title"]),
                "status": statuses[index % len(statuses)],
                "property_type": property_item.get("property_type", "apartment"),
                "transaction_type": "sale",
                "locality": property_item.get("locality", "Mumbai"),
                "address": property_item.get("address", "Mumbai"),
                "latitude": float(property_item.get("latitude", 19.076)),
                "longitude": float(property_item.get("longitude", 72.8777)),
                "carpet_area_sqft": carpet,
                "builtup_area_sqft": _as_int(property_item.get("built_up_area_sqft") or property_item.get("area_sqft")),
                "bedrooms": _as_int(property_item.get("bedrooms")),
                "bathrooms": _as_int(property_item.get("bathrooms")),
                "parking_count": len(property_item.get("parking") or []) or (1 if property_item.get("bedrooms", 0) >= 2 else 0),
                "furnishing_status": property_item.get("furnishing") or ("furnished" if index % 2 == 0 else "semi-furnished"),
                "possession_status": property_item.get("possession", "Ready to move"),
                # Listing-spec parameters carried from the source property.
                "pincode": property_item.get("pincode"),
                "year_built": property_item.get("year_built"),
                "listing_type": property_item.get("listing_type"),
                "current_condition": property_item.get("current_condition"),
                "who_shows_property": property_item.get("who_shows_property"),
                "kitchen_type": property_item.get("kitchen_type"),
                "parking_types": property_item.get("parking") or [],
                "maintenance_cost": property_item.get("maintenance_cost"),
                "price_status": property_item.get("price_status"),
                "google_map_link": property_item.get("google_map_link"),
                "floor_plan_url": property_item.get("floor_plan_url"),
                "brochure_url": property_item.get("brochure_url"),
                "highlights": property_item.get("highlights") or [],
                "nearby": property_item.get("nearby") or {},
                "rera_possession": property_item.get("rera_possession"),
                "builder_possession": property_item.get("builder_possession"),
                "rera_carpet_area_sqft": property_item.get("rera_carpet_area_sqft"),
                "builder": property_item.get("builder"),
                "amenities_list": property_item.get("amenities") or [],
                "occupancy_certificate": property_item.get("occupancy_certificate"),
                "allotment_letter": property_item.get("allotment_letter"),
                "sale_deed": property_item.get("sale_deed"),
                "availability_date": property_item.get("availability", "This week"),
                "rera_number": property_item.get("rera_id"),
                "asking_price": price,
                "recommended_price": round(price * 0.97, 0),
                "fast_sale_price": round(price * 0.94, 0),
                "optimistic_price": round(price * 1.05, 0),
                "min_acceptable_price": round(price * 0.92, 0),
                "price_per_sqft": round(price / max(carpet, 1), 0),
                "market_heat_score": float(property_item.get("walkability_score") or 65),
                "legal_risk_score": legal_risk,
                "readiness_score": readiness,
                "lead_quality_score": 58 + index * 6,
                "redevelopment_score": float(property_item.get("redevelopment_score") or 55 + index * 3),
                "description_short": property_item.get("description", ""),
                "description_long": property_item.get("description", ""),
                "seo_title": f"{property_item['title']} | Mumbai Seller Listing",
                "public_visibility": index >= 2,
                "owner_name": "Patel Family" if index % 2 == 0 else "Builder Desk",
                "owner_phone": "+91 90000 00001",
                "owner_email": "seller@example.com",
                "hero_image_url": property_item.get("image_url"),
                "map_payload": {"lat": property_item.get("latitude"), "lng": property_item.get("longitude")},
                "pricing_json": {},
                "copy_json": {},
                "readiness_json": {"data": readiness},
                "legal_notes": ["RERA present" if property_item.get("rera_id") else "RERA confirmation pending"],
                "created_at": _utc_now(),
                "updated_at": _utc_now(),
                "published_at": _utc_now() if index >= 3 else None,
            }
        return listings

    def _seed_comparables(self) -> list[dict[str, Any]]:
        comparables: list[dict[str, Any]] = []
        for property_item in SAMPLE_PROPERTIES:
            comparables.append(
                {
                    "id": f"comp-{property_item['id']}",
                    "locality": property_item.get("locality", "Mumbai"),
                    "property_type": property_item.get("property_type", "apartment"),
                    "price": float(property_item.get("price") or 0),
                    "price_per_sqft": round(float(property_item.get("price") or 0) / max(_as_int(property_item.get("area_sqft") or 1), 1), 0),
                    "carpet_area_sqft": _as_int(property_item.get("carpet_area_sqft") or property_item.get("area_sqft")),
                    "bedrooms": _as_int(property_item.get("bedrooms")),
                    "transaction_date": "2026-04-15",
                    "source": "mumbai_demo_db",
                    "metadata_json": {"builder": property_item.get("builder"), "rera": property_item.get("rera_id")},
                    "created_at": _utc_now(),
                }
            )
        return comparables

    def _default_automation_rules(self) -> list[dict[str, Any]]:
        names = [
            ("Auto respond to WhatsApp leads", "Lead qualification", True),
            ("Auto answer calls", "Voice triage", True),
            ("Auto schedule visits", "Cal.com booking", True),
            ("Auto send brochure", "Marketing", True),
            ("Auto follow up after visit", "Lead nurture", True),
            ("Auto detect stale leads", "Growth analytics", True),
            ("Auto recommend price changes", "Pricing", True),
            ("Auto generate weekly seller report", "Reporting", True),
            ("Auto update listing quality score", "Quality", True),
            ("Auto alert for legal risk", "Legal", True),
            ("Auto create Codex ingestion task", "Codex automation", False),
        ]
        return [
            {
                "id": f"rule-{idx}",
                "name": name,
                "enabled": enabled,
                "last_run": _utc_now() if enabled else None,
                "next_run": None,
                "agent_name": agent,
                "logs": ["Initialized in demo mode"],
                "failure_state": None,
            }
            for idx, (name, agent, enabled) in enumerate(names, start=1)
        ]

    def _seed_listing_relations(self, listing_id: str) -> None:
        if listing_id in self._documents:
            return
        self._documents[listing_id] = []
        self._media[listing_id] = []
        self._leads[listing_id] = []
        self._visits[listing_id] = []
        self._tasks[listing_id] = []
        self._audit[listing_id] = []
        self._automation[listing_id] = self._default_automation_rules()

    async def _seed_database(self, pool: Any) -> None:
        async with pool.acquire() as conn:
            existing = await conn.fetchval("select count(*) from seller_listings")
            if existing and int(existing) > 0:
                return
            await conn.execute(
                """
                insert into manager_profiles (id, user_id, full_name, company_name, phone, email, role, rera_agent_id, operating_localities)
                values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                on conflict (id) do nothing
                """,
                self._manager.id,
                self._manager.user_id,
                self._manager.full_name,
                self._manager.company_name,
                self._manager.phone,
                self._manager.email,
                self._manager.role,
                self._manager.rera_agent_id,
                self._manager.operating_localities,
            )
            for listing in self._listings.values():
                await self._save_listing_row(conn, listing)

    async def _load_database_state(self, pool: Any) -> None:
        async with pool.acquire() as conn:
            rows = await conn.fetch("select * from seller_listings order by updated_at desc")
        if not rows:
            return
        publish_on_load: list[str] = []
        self._listings = {}
        for row in rows:
            listing = {key: _json_safe(value) for key, value in dict(row).items()}
            listing["map_payload"] = _json_dict(listing.get("map_payload"))
            listing["pricing_json"] = _json_dict(listing.get("pricing_json"))
            listing["copy_json"] = _json_dict(listing.get("copy_json"))
            listing["readiness_json"] = _json_dict(listing.get("readiness_json"))
            listing["legal_notes"] = _json_list(listing.get("legal_notes"))
            self._listings[listing["id"]] = listing
            self._seed_listing_relations(listing["id"])
            if listing.get("status") in {"draft", "data_extraction", "needs_review", "ready_to_publish"} and self._has_public_listing_fields(listing):
                self._mark_listing_public(listing["id"], action="listing_auto_published_on_startup")
                publish_on_load.append(listing["id"])
        if publish_on_load:
            async with pool.acquire() as conn:
                for listing_id in publish_on_load:
                    await self._save_listing_row(conn, self._listings[listing_id])
                    await self._sync_public_property(listing_id)

    async def _save_listing(self, listing_id: str) -> None:
        try:
            pool = await get_pool()
        except Exception:
            pool = None
        if pool is None:
            return
        async with pool.acquire() as conn:
            await self._save_listing_row(conn, self._listings[listing_id])

    async def _save_listing_row(self, conn: Any, listing: dict[str, Any]) -> None:
        await conn.execute(
            """
            insert into seller_listings (
              id, manager_id, title, slug, status, property_type, transaction_type, locality, address,
              latitude, longitude, carpet_area_sqft, builtup_area_sqft, bedrooms, bathrooms, parking_count,
              furnishing_status, possession_status, availability_date, rera_number, asking_price, recommended_price,
              fast_sale_price, optimistic_price, min_acceptable_price, price_per_sqft, market_heat_score,
              legal_risk_score, readiness_score, lead_quality_score, redevelopment_score, description_short,
              description_long, seo_title, public_visibility, owner_name, owner_phone, owner_email, hero_image_url,
              map_payload, pricing_json, copy_json, readiness_json, legal_notes, created_at, updated_at, published_at
            ) values (
              $1,$2,$3,$4,$5,$6,$7,$8,$9,
              $10,$11,$12,$13,$14,$15,$16,
              $17,$18,$19,$20,$21,$22,
              $23,$24,$25,$26,$27,
              $28,$29,$30,$31,$32,$33,
              $34,$35,$36,$37,$38,
              $39,$40,$41,$42,$43,$44,$45::timestamptz,$46::timestamptz,$47::timestamptz
            ) on conflict (id) do update set
              manager_id = excluded.manager_id,
              title = excluded.title,
              slug = excluded.slug,
              status = excluded.status,
              property_type = excluded.property_type,
              transaction_type = excluded.transaction_type,
              locality = excluded.locality,
              address = excluded.address,
              latitude = excluded.latitude,
              longitude = excluded.longitude,
              carpet_area_sqft = excluded.carpet_area_sqft,
              builtup_area_sqft = excluded.builtup_area_sqft,
              bedrooms = excluded.bedrooms,
              bathrooms = excluded.bathrooms,
              parking_count = excluded.parking_count,
              furnishing_status = excluded.furnishing_status,
              possession_status = excluded.possession_status,
              availability_date = excluded.availability_date,
              rera_number = excluded.rera_number,
              asking_price = excluded.asking_price,
              recommended_price = excluded.recommended_price,
              fast_sale_price = excluded.fast_sale_price,
              optimistic_price = excluded.optimistic_price,
              min_acceptable_price = excluded.min_acceptable_price,
              price_per_sqft = excluded.price_per_sqft,
              market_heat_score = excluded.market_heat_score,
              legal_risk_score = excluded.legal_risk_score,
              readiness_score = excluded.readiness_score,
              lead_quality_score = excluded.lead_quality_score,
              redevelopment_score = excluded.redevelopment_score,
              description_short = excluded.description_short,
              description_long = excluded.description_long,
              seo_title = excluded.seo_title,
              public_visibility = excluded.public_visibility,
              owner_name = excluded.owner_name,
              owner_phone = excluded.owner_phone,
              owner_email = excluded.owner_email,
              hero_image_url = excluded.hero_image_url,
              map_payload = excluded.map_payload,
              pricing_json = excluded.pricing_json,
              copy_json = excluded.copy_json,
              readiness_json = excluded.readiness_json,
              legal_notes = excluded.legal_notes,
              updated_at = excluded.updated_at,
              published_at = excluded.published_at
            """,
            listing["id"], listing["manager_id"], listing["title"], listing["slug"], listing["status"], listing["property_type"], listing["transaction_type"], listing["locality"], listing["address"],
            listing["latitude"], listing["longitude"], listing.get("carpet_area_sqft"), listing.get("builtup_area_sqft"), listing.get("bedrooms"), listing.get("bathrooms"), listing.get("parking_count"),
            listing.get("furnishing_status"), listing.get("possession_status"), listing.get("availability_date"), listing.get("rera_number"), listing.get("asking_price"), listing.get("recommended_price"),
            listing.get("fast_sale_price"), listing.get("optimistic_price"), listing.get("min_acceptable_price"), listing.get("price_per_sqft"), listing.get("market_heat_score"),
            listing.get("legal_risk_score"), listing.get("readiness_score"), listing.get("lead_quality_score"), listing.get("redevelopment_score"), listing.get("description_short"),
            listing.get("description_long"), listing.get("seo_title"), listing.get("public_visibility"), listing.get("owner_name"), listing.get("owner_phone"), listing.get("owner_email"), listing.get("hero_image_url"),
            json.dumps(listing.get("map_payload") or {}), json.dumps(listing.get("pricing_json") or {}), json.dumps(listing.get("copy_json") or {}), json.dumps(listing.get("readiness_json") or {}), json.dumps(listing.get("legal_notes") or []), _as_datetime(listing.get("created_at")), _as_datetime(listing.get("updated_at")), _as_datetime(listing.get("published_at")),
        )

    async def _sync_public_property(self, listing_id: str) -> None:
        listing = self._listings[listing_id]
        if not listing.get("public_visibility"):
            return
        try:
            pool = await get_pool()
        except Exception:
            pool = None
        if pool is None:
            return
        price = _as_float(listing.get("asking_price"))
        area = _as_int(listing.get("builtup_area_sqft") or listing.get("carpet_area_sqft"), 1)
        bedrooms = _as_int(listing.get("bedrooms"))
        bathrooms = _as_int(listing.get("bathrooms"))
        description = listing.get("description_long") or listing.get("description_short") or listing["title"]
        embedding = listing.get("embedding")
        vector_literal = "[" + ",".join(f"{float(value):.6f}" for value in embedding[:1536]) + "]" if embedding else None
        try:
            async with pool.acquire() as conn:
                await conn.execute(
                    """
                    insert into properties (
                  id, title, address, city, locality, micro_market, property_type, transaction_type,
                  price, price_per_sqft, bedrooms, bathrooms, area_sqft, carpet_area_sqft,
                  built_up_area_sqft, latitude, longitude, status, availability, possession,
                  builder, description, amenities, tags, image_url, splat_url, rera_id,
                  redevelopment_score, walkability_score, commute_score, risk_flags, embedding, updated_at
                ) values (
                  $1,$2,$3,'Mumbai',$4,$5,$6,$7,
                  $8,$9,$10,$11,$12,$13,
                  $14,$15,$16,'available',$17,$18,
                  $19,$20,$21,$22,$23,$24,$25,
                  $26,$27,$28,$29,$30::vector,now()
                ) on conflict (id) do update set
                  title = excluded.title,
                  address = excluded.address,
                  locality = excluded.locality,
                  micro_market = excluded.micro_market,
                  property_type = excluded.property_type,
                  transaction_type = excluded.transaction_type,
                  price = excluded.price,
                  price_per_sqft = excluded.price_per_sqft,
                  bedrooms = excluded.bedrooms,
                  bathrooms = excluded.bathrooms,
                  area_sqft = excluded.area_sqft,
                  carpet_area_sqft = excluded.carpet_area_sqft,
                  built_up_area_sqft = excluded.built_up_area_sqft,
                  latitude = excluded.latitude,
                  longitude = excluded.longitude,
                  status = excluded.status,
                  availability = excluded.availability,
                  possession = excluded.possession,
                  description = excluded.description,
                  tags = excluded.tags,
                  image_url = excluded.image_url,
                  rera_id = excluded.rera_id,
                  redevelopment_score = excluded.redevelopment_score,
                  risk_flags = excluded.risk_flags,
                  embedding = excluded.embedding,
                  updated_at = now()
                    """,
                    listing["id"],
                    listing["title"],
                    listing["address"],
                    listing["locality"],
                    listing.get("locality"),
                    listing.get("property_type") or "apartment",
                    "buy" if listing.get("transaction_type") == "sale" else (listing.get("transaction_type") or "buy"),
                    price,
                    listing.get("price_per_sqft") or round(price / max(area, 1), 0),
                    bedrooms,
                    bathrooms,
                    area,
                    listing.get("carpet_area_sqft"),
                    listing.get("builtup_area_sqft"),
                    listing["latitude"],
                    listing["longitude"],
                    listing.get("availability_date") or "Viewing slots available this week",
                    listing.get("possession_status"),
                    self._manager.company_name,
                    description,
                    [],
                    [listing.get("status", "published"), "manager_listing", listing.get("locality", "Mumbai")],
                    listing.get("hero_image_url"),
                    None,
                    listing.get("rera_number"),
                    listing.get("redevelopment_score"),
                    listing.get("market_heat_score"),
                    None,
                    listing.get("legal_notes") or [],
                    vector_literal,
                )
        except Exception:
            return

    def _listing_summary(self, listing: dict[str, Any]) -> ManagerListingSummary:
        lead_count = len(self._leads.get(listing["id"], []))
        pending_tasks = sum(1 for task in self._tasks.get(listing["id"], []) if task.get("status") not in {"done", "completed"})
        next_visit = next((visit.get("scheduled_start") for visit in self._visits.get(listing["id"], [])), None)
        return ManagerListingSummary(
            **{**listing, "lead_count": lead_count, "pending_tasks": pending_tasks, "next_visit": next_visit}
        )

    def _listing_detail(self, listing_id: str) -> ManagerListingDetail:
        listing = deepcopy(self._listings[listing_id])
        legal_notes = list(listing.pop("legal_notes", []) or [])
        listing["lead_count"] = len(self._leads.get(listing_id, []))
        listing["pending_tasks"] = sum(1 for task in self._tasks.get(listing_id, []) if task.get("status") not in {"done", "completed"})
        pricing = self._pricing_model(listing)
        return ManagerListingDetail(
            **listing,
            documents=[ListingDocument(**item) for item in self._documents.get(listing_id, [])],
            media=[ListingMedia(**item) for item in self._media.get(listing_id, [])],
            leads=[ListingLead(**item) for item in self._leads.get(listing_id, [])],
            site_visits=[SiteVisit(**item) for item in self._visits.get(listing_id, [])],
            audit_log=[ListingAuditLog(**item) for item in self._audit.get(listing_id, [])],
            automation_rules=[AutomationRule(**item) for item in self._automation.get(listing_id, [])],
            market_comparables=[ComparableListing(**item) for item in self._comparables if item["locality"] == listing.get("locality")][:6],
            pricing=pricing,
            listing_copy=ListingCopyPack(**listing["copy_json"]) if listing.get("copy_json") else None,
            readiness_breakdown=listing.get("readiness_json") or {},
            missing_fields=self._missing_fields(listing),
            legal_notes=legal_notes,
            public_preview_url=f"/manager/listings/{listing_id}",
            map_preview={"latitude": listing.get("latitude"), "longitude": listing.get("longitude"), "locality": listing.get("locality")},
        )

    def _pricing_model(self, listing: dict[str, Any]) -> ListingPricing | None:
        pricing = _json_dict(listing.get("pricing_json"))
        if not pricing and not listing.get("asking_price"):
            return None
        price = _as_float(listing.get("asking_price"))
        area = max(_as_int(listing.get("carpet_area_sqft") or listing.get("builtup_area_sqft"), 1), 1)
        complete = {
            "recommended_price": pricing.get("recommended_price") or listing.get("recommended_price") or round(price * 0.97, 0),
            "minimum_acceptable_price": pricing.get("minimum_acceptable_price") or listing.get("min_acceptable_price") or round(price * 0.92, 0),
            "optimistic_price": pricing.get("optimistic_price") or listing.get("optimistic_price") or round(price * 1.05, 0),
            "fast_sale_price": pricing.get("fast_sale_price") or listing.get("fast_sale_price") or round(price * 0.94, 0),
            "price_per_sqft": pricing.get("price_per_sqft") or listing.get("price_per_sqft") or round(price / area, 0),
            "rental_yield_estimate": pricing.get("rental_yield_estimate") or 2.8,
            "buyer_affordability_segment": pricing.get("buyer_affordability_segment") or "Mumbai qualified buyers",
            "negotiation_buffer": pricing.get("negotiation_buffer") or round(price * 0.03, 0),
            "market_heat_score": pricing.get("market_heat_score") or listing.get("market_heat_score") or 60,
            "redevelopment_upside_score": pricing.get("redevelopment_upside_score") or listing.get("redevelopment_score") or 45,
            "confidence_score": pricing.get("confidence_score") or 74,
            "explanation": pricing.get("explanation") or "Indicative pricing based on listing fields and Mumbai market defaults.",
        }
        return ListingPricing(**complete)

    def _missing_fields(self, listing: dict[str, Any]) -> list[str]:
        missing = []
        checks = [
            ("title", "Listing title"),
            ("locality", "Locality"),
            ("address", "Exact address"),
            ("latitude", "Latitude"),
            ("longitude", "Longitude"),
            ("carpet_area_sqft", "Carpet area"),
            ("asking_price", "Asking price"),
        ]
        for key, label in checks:
            if listing.get(key) in {None, "", 0}:
                missing.append(label)
        return missing

    def _has_public_listing_fields(self, listing: dict[str, Any]) -> bool:
        return not self._missing_fields(listing)

    def _mark_listing_public(self, listing_id: str, action: str = "listing_published") -> None:
        listing = self._listings[listing_id]
        now = _utc_now()
        price = _as_float(listing.get("asking_price"))
        area = max(_as_int(listing.get("carpet_area_sqft") or listing.get("builtup_area_sqft"), 1), 1)
        listing["status"] = "published"
        listing["public_visibility"] = True
        listing["published_at"] = listing.get("published_at") or now
        listing["updated_at"] = now
        listing["readiness_score"] = max(float(listing.get("readiness_score", 0)), 88)
        listing["recommended_price"] = listing.get("recommended_price") or round(price * 0.97, 0)
        listing["fast_sale_price"] = listing.get("fast_sale_price") or round(price * 0.94, 0)
        listing["optimistic_price"] = listing.get("optimistic_price") or round(price * 1.05, 0)
        listing["min_acceptable_price"] = listing.get("min_acceptable_price") or round(price * 0.92, 0)
        listing["price_per_sqft"] = listing.get("price_per_sqft") or round(price / area, 0)
        listing["pricing_json"] = self._pricing_model(listing).model_dump(mode="json")
        listing["readiness_json"] = {
            **(listing.get("readiness_json") or {}),
            "readiness_score": listing["readiness_score"],
            "published_by_default": True,
        }
        if not listing.get("rera_number"):
            notes = list(listing.get("legal_notes") or [])
            if "RERA / legal identifier pending verification" not in notes:
                notes.append("RERA / legal identifier pending verification")
            listing["legal_notes"] = notes
        self._add_audit(listing_id, "manager", self._manager.full_name, action, {"summary": f"Published {listing['title']} as property inventory"})

    def _activity_feed(self) -> list[ManagerFeedEvent]:
        items: list[ManagerFeedEvent] = []
        for listing_id, logs in self._audit.items():
            for log in logs[-3:]:
                items.append(
                    ManagerFeedEvent(
                        id=log["id"],
                        created_at=log["created_at"],
                        actor_type=log["actor_type"],
                        actor_name=log["actor_name"],
                        action=log["action"],
                        details=str(log["details_json"].get("summary") or log["details_json"].get("details") or log["action"]),
                        tone="emerald" if "publish" in log["action"] else "amber" if "risk" in log["action"] else "neutral",
                    )
                )
        return sorted(items, key=lambda item: item.created_at, reverse=True)[:12]

    def _manager_tasks(self) -> list[ManagerTaskItem]:
        tasks: list[ManagerTaskItem] = []
        for listing_id, items in self._tasks.items():
            for item in items:
                tasks.append(
                    ManagerTaskItem(
                        id=item["id"],
                        title=item["title"],
                        description=item.get("description") or item["title"],
                        priority=item.get("priority", "medium"),
                        status=item.get("status", "open"),
                        action_label=item.get("action_label", "Review"),
                        listing_id=listing_id,
                    )
                )
        return tasks[:12]

    def _pipeline_columns(self) -> list[ManagerPipelineColumn]:
        buckets = [
            ("draft", "Draft"),
            ("data_extraction", "Data Extraction"),
            ("needs_review", "Needs Review"),
            ("ready_to_publish", "Ready to Publish"),
            ("published", "Published"),
            ("leads_active", "Leads Active"),
            ("offer_stage", "Offer Stage"),
            ("negotiation", "Negotiation"),
            ("closed", "Closed"),
            ("archived", "Archived"),
        ]
        columns: list[ManagerPipelineColumn] = []
        for key, label in buckets:
            listing_ids = [listing_id for listing_id, listing in self._listings.items() if listing.get("status") == key]
            columns.append(ManagerPipelineColumn(id=key, label=label, listing_ids=listing_ids, count=len(listing_ids)))
        return columns

    def _summary_cards(self) -> list[ManagerSummaryCard]:
        listings = list(self._listings.values())
        active = sum(1 for listing in listings if listing.get("status") in {"published", "leads_active", "offer_stage", "negotiation"})
        drafts = sum(1 for listing in listings if listing.get("status") in {"draft", "data_extraction", "needs_review", "ready_to_publish"})
        leads_this_week = sum(len(items) for items in self._leads.values())
        visits = sum(len(items) for items in self._visits.values())
        offers = sum(1 for listing in listings if listing.get("status") in {"offer_stage", "negotiation"})
        avg_response = 8 if leads_this_week else 0
        pipeline_value = sum(_as_float(listing.get("asking_price")) for listing in listings if listing.get("public_visibility"))
        attention = sum(1 for listing in listings if listing.get("legal_risk_score", 0) > 40 or listing.get("readiness_score", 0) < 75)
        ai_tasks = sum(len(items) for items in self._tasks.values())
        legal_alerts = sum(1 for listing in listings if listing.get("legal_risk_score", 0) > 50)
        return [
            ManagerSummaryCard(label="Active listings", value=str(active), detail="Published and in lead or negotiation flow", tone="emerald"),
            ManagerSummaryCard(label="Draft listings", value=str(drafts), detail="Needs review or publish prep", tone="slate"),
            ManagerSummaryCard(label="Leads this week", value=str(leads_this_week), detail="Across WhatsApp, call, and web", tone="gold"),
            ManagerSummaryCard(label="Site visits", value=str(visits), detail="Scheduled and requested", tone="emerald"),
            ManagerSummaryCard(label="Offers received", value=str(offers), detail="Open offer-stage listings", tone="amber"),
            ManagerSummaryCard(label="Avg response", value=f"{avg_response} min", detail="Live assistant response time", tone="slate"),
            ManagerSummaryCard(label="Pipeline value", value=f"₹{pipeline_value/10_000_000:.1f} Cr", detail="Visible public listings", tone="emerald"),
            ManagerSummaryCard(label="Needs attention", value=str(attention), detail="Missing legal or media items", tone="amber"),
            ManagerSummaryCard(label="AI tasks done", value=str(ai_tasks), detail="Agent actions recorded", tone="slate"),
            ManagerSummaryCard(label="Legal alerts", value=str(legal_alerts), detail="RERA / mismatch warnings", tone="amber"),
        ]

    async def dashboard(self) -> ManagerDashboard:
        await self.ensure_ready()
        return ManagerDashboard(
            manager=self._manager,
            summary_cards=self._summary_cards(),
            map_pins=self._map_pins(),
            pipeline_columns=self._pipeline_columns(),
            activity_feed=self._activity_feed(),
            urgent_tasks=self._manager_tasks(),
            listings=[self._listing_summary(listing) for listing in self._listings.values()],
            market_highlights=market_insights(),
        )

    def _map_pins(self) -> list[ManagerMapPin]:
        palette = {
            "draft": "yellow",
            "data_extraction": "yellow",
            "needs_review": "red",
            "ready_to_publish": "blue",
            "published": "green",
            "leads_active": "blue",
            "offer_stage": "purple",
            "negotiation": "purple",
            "closed": "gray",
            "archived": "gray",
        }
        pins: list[ManagerMapPin] = []
        for listing in self._listings.values():
            pins.append(
                ManagerMapPin(
                    id=listing["id"],
                    title=listing["title"],
                    locality=listing["locality"],
                    status=listing["status"],
                    color=palette.get(listing["status"], "yellow"),
                    latitude=float(listing["latitude"]),
                    longitude=float(listing["longitude"]),
                    price=_as_float(listing.get("asking_price")),
                    market_heat_score=float(listing.get("market_heat_score", 0)),
                    legal_risk_score=float(listing.get("legal_risk_score", 0)),
                    lead_count=len(self._leads.get(listing["id"], [])),
                    readiness_score=float(listing.get("readiness_score", 0)),
                )
            )
        return pins

    async def list_listings(self) -> list[ManagerListingSummary]:
        await self.ensure_ready()
        return [self._listing_summary(listing) for listing in self._listings.values()]

    async def get_listing(self, listing_id: str) -> ManagerListingDetail:
        await self.ensure_ready()
        if listing_id not in self._listings:
            raise HTTPException(status_code=404, detail="Listing not found")
        return self._listing_detail(listing_id)

    async def create_listing(self, request: ManagerCreateListingRequest) -> ManagerListingDetail:
        await self.ensure_ready()
        listing_id = f"seller-{uuid4().hex[:8]}"
        listing = {
            "id": listing_id,
            "manager_id": request.manager_id,
            "title": request.title,
            "slug": _slugify(request.title),
            "status": "draft",
            "property_type": request.property_type,
            "transaction_type": request.transaction_type,
            "locality": request.locality,
            "address": request.address,
            "latitude": request.latitude,
            "longitude": request.longitude,
            "carpet_area_sqft": request.carpet_area_sqft,
            "builtup_area_sqft": request.builtup_area_sqft,
            "bedrooms": request.bedrooms,
            "bathrooms": request.bathrooms,
            "parking_count": request.parking_count,
            "furnishing_status": request.furnishing_status,
            "possession_status": request.possession_status,
            "availability_date": request.availability_date,
            "rera_number": request.rera_number,
            "asking_price": request.asking_price,
            "recommended_price": None,
            "fast_sale_price": None,
            "optimistic_price": None,
            "min_acceptable_price": None,
            "price_per_sqft": None,
            "market_heat_score": 60,
            "legal_risk_score": 44 if not request.rera_number else 18,
            "readiness_score": 42,
            "lead_quality_score": 0,
            "redevelopment_score": 48,
            "description_short": request.notes or "Seller-created listing draft",
            "description_long": request.notes or "Seller-created listing draft",
            "seo_title": request.title,
            "public_visibility": False,
            "owner_name": request.owner_name,
            "owner_phone": request.owner_phone,
            "owner_email": request.owner_email,
            "hero_image_url": None,
            "map_payload": {"lat": request.latitude, "lng": request.longitude},
            "pricing_json": {},
            "copy_json": {},
            "readiness_json": {},
            "legal_notes": ["Awaiting document intake"],
            "created_at": _utc_now(),
            "updated_at": _utc_now(),
            "published_at": None,
        }
        self._listings[listing_id] = listing
        self._seed_listing_relations(listing_id)
        self._add_task(listing_id, "Seller Intake Agent", "intake_validation", "Review mandatory fields before publish", priority="high")
        self._add_audit(listing_id, "manager", self._manager.full_name, "listing_created", {"summary": f"Created {request.title}"})
        if request.publish_immediately and self._has_public_listing_fields(listing):
            self._mark_listing_public(listing_id, action="listing_created_and_published")
            self._add_task(listing_id, "Publishing Agent", "publish", "Listing is live on manager, broker, and buyer property surfaces", priority="high")
        await self._save_listing(listing_id)
        if self._listings[listing_id].get("public_visibility"):
            await self._sync_public_property(listing_id)
        return self._listing_detail(listing_id)

    def _add_task(self, listing_id: str, agent_name: str, task_type: str, description: str, priority: str = "medium") -> None:
        item = {
            "id": f"task-{uuid4().hex[:10]}",
            "listing_id": listing_id,
            "agent_name": agent_name,
            "task_type": task_type,
            "status": "open",
            "priority": priority,
            "input_json": {},
            "output_json": {},
            "error_message": None,
            "created_at": _utc_now(),
            "updated_at": _utc_now(),
            "completed_at": None,
            "title": description,
            "description": description,
            "action_label": "Review",
        }
        self._tasks.setdefault(listing_id, []).append(item)

    def _add_audit(self, listing_id: str, actor_type: str, actor_name: str, action: str, details: dict[str, Any]) -> None:
        item = {
            "id": f"audit-{uuid4().hex[:10]}",
            "listing_id": listing_id,
            "actor_type": actor_type,
            "actor_name": actor_name,
            "action": action,
            "details_json": details,
            "created_at": _utc_now(),
        }
        self._audit.setdefault(listing_id, []).append(item)

    async def run_listing_agents(self, listing_id: str, request: ManagerAgentRunRequest) -> dict[str, Any]:
        await self.ensure_ready()
        if listing_id not in self._listings:
            raise HTTPException(status_code=404, detail="Listing not found")
        graph = build_manager_graph()
        state = {
            "manager_id": request.manager_id,
            "listing_id": listing_id,
            "current_task": request.current_task or "seller_automation",
            "user_request": request.user_request,
            "listing_snapshot": deepcopy(self._listings[listing_id]),
            "missing_fields": self._missing_fields(self._listings[listing_id]),
            "readiness_score": float(self._listings[listing_id].get("readiness_score", 0)),
            "legal_risk_score": float(self._listings[listing_id].get("legal_risk_score", 0)),
            "messages": [],
            "audit_events": [],
            "auto_publish": request.auto_publish,
            "published": False,
        }
        result = await graph.ainvoke(state)
        self._apply_automation_result(listing_id, result)
        await self._save_listing(listing_id)
        if self._listings[listing_id].get("public_visibility"):
            await self._sync_public_property(listing_id)
        return {"listing": self._listing_detail(listing_id).model_dump(mode="json"), "automation_state": result}

    async def run_full_automation(self, request: ManagerAutomationRunRequest) -> dict[str, Any]:
        return await self.run_listing_agents(
            request.listing_id,
            ManagerAgentRunRequest(
                manager_id=request.manager_id,
                user_request="Run full listing automation",
                auto_publish=request.auto_publish,
                current_task=request.current_task,
            ),
        )

    def _apply_automation_result(self, listing_id: str, result: dict[str, Any]) -> None:
        listing = self._listings[listing_id]
        snapshot = result.get("listing_snapshot", {}) or {}
        listing.update(
            {
                "title": snapshot.get("title", listing["title"]),
                "slug": snapshot.get("slug", listing["slug"]),
                "status": "published" if result.get("published") else ("needs_review" if result.get("readiness_score", 0) >= 70 else listing.get("status", "draft")),
                "recommended_price": snapshot.get("recommended_price", listing.get("recommended_price")),
                "fast_sale_price": snapshot.get("fast_sale_price", listing.get("fast_sale_price")),
                "optimistic_price": snapshot.get("optimistic_price", listing.get("optimistic_price")),
                "min_acceptable_price": snapshot.get("min_acceptable_price", listing.get("min_acceptable_price")),
                "price_per_sqft": snapshot.get("price_per_sqft", listing.get("price_per_sqft")),
                "market_heat_score": snapshot.get("market_heat_score", listing.get("market_heat_score")),
                "legal_risk_score": result.get("legal_risk_score", listing.get("legal_risk_score")),
                "readiness_score": result.get("readiness_score", listing.get("readiness_score")),
                "description_short": snapshot.get("description_short", listing.get("description_short")),
                "description_long": snapshot.get("description_long", listing.get("description_long")),
                "seo_title": snapshot.get("seo_title", listing.get("seo_title")),
                "hero_image_url": snapshot.get("hero_image_url", listing.get("hero_image_url")),
                "pricing_json": snapshot.get("pricing_analysis", listing.get("pricing_json", {})),
                "copy_json": snapshot.get("listing_copy", listing.get("copy_json", {})),
                "readiness_json": {"readiness_score": result.get("readiness_score", listing.get("readiness_score", 0)), "missing_fields": result.get("missing_fields", [])},
                "legal_notes": snapshot.get("legal_notes", listing.get("legal_notes", [])),
                "updated_at": _utc_now(),
            }
        )
        if result.get("published"):
            listing["public_visibility"] = True
            listing["published_at"] = _utc_now()
        self._add_audit(listing_id, "agent", "Manager Automation Graph", "automation_run", {"summary": "Full listing automation completed", "published": bool(result.get("published"))})
        if result.get("published"):
            self._add_task(listing_id, "Publishing Agent", "publish", "Listing is published and visible on buyer surfaces", priority="high")

    async def publish_listing(self, listing_id: str) -> ManagerPublishResponse:
        await self.ensure_ready()
        if listing_id not in self._listings:
            raise HTTPException(status_code=404, detail="Listing not found")
        listing = self._listings[listing_id]
        missing = self._missing_fields(listing)
        if missing:
            raise HTTPException(status_code=422, detail={"missing_items": missing})
        self._mark_listing_public(listing_id, action="listing_published")
        content = " ".join(filter(None, [listing.get("title"), listing.get("locality"), listing.get("description_short"), listing.get("description_long")]))
        vector = await self.embedder.embed(content)
        listing["embedding"] = vector[:1536]
        self._add_task(listing_id, "Publishing Agent", "publish", "Verify public listing surfaces and WhatsApp/call routing", priority="high")
        await self._save_listing(listing_id)
        await self._sync_public_property(listing_id)
        return ManagerPublishResponse(published=True, missing_items=[], listing=self._listing_detail(listing_id), audit_log=[ListingAuditLog(**item) for item in self._audit.get(listing_id, [])][-6:])

    async def upload_documents(self, listing_id: str, files: list[Any], document_type: str) -> dict[str, Any]:
        await self.ensure_ready()
        if listing_id not in self._listings:
            raise HTTPException(status_code=404, detail="Listing not found")
        created: list[ListingDocument] = []
        for file in files:
            item = ListingDocument(
                id=f"doc-{uuid4().hex[:10]}",
                listing_id=listing_id,
                document_type=document_type,
                file_url=f"/uploads/{file.filename}",
                file_name=file.filename,
                extraction_status="extracted",
                extracted_json={
                    "parties": [self._manager.full_name, self._listings[listing_id].get("owner_name")],
                    "property_identity": self._listings[listing_id].get("title"),
                    "agreement_dates": [_utc_now()],
                    "payment_milestones": ["20% on booking", "80% on registration"],
                    "possession_dates": [self._listings[listing_id].get("availability_date")],
                    "contingencies": ["Manager verification required"],
                    "legal_red_flags": [] if self._listings[listing_id].get("rera_number") else ["RERA not supplied"],
                },
                confidence_score=0.84,
                red_flags=[] if self._listings[listing_id].get("rera_number") else ["RERA not supplied"],
                missing_items=["Title report"] if document_type == "sale_deed" else [],
                created_at=_utc_now(),
                updated_at=_utc_now(),
            )
            self._documents.setdefault(listing_id, []).append(item.model_dump(mode="json"))
            self._add_audit(listing_id, "agent", "Document Due Diligence Agent", "document_uploaded", {"summary": f"Uploaded {file.filename}"})
            created.append(item)
        self._add_task(listing_id, "Document Due Diligence Agent", "extract_documents", "Review extracted clauses and red flags", priority="high")
        return {"listing_id": listing_id, "documents": [item.model_dump(mode="json") for item in created], "audit_log": [ListingAuditLog(**item).model_dump(mode="json") for item in self._audit.get(listing_id, [])][-4:]}

    async def upload_media(self, listing_id: str, files: list[Any], media_type: str) -> dict[str, Any]:
        await self.ensure_ready()
        if listing_id not in self._listings:
            raise HTTPException(status_code=404, detail="Listing not found")
        created: list[ListingMedia] = []
        rooms = ["living_room", "kitchen", "bedroom", "bathroom", "building_exterior", "view", "amenities"]
        for index, file in enumerate(files):
            room = rooms[index % len(rooms)]
            item = ListingMedia(
                id=f"media-{uuid4().hex[:10]}",
                listing_id=listing_id,
                media_type=media_type,
                room_type=room,
                file_url=f"/uploads/{file.filename}",
                thumbnail_url=f"/uploads/{file.filename}",
                caption=f"{room.replace('_', ' ').title()} for {self._listings[listing_id]['title']}",
                alt_text=f"{room.replace('_', ' ')} image for {self._listings[listing_id]['title']}",
                is_hero=index == 0,
                quality_score=86 if index == 0 else 74,
                created_at=_utc_now(),
            )
            self._media.setdefault(listing_id, []).append(item.model_dump(mode="json"))
            self._add_audit(listing_id, "agent", "Media Intelligence Agent", "media_uploaded", {"summary": f"Uploaded {file.filename}", "room": room})
            created.append(item)
        if any(file.filename.lower().endswith((".mp4", ".mov", ".mkv")) for file in files):
            self._add_task(listing_id, "Codex Ops Agent", "3dgs_pipeline", "Trigger 3DGS / walkthrough ingestion task", priority="high")
        self._add_task(listing_id, "Media Intelligence Agent", "quality_review", "Approve hero image and missing visuals", priority="medium")
        return {"listing_id": listing_id, "media": [item.model_dump(mode="json") for item in created], "audit_log": [ListingAuditLog(**item).model_dump(mode="json") for item in self._audit.get(listing_id, [])][-4:]}

    async def leads(self) -> list[ListingLead]:
        await self.ensure_ready()
        results: list[ListingLead] = []
        for listing_id, items in self._leads.items():
            for item in items:
                results.append(ListingLead(**item))
        return results

    async def lead_detail(self, lead_id: str) -> ListingLead:
        await self.ensure_ready()
        for items in self._leads.values():
            for item in items:
                if item["id"] == lead_id:
                    return ListingLead(**item)
        raise HTTPException(status_code=404, detail="Lead not found")

    async def tasks(self) -> list[ManagerTaskItem]:
        await self.ensure_ready()
        return self._manager_tasks()

    async def market(self) -> dict[str, Any]:
        await self.ensure_ready()
        return {
            "city": "Mumbai",
            "localities": self._manager.operating_localities,
            "insights": market_insights(),
            "comparables": [ComparableListing(**item).model_dump(mode="json") for item in self._comparables[:12]],
            "cost_buckets": ["below ₹5 Cr", "₹5–10 Cr", "above ₹10 Cr"],
            "buyer_suitability": {"family": ["Borivali", "Chembur", "Powai"], "investor": ["Andheri", "Malad", "Ghatkopar"], "nri": ["Bandra", "Worli", "Lower Parel"]},
        }

    async def audit_log(self) -> list[ListingAuditLog]:
        await self.ensure_ready()
        audit: list[ListingAuditLog] = []
        for listing_id, entries in self._audit.items():
            audit.extend(ListingAuditLog(**entry) for entry in entries)
        return sorted(audit, key=lambda item: item.created_at, reverse=True)

    async def automation(self) -> list[AutomationRule]:
        await self.ensure_ready()
        rules: list[AutomationRule] = []
        for items in self._automation.values():
            rules.extend(AutomationRule(**item) for item in items)
        return rules[:20]

    async def dashboard_payload(self) -> ManagerDashboard:
        return await self.dashboard()

    def get_listing_for_frontend(self, listing_id: str) -> dict[str, Any]:
        listing = self._listings[listing_id]
        detail = self._listing_detail(listing_id)
        return detail.model_dump(mode="json")


manager_portal_service = ManagerPortalService()
