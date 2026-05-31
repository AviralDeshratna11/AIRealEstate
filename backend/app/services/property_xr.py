from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal
from uuid import uuid4

try:
    from langgraph.types import Command
except Exception:  # pragma: no cover
    class Command:  # type: ignore[no-redef]
        def __init__(self, update=None, goto=None):
            self.update = update or {}
            self.goto = goto

from pydantic import BaseModel, Field

from app.services.property_intelligence import property_intelligence_service


XRResponseType = Literal[
    "answer",
    "navigate",
    "start_tour",
    "continue_tour",
    "book_visit",
    "finance_estimate",
    "legal_summary",
    "market_summary",
    "compare_property",
    "propertypool_action",
    "error",
]


class XRGuideState(BaseModel):
    session_id: str | None = None
    user_id: str | None = None
    role: str = "public"
    property_id: str
    buyer_id: str | None = None
    broker_id: str | None = None
    manager_id: str | None = None
    current_room: str | None = None
    current_hotspot_id: str | None = None
    current_camera_position: dict[str, float] = Field(default_factory=dict)
    current_camera_target: dict[str, float] = Field(default_factory=dict)
    user_query: str = ""
    query_mode: str = "text"
    voice_transcript: str | None = None
    property_snapshot: dict[str, Any] = Field(default_factory=dict)
    buyer_profile: dict[str, Any] = Field(default_factory=dict)
    room_metadata: list[dict[str, Any]] = Field(default_factory=list)
    hotspot_metadata: list[dict[str, Any]] = Field(default_factory=list)
    legal_context: dict[str, Any] = Field(default_factory=dict)
    finance_context: dict[str, Any] = Field(default_factory=dict)
    market_context: dict[str, Any] = Field(default_factory=dict)
    tour_context: dict[str, Any] = Field(default_factory=dict)
    navigation_command: dict[str, Any] = Field(default_factory=dict)
    spoken_response: str | None = None
    text_response: str | None = None
    next_action: str | None = None
    handoff_agent: str | None = None
    audit_events: list[dict[str, Any]] = Field(default_factory=list)


class XRGuideResponse(BaseModel):
    response_type: XRResponseType
    spoken_text: str
    display_text: str
    navigation_target: str | None = None
    camera_position: dict[str, float] | None = None
    camera_look_at: dict[str, float] | None = None
    room_id: str | None = None
    hotspot_id: str | None = None
    highlight_hotspots: list[str] = Field(default_factory=list)
    suggested_actions: list[str] = Field(default_factory=list)
    confidence_score: float = Field(default=0.72, ge=0, le=1)
    requires_handoff: bool = False
    handoff_agent: str | None = None
    safety_notes: list[str] = Field(default_factory=list)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _vec(x: float, y: float, z: float) -> dict[str, float]:
    return {"x": x, "y": y, "z": z}


def _hotspot(
    listing_id: str,
    idx: int,
    room: str,
    label: str,
    description: str,
    position: tuple[float, float, float],
    camera: tuple[float, float, float],
    look: tuple[float, float, float],
    hotspot_type: str = "room",
    tags: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "hotspot_id": f"xr-hotspot-{idx}",
        "id": f"xr-hotspot-{idx}",
        "listing_id": listing_id,
        "room_name": room,
        "label": label,
        "description": description,
        "position_json": _vec(*position),
        "camera_position_json": _vec(*camera),
        "camera_look_at_json": _vec(*look),
        "hotspot_type": hotspot_type,
        "priority": idx,
        "narration": f"{label}. {description} Unknowns should be verified during a physical site visit.",
        "buyer_relevance_tags": tags or ["family", "first_time_buyer"],
        "broker_talking_points": [
            "Use verified claims only.",
            "Point out layout, light, EMI context, and document status without overclaiming.",
        ],
        "manager_notes": "Confirm room label, caption, sunlight direction, and splat alignment.",
        "linked_media_id": None,
        "linked_document_id": None,
        "created_at": _now(),
        "updated_at": _now(),
    }


class XRVirtualGuideAgent:
    async def route(self, state: XRGuideState) -> Command:
        text = (state.voice_transcript or state.user_query or "").lower()
        if any(k in text for k in ["show", "go to", "move", "kitchen", "bedroom", "living", "parking", "balcony", "lobby"]):
            return Command(update={"handoff_agent": "Tour Guide Agent"}, goto="navigate")
        if any(k in text for k in ["emi", "afford", "loan", "down payment"]):
            return Command(update={"handoff_agent": "Finance Agent"}, goto="finance")
        if any(k in text for k in ["legal", "rera", "document", "title", "noc"]):
            return Command(update={"handoff_agent": "Legal Due Diligence Agent"}, goto="legal")
        if any(k in text for k in ["price", "market", "yield", "investment", "resale"]):
            return Command(update={"handoff_agent": "Market Intelligence Agent"}, goto="market")
        if any(k in text for k in ["book", "visit", "sunday", "tomorrow"]):
            return Command(update={"handoff_agent": "Calendar Scheduling Agent"}, goto="book_visit")
        if any(k in text for k in ["propertypool", "buyers", "broker", "tie-up", "tieup"]):
            return Command(update={"handoff_agent": "PropertyPool Agent"}, goto="propertypool")
        if any(k in text for k in ["start", "tour", "guide"]):
            return Command(update={"handoff_agent": "XR Virtual Guide Agent"}, goto="start_tour")
        return Command(update={"handoff_agent": "Property Page Agent"}, goto="answer")

    async def answer(self, state: XRGuideState) -> XRGuideResponse:
        routed = await self.route(state)
        target = routed.goto or "answer"
        hotspots = state.hotspot_metadata
        query = (state.voice_transcript or state.user_query or "").lower()
        chosen = self._find_hotspot(hotspots, query) or (hotspots[0] if hotspots else None)
        title = state.property_snapshot.get("listing", {}).get("title", "this property")
        safety = ["Do not treat this as legal clearance.", "Sunlight, noise, room dimensions, and amenities must be verified if source data is missing."]

        if target == "navigate" and chosen:
            return XRGuideResponse(
                response_type="navigate",
                spoken_text=f"Moving to {chosen['label']}. {chosen['narration']}",
                display_text=f"Navigating to {chosen['label']}. {chosen['description']}",
                navigation_target=chosen["label"],
                camera_position=chosen["camera_position_json"],
                camera_look_at=chosen["camera_look_at_json"],
                room_id=chosen["room_name"],
                hotspot_id=chosen["hotspot_id"],
                highlight_hotspots=[chosen["hotspot_id"]],
                suggested_actions=["Ask about light", "Inspect during site visit", "Next stop"],
                confidence_score=0.86,
                handoff_agent="Tour Guide Agent",
                safety_notes=safety,
            )
        if target == "finance":
            finance = state.finance_context
            emi = finance.get("monthly_emi")
            return XRGuideResponse(
                response_type="finance_estimate",
                spoken_text=f"For {title}, the estimated EMI is about INR {emi:,.0f} per month if the default loan profile applies. I can refine this with your down payment and tenure.",
                display_text=f"Estimated EMI: INR {emi:,.0f}/month. This is a planning estimate, not a lender sanction.",
                suggested_actions=["Change down payment", "Schedule finance call", "Compare EMI"],
                confidence_score=0.78,
                requires_handoff=True,
                handoff_agent="Finance Agent",
                safety_notes=safety,
            )
        if target == "legal":
            docs = state.legal_context
            missing = docs.get("missing_documents") or []
            msg = "Legal verification is incomplete. Professional legal review is recommended."
            if missing:
                msg += f" Missing checks include {', '.join(missing[:3])}."
            return XRGuideResponse(
                response_type="legal_summary",
                spoken_text=msg,
                display_text=msg,
                suggested_actions=["Request documents", "Ask Legal Agent", "Book visit after review"],
                confidence_score=0.74,
                requires_handoff=True,
                handoff_agent="Legal Due Diligence Agent",
                safety_notes=safety,
            )
        if target == "market":
            market = state.market_context
            text = market.get("ai_explanation") or "Market context is available with Mumbai locality signals."
            return XRGuideResponse(
                response_type="market_summary",
                spoken_text=text,
                display_text=text,
                suggested_actions=["Compare similar homes", "Ask price fairness", "View locality map"],
                confidence_score=0.8,
                requires_handoff=True,
                handoff_agent="Market Intelligence Agent",
                safety_notes=safety,
            )
        if target == "book_visit":
            return XRGuideResponse(
                response_type="book_visit",
                spoken_text="I can help book a physical visit. The next step is to choose a slot and confirm your phone or WhatsApp number.",
                display_text="Visit request started. Choose a slot and confirm contact details.",
                suggested_actions=["Schedule physical visit", "WhatsApp assistant", "Create visit checklist"],
                confidence_score=0.82,
                requires_handoff=True,
                handoff_agent="Calendar Scheduling Agent",
                safety_notes=safety,
            )
        if target == "propertypool":
            return XRGuideResponse(
                response_type="propertypool_action",
                spoken_text="Broker presentation mode can create a PropertyPool route, but sharing and claims must follow approved tie-up permissions.",
                display_text="PropertyPool XR route ready subject to tie-up approval and verified-claims policy.",
                suggested_actions=["Request tie-up", "Create PropertyPool", "Generate broker pitch"],
                confidence_score=0.78,
                requires_handoff=True,
                handoff_agent="PropertyPool Agent",
                safety_notes=safety,
            )
        if target == "start_tour" and chosen:
            return XRGuideResponse(
                response_type="start_tour",
                spoken_text=f"Starting the AI guided tour for {title}. We will begin at {chosen['label']} and move through the main rooms, documents, finance, and locality context.",
                display_text=f"Guided tour started at {chosen['label']}.",
                navigation_target=chosen["label"],
                camera_position=chosen["camera_position_json"],
                camera_look_at=chosen["camera_look_at_json"],
                room_id=chosen["room_name"],
                hotspot_id=chosen["hotspot_id"],
                highlight_hotspots=[chosen["hotspot_id"]],
                suggested_actions=["Next stop", "Pause tour", "Ask a question"],
                confidence_score=0.87,
                safety_notes=safety,
            )
        return XRGuideResponse(
            response_type="answer",
            spoken_text=f"{title} is best evaluated through layout, light, document readiness, finance comfort, and site verification. I can guide you to a room or answer finance, legal, market, or visit questions.",
            display_text=f"{title}: ask me to show a room, estimate EMI, check legal readiness, explain market value, or book a visit.",
            suggested_actions=["Show living room", "What are legal risks?", "What is EMI?", "Start guided tour"],
            confidence_score=0.72,
            handoff_agent="Property Page Agent",
            safety_notes=safety,
        )

    def _find_hotspot(self, hotspots: list[dict[str, Any]], text: str) -> dict[str, Any] | None:
        for hotspot in hotspots:
            haystack = " ".join([hotspot.get("room_name", ""), hotspot.get("label", ""), hotspot.get("description", "")]).lower()
            if any(token in haystack for token in text.split() if len(token) > 3):
                return hotspot
        for alias, room in [("kitchen", "Kitchen"), ("living", "Living room"), ("master", "Master bedroom"), ("parking", "Parking"), ("balcony", "Balcony"), ("lobby", "Lobby")]:
            if alias in text:
                return next((h for h in hotspots if room.lower() in h.get("room_name", "").lower() or room.lower() in h.get("label", "").lower()), None)
        return None


class PropertyXRService:
    def __init__(self) -> None:
        self.agent = XRVirtualGuideAgent()
        self.sessions: dict[str, dict[str, Any]] = {}

    async def xr_payload(self, property_id: str, role: str = "public") -> dict[str, Any]:
        detail = await property_intelligence_service.detail(property_id, role)
        listing = detail["listing"]
        hotspots = self.hotspots_for_listing(detail["id"])
        assets = self.assets_for_detail(detail)
        routes = self.routes_for_hotspots(detail["id"], hotspots)
        return {
            "property": {
                "id": detail["id"],
                "requested_id": property_id,
                "title": listing.get("title"),
                "locality": listing.get("locality"),
                "price": listing.get("asking_price") or listing.get("price"),
                "bedrooms": listing.get("bedrooms"),
                "bathrooms": listing.get("bathrooms"),
                "hero_image_url": listing.get("hero_image_url"),
            },
            "xr_asset": next((asset for asset in assets if asset["processing_status"] == "ready"), None),
            "assets": assets,
            "hotspots": hotspots,
            "routes": routes,
            "tour_script": self.tour_script(detail, routes[0]),
            "viewer_config": {
                "webxr_enabled": True,
                "desktop_controls": "orbit_walk",
                "mobile_controls": "touch_orbit",
                "comfort_mode": True,
                "seated_mode": True,
                "reduced_motion": False,
                "camera_height": 1.62,
                "splat_quality": "adaptive",
                "fallback_mode": "image_video_gallery",
                "mock_voice_available": True,
            },
            "permissions": self.permissions_for_role(role),
            "analytics": self.analytics(detail["id"]),
            "role": role,
        }

    def assets_for_detail(self, detail: dict[str, Any]) -> list[dict[str, Any]]:
        listing = detail["listing"]
        splat_url = listing.get("splat_url")
        requested = str(detail.get("id", ""))
        if not splat_url:
            normalized = requested.replace("seller-", "")
            if "powai" in normalized:
                splat_url = "/splats/powai-lake.ksplat"
            elif "bandra" in normalized:
                splat_url = "/splats/bandra-west.ksplat"
            elif "andheri" in normalized:
                splat_url = "/splats/andheri-east.ksplat"
        if splat_url:
            return [
                {
                    "id": f"xr-asset-{requested}",
                    "listing_id": detail["id"],
                    "asset_type": "ksplat",
                    "asset_url": splat_url,
                    "thumbnail_url": listing.get("hero_image_url"),
                    "file_size_mb": 184,
                    "version": "demo-1",
                    "processing_status": "ready",
                    "coordinate_system": "threejs_y_up",
                    "scale_factor": 1,
                    "origin_json": _vec(0, 0, 0),
                    "metadata_json": {"source": "demo gsplat placeholder", "loader": "adaptive_three_pointcloud_fallback"},
                    "created_at": _now(),
                    "updated_at": _now(),
                }
            ]
        return [
            {
                "id": f"xr-asset-pending-{detail['id']}",
                "listing_id": detail["id"],
                "asset_type": "video_fallback",
                "asset_url": listing.get("hero_image_url"),
                "thumbnail_url": listing.get("hero_image_url"),
                "file_size_mb": None,
                "version": "fallback",
                "processing_status": "pending",
                "coordinate_system": "threejs_y_up",
                "scale_factor": 1,
                "origin_json": _vec(0, 0, 0),
                "metadata_json": {"message": "3D tour not available yet. Manager can trigger XR generation workflow through Codex."},
                "created_at": _now(),
                "updated_at": _now(),
            }
        ]

    def hotspots_for_listing(self, listing_id: str) -> list[dict[str, Any]]:
        return [
            _hotspot(listing_id, 1, "Building approach", "Building entrance", "Check road access, drop-off, entry security, and visitor movement.", (-4, 1.4, -3), (-6, 1.7, -6), (-2, 1.3, -2), "entry", ["family", "broker"]),
            _hotspot(listing_id, 2, "Lobby", "Lobby and lift", "Assess maintenance, lift count, accessibility, and society upkeep.", (-2, 1.3, -1), (-3, 1.65, -3), (0, 1.2, 0), "common_area", ["senior", "family"]),
            _hotspot(listing_id, 3, "Living room", "Living room", "Broadest layout zone for family seating, daylight checks, and ventilation review.", (0, 1.4, 0), (0, 1.65, 4), (0, 1.2, 0), "room", ["family", "first_time_buyer"]),
            _hotspot(listing_id, 4, "Balcony", "Balcony / view", "Verify privacy, road noise, open view, and morning/evening light.", (3, 1.4, 1), (4, 1.65, 3), (2, 1.2, 0), "view", ["nri", "family"]),
            _hotspot(listing_id, 5, "Kitchen", "Kitchen", "Check utility flow, storage, ventilation, platform condition, and appliance placement.", (-2, 1.4, 2), (-3.5, 1.65, 3), (-1, 1.1, 1), "room", ["family", "first_time_buyer"]),
            _hotspot(listing_id, 6, "Master bedroom", "Master bedroom", "Review privacy, wardrobe wall, work setup, AC placement, and noise leakage.", (2.5, 1.4, -2), (4, 1.65, -3), (1, 1.2, -1), "room", ["family", "nri"]),
            _hotspot(listing_id, 7, "Bathroom", "Bathrooms", "Inspect plumbing pressure, ventilation, fittings, drainage slope, and seepage risk.", (-3, 1.3, -2), (-4, 1.6, -2.5), (-2, 1.1, -1), "inspection", ["first_time_buyer"]),
            _hotspot(listing_id, 8, "Parking", "Parking and amenities", "Confirm parking allocation, access ramp, visitor rules, and amenity quality.", (4, 1.4, -4), (6, 1.7, -5), (3, 1.1, -3), "amenity", ["broker", "family"]),
            _hotspot(listing_id, 9, "Legal", "Legal/document context", "Use this checkpoint to ask about RERA, title report, NOC, and document gaps.", (-4, 1.8, 3), (-5, 1.7, 4), (-2, 1.2, 2), "legal", ["nri", "first_time_buyer"]),
            _hotspot(listing_id, 10, "Finance", "Finance context", "Ask EMI, down payment, total cash needed, or affordability questions here.", (4, 1.8, 3), (5, 1.7, 4), (2, 1.2, 2), "finance", ["first_time_buyer", "investor"]),
        ]

    def routes_for_hotspots(self, listing_id: str, hotspots: list[dict[str, Any]]) -> list[dict[str, Any]]:
        ids = [h["hotspot_id"] for h in hotspots]
        variants = [
            ("default", "Default buyer route", ids),
            ("family_buyer", "Family comfort route", [ids[i] for i in [0, 1, 2, 4, 5, 6, 7, 8] if i < len(ids)]),
            ("investor", "Investor yield and exit route", [ids[i] for i in [2, 5, 7, 9, 8] if i < len(ids)]),
            ("nri", "NRI trust and maintenance route", [ids[i] for i in [0, 1, 2, 5, 8, 9] if i < len(ids)]),
            ("broker_propertypool", "Broker PropertyPool presentation", ids),
            ("manager_preview", "Manager XR quality review", ids),
        ]
        return [
            {
                "id": f"xr-route-{route_type}-{listing_id}",
                "listing_id": listing_id,
                "route_name": name,
                "route_type": route_type,
                "ordered_hotspot_ids": ordered,
                "route_script": f"{name}: move through verified visual evidence, call out unknowns, then close with next best action.",
                "estimated_duration_minutes": 8 if route_type == "default" else 6,
                "created_at": _now(),
                "updated_at": _now(),
            }
            for route_type, name, ordered in variants
        ]

    def tour_script(self, detail: dict[str, Any], route: dict[str, Any]) -> dict[str, Any]:
        title = detail["listing"].get("title")
        return {
            "title": f"AI Virtual Property Guide script for {title}",
            "opening": f"Welcome to the immersive tour of {title}. I will guide you through layout, light, comfort, documents, finance, and locality context.",
            "closing": "This XR tour helps shortlist, but final decision should include a physical visit and professional document review.",
            "route_script": route["route_script"],
            "broker_script": "Keep claims verified, protect attribution, and invite buyers to a PropertyPool visit only when tie-up permissions allow it.",
            "manager_improvements": ["Confirm room labels", "Upload gsplat asset", "Add floor plan alignment", "Approve narration script"],
        }

    def permissions_for_role(self, role: str) -> dict[str, bool]:
        return {
            "can_view_public_xr": True,
            "can_ask_ai": True,
            "can_use_voice": True,
            "can_schedule_visit": role in {"public", "buyer", "broker"},
            "can_shortlist": role in {"public", "buyer"},
            "can_compare": role in {"public", "buyer"},
            "can_create_propertypool": role == "broker",
            "can_view_broker_talking_points": role == "broker",
            "can_trigger_xr_processing": role in {"manager", "admin"},
            "can_view_manager_analytics": role in {"manager", "admin"},
        }

    def analytics(self, listing_id: str) -> dict[str, Any]:
        sessions = [s for s in self.sessions.values() if s.get("listing_id") == listing_id]
        return {
            "total_xr_views": len(sessions),
            "average_tour_duration_minutes": 7.5 if sessions else 0,
            "most_visited_rooms": ["Living room", "Kitchen", "Master bedroom"],
            "most_asked_questions": ["What is the EMI?", "Is this legally safe?", "How is the sunlight?"],
            "drop_off_point": "Legal/document context" if sessions else None,
            "rooms_with_concerns": ["Bathroom", "Balcony/noise"],
            "buyer_interest_score": 78,
            "visit_conversion_rate": 0.32,
            "offer_conversion_rate": 0.11,
            "broker_led_xr_sessions": len([s for s in sessions if s.get("role") == "broker"]),
            "propertypool_xr_attendees": 0,
        }

    async def create_session(self, property_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        role = payload.get("role", "public")
        xr = await self.xr_payload(property_id, role)
        session_id = f"xr-session-{uuid4().hex[:10]}"
        first = xr["hotspots"][0]
        session = {
            "id": session_id,
            "session_id": session_id,
            "listing_id": xr["property"]["id"],
            "user_id": payload.get("user_id"),
            "role": role,
            "buyer_id": payload.get("buyer_id"),
            "broker_id": payload.get("broker_id"),
            "manager_id": payload.get("manager_id"),
            "started_at": _now(),
            "ended_at": None,
            "session_status": "active",
            "current_hotspot_id": first["hotspot_id"],
            "transcript_json": [],
            "events_json": [{"event_type": "session_started", "created_at": _now()}],
            "feedback_json": {},
            "created_at": _now(),
            "updated_at": _now(),
        }
        self.sessions[session_id] = session
        return {
            "session_id": session_id,
            "initial_route": xr["routes"][0],
            "greeting": xr["tour_script"]["opening"],
            "starting_camera_position": first["camera_position_json"],
            "starting_camera_look_at": first["camera_look_at_json"],
            "current_hotspot_id": first["hotspot_id"],
        }

    async def guide(self, property_id: str, payload: dict[str, Any], mode: str = "ask") -> dict[str, Any]:
        role = payload.get("role", "public")
        xr = await self.xr_payload(property_id, role)
        detail = await property_intelligence_service.detail(property_id, role)
        state = XRGuideState(
            session_id=payload.get("session_id"),
            user_id=payload.get("user_id"),
            role=role,
            property_id=xr["property"]["id"],
            buyer_id=payload.get("buyer_id"),
            broker_id=payload.get("broker_id"),
            manager_id=payload.get("manager_id"),
            current_room=payload.get("current_room"),
            current_hotspot_id=payload.get("current_hotspot_id"),
            current_camera_position=payload.get("camera_position") or {},
            current_camera_target=payload.get("camera_target") or {},
            user_query=payload.get("query") or payload.get("transcript") or ("Start the tour" if mode == "start" else ""),
            query_mode=payload.get("query_mode", "voice" if mode == "voice" else "text"),
            voice_transcript=payload.get("transcript"),
            property_snapshot=detail,
            hotspot_metadata=xr["hotspots"],
            legal_context=detail["documents"],
            finance_context=detail["finance"],
            market_context=detail["market_intelligence"],
            tour_context={"routes": xr["routes"], "tour_script": xr["tour_script"]},
            audit_events=[{"event_type": f"xr_guide_{mode}", "created_at": _now()}],
        )
        response = await self.agent.answer(state)
        if state.session_id and state.session_id in self.sessions:
            self.sessions[state.session_id]["transcript_json"].append(
                {"query": state.user_query, "response": response.model_dump(mode="json"), "created_at": _now()}
            )
            self.sessions[state.session_id]["current_hotspot_id"] = response.hotspot_id or self.sessions[state.session_id].get("current_hotspot_id")
        return response.model_dump(mode="json")

    async def navigate(self, property_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        target = payload.get("hotspot_id") or payload.get("target_room") or payload.get("target")
        xr = await self.xr_payload(property_id, payload.get("role", "public"))
        hotspot = next((h for h in xr["hotspots"] if h["hotspot_id"] == target or h["room_name"].lower() == str(target).lower() or h["label"].lower() == str(target).lower()), xr["hotspots"][0])
        return {
            "navigation_command": "go_to_hotspot",
            "camera_path": [
                payload.get("camera_position") or _vec(0, 1.6, 6),
                hotspot["camera_position_json"],
            ],
            "camera_look_at": hotspot["camera_look_at_json"],
            "target_hotspot": hotspot,
            "narration": hotspot["narration"],
            "comfort_mode": True,
        }

    async def record_event(self, property_id: str, session_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        session = self.sessions.setdefault(session_id, {"session_id": session_id, "listing_id": property_id, "events_json": [], "transcript_json": [], "feedback_json": {}})
        event = {"id": f"xr-event-{uuid4().hex[:8]}", "listing_id": property_id, "timestamp": _now(), **payload}
        session.setdefault("events_json", []).append(event)
        return {"saved": True, "event": event}

    async def feedback(self, property_id: str, session_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        session = self.sessions.setdefault(session_id, {"session_id": session_id, "listing_id": property_id, "events_json": [], "transcript_json": [], "feedback_json": {}})
        feedback = {"id": f"xr-feedback-{uuid4().hex[:8]}", "listing_id": property_id, "session_id": session_id, "created_at": _now(), **payload}
        session["feedback_json"] = feedback
        return {
            "saved": True,
            "feedback": feedback,
            "next_action_recommendation": "Schedule physical visit" if payload.get("interested") or payload.get("wants_physical_visit") else "Compare with similar homes",
        }

    async def propertypool_xr(self, event_id: str, action: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        payload = payload or {}
        return {
            "event_id": event_id,
            "action": action,
            "status": "ready",
            "message": f"PropertyPool XR {action.replace('_', ' ')} completed in demo mode.",
            "broadcast": action == "broadcast_navigation",
            "summary": "AI detected common doubts around EMI, legal documents, sunlight, and physical visit readiness.",
            "created_at": _now(),
            "payload": payload,
        }


property_xr_service = PropertyXRService()
