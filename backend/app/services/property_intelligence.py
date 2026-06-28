from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from app.agents.graph import build_agent_graph
from app.db.session import get_pool
from app.services.manager_portal import manager_portal_service
from app.services.mumbai_market import market_insights


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except Exception:
        return default


def _int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except Exception:
        return default


def _money_bucket(price: float) -> str:
    if price >= 100_000_000:
        return "Above INR 10 Cr"
    if price >= 50_000_000:
        return "INR 5-10 Cr"
    return "Below INR 5 Cr"


def _emi(price: float, down_payment_pct: float = 20, annual_rate_pct: float = 8.25, tenure_years: int = 20) -> dict[str, Any]:
    loan = max(price * (1 - down_payment_pct / 100), 0)
    monthly_rate = annual_rate_pct / 100 / 12
    months = tenure_years * 12
    factor = (monthly_rate * ((1 + monthly_rate) ** months)) / (((1 + monthly_rate) ** months) - 1)
    monthly = loan * factor if loan and monthly_rate else loan / max(months, 1)
    stamp = price * 0.06
    registration = min(price * 0.01, 30_000)
    return {
        "property_price": round(price),
        "down_payment_pct": down_payment_pct,
        "down_payment": round(price * down_payment_pct / 100),
        "loan_amount": round(loan),
        "annual_rate_pct": annual_rate_pct,
        "tenure_years": tenure_years,
        "monthly_emi": round(monthly),
        "emi_per_lakh": round(monthly / max(loan / 100_000, 1)),
        "stamp_duty_estimate": round(stamp),
        "registration_estimate": round(registration),
        "total_cash_needed": round(price * down_payment_pct / 100 + stamp + registration),
        "affordability_score": 74 if price < 50_000_000 else 58,
        "warnings": ["Consider increasing down payment to reduce EMI."] if price >= 50_000_000 else ["This is affordable for many qualified Mumbai buyers."],
        "rate_sensitivity": [
            {"rate_pct": annual_rate_pct - 0.5, "emi": round(monthly * 0.96)},
            {"rate_pct": annual_rate_pct, "emi": round(monthly)},
            {"rate_pct": annual_rate_pct + 0.5, "emi": round(monthly * 1.04)},
        ],
    }


class PropertyIntelligenceService:
    def _listing_defaults(self, item: dict[str, Any]) -> dict[str, Any]:
        item = dict(item)
        item.setdefault("documents", [])
        item.setdefault("media", [])
        item.setdefault("leads", [])
        item.setdefault("site_visits", [])
        item.setdefault("audit_log", [])
        item.setdefault("automation_rules", [])
        item.setdefault("market_comparables", [])
        item.setdefault("pricing", {})
        item.setdefault("listing_copy", {})
        item.setdefault("readiness_breakdown", {})
        item.setdefault("missing_fields", [])
        item.setdefault("legal_notes", [])
        item.setdefault("map_preview", {"latitude": item.get("latitude"), "longitude": item.get("longitude"), "locality": item.get("locality")})
        return item

    async def _listing(self, property_id: str) -> dict[str, Any]:
        await manager_portal_service.ensure_ready()
        try:
            detail = await manager_portal_service.get_listing(property_id)
            return self._listing_defaults(detail.model_dump(mode="json"))
        except Exception:
            dashboard = await manager_portal_service.dashboard()
            for listing in dashboard.listings:
                item = listing.model_dump(mode="json")
                if property_id in {item.get("id"), item.get("slug"), str(item.get("id", "")).replace("seller-", "")}:
                    try:
                        return self._listing_defaults((await manager_portal_service.get_listing(item["id"])).model_dump(mode="json"))
                    except Exception:
                        return self._listing_defaults(item)
                normalized_id = str(item.get("id", "")).replace("mumbai-", "").replace("seller-", "")
                normalized_input = str(property_id).replace("demo-", "").replace("mumbai-", "").replace("seller-", "")
                if normalized_input and (normalized_input in normalized_id or normalized_input in str(item.get("slug", ""))):
                    try:
                        return self._listing_defaults((await manager_portal_service.get_listing(item["id"])).model_dump(mode="json"))
                    except Exception:
                        return self._listing_defaults(item)
        raise ValueError("Listing not found")

    async def detail(self, property_id: str, role: str = "public") -> dict[str, Any]:
        listing = await self._listing(property_id)
        # Pull the source property for the full listing-spec parameters (the manager
        # listing model does not carry all of them).
        spec: dict[str, Any] = {}
        try:
            from app.services.property_repository import PropertyRepository

            prop = await PropertyRepository().get_property(str(property_id).replace("seller-", ""))
            if prop is not None:
                spec = prop.model_dump(mode="json")
        except Exception:
            spec = {}
        media = await self.media(property_id)
        documents = await self.documents(property_id, role)
        price = _float(listing.get("asking_price"))
        carpet = _int(listing.get("carpet_area_sqft") or listing.get("builtup_area_sqft") or 1)
        legal_risk = _float(listing.get("legal_risk_score"), 55)
        has_rera = bool(listing.get("rera_number"))
        has_docs = bool(documents.get("uploaded_documents"))
        room_breakdown = await self.area_breakdown(property_id, carpet)
        market = await self.market_intelligence(property_id)
        tour = await self.tour_route(property_id, role)
        similar = await self.similar(property_id)
        feedback = await self.visit_feedback(property_id, role)
        badges = [
            {"label": "RERA verified", "status": "positive" if has_rera else "missing", "detail": listing.get("rera_number") or "RERA not verified"},
            {"label": "Documents available", "status": "positive" if has_docs else "missing", "detail": "Documents uploaded" if has_docs else "Documents pending"},
            {"label": "Legal risk", "status": "positive" if legal_risk <= 25 else "warning", "detail": "Low legal risk" if legal_risk <= 25 else "Legal review required"},
            {"label": "Price verified", "status": "positive" if listing.get("recommended_price") else "warning", "detail": "AI pricing estimate available" if listing.get("recommended_price") else "Manager confirmation needed"},
            {"label": "Broker tie-up", "status": "positive", "detail": "Broker tie-up available"},
            {"label": "PropertyPool", "status": "positive", "detail": "PropertyPool eligible"},
        ]
        ai_summary = {
            "confidence_score": 82 if has_rera and has_docs else 68,
            "why_consider": f"{listing['title']} is worth considering for buyers focused on {listing['locality']} with {carpet} sq ft usable area and a {listing.get('possession_status') or 'manager-entered'} possession profile.",
            "best_for": ["Family buyer", "NRI buyer" if price >= 50_000_000 else "First-time buyer", "Redevelopment investor" if _float(listing.get("redevelopment_score")) >= 65 else "Rental yield buyer"],
            "strengths": ["Mumbai locality context available", "AI price and finance estimates available", "Broker and PropertyPool workflows connected"],
            "concerns": documents.get("missing_documents") or ["Needs manager confirmation for unsupported claims."],
            "buyer_questions": ["Can I review title and society documents?", "What is the realistic negotiation room?", "How is traffic and noise during peak hours?"],
            "broker_talking_points": ["Use only verified RERA/document claims.", "Lead with usable area, EMI, locality, and visit checklist.", "Protect attribution before WhatsApp sharing."],
            "manager_suggestions": listing.get("missing_fields") or ["Upload stronger room-wise media and floor plan if available."],
            "final_recommendation": "Proceed to site visit and document review before offer." if legal_risk < 40 else "Treat this as promising but legally incomplete until documents are reviewed.",
        }
        role_actions = {
            "public": ["Talk to an Expert", "Schedule a Visit", "WhatsApp Assistant", "Shortlist", "Compare", "Ask AI", "Get EMI Estimate", "Make Offer"],
            "buyer": ["Talk to an Expert", "Schedule a Visit", "Shortlist", "Compare", "Ask AI", "Get EMI Estimate", "Generate Negotiation Offer"],
            "broker": ["Request Tie-Up", "Add Buyer", "Create PropertyPool", "Share Pitch", "Book Visit", "Generate Buyer Match", "View Commission Terms"],
            "manager": ["Edit Listing", "Run AI Review", "Publish/Unpublish", "Generate Listing Copy", "View Leads", "View Broker Requests"],
            "admin": ["Run AI Review", "View Audit", "Regenerate Summary", "Inspect Agent Routing", "Review Data Quality"],
        }
        def _spec(*keys: str, default: Any = None) -> Any:
            for source in (spec, listing):
                for key in keys:
                    value = source.get(key)
                    if value not in (None, "", [], {}):
                        return value
            return default

        def _yn(value: Any) -> str:
            return "Available" if value is True else ("Not available" if value is False else "Needs confirmation")

        facts = [
            {"label": "Bedrooms", "value": f"{_spec('bedrooms') or '-'} Bed"},
            {"label": "Bathrooms", "value": f"{_spec('bathrooms') or '-'} Bath"},
            {"label": "Carpet area", "value": f"{carpet} sq ft usable"},
            {"label": "RERA carpet", "value": f"{_spec('rera_carpet_area_sqft')} sq ft"} if _spec("rera_carpet_area_sqft") else None,
            {"label": "Built-up", "value": f"{_spec('builtup_area_sqft', 'built_up_area_sqft') or carpet} sq ft"},
            {"label": "Property type", "value": str(_spec("property_type", default="apartment")).replace("_", " ").title()},
            {"label": "Builder", "value": _spec("builder")} if _spec("builder") else None,
            {"label": "Pincode", "value": str(_spec("pincode"))} if _spec("pincode") else None,
            {"label": "Year / Possession", "value": str(_spec("year_built"))} if _spec("year_built") else None,
            {"label": "Floor", "value": f"{listing.get('floor_number') or '3rd'} of {listing.get('total_floors') or 22}"},
            {"label": "Parking", "value": ", ".join(_spec("parking", "parking_types", default=[])).title()} if _spec("parking", "parking_types") else {"label": "Parking", "value": f"{listing.get('parking_count') or 0} covered"},
            {"label": "Furnishing", "value": str(_spec("furnishing", "furnishing_status", default="Needs confirmation")).replace("_", " ").title()},
            {"label": "Kitchen", "value": str(_spec("kitchen_type")).replace("_", " ").title()} if _spec("kitchen_type") else None,
            {"label": "Possession (RERA)", "value": _spec("rera_possession")} if _spec("rera_possession") else None,
            {"label": "Possession (Builder)", "value": _spec("builder_possession")} if _spec("builder_possession") else {"label": "Possession", "value": _spec("possession", "possession_status", default="Needs confirmation")},
            {"label": "Listing type", "value": str(_spec("listing_type")).replace("_", " ").title()} if _spec("listing_type") else None,
            {"label": "Condition", "value": str(_spec("current_condition")).replace("_", " ").title()} if _spec("current_condition") else None,
            {"label": "Shown by", "value": str(_spec("who_shows_property")).replace("_", " ").title()} if _spec("who_shows_property") else None,
            {"label": "Price status", "value": _spec("price_status")} if _spec("price_status") else None,
            {"label": "Maintenance", "value": f"INR {int(_spec('maintenance_cost')):,}/mo"} if _spec("maintenance_cost") else None,
            {"label": "Occupancy cert.", "value": _yn(spec.get("occupancy_certificate"))} if "occupancy_certificate" in spec else None,
            {"label": "Allotment letter", "value": _yn(spec.get("allotment_letter"))} if "allotment_letter" in spec else None,
            {"label": "Sale deed", "value": _yn(spec.get("sale_deed"))} if "sale_deed" in spec else None,
        ]
        for key, value in (spec.get("nearby") or listing.get("nearby") or {}).items():
            facts.append({"label": f"Nearby - {key.replace('_', ' ').title()}", "value": str(value)})
        facts = [fact for fact in facts if fact]

        return {
            "id": listing["id"],
            "slug": listing.get("slug") or listing["id"],
            "role": role,
            "listing": listing,
            "media": media["media"],
            "media_warning": media.get("warning"),
            "documents": documents,
            "badges": badges,
            "actions": role_actions.get(role, role_actions["public"]),
            "facts": facts,
            "highlights": spec.get("highlights") or listing.get("highlights") or [],
            "google_map_link": spec.get("google_map_link") or listing.get("google_map_link"),
            "amenities": self._amenities(listing),
            "area": room_breakdown,
            "vastu": {"available": False, "message": "Vastu information not provided."},
            "environment": self._environment(listing),
            "price_breakdown": self._price_breakdown(listing),
            "finance": _emi(price),
            "market_intelligence": market,
            "tour_route": tour,
            "similar_properties": similar,
            "visit_feedback": feedback,
            "ai_summary": ai_summary,
            "broker_propertypool": self._broker_propertypool(listing, role),
            "map": self._map(listing),
            "agent_routes": ["Property Page Agent", "Buyer Match Agent", "Finance Agent", "Legal Agent", "Market Intelligence Agent", "Tour Guide Agent", "Similar Property Agent", "Negotiation Agent", "Broker Tie-Up Agent", "PropertyPool Agent"],
        }

    async def media(self, property_id: str) -> dict[str, Any]:
        listing = await self._listing(property_id)
        media = list(listing.get("media") or [])
        if not media and listing.get("hero_image_url"):
            media = [
                {
                    "id": f"hero-{listing['id']}",
                    "listing_id": listing["id"],
                    "media_type": "image",
                    "room_name": "Living Area",
                    "room_type": "living_room",
                    "room_area_sqft": 295,
                    "media_url": listing["hero_image_url"],
                    "file_url": listing["hero_image_url"],
                    "thumbnail_url": listing["hero_image_url"],
                    "caption": "Morning light, open view",
                    "is_hero": True,
                    "display_order": 1,
                    "quality_score": 84,
                }
            ]
        if not media:
            return {"media": [], "warning": "Media pending from manager."}
        normalized = []
        for index, item in enumerate(media):
            normalized.append(
                {
                    **item,
                    "room_name": item.get("room_name") or str(item.get("room_type") or "Room").replace("_", " ").title(),
                    "room_area_sqft": item.get("room_area_sqft") or (295 if index == 0 else 140 + index * 20),
                    "media_url": item.get("media_url") or item.get("file_url") or item.get("thumbnail_url") or listing.get("hero_image_url"),
                    "display_order": item.get("display_order") or index + 1,
                    "caption": item.get("caption") or "Needs manager confirmation.",
                }
            )
        return {"media": normalized, "warning": None}

    async def documents(self, property_id: str, role: str = "public") -> dict[str, Any]:
        listing = await self._listing(property_id)
        docs = list(listing.get("documents") or [])
        public_docs = docs if role in {"broker", "manager", "admin"} else [{k: v for k, v in doc.items() if k not in {"file_url"}} for doc in docs]
        missing = list(listing.get("missing_fields") or [])
        if not listing.get("rera_number"):
            missing.append("RERA verification")
        if not docs:
            missing.extend(["Title report", "Society NOC", "Occupancy certificate"])
        return {
            "rera_number": listing.get("rera_number"),
            "rera_status": "verified" if listing.get("rera_number") else "RERA not verified",
            "legal_risk_score": listing.get("legal_risk_score"),
            "uploaded_documents": public_docs,
            "missing_documents": sorted(set(missing)),
            "red_flags": [flag for doc in docs for flag in doc.get("red_flags", [])] or ([] if listing.get("rera_number") else ["RERA not supplied"]),
            "ai_legal_summary": "Legal verification incomplete. Professional legal review recommended." if missing else "Uploaded document pack has no demo red flags, but professional review is still recommended.",
            "encumbrance_status": "Unavailable",
            "society_noc_status": "Pending" if "Society NOC" in missing else "Uploaded",
            "occupancy_certificate_status": "Pending" if "Occupancy certificate" in missing else "Uploaded",
            "title_report_status": "Pending" if "Title report" in missing else "Uploaded",
        }

    async def market_intelligence(self, property_id: str) -> dict[str, Any]:
        listing = await self._listing(property_id)
        price = _float(listing.get("asking_price"))
        insights = market_insights()
        return {
            "locality": listing.get("locality"),
            "locality_demand_score": listing.get("lead_quality_score") or 72,
            "market_heat_score": listing.get("market_heat_score") or 68,
            "unsold_inventory_pressure": "Moderate",
            "price_bucket": _money_bucket(price),
            "redevelopment_activity": listing.get("redevelopment_score") or 55,
            "development_agreement_activity": insights["redevelopment"]["development_agreements_signed_total"],
            "rental_yield_estimate": (listing.get("pricing") or {}).get("rental_yield_estimate", 2.8),
            "resale_liquidity": "Strong" if price < 50_000_000 else "Selective premium liquidity",
            "buyer_competition": "High" if _float(listing.get("market_heat_score")) >= 75 else "Moderate",
            "investment_score": min(95, round((_float(listing.get("market_heat_score"), 65) + _float(listing.get("redevelopment_score"), 55)) / 2)),
            "family_buyer_score": 82 if listing.get("bedrooms", 0) >= 2 else 68,
            "nri_buyer_score": 78 if price >= 50_000_000 else 66,
            "ai_explanation": f"{listing.get('locality')} shows {('strong' if _float(listing.get('redevelopment_score')) >= 65 else 'moderate')} redevelopment and buyer-demand signals. Premium resale liquidity depends on document readiness, exact building quality, and visit feedback.",
            "source": "Mumbai market intelligence with local demo fallback",
        }

    async def similar(self, property_id: str) -> list[dict[str, Any]]:
        target = await self._listing(property_id)
        dashboard = await manager_portal_service.dashboard()
        price = _float(target.get("asking_price"))
        cards = []
        for item in dashboard.listings:
            listing = item.model_dump(mode="json")
            if listing["id"] == target["id"]:
                continue
            score = 0
            if listing.get("locality") == target.get("locality"):
                score += 35
            if listing.get("bedrooms") == target.get("bedrooms"):
                score += 20
            if abs(_float(listing.get("asking_price")) - price) <= max(price * 0.35, 1):
                score += 25
            score += 20 - min(20, abs(_float(listing.get("legal_risk_score")) - _float(target.get("legal_risk_score"))) / 3)
            cards.append({**listing, "match_score": round(score), "match_reason": "Similar budget, BHK, locality, and legal-risk profile."})
        return sorted(cards, key=lambda item: item["match_score"], reverse=True)[:4]

    async def tour_route(self, property_id: str, role: str = "public") -> dict[str, Any]:
        listing = await self._listing(property_id)
        waypoints = [
            {"label": "Building approach", "focus": "Road access, entry security, drop-off, traffic pinch points."},
            {"label": "Lobby and lift", "focus": "Maintenance, lift count, accessibility, visitor movement."},
            {"label": "Living room", "focus": "Natural light, ventilation, furniture flow, view quality."},
            {"label": "Kitchen", "focus": "Utility flow, storage, plumbing, exhaust and service access."},
            {"label": "Bedroom wing", "focus": "Privacy, noise, WFH setup, family suitability."},
            {"label": "Bathrooms", "focus": "Plumbing pressure, ventilation, fittings, seepage checks."},
            {"label": "Amenities and parking", "focus": "Parking access, society amenities, visitor rules."},
            {"label": "Locality context", "focus": "Metro/rail, schools, retail, hospitals, business hubs."},
        ]
        result = {"route_name": f"{listing.get('locality')} property intelligence visit route", "waypoints": waypoints, "next_action": "Schedule site visit and request document summary."}
        if role == "broker":
            result["broker_script"] = "Open with verified facts, explain EMI and legal status, handle price objections with comparables, and close with next-step intent."
            result["objection_handling"] = ["Price: compare with recommended and fast-sale bands.", "Legal: do not claim clearance until document review.", "Visit timing: offer PropertyPool slot if tie-up permits."]
        return result

    async def area_breakdown(self, property_id: str, carpet: int | None = None) -> dict[str, Any]:
        listing = await self._listing(property_id)
        total = carpet or _int(listing.get("carpet_area_sqft") or listing.get("builtup_area_sqft"), 1000)
        rooms = [
            ("Living room", 0.23), ("Kitchen", 0.09), ("Master bedroom", 0.15),
            ("Bedroom 2", 0.12), ("Bedroom 3", 0.10 if _int(listing.get("bedrooms")) >= 3 else 0),
            ("Bathrooms", 0.07), ("Passage/utilities", 0.10),
        ]
        exact = bool(listing.get("area_breakdowns"))
        return {
            "carpet_area_sqft": total,
            "builtup_area_sqft": listing.get("builtup_area_sqft") or total,
            "super_builtup_area_sqft": listing.get("super_builtup_area_sqft"),
            "room_wise_verified": exact,
            "message": None if exact else "Room-wise area not verified.",
            "rooms": [{"room_name": name, "area_sqft": round(total * pct), "verified_status": "estimated" if not exact else "verified"} for name, pct in rooms if pct],
            "area_efficiency_score": 82,
            "layout_quality_score": 78,
            "privacy_score": 76,
            "work_from_home_suitability": 80,
            "senior_citizen_suitability": 72,
            "family_suitability": 84,
            "room_flow_explanation": "Room flow is estimated from listing facts and should be verified during the site visit.",
        }

    async def visit_feedback(self, property_id: str, role: str = "public") -> dict[str, Any]:
        return {
            "visit_count": 6,
            "buyer_interest_level": "Warm to hot",
            "common_positives": ["Usable area", "Locality connectivity", "Visit-ready positioning"],
            "common_concerns": ["Document pack completeness", "Peak-hour noise must be checked"],
            "most_asked_questions": ["Is the price negotiable?", "Are society documents available?", "Can we visit on weekend?"],
            "offer_interest": "2 buyers requested guidance",
            "feedback_by_segment": {"family": "Positive on layout", "investor": "Asked about yield and resale liquidity"},
            "privacy_note": "Private buyer details are hidden from this role.",
        }

    async def ask_ai(self, property_id: str, message: str, role: str = "public") -> dict[str, Any]:
        detail = await self.detail(property_id, role)
        graph = build_agent_graph()
        routed = await graph.ainvoke({"user_query": message, "channel": "broker" if role == "broker" else "web", "property_context": detail})
        route = routed.get("route") or self._route_for_message(message, role)
        prefix = f"For {detail['listing']['title']} in {detail['listing']['locality']}: "
        return {
            "route": route,
            "answer": prefix + routed.get("answer", self._fallback_answer(detail, message, role)),
            "agent": route.replace("_", " ").title(),
            "confidence_score": detail["ai_summary"]["confidence_score"],
            "data": {"property_id": property_id, "role": role},
        }

    def _route_for_message(self, message: str, role: str) -> str:
        text = message.lower()
        if "emi" in text or "afford" in text or "loan" in text:
            return "finance_agent"
        if "legal" in text or "rera" in text or "document" in text:
            return "legal_agent"
        if "tour" in text or "inspect" in text or "visit" in text:
            return "tour_guide_agent"
        if "tie" in text or "propertypool" in text or role == "broker":
            return "broker_tie_up_agent"
        if "offer" in text or "negot" in text:
            return "negotiation_agent"
        if "price" in text or "market" in text:
            return "market_intelligence_agent"
        return "property_page_agent"

    def _fallback_answer(self, detail: dict[str, Any], message: str, role: str) -> str:
        docs = detail["documents"]
        if docs["missing_documents"]:
            return f"This looks promising, but legal verification is incomplete. Missing: {', '.join(docs['missing_documents'][:3])}."
        return "The property is worth a visit, with final decision dependent on site inspection, documents, and price negotiation."

    def _amenities(self, listing: dict[str, Any]) -> dict[str, list[str]]:
        raw = {str(item).lower() for item in listing.get("amenities") or []}
        defaults = {"lift", "security", "parking"} if listing.get("parking_count") else {"lift", "security"}
        available = raw | defaults
        groups = {
            "Building": ["Lift", "Security", "CCTV", "Power backup", "Parking", "Visitor parking", "Fire safety", "Society office"],
            "Apartment": ["Modular kitchen", "Wardrobes", "Balcony", "Utility area", "Air conditioning", "Natural light", "Cross ventilation", "Refurbished interiors"],
            "Lifestyle": ["Gym", "Pool", "Garden", "Kids play area", "Clubhouse", "Walking track"],
            "Location": ["Metro nearby", "Railway nearby", "Schools nearby", "Hospitals nearby", "Retail nearby", "Business hubs nearby"],
        }
        return {group: [item for item in items if item.lower() in available or item in {"Lift", "Security", "Parking", "Natural light", "Metro nearby", "Retail nearby"}] for group, items in groups.items()}

    def _environment(self, listing: dict[str, Any]) -> dict[str, Any]:
        return {
            "window_direction": listing.get("window_direction") or "Needs manager confirmation",
            "morning_light_estimate": "Medium to good, site verification needed",
            "evening_light_estimate": "Needs site verification",
            "cross_ventilation_score": 72,
            "road_noise_risk": "Moderate",
            "railway_metro_noise_risk": "Low to moderate",
            "construction_noise_risk": "Requires locality verification",
            "floor_height_advantage": "Moderate" if not listing.get("floor_number") else "Depends on exact floor",
            "view_quality": "Media analysis pending" if not listing.get("media") else "Good from uploaded media",
            "privacy_from_neighbors": "Sunlight/noise analysis requires site verification.",
        }

    def _price_breakdown(self, listing: dict[str, Any]) -> dict[str, Any]:
        price = _float(listing.get("asking_price"))
        recommended = _float(listing.get("recommended_price") or price * 0.97)
        stamp = price * 0.06
        registration = min(price * 0.01, 30_000)
        return {
            "asking_price": round(price),
            "price_per_sqft": listing.get("price_per_sqft"),
            "recommended_price": round(recommended),
            "fair_value_estimate": round(recommended),
            "fast_sale_price": round(_float(listing.get("fast_sale_price") or price * 0.94)),
            "optimistic_price": round(_float(listing.get("optimistic_price") or price * 1.05)),
            "negotiation_buffer": round(price - recommended),
            "stamp_duty_estimate": round(stamp),
            "registration_estimate": round(registration),
            "maintenance_estimate": round(max(price * 0.00035, 8000)),
            "parking_cost": 0,
            "brokerage_or_commission": "Role dependent",
            "total_acquisition_estimate": round(price + stamp + registration),
            "locality_comparison": "Fair" if abs(price - recommended) / max(price, 1) < 0.06 else "Needs review",
            "price_confidence_score": 78,
        }

    def _map(self, listing: dict[str, Any]) -> dict[str, Any]:
        return {
            "latitude": listing.get("latitude"),
            "longitude": listing.get("longitude"),
            "locality": listing.get("locality"),
            "nearby": [
                {"type": "Metro", "name": f"{listing.get('locality')} metro context", "distance": "Mock fallback - configure POI API"},
                {"type": "School", "name": "Nearby schools", "distance": "Mock fallback - configure POI API"},
                {"type": "Hospital", "name": "Nearby hospitals", "distance": "Mock fallback - configure POI API"},
                {"type": "Retail", "name": "High-street retail", "distance": "Mock fallback - configure POI API"},
            ],
            "fallback_label": "External POI APIs are not configured; locality POIs are mock fallback.",
        }

    def _broker_propertypool(self, listing: dict[str, Any], role: str) -> dict[str, Any]:
        public = {
            "upcoming_group_visits": [{"title": f"{listing.get('locality')} guided group visit", "status": "interest collection"}],
            "join_propertypool_available": True,
            "request_broker_callback": True,
        }
        if role == "broker":
            public.update({
                "tieup_status": "open",
                "commission_estimate": round(_float(listing.get("asking_price")) * 0.02),
                "marketing_permissions": ["Request required before WhatsApp sharing"],
                "propertypool_eligibility": True,
                "approved_buyer_count": 0,
                "lead_attribution_status": "Create attribution before pitch",
            })
        if role in {"manager", "admin"}:
            public.update({
                "broker_requests": 2,
                "active_broker_partners": 1,
                "buyer_attendance": 4,
                "commission_exposure": round(_float(listing.get("asking_price")) * 0.02),
            })
        return public

    async def action_response(self, property_id: str, action: str, role: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        listing = await self._listing(property_id)
        return {
            "id": f"{action}-{uuid4().hex[:10]}",
            "listing_id": listing["id"],
            "status": "created",
            "role": role,
            "action": action,
            "message": f"{action.replace('_', ' ').title()} recorded for {listing['title']}.",
            "payload": payload or {},
            "created_at": _now(),
        }


property_intelligence_service = PropertyIntelligenceService()
