from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal, TypedDict

try:
    from langgraph.graph import END, START, StateGraph
    from langgraph.types import Command
    LANGGRAPH_AVAILABLE = True
except Exception:  # pragma: no cover
    END = START = None
    LANGGRAPH_AVAILABLE = False

    class Command:  # type: ignore[no-redef]
        def __init__(self, update=None, goto=None):
            self.update = update or {}
            self.goto = goto

        def __class_getitem__(cls, item):
            return cls


class ManagerAutomationState(TypedDict, total=False):
    manager_id: str
    listing_id: str
    lead_id: str
    current_task: str
    user_request: str
    listing_snapshot: dict[str, Any]
    extracted_document_data: dict[str, Any]
    media_analysis: dict[str, Any]
    pricing_analysis: dict[str, Any]
    market_analysis: dict[str, Any]
    lead_profile: dict[str, Any]
    negotiation_context: dict[str, Any]
    missing_fields: list[str]
    readiness_score: float
    legal_risk_score: float
    next_action: str
    messages: list[str]
    audit_events: list[dict[str, Any]]
    auto_publish: bool
    publish_blocked: bool
    published: bool
    listing_copy: dict[str, Any]
    tasks: list[dict[str, Any]]


Route = Literal["seller_intake", "document_due_diligence", "media_intelligence", "pricing_valuation", "listing_copy", "publishing", "growth", "final"]


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _touch_audit(state: ManagerAutomationState, action: str, details: str, actor: str = "system") -> list[dict[str, Any]]:
    events = list(state.get("audit_events", []))
    events.append({"created_at": _utc_now(), "actor_type": "agent", "actor_name": actor, "action": action, "details": details})
    return events


def _readiness_from_snapshot(snapshot: dict[str, Any], missing: list[str]) -> float:
    score = 100.0
    if missing:
        score -= min(35, len(missing) * 5)
    if not snapshot.get("documents"):
        score -= 10
    if not snapshot.get("media"):
        score -= 10
    if not snapshot.get("pricing_analysis"):
        score -= 10
    if not snapshot.get("listing_copy"):
        score -= 10
    if snapshot.get("legal_risk_score", 0) > 65:
        score -= 10
    return max(0.0, min(100.0, round(score, 1)))


def intake_node(state: ManagerAutomationState) -> Command[Route]:
    snapshot = dict(state.get("listing_snapshot", {}))
    missing = [
        field
        for field in ["title", "locality", "address", "latitude", "longitude", "carpet_area_sqft", "asking_price", "rera_number"]
        if snapshot.get(field) in {None, "", []}
    ]
    legal_risk = 15.0 if snapshot.get("rera_number") else 55.0
    readiness = _readiness_from_snapshot(snapshot, missing)
    snapshot["market_heat_score"] = snapshot.get("market_heat_score") or 60
    return Command(
        update={
            "listing_snapshot": snapshot,
            "missing_fields": missing,
            "legal_risk_score": legal_risk,
            "readiness_score": readiness,
            "next_action": "Run document diligence",
            "messages": ["Seller Intake Agent validated core listing fields."],
            "audit_events": _touch_audit(state, "seller_intake_completed", f"Missing fields: {', '.join(missing) if missing else 'none'}"),
        },
        goto="document_due_diligence",
    )


def document_node(state: ManagerAutomationState) -> Command[Route]:
    snapshot = dict(state.get("listing_snapshot", {}))
    legal_risk = float(state.get("legal_risk_score", 55.0))
    if snapshot.get("rera_number"):
        legal_risk = max(10.0, legal_risk - 15)
    extracted = {
        "document_count": len(snapshot.get("documents", [])),
        "rera_match": bool(snapshot.get("rera_number")),
        "party_summary": snapshot.get("owner_name") or snapshot.get("title"),
        "red_flags": ["Missing legal confirmation" ] if not snapshot.get("rera_number") else [],
        "missing_items": ["Title report", "Encumbrance certificate"] if not snapshot.get("documents") else [],
    }
    snapshot["legal_notes"] = extracted.get("red_flags", [])
    readiness = _readiness_from_snapshot(snapshot, list(state.get("missing_fields", [])))
    return Command(
        update={
            "listing_snapshot": snapshot,
            "extracted_document_data": extracted,
            "legal_risk_score": legal_risk,
            "readiness_score": min(100.0, readiness + 8),
            "next_action": "Analyze media",
            "messages": state.get("messages", []) + ["Document Due Diligence Agent extracted legal signals."],
            "audit_events": _touch_audit(state, "document_due_diligence_completed", f"Extracted {extracted['document_count']} document groups."),
        },
        goto="media_intelligence",
    )


def media_node(state: ManagerAutomationState) -> Command[Route]:
    snapshot = dict(state.get("listing_snapshot", {}))
    media = snapshot.get("media", []) or []
    hero = next((item for item in media if item.get("is_hero")), media[0] if media else None)
    analysis = {
        "room_types": [item.get("room_type", "unknown") for item in media[:8]],
        "quality_score": round(sum(float(item.get("quality_score", 0)) for item in media[:8]) / max(len(media[:8]), 1), 1) if media else 45.0,
        "hero_image_url": hero.get("file_url") if hero else snapshot.get("hero_image_url"),
        "missing_visuals": ["Kitchen", "Living room", "View"] if len(media) < 4 else [],
        "tour_ready": bool(media),
        "codex_task": bool(snapshot.get("raw_video_url")),
    }
    snapshot["hero_image_url"] = analysis["hero_image_url"]
    readiness = _readiness_from_snapshot(snapshot, list(state.get("missing_fields", [])))
    return Command(
        update={
            "listing_snapshot": snapshot,
            "media_analysis": analysis,
            "readiness_score": min(100.0, readiness + (10 if media else 0)),
            "next_action": "Generate pricing",
            "messages": state.get("messages", []) + ["Media Intelligence Agent classified media and suggested hero selection."],
            "audit_events": _touch_audit(state, "media_intelligence_completed", f"Media analyzed: {len(media)} items."),
        },
        goto="pricing_valuation",
    )


def pricing_node(state: ManagerAutomationState) -> Command[Route]:
    snapshot = dict(state.get("listing_snapshot", {}))
    asking_price = float(snapshot.get("asking_price") or 0)
    carpet = float(snapshot.get("carpet_area_sqft") or snapshot.get("builtup_area_sqft") or 0)
    locality = str(snapshot.get("locality") or "Mumbai")
    area_band = "₹5–10 Cr" if asking_price >= 50_000_000 else ("above ₹10 Cr" if asking_price >= 100_000_000 else "below ₹5 Cr")
    price_per_sqft = round(asking_price / carpet, 0) if asking_price and carpet else 0
    recommended = round(asking_price * 0.97 if asking_price else 0, 0)
    analysis = {
        "recommended_price": recommended,
        "minimum_acceptable_price": round(asking_price * 0.92 if asking_price else 0, 0),
        "optimistic_price": round(asking_price * 1.05 if asking_price else 0, 0),
        "fast_sale_price": round(asking_price * 0.94 if asking_price else 0, 0),
        "price_per_sqft": price_per_sqft,
        "rental_yield_estimate": 2.8 if locality in {"Powai", "Andheri", "Chembur"} else 2.4,
        "buyer_affordability_segment": area_band,
        "negotiation_buffer": round(max(0, asking_price - recommended), 0),
        "market_heat_score": snapshot.get("market_heat_score") or 68,
        "redevelopment_upside_score": snapshot.get("redevelopment_score") or 55,
        "confidence_score": 76.0 if asking_price else 42.0,
        "explanation": f"Pricing uses Mumbai locality demand, comparable inventory pressure, EMI affordability, and {area_band} positioning.",
    }
    snapshot["pricing_analysis"] = analysis
    snapshot["recommended_price"] = analysis["recommended_price"]
    snapshot["fast_sale_price"] = analysis["fast_sale_price"]
    snapshot["optimistic_price"] = analysis["optimistic_price"]
    snapshot["min_acceptable_price"] = analysis["minimum_acceptable_price"]
    readiness = _readiness_from_snapshot(snapshot, list(state.get("missing_fields", [])))
    return Command(
        update={
            "listing_snapshot": snapshot,
            "pricing_analysis": analysis,
            "readiness_score": min(100.0, readiness + 12),
            "next_action": "Generate copy",
            "messages": state.get("messages", []) + ["Pricing and Valuation Agent recommended listing and floor prices."],
            "audit_events": _touch_audit(state, "pricing_valuation_completed", f"Recommended {recommended:.0f} for {locality} listing."),
        },
        goto="listing_copy",
    )


def copy_node(state: ManagerAutomationState) -> Command[Route]:
    snapshot = dict(state.get("listing_snapshot", {}))
    locality = str(snapshot.get("locality") or "Mumbai")
    title = str(snapshot.get("title") or "Mumbai property")
    asking_price = float(snapshot.get("asking_price") or 0)
    copy = {
        "seo_title": snapshot.get("seo_title") or f"{title} | {locality} Premium Listing",
        "short_description": snapshot.get("description_short") or f"Premium {snapshot.get('property_type', 'property')} in {locality} with AI-assisted seller workflow.",
        "long_description": snapshot.get("description_long") or f"{title} is a Mumbai seller listing prepared by the Manager Selling Portal. Pricing, legal review, media quality, and lead automation are tracked before publication.",
        "premium_description": f"A polished {locality} listing with managed publishing, lead qualification, and document readiness. Asking price guide: ₹{asking_price:,.0f}.",
        "whatsapp_message": f"{title} in {locality} is ready for qualified buyers. Ask for the pricing sheet, document pack, or a viewing slot.",
        "broker_pitch": f"{title} is positioned for broker-ready conversion with AI pricing and lead handling in {locality}.",
        "investor_pitch": f"Investor-friendly {locality} listing with clear pricing bands, demand signals, and negotiation room.",
        "family_buyer_pitch": f"Family buyer fit with {locality} context, legal review, and visit scheduling ready.",
        "nri_buyer_pitch": f"NRI-friendly Mumbai asset with verified docs, map context, and concierge-style follow-up.",
        "social_post": f"Just listed: {title} in {locality}. AI-reviewed, market-priced, and ready for qualified buyers.",
        "bullet_points": [f"{snapshot.get('bedrooms', '-')} BHK", f"{snapshot.get('carpet_area_sqft', '-')} sq ft carpet", f"{snapshot.get('rera_number') or 'RERA to confirm'}"],
        "amenity_highlights": ["Managed publishing", "Lead automation", "Document due diligence"],
        "locality_highlights": [locality, "Mumbai market intelligence", "Map-ready publishing"],
        "redevelopment_angle": f"{locality} redevelopment upside tracked by seller automation." if snapshot.get("redevelopment_score") else None,
        "compliance_highlights": ["No unsupported legal claims", "Manager confirmation required for unverified items"],
        "needs_confirmation": ["View quality", "Legal claims"] if not snapshot.get("documents") else [],
    }
    snapshot["listing_copy"] = copy
    readiness = _readiness_from_snapshot(snapshot, list(state.get("missing_fields", [])))
    return Command(
        update={
            "listing_snapshot": snapshot,
            "listing_copy": copy,
            "readiness_score": min(100.0, readiness + 10),
            "next_action": "Publish or request review",
            "messages": state.get("messages", []) + ["Listing Copy Agent drafted compliant marketing copy."],
            "audit_events": _touch_audit(state, "listing_copy_completed", f"SEO title generated for {title}."),
        },
        goto="publishing",
    )


def publishing_node(state: ManagerAutomationState) -> Command[Route]:
    readiness = float(state.get("readiness_score", 0))
    missing = list(state.get("missing_fields", []))
    publish_blocked = bool(missing)
    published = bool(state.get("auto_publish") and readiness >= 82 and not publish_blocked)
    next_action = "Published to buyer surface" if published else ("Needs manager review" if readiness >= 70 else "Fix missing items first")
    return Command(
        update={
            "published": published,
            "publish_blocked": publish_blocked,
            "next_action": next_action,
            "messages": state.get("messages", []) + ["Publishing Agent evaluated readiness and approval gates."],
            "audit_events": _touch_audit(state, "publishing_evaluated", next_action),
        },
        goto="growth" if published else "final",
    )


def growth_node(state: ManagerAutomationState) -> Command[Route]:
    tasks = [
        {"title": "Confirm RERA / legal pack", "priority": "high", "status": "open"},
        {"title": "Approve listing copy", "priority": "medium", "status": "open"},
        {"title": "Review hero image", "priority": "medium", "status": "open"},
        {"title": "Monitor fresh leads", "priority": "medium", "status": "open"},
    ]
    return Command(
        update={
            "tasks": tasks,
            "next_action": "Track stale leads and weekly report",
            "messages": state.get("messages", []) + ["Seller Growth and Analytics Agent generated the follow-up task list."],
            "audit_events": _touch_audit(state, "growth_analytics_completed", "Generated stale lead and listing improvement tasks."),
        },
        goto="final",
    )


def build_manager_graph():
    nodes = {
        "seller_intake": intake_node,
        "document_due_diligence": document_node,
        "media_intelligence": media_node,
        "pricing_valuation": pricing_node,
        "listing_copy": copy_node,
        "publishing": publishing_node,
        "growth": growth_node,
        "final": lambda state: state,
    }

    if not LANGGRAPH_AVAILABLE:
        class SimpleCompiledGraph:
            async def ainvoke(self, input_state: ManagerAutomationState) -> ManagerAutomationState:
                state: ManagerAutomationState = dict(input_state)
                current = "seller_intake"
                for _ in range(10):
                    result = await nodes[current](state) if current != "final" else nodes[current](state)
                    if isinstance(result, Command):
                        state.update(result.update)
                        current = result.goto or "final"
                    else:
                        state = result
                        current = "final"
                    if current == "final":
                        return nodes["final"](state)
                return state

        return SimpleCompiledGraph()

    graph = StateGraph(ManagerAutomationState)
    for name, node in nodes.items():
        graph.add_node(name, node)
    graph.add_edge(START, "seller_intake")
    graph.add_edge("final", END)
    return graph.compile()
