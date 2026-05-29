from __future__ import annotations

import asyncio
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import uuid4

from fastapi import HTTPException

from app.agents.broker_graph import build_broker_graph
from app.broker_models import (
    BrokerAgentTask,
    BrokerAuditLog,
    BrokerAutomationRunRequest,
    BrokerBuyer,
    BrokerBuyerCreate,
    BrokerCommission,
    BrokerDashboard,
    BrokerFeedEvent,
    BrokerInventoryProperty,
    BrokerLeadAttribution,
    BrokerLeadImportRequest,
    BrokerMapPin,
    BrokerProfile,
    BrokerProfileUpsertRequest,
    BrokerSummaryCard,
    BrokerTieupRequest,
    BrokerTieupRequestCreate,
    ManagerTieupDecisionRequest,
    PropertyPoolCreateRequest,
    PropertyPoolEvent,
    PropertyPoolRegistration,
)
from app.db.session import get_pool
from app.services.manager_portal import manager_portal_service


DDL_STATEMENTS = [
    """
    create table if not exists broker_profiles (
      id text primary key default gen_random_uuid()::text,
      user_id text,
      full_name text not null,
      agency_name text,
      phone text not null,
      email text not null,
      whatsapp_number text,
      rera_agent_id text,
      operating_localities text[] not null default '{}',
      years_experience int not null default 0,
      property_categories text[] not null default '{}',
      buyer_network_size int not null default 0,
      average_monthly_visits int not null default 0,
      preferred_commission_structure text,
      languages_spoken text[] not null default '{}',
      specialization text[] not null default '{}',
      verification_status text not null default 'pending',
      trust_score numeric not null default 0,
      profile_photo_url text,
      business_card_url text,
      kyc_document_url text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
    """,
    """
    create table if not exists broker_tieup_requests (
      id text primary key default gen_random_uuid()::text,
      broker_id text,
      manager_id text,
      listing_id text,
      status text not null default 'requested',
      requested_commission numeric,
      approved_commission numeric,
      requested_validity_days int,
      approved_validity_days int,
      requested_exclusivity boolean not null default false,
      approved_exclusivity boolean not null default false,
      requested_propertypool_rights boolean not null default false,
      approved_propertypool_rights boolean not null default false,
      intended_buyer_segment text,
      expected_buyer_count int,
      marketing_channels text[] not null default '{}',
      broker_message text,
      manager_response text,
      ai_recommendation_json jsonb not null default '{}'::jsonb,
      approved_terms_json jsonb not null default '{}'::jsonb,
      expires_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
    """,
    """
    create table if not exists broker_property_access (
      id text primary key default gen_random_uuid()::text,
      broker_id text,
      listing_id text,
      tieup_id text,
      access_status text,
      can_share_whatsapp boolean not null default false,
      can_create_propertypool boolean not null default false,
      can_book_visits boolean not null default false,
      can_view_documents boolean not null default false,
      can_view_manager_contact boolean not null default false,
      commission_rule_json jsonb not null default '{}'::jsonb,
      attribution_expiry_days int not null default 90,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
    """,
    """
    create table if not exists broker_buyers (
      id text primary key default gen_random_uuid()::text,
      broker_id text,
      full_name text not null,
      phone text not null,
      email text,
      budget_min numeric,
      budget_max numeric,
      preferred_localities text[] not null default '{}',
      property_type_preference text,
      bhk_preference text,
      purchase_purpose text,
      buying_timeline text,
      loan_required boolean not null default true,
      family_size int,
      lead_temperature text not null default 'warm',
      communication_channel text not null default 'WhatsApp',
      notes text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
    """,
    """
    create table if not exists broker_lead_attributions (
      id text primary key default gen_random_uuid()::text,
      broker_id text,
      buyer_id text,
      listing_id text,
      tieup_id text,
      attribution_status text,
      first_introduced_at timestamptz,
      last_interaction_at timestamptz,
      expiry_at timestamptz,
      source text,
      duplicate_conflict boolean not null default false,
      conflict_details_json jsonb not null default '{}'::jsonb,
      commission_eligible boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
    """,
    """
    create table if not exists propertypool_events (
      id text primary key default gen_random_uuid()::text,
      listing_id text,
      broker_id text,
      manager_id text,
      tieup_id text,
      event_title text,
      event_type text,
      status text,
      scheduled_start timestamptz,
      scheduled_end timestamptz,
      max_buyers int,
      meeting_point text,
      buyer_segment text,
      route_json jsonb not null default '{}'::jsonb,
      tour_script text,
      invite_message text,
      reminder_schedule_json jsonb not null default '{}'::jsonb,
      manager_approval_status text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
    """,
    """
    create table if not exists propertypool_registrations (
      id text primary key default gen_random_uuid()::text,
      event_id text,
      buyer_id text,
      broker_id text,
      rsvp_status text,
      checkin_status text,
      checkin_time timestamptz,
      feedback_json jsonb not null default '{}'::jsonb,
      interest_level text,
      next_action text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
    """,
    """
    create table if not exists broker_commissions (
      id text primary key default gen_random_uuid()::text,
      broker_id text,
      buyer_id text,
      listing_id text,
      tieup_id text,
      deal_status text,
      property_value numeric,
      commission_percentage numeric,
      expected_commission numeric,
      approved_commission numeric,
      payout_status text,
      dispute_status text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
    """,
    """
    create table if not exists broker_agent_tasks (
      id text primary key default gen_random_uuid()::text,
      broker_id text,
      listing_id text,
      buyer_id text,
      propertypool_event_id text,
      agent_name text,
      task_type text,
      status text,
      priority text,
      input_json jsonb not null default '{}'::jsonb,
      output_json jsonb not null default '{}'::jsonb,
      error_message text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      completed_at timestamptz
    )
    """,
    """
    create table if not exists broker_audit_logs (
      id text primary key default gen_random_uuid()::text,
      broker_id text,
      listing_id text,
      buyer_id text,
      action text,
      actor_type text,
      actor_name text,
      details_json jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )
    """,
]


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _future(days: int) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()


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


class BrokerPortalService:
    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._seeded = False
        self._broker = BrokerProfile(
            id="broker-demo-1",
            user_id="broker-user-demo",
            full_name="Aarav Shah",
            agency_name="Shah Homes Network",
            phone="+91 90000 01001",
            email="aarav@shahhomes.example",
            whatsapp_number="+91 90000 01001",
            rera_agent_id="A51800004567",
            operating_localities=["Andheri", "Bandra", "Chembur", "Powai", "Borivali"],
            years_experience=9,
            property_categories=["resale", "luxury", "redevelopment"],
            buyer_network_size=240,
            average_monthly_visits=22,
            preferred_commission_structure="2% success fee with protected attribution",
            languages_spoken=["English", "Hindi", "Marathi", "Gujarati"],
            specialization=["luxury", "redevelopment", "resale", "NRI"],
            verification_status="verified",
            trust_score=88,
            kyc_document_url="/demo/broker-kyc.pdf",
            business_card_url="/demo/business-card.png",
            created_at=_utc_now(),
            updated_at=_utc_now(),
        )
        self._tieups: dict[str, dict[str, Any]] = {}
        self._buyers: dict[str, dict[str, Any]] = {}
        self._attributions: dict[str, dict[str, Any]] = {}
        self._propertypool: dict[str, dict[str, Any]] = {}
        self._registrations: dict[str, dict[str, Any]] = {}
        self._commissions: dict[str, dict[str, Any]] = {}
        self._tasks: dict[str, dict[str, Any]] = {}
        self._audit: list[dict[str, Any]] = []
        self._seed_demo_records()

    async def ensure_ready(self) -> None:
        await manager_portal_service.ensure_ready()
        if self._seeded:
            return
        async with self._lock:
            if self._seeded:
                return
            try:
                pool = await get_pool()
            except Exception:
                pool = None
            if pool is not None:
                async with pool.acquire() as conn:
                    for statement in DDL_STATEMENTS:
                        await conn.execute(statement)
            self._seeded = True

    def _seed_demo_records(self) -> None:
        for idx, buyer in enumerate(
            [
                ("Rahul Mehta", "+91 90000 02001", ["Andheri", "Powai"], 16_000_000, 24_000_000, "family buyers", "hot"),
                ("Nisha Iyer", "+91 90000 02002", ["Bandra", "Worli"], 45_000_000, 75_000_000, "NRI buyers", "ready_to_offer"),
                ("Kabir Merchant", "+91 90000 02003", ["Chembur", "Ghatkopar"], 22_000_000, 34_000_000, "investors", "warm"),
                ("Ananya Rao", "+91 90000 02004", ["Borivali", "Malad"], 12_000_000, 20_000_000, "first-time buyers", "hot"),
            ],
            start=1,
        ):
            item = {
                "id": f"buyer-demo-{idx}",
                "broker_id": self._broker.id,
                "full_name": buyer[0],
                "phone": buyer[1],
                "email": f"buyer{idx}@example.com",
                "budget_min": buyer[3],
                "budget_max": buyer[4],
                "preferred_localities": buyer[2],
                "property_type_preference": "apartment",
                "bhk_preference": "2-3 BHK",
                "purchase_purpose": buyer[5],
                "buying_timeline": "30-60 days",
                "loan_required": True,
                "family_size": 4,
                "lead_temperature": buyer[6],
                "communication_channel": "WhatsApp",
                "assigned_properties": [],
                "visit_history": [],
                "offer_history": [],
                "follow_up_status": "due today",
                "qualification_score": 82 + idx * 3,
                "notes": "Demo buyer imported from broker network.",
                "created_at": _utc_now(),
                "updated_at": _utc_now(),
            }
            self._buyers[item["id"]] = item
        self._add_task("Broker Inventory Discovery Agent", "tieup_recommendation", "Review 7 manager listings that match active buyer demand", "high")
        self._add_task("PropertyPool Planning Agent", "group_visit", "Create Andheri PropertyPool for Saturday 5 PM", "high")
        self._add_audit("broker_profile_seeded", {"summary": "Demo broker profile and buyer network initialized."})

    def _manager_listings(self) -> list[dict[str, Any]]:
        return [deepcopy(item) for item in manager_portal_service._listings.values()]  # noqa: SLF001 - shared in-memory demo service

    def _listing(self, listing_id: str) -> dict[str, Any]:
        listing = manager_portal_service._listings.get(listing_id)  # noqa: SLF001
        if not listing and listing_id.startswith("seller-demo-"):
            listing = manager_portal_service._listings.get(listing_id.replace("seller-demo-", "seller-mumbai-", 1))  # noqa: SLF001
        if not listing:
            raise HTTPException(status_code=404, detail="Property not found")
        return deepcopy(listing)

    def _tieup_for_listing(self, listing_id: str, broker_id: str = "broker-demo-1") -> dict[str, Any] | None:
        return next((item for item in self._tieups.values() if item["listing_id"] == listing_id and item["broker_id"] == broker_id and item["status"] not in {"cancelled", "expired"}), None)

    def _property_access(self, listing: dict[str, Any]) -> BrokerInventoryProperty:
        tieup = self._tieup_for_listing(listing["id"])
        approved = tieup and tieup["status"] in {"approved", "agreement_accepted", "active"}
        pending = tieup and tieup["status"] in {"requested", "under_review", "terms_updated"}
        price = _as_float(listing.get("asking_price"))
        commission_pct = _as_float(tieup.get("approved_commission") if tieup else None, 2.0 if price < 50_000_000 else 1.5)
        demand = min(96.0, _as_float(listing.get("lead_quality_score"), 55) + len(self._buyers) * 4)
        map_color = "blue" if approved else ("yellow" if pending else ("purple" if commission_pct >= 2 else ("green" if listing.get("public_visibility") else "red")))
        return BrokerInventoryProperty(
            id=listing["id"],
            manager_id=listing.get("manager_id") or "manager-demo-1",
            title=listing["title"],
            locality=listing["locality"],
            address=listing["address"],
            latitude=_as_float(listing.get("latitude"), 19.076),
            longitude=_as_float(listing.get("longitude"), 72.8777),
            price=price,
            carpet_area_sqft=_as_int(listing.get("carpet_area_sqft")),
            bedrooms=_as_int(listing.get("bedrooms")),
            property_type=listing.get("property_type") or "apartment",
            image_url=listing.get("hero_image_url"),
            commission_estimate=round(price * commission_pct / 100, 0),
            commission_range=f"{commission_pct:.1f}% - {commission_pct + 0.4:.1f}%",
            tieup_status=tieup["status"] if tieup else ("open" if listing.get("public_visibility") else "approval_required"),
            map_color=map_color,
            allowed_marketing_status="approved channels active" if approved else ("awaiting manager approval" if pending else "request tie-up to share"),
            buyer_match_score=min(97, demand + (8 if listing["locality"] in self._broker.operating_localities else 0)),
            buyer_demand_score=demand,
            market_heat_score=_as_float(listing.get("market_heat_score")),
            legal_risk_score=_as_float(listing.get("legal_risk_score")),
            redevelopment_score=_as_float(listing.get("redevelopment_score")),
            visit_availability=listing.get("availability_date") or "This week",
            propertypool_status="available" if approved and (tieup or {}).get("approved_propertypool_rights", True) else "eligible after tie-up",
            propertypool_eligible=True,
            sharing_rights=["WhatsApp", "Calls", "Existing buyer database"] if approved else [],
            rera_number=listing.get("rera_number"),
            description=listing.get("description_short"),
        )

    def _add_audit(self, action: str, details: dict[str, Any], broker_id: str | None = None, listing_id: str | None = None, buyer_id: str | None = None, actor_type: str = "agent", actor_name: str = "Broker Network Automation") -> None:
        self._audit.append(
            {
                "id": f"audit-{uuid4().hex[:10]}",
                "broker_id": broker_id or self._broker.id,
                "listing_id": listing_id,
                "buyer_id": buyer_id,
                "action": action,
                "actor_type": actor_type,
                "actor_name": actor_name,
                "details_json": details,
                "created_at": _utc_now(),
            }
        )

    def _add_task(self, agent_name: str, task_type: str, title: str, priority: str = "medium", listing_id: str | None = None, buyer_id: str | None = None, event_id: str | None = None, output: dict[str, Any] | None = None) -> dict[str, Any]:
        item = {
            "id": f"task-{uuid4().hex[:10]}",
            "broker_id": self._broker.id,
            "listing_id": listing_id,
            "buyer_id": buyer_id,
            "propertypool_event_id": event_id,
            "agent_name": agent_name,
            "task_type": task_type,
            "status": "open",
            "priority": priority,
            "input_json": {},
            "output_json": output or {"title": title},
            "error_message": None,
            "created_at": _utc_now(),
            "updated_at": _utc_now(),
            "completed_at": None,
            "title": title,
        }
        self._tasks[item["id"]] = item
        return item

    def _route_json(self, listing: dict[str, Any]) -> dict[str, Any]:
        locality = listing.get("locality", "Mumbai")
        return {
            "route_name": f"{locality} PropertyPool mobile route",
            "waypoints": [
                {"label": "Building approach", "focus": "Road access, drop-off, security, entry experience, first impression"},
                {"label": "Lobby and lift area", "focus": "Maintenance, cleanliness, lift count, accessibility"},
                {"label": "Living room", "focus": "Natural light, ventilation, layout flexibility, balcony/view"},
                {"label": "Kitchen", "focus": "Utility flow, storage, ventilation, gas/water points"},
                {"label": "Bedroom wing", "focus": "Privacy, noise, work-from-home suitability, child/senior suitability"},
                {"label": "Bathrooms", "focus": "Plumbing, ventilation, fittings, maintenance red flags"},
                {"label": "Amenities and parking", "focus": "Parking access, amenities, security, visitor parking"},
                {"label": "Locality context", "focus": "Metro/rail, schools, retail, hospitals, commute, redevelopment activity"},
                {"label": "Closing discussion", "focus": "Buyer questions, EMI affordability, documents available, next steps, offer window"},
            ],
        }

    def _tour_script(self, listing: dict[str, Any], segment: str) -> str:
        rera = listing.get("rera_number") or "RERA confirmation pending"
        return (
            f"Opening: position {listing['title']} for {segment} in {listing['locality']}. "
            "Explain only verified facts, then move through approach, lobby, living room, kitchen, bedrooms, bathrooms, amenities, and locality context. "
            f"Legal/RERA note: {rera}. EMI note: share indicative affordability only. "
            "Common objections: price, commute, maintenance, legal documents, offer timing. Closing prompt: ask each buyer for fit, concerns, and next action."
        )

    async def dashboard(self) -> BrokerDashboard:
        await self.ensure_ready()
        properties = [self._property_access(item) for item in self._manager_listings()]
        tieups = [BrokerTieupRequest(**item) for item in self._tieups.values()]
        buyers = [BrokerBuyer(**item) for item in self._buyers.values()]
        events = [self._event_model(item) for item in self._propertypool.values()]
        commissions = [BrokerCommission(**item) for item in self._commissions.values()]
        cards = [
            BrokerSummaryCard(label="Approved tie-ups", value=str(sum(1 for item in tieups if item.status in {"approved", "agreement_accepted", "active"})), detail="Manager-approved inventory", tone="emerald"),
            BrokerSummaryCard(label="Pending requests", value=str(sum(1 for item in tieups if item.status in {"requested", "under_review", "terms_updated"})), detail="Awaiting manager action", tone="amber"),
            BrokerSummaryCard(label="Available properties", value=str(len(properties)), detail="Mumbai manager inventory", tone="slate"),
            BrokerSummaryCard(label="Active buyers", value=str(len(buyers)), detail="Broker network", tone="emerald"),
            BrokerSummaryCard(label="PropertyPool events", value=str(len(events)), detail="Group visits", tone="gold"),
            BrokerSummaryCard(label="Hot leads", value=str(sum(1 for item in buyers if item.lead_temperature in {"hot", "ready_to_offer"})), detail="Ready for action", tone="emerald"),
            BrokerSummaryCard(label="Expected pipeline", value=f"INR {sum(item.expected_commission for item in commissions) / 10_00_000:.1f}L", detail="Commission forecast", tone="gold"),
            BrokerSummaryCard(label="AI tasks completed", value=str(sum(1 for item in self._tasks.values() if item.get("status") == "completed")), detail="Automation actions", tone="slate"),
        ]
        return BrokerDashboard(
            broker=self._broker,
            summary_cards=cards,
            map_pins=[BrokerMapPin(id=item.id, title=item.title, locality=item.locality, latitude=item.latitude, longitude=item.longitude, price=item.price, color=item.map_color, commission_range=item.commission_range, tieup_status=item.tieup_status, visit_availability=item.visit_availability, buyer_demand_score=item.buyer_demand_score, legal_risk_score=item.legal_risk_score, market_heat_score=item.market_heat_score) for item in properties],
            available_properties=properties,
            tieup_feed=tieups,
            propertypool_events=events,
            buyers=buyers,
            commissions=commissions,
            activity_feed=self._activity_feed(),
            next_best_actions=[BrokerAgentTask(**{k: v for k, v in item.items() if k != "title"}) for item in self._tasks.values()],
            attribution_alerts=[BrokerLeadAttribution(**item) for item in self._attributions.values() if item.get("duplicate_conflict")],
        )

    def _activity_feed(self) -> list[BrokerFeedEvent]:
        defaults = [
            ("Tie-Up Agent", "inventory_match", "Found 7 properties matching your buyer network.", "emerald"),
            ("Lead Qualification Agent", "buyers_ranked", "Identified 3 buyers suitable for Andheri 2BHK.", "emerald"),
            ("PropertyPool Agent", "group_visit_recommended", "Recommends creating a Saturday 5 PM group visit.", "gold"),
            ("Commission Agent", "pipeline_updated", "Updated expected payout for approved Bandra deal.", "slate"),
        ]
        feed = [
            BrokerFeedEvent(id=f"feed-{idx}", created_at=_utc_now(), actor_name=actor, action=action, details=details, tone=tone)
            for idx, (actor, action, details, tone) in enumerate(defaults, start=1)
        ]
        feed.extend(
            BrokerFeedEvent(id=item["id"], created_at=item["created_at"], actor_name=item["actor_name"], action=item["action"], details=str(item["details_json"].get("summary") or item["details_json"]), tone="slate")
            for item in self._audit[-8:]
        )
        return sorted(feed, key=lambda item: item.created_at, reverse=True)[:10]

    async def profile(self) -> BrokerProfile:
        await self.ensure_ready()
        return self._broker

    async def upsert_profile(self, request: BrokerProfileUpsertRequest) -> BrokerProfile:
        await self.ensure_ready()
        required = ["full_name", "phone", "email", "operating_localities", "buyer_network_size"]
        missing = [field for field in required if not getattr(request, field)]
        if not request.kyc_document_url:
            missing.append("kyc_document_url")
        status = "verified" if not missing and request.rera_agent_id else ("needs_review" if not request.rera_agent_id else "pending")
        trust = 45 + min(request.years_experience * 4, 20) + min(request.buyer_network_size / 20, 20) + (10 if request.rera_agent_id else 0) + (5 if request.kyc_document_url else 0)
        self._broker = BrokerProfile(id=self._broker.id, verification_status=status, trust_score=round(min(trust, 96), 1), missing_document_tasks=missing, created_at=self._broker.created_at, updated_at=_utc_now(), **request.model_dump())
        self._add_audit("broker_profile_upserted", {"summary": f"Verification status {status}", "missing": missing}, actor_name="Broker Onboarding Agent")
        return self._broker

    async def properties(self) -> list[BrokerInventoryProperty]:
        await self.ensure_ready()
        return [self._property_access(item) for item in self._manager_listings()]

    async def property_detail(self, property_id: str) -> dict[str, Any]:
        await self.ensure_ready()
        listing = self._listing(property_id)
        access = self._property_access(listing)
        safe_detail = access.model_dump(mode="json")
        if access.tieup_status in {"approved", "agreement_accepted", "active"}:
            safe_detail.update({"documents_available": True, "shareable_pitch": self._pitch(listing), "manager_contact_visible": True})
        else:
            safe_detail.update({"documents_available": False, "shareable_pitch": self._pitch(listing, gated=True), "manager_contact_visible": False})
        safe_detail["tour_route"] = self._route_json(listing)
        return safe_detail

    def _pitch(self, listing: dict[str, Any], gated: bool = False) -> str:
        legal = listing.get("rera_number") or "legal/RERA confirmation pending"
        suffix = "Request tie-up before sharing full media or document details." if gated else "Approved broker sharing: WhatsApp, calls, and buyer database."
        return f"{listing['title']} in {listing['locality']} at INR {int(_as_float(listing.get('asking_price'))):,}. Verified facts only: {legal}. {suffix}"

    async def request_tieup(self, request: BrokerTieupRequestCreate) -> BrokerTieupRequest:
        await self.ensure_ready()
        if self._broker.verification_status not in {"verified", "needs_review"}:
            raise HTTPException(status_code=403, detail="Complete broker verification before requesting premium tie-ups")
        listing = self._listing(request.listing_id)
        existing = self._tieup_for_listing(request.listing_id, request.broker_id)
        if existing:
            return BrokerTieupRequest(**existing)
        recommendation = {
            "fit_score": min(94, self._property_access(listing).buyer_match_score),
            "risk_level": "low" if _as_float(listing.get("legal_risk_score")) < 35 else "medium",
            "suggested_commission": request.requested_commission,
            "suggested_validity_days": request.requested_validity_days,
            "marketing_restrictions": ["Use manager-approved claims only", "Do not disclose hidden seller walk-away price", "Protect buyer attribution"],
        }
        item = {
            "id": f"tieup-{uuid4().hex[:10]}",
            "broker_id": request.broker_id,
            "manager_id": listing.get("manager_id") or "manager-demo-1",
            "listing_id": listing["id"],
            "property_title": listing["title"],
            "manager_name": "Patel Panel Realty",
            "status": "under_review",
            "requested_commission": request.requested_commission,
            "approved_commission": None,
            "requested_validity_days": request.requested_validity_days,
            "approved_validity_days": None,
            "requested_exclusivity": request.requested_exclusivity,
            "approved_exclusivity": False,
            "requested_propertypool_rights": request.requested_propertypool_rights,
            "approved_propertypool_rights": False,
            "intended_buyer_segment": request.intended_buyer_segment,
            "expected_buyer_count": request.expected_buyer_count,
            "marketing_channels": request.marketing_channels,
            "broker_message": request.broker_message,
            "manager_response": None,
            "ai_recommendation_json": recommendation,
            "approved_terms_json": {},
            "expires_at": None,
            "created_at": _utc_now(),
            "updated_at": _utc_now(),
        }
        self._tieups[item["id"]] = item
        self._add_task("Tie-Up Negotiation Agent", "manager_approval", f"Manager approval needed for {listing['title']}", "high", listing_id=listing["id"])
        self._add_audit("tieup_requested", {"summary": f"Requested tie-up for {listing['title']}", "recommendation": recommendation}, listing_id=listing["id"], actor_name="Tie-Up Negotiation Agent")
        return BrokerTieupRequest(**item)

    async def tieups(self) -> list[BrokerTieupRequest]:
        await self.ensure_ready()
        return [BrokerTieupRequest(**item) for item in self._tieups.values()]

    async def accept_terms(self, tieup_id: str) -> BrokerTieupRequest:
        await self.ensure_ready()
        item = self._get_tieup(tieup_id)
        if item["status"] not in {"approved", "terms_updated"}:
            raise HTTPException(status_code=409, detail="Tie-up must be approved or terms updated before acceptance")
        item["status"] = "active"
        item["updated_at"] = _utc_now()
        self._create_access_and_commission(item)
        self._add_audit("tieup_terms_accepted", {"summary": f"Accepted manager terms for {item['property_title']}"}, listing_id=item["listing_id"], actor_type="broker", actor_name=self._broker.full_name)
        return BrokerTieupRequest(**item)

    async def cancel_tieup(self, tieup_id: str) -> BrokerTieupRequest:
        await self.ensure_ready()
        item = self._get_tieup(tieup_id)
        item["status"] = "cancelled"
        item["updated_at"] = _utc_now()
        self._add_audit("tieup_cancelled", {"summary": f"Cancelled tie-up for {item['property_title']}"}, listing_id=item["listing_id"], actor_type="broker", actor_name=self._broker.full_name)
        return BrokerTieupRequest(**item)

    def _get_tieup(self, tieup_id: str) -> dict[str, Any]:
        if tieup_id not in self._tieups:
            raise HTTPException(status_code=404, detail="Tie-up not found")
        return self._tieups[tieup_id]

    async def manager_tieup_requests(self) -> list[BrokerTieupRequest]:
        await self.ensure_ready()
        return [BrokerTieupRequest(**item) for item in self._tieups.values()]

    async def manager_decide_tieup(self, request_id: str, decision: ManagerTieupDecisionRequest, status: str) -> BrokerTieupRequest:
        await self.ensure_ready()
        item = self._get_tieup(request_id)
        if status == "approved":
            item["status"] = "approved"
            item["approved_commission"] = decision.approved_commission or item["requested_commission"]
            item["approved_validity_days"] = decision.approved_validity_days or item["requested_validity_days"]
            item["approved_propertypool_rights"] = True if decision.approved_propertypool_rights is None else decision.approved_propertypool_rights
            item["approved_exclusivity"] = bool(decision.approved_exclusivity)
            item["approved_terms_json"] = {
                "allowed_marketing_channels": decision.allowed_marketing_channels or item["marketing_channels"],
                "attribution_expiry_days": 90,
                "document_access": "summary only until buyer is qualified",
                "claims_policy": "verified facts only",
            }
            item["expires_at"] = _future(item["approved_validity_days"])
        elif status == "rejected":
            item["status"] = "rejected"
        elif status == "terms_updated":
            item["status"] = "terms_updated"
            if decision.approved_commission is not None:
                item["approved_commission"] = decision.approved_commission
            if decision.approved_validity_days is not None:
                item["approved_validity_days"] = decision.approved_validity_days
            if decision.approved_propertypool_rights is not None:
                item["approved_propertypool_rights"] = decision.approved_propertypool_rights
        item["manager_response"] = decision.manager_response or item.get("manager_response")
        item["updated_at"] = _utc_now()
        self._add_audit(f"manager_tieup_{status}", {"summary": f"Manager marked tie-up {status} for {item['property_title']}"}, listing_id=item["listing_id"], actor_type="manager", actor_name="Patel Panel Realty")
        if status == "approved":
            self._create_access_and_commission(item)
        return BrokerTieupRequest(**item)

    def _create_access_and_commission(self, item: dict[str, Any]) -> None:
        listing = self._listing(item["listing_id"])
        if not any(existing.get("tieup_id") == item["id"] for existing in self._commissions.values()):
            commission_id = f"commission-{uuid4().hex[:10]}"
            pct = _as_float(item.get("approved_commission") or item.get("requested_commission"), 2.0)
            price = _as_float(listing.get("asking_price"))
            self._commissions[commission_id] = {
                "id": commission_id,
                "broker_id": item["broker_id"],
                "buyer_id": None,
                "listing_id": item["listing_id"],
                "tieup_id": item["id"],
                "deal_status": "pipeline",
                "property_value": price,
                "commission_percentage": pct,
                "expected_commission": round(price * pct / 100, 0),
                "approved_commission": None,
                "payout_status": "pending",
                "dispute_status": "none",
                "created_at": _utc_now(),
                "updated_at": _utc_now(),
            }

    async def buyers(self) -> list[BrokerBuyer]:
        await self.ensure_ready()
        return [BrokerBuyer(**item) for item in self._buyers.values()]

    async def create_buyer(self, request: BrokerBuyerCreate) -> BrokerBuyer:
        await self.ensure_ready()
        duplicate = next((item for item in self._buyers.values() if item["phone"] == request.phone and item["broker_id"] != request.broker_id), None)
        item = BrokerBuyer(id=f"buyer-{uuid4().hex[:10]}", qualification_score=self._qualify_score(request), assigned_properties=[], visit_history=[], offer_history=[], follow_up_status="new", created_at=_utc_now(), updated_at=_utc_now(), **request.model_dump()).model_dump(mode="json")
        self._buyers[item["id"]] = item
        if duplicate:
            self._add_audit("duplicate_buyer_detected", {"summary": f"Duplicate phone detected for {request.full_name}", "phone": request.phone}, buyer_id=item["id"], actor_name="Lead Attribution Agent")
        else:
            self._add_audit("broker_buyer_created", {"summary": f"Added buyer {request.full_name}"}, buyer_id=item["id"], actor_type="broker", actor_name=self._broker.full_name)
        return BrokerBuyer(**item)

    def _qualify_score(self, buyer: BrokerBuyerCreate) -> float:
        score = 45
        if buyer.budget_max:
            score += 15
        if buyer.preferred_localities:
            score += 15
        if buyer.buying_timeline and any(token in buyer.buying_timeline.lower() for token in ["30", "60", "ready", "soon"]):
            score += 15
        if buyer.lead_temperature in {"hot", "ready_to_offer"}:
            score += 10
        return min(98, score)

    async def leads(self) -> list[BrokerLeadAttribution]:
        await self.ensure_ready()
        return [BrokerLeadAttribution(**item) for item in self._attributions.values()]

    async def import_leads(self, request: BrokerLeadImportRequest) -> dict[str, Any]:
        await self.ensure_ready()
        created = [await self.create_buyer(item) for item in request.leads]
        self._add_task("Broker Buyer Matching Agent", "csv_import_qualification", f"Qualified {len(created)} imported buyers", "medium")
        return {"created": [item.model_dump(mode="json") for item in created], "count": len(created)}

    async def qualify_lead(self, lead_id: str) -> dict[str, Any]:
        await self.ensure_ready()
        buyer = self._buyers.get(lead_id)
        if not buyer:
            raise HTTPException(status_code=404, detail="Buyer not found")
        buyer["qualification_score"] = min(98, _as_float(buyer.get("qualification_score"), 60) + 8)
        buyer["follow_up_status"] = "qualified - send matched inventory"
        self._add_audit("buyer_qualified", {"summary": f"Qualified {buyer['full_name']}", "score": buyer["qualification_score"]}, buyer_id=lead_id, actor_name="Broker Buyer Matching Agent")
        return {"buyer": BrokerBuyer(**buyer).model_dump(mode="json"), "matches": [item.model_dump(mode="json") for item in (await self.properties())[:3]]}

    async def propertypool_events(self) -> list[PropertyPoolEvent]:
        await self.ensure_ready()
        return [self._event_model(item) for item in self._propertypool.values()]

    def _event_model(self, item: dict[str, Any]) -> PropertyPoolEvent:
        registrations = [reg for reg in self._registrations.values() if reg["event_id"] == item["id"]]
        return PropertyPoolEvent(**{**item, "registered_buyers": len(registrations), "attended_buyers": sum(1 for reg in registrations if reg.get("checkin_status") == "checked_in"), "offer_pipeline": sum(1 for reg in registrations if reg.get("interest_level") in {"hot", "ready_to_offer"})})

    async def create_propertypool(self, request: PropertyPoolCreateRequest) -> PropertyPoolEvent:
        await self.ensure_ready()
        listing = self._listing(request.listing_id)
        tieup = self._tieup_for_listing(request.listing_id, request.broker_id)
        if not tieup or tieup["status"] not in {"approved", "agreement_accepted", "active"}:
            raise HTTPException(status_code=403, detail="Broker needs approved tie-up before creating PropertyPool")
        if not tieup.get("approved_propertypool_rights", False):
            raise HTTPException(status_code=403, detail="Tie-up does not allow PropertyPool rights")
        event_id = f"pool-{uuid4().hex[:10]}"
        route = self._route_json(listing)
        item = {
            "id": event_id,
            "listing_id": listing["id"],
            "broker_id": request.broker_id,
            "manager_id": listing.get("manager_id") or "manager-demo-1",
            "tieup_id": request.tieup_id or tieup["id"],
            "event_title": request.event_title or f"{listing['locality']} PropertyPool: {listing['title']}",
            "event_type": request.event_type,
            "status": "scheduled",
            "scheduled_start": request.scheduled_start,
            "scheduled_end": request.scheduled_end or _future(2),
            "max_buyers": request.max_buyers,
            "meeting_point": request.meeting_point or f"Main gate, {listing['address']}",
            "buyer_segment": request.buyer_segment,
            "route_json": route,
            "tour_script": self._tour_script(listing, request.buyer_segment),
            "invite_message": f"Hi, I found a verified {listing['title']} in {listing['locality']} that matches your budget. Group visit is scheduled. Should I reserve your slot?",
            "reminder_schedule_json": {"t_minus_24h": "WhatsApp reminder", "t_minus_2h": "Location map and checklist", "post_visit": "Feedback and offer intent"},
            "manager_approval_status": "approved",
            "created_at": _utc_now(),
            "updated_at": _utc_now(),
        }
        self._propertypool[event_id] = item
        self._add_task("Broker Tour Guide Agent", "mobile_route", f"Use mobile route for {item['event_title']}", "high", listing_id=listing["id"], event_id=event_id)
        self._add_audit("propertypool_created", {"summary": f"Created PropertyPool for {listing['title']}", "route": route}, listing_id=listing["id"], actor_name="PropertyPool Planning Agent")
        return self._event_model(item)

    async def propertypool_detail(self, event_id: str) -> dict[str, Any]:
        await self.ensure_ready()
        if event_id not in self._propertypool:
            raise HTTPException(status_code=404, detail="PropertyPool event not found")
        event = self._event_model(self._propertypool[event_id]).model_dump(mode="json")
        event["registrations"] = [PropertyPoolRegistration(**item).model_dump(mode="json") for item in self._registrations.values() if item["event_id"] == event_id]
        event["property"] = await self.property_detail(event["listing_id"])
        return event

    async def join_propertypool(self, event_id: str, buyer_id: str, broker_id: str = "broker-demo-1") -> PropertyPoolRegistration:
        await self.ensure_ready()
        if event_id not in self._propertypool:
            raise HTTPException(status_code=404, detail="PropertyPool event not found")
        if buyer_id not in self._buyers:
            raise HTTPException(status_code=404, detail="Buyer not found")
        reg_id = f"reg-{uuid4().hex[:10]}"
        item = {"id": reg_id, "event_id": event_id, "buyer_id": buyer_id, "broker_id": broker_id, "rsvp_status": "confirmed", "checkin_status": "pending", "checkin_time": None, "feedback_json": {}, "interest_level": None, "next_action": "Send reminder", "created_at": _utc_now(), "updated_at": _utc_now()}
        self._registrations[reg_id] = item
        self._create_attribution(broker_id, buyer_id, self._propertypool[event_id]["listing_id"], self._propertypool[event_id].get("tieup_id"), "propertypool_rsvp")
        return PropertyPoolRegistration(**item)

    async def invite_buyers(self, event_id: str, buyer_ids: list[str] | None = None) -> dict[str, Any]:
        await self.ensure_ready()
        if event_id not in self._propertypool:
            raise HTTPException(status_code=404, detail="PropertyPool event not found")
        target_ids = buyer_ids or [buyer["id"] for buyer in self._buyers.values() if buyer["lead_temperature"] in {"hot", "ready_to_offer"}][:8]
        messages = []
        for buyer_id in target_ids:
            buyer = self._buyers.get(buyer_id)
            if not buyer:
                continue
            messages.append({"buyer_id": buyer_id, "to": buyer["phone"], "message": self._propertypool[event_id]["invite_message"]})
        self._add_audit("propertypool_buyers_invited", {"summary": f"Prepared {len(messages)} WhatsApp invite drafts", "messages": messages}, listing_id=self._propertypool[event_id]["listing_id"], actor_name="WhatsApp Agent")
        return {"event_id": event_id, "drafts": messages}

    async def check_in(self, event_id: str, buyer_id: str) -> PropertyPoolRegistration:
        await self.ensure_ready()
        reg = next((item for item in self._registrations.values() if item["event_id"] == event_id and item["buyer_id"] == buyer_id), None)
        if not reg:
            reg = (await self.join_propertypool(event_id, buyer_id)).model_dump(mode="json")
            self._registrations[reg["id"]] = reg
        reg["checkin_status"] = "checked_in"
        reg["checkin_time"] = _utc_now()
        reg["updated_at"] = _utc_now()
        self._add_audit("propertypool_checkin", {"summary": f"Buyer checked into {event_id}"}, buyer_id=buyer_id, listing_id=self._propertypool[event_id]["listing_id"], actor_type="broker", actor_name=self._broker.full_name)
        return PropertyPoolRegistration(**reg)

    async def feedback(self, event_id: str, buyer_id: str, feedback: dict[str, Any]) -> PropertyPoolRegistration:
        await self.ensure_ready()
        reg = next((item for item in self._registrations.values() if item["event_id"] == event_id and item["buyer_id"] == buyer_id), None)
        if not reg:
            raise HTTPException(status_code=404, detail="Registration not found")
        interest = str(feedback.get("interest_level") or "warm")
        reg["feedback_json"] = feedback
        reg["interest_level"] = interest
        reg["next_action"] = "Trigger negotiation follow-up" if interest in {"hot", "ready_to_offer"} else "Send alternatives"
        reg["updated_at"] = _utc_now()
        self._add_task("Broker Follow-Up Agent", "post_visit_feedback", reg["next_action"], "high" if interest in {"hot", "ready_to_offer"} else "medium", buyer_id=buyer_id, event_id=event_id)
        self._add_audit("propertypool_feedback_saved", {"summary": f"Feedback saved with interest {interest}", "feedback": feedback}, buyer_id=buyer_id, listing_id=self._propertypool[event_id]["listing_id"], actor_name="Broker Follow-Up Agent")
        return PropertyPoolRegistration(**reg)

    def _create_attribution(self, broker_id: str, buyer_id: str, listing_id: str, tieup_id: str | None, source: str) -> dict[str, Any]:
        buyer = self._buyers[buyer_id]
        duplicate = next((item for item in self._attributions.values() if item["listing_id"] == listing_id and item["buyer_id"] != buyer_id and self._buyers.get(item["buyer_id"], {}).get("phone") == buyer["phone"]), None)
        item = {
            "id": f"attr-{uuid4().hex[:10]}",
            "broker_id": broker_id,
            "buyer_id": buyer_id,
            "listing_id": listing_id,
            "tieup_id": tieup_id,
            "attribution_status": "conflict" if duplicate else "protected",
            "first_introduced_at": _utc_now(),
            "last_interaction_at": _utc_now(),
            "expiry_at": _future(90),
            "source": source,
            "duplicate_conflict": bool(duplicate),
            "conflict_details_json": {"conflicting_attribution_id": duplicate["id"]} if duplicate else {},
            "commission_eligible": not duplicate,
            "created_at": _utc_now(),
            "updated_at": _utc_now(),
        }
        self._attributions[item["id"]] = item
        self._add_audit("lead_attribution_created", {"summary": f"Attribution {item['attribution_status']} for buyer {buyer['full_name']}", "source": source}, buyer_id=buyer_id, listing_id=listing_id, actor_name="Lead Attribution Agent")
        return item

    async def commissions(self) -> list[BrokerCommission]:
        await self.ensure_ready()
        return [BrokerCommission(**item) for item in self._commissions.values()]

    async def analytics(self) -> dict[str, Any]:
        await self.ensure_ready()
        buyers = list(self._buyers.values())
        properties = await self.properties()
        return {
            "best_localities": ["Andheri", "Bandra", "Chembur", "Borivali"],
            "buyer_temperature": {temp: sum(1 for buyer in buyers if buyer["lead_temperature"] == temp) for temp in ["cold", "warm", "hot", "ready_to_offer"]},
            "top_property_matches": [item.model_dump(mode="json") for item in sorted(properties, key=lambda prop: prop.buyer_match_score, reverse=True)[:5]],
            "conversion_recommendations": [
                "Run PropertyPool for Andheri/Powai buyer cluster this weekend.",
                "Request tie-up on low legal-risk listings before sharing WhatsApp pitches.",
                "Move ready-to-offer buyers into negotiation follow-up within 2 hours of visit feedback.",
            ],
        }

    async def run_automation(self, request: BrokerAutomationRunRequest) -> dict[str, Any]:
        await self.ensure_ready()
        selected = self._property_access(self._listing(request.listing_id)) if request.listing_id else (await self.properties())[0]
        graph = build_broker_graph()
        state = {
            "broker_id": request.broker_id,
            "listing_id": selected.id,
            "user_request": request.user_request,
            "broker_profile": self._broker.model_dump(mode="json"),
            "broker_verification_status": self._broker.verification_status,
            "selected_property": selected.model_dump(mode="json"),
            "buyer_network_snapshot": list(self._buyers.values()),
            "tieup_request": {"requested_commission": 2.0, "requested_validity_days": 45, "requested_propertypool_rights": True, "intended_buyer_segment": "qualified buyers", "expected_buyer_count": 6},
            "messages": [],
            "audit_events": [],
            "recommendations": [],
            "tasks": [],
        }
        result = await graph.ainvoke(state)
        for event in result.get("audit_events", []):
            self._add_audit(event.get("action", "broker_automation_event"), {"summary": event.get("details", "Broker automation event")}, listing_id=selected.id, actor_name=event.get("actor_name", "Broker Automation Graph"))
        for task in result.get("tasks", []):
            self._add_task(task.get("agent_name", "Broker Growth Agent"), task.get("task_type", "automation"), task.get("title", "Review broker automation output"), task.get("priority", "medium"), listing_id=selected.id)
        self._add_task("Broker Growth Agent", "weekly_report", "Review broker growth automation recommendations", "medium", listing_id=selected.id, output={"recommendations": result.get("recommendations", [])})
        return {"automation_state": result, "dashboard": (await self.dashboard()).model_dump(mode="json")}

    async def audit_log(self) -> list[BrokerAuditLog]:
        await self.ensure_ready()
        return [BrokerAuditLog(**item) for item in sorted(self._audit, key=lambda entry: entry["created_at"], reverse=True)]


broker_portal_service = BrokerPortalService()
