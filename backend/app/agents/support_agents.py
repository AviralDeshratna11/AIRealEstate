from __future__ import annotations

import re
from typing import Any

from app.models import LeadQualificationRequest, LeadQualificationResponse, TourGuideRequest, TourGuideResponse
from app.services.mumbai_market import market_insights, monthly_emi
from app.services.property_repository import PropertyRepository


class WhatsAppAssistantAgent:
    """Lightweight WhatsApp concierge for first response, qualification, and handoff."""

    async def qualify(self, request: LeadQualificationRequest) -> LeadQualificationResponse:
        q = request.message.lower()
        budget_match = re.search(r"(\d+(?:\.\d+)?)\s*(cr|crore|lakh|l)", q)
        budget = request.budget
        if budget is None and budget_match:
            mult = 10_000_000 if budget_match.group(2) in {"cr", "crore"} else 100_000
            budget = float(budget_match.group(1)) * mult
        locality = request.preferred_locality or next(
            (loc for loc in ["Powai", "Bandra", "Borivali", "Andheri", "Worli", "Ghatkopar", "Malad", "Chembur"] if loc.lower() in q),
            None,
        )
        high_intent = any(t in q for t in ["visit", "book", "site", "call", "tomorrow", "today", "loan", "emi"])
        score = 55 + (25 if budget else 0) + (10 if locality else 0) + (10 if high_intent else 0)
        score = min(score, 100)
        agent = "voice_receptionist" if "call" in q or "phone" in q else "mumbai_search_agent"
        return LeadQualificationResponse(
            lead_score=score,
            intent="site_visit" if high_intent else "property_discovery",
            recommended_agent=agent,
            suggested_reply=(
                f"Thanks! I can shortlist Mumbai homes around {locality or 'your preferred area'} "
                f"{f'within ₹{budget/10_000_000:.1f} Cr ' if budget else ''}and share map pins, EMI, and viewing slots."
            ),
            extracted_requirements={"budget": budget, "locality": locality, "channel": request.channel.value},
        )


class MarketIntelligenceAgent:
    async def summarize(self, query: str) -> dict[str, Any]:
        data = market_insights()
        return {
            "answer": (
                "Mumbai launch mode is active. Search ranking now considers locality, price bucket liquidity, "
                "redevelopment activity, EMI affordability, construction/material estimates, and viewing automation."
            ),
            "insights": data,
        }


class FinanceAgent:
    async def estimate_for_property(self, property_id: str | None, price: float | None, rate: float, tenure: int, down_payment_pct: float) -> dict[str, Any]:
        repo = PropertyRepository()
        prop = await repo.get_property(property_id) if property_id else None
        final_price = price or (prop.price if prop else None)
        if not final_price:
            return {"answer": "Share a property or price and I can compute EMI and affordability."}
        loan = final_price * (1 - down_payment_pct / 100)
        emi = monthly_emi(loan, rate, tenure)
        return {
            "answer": f"For a ₹{final_price/10_000_000:.2f} Cr property with {down_payment_pct:.0f}% down payment, estimated EMI is about ₹{emi:,.0f}/month at {rate:.2f}% for {tenure} years.",
            "loan_amount": loan,
            "monthly_emi": emi,
            "property": prop.model_dump(mode="json") if prop else None,
        }


class TourGuideAgent:
    async def guide(self, request: TourGuideRequest) -> TourGuideResponse:
        repo = PropertyRepository()
        prop = await repo.get_property(request.property_id) if request.property_id else None
        title = prop.title if prop else "selected Mumbai property"
        base_lat = prop.latitude if prop else 19.1176
        base_lng = prop.longitude if prop else 72.9060
        return TourGuideResponse(
            property_id=str(prop.id) if prop else request.property_id,
            route_name="AI guided buyer tour",
            narration=(
                f"Starting the guided tour for {title}. First we show the building entry and approach road, "
                "then the living room light path, bedroom privacy, kitchen utility flow, parking, and finally nearby transit/retail context."
            ),
            waypoints=[
                {"label": "Building approach", "lat": base_lat, "lng": base_lng, "focus": "road access, entry security, drop-off"},
                {"label": "Living room", "lat": base_lat + 0.0005, "lng": base_lng + 0.0003, "focus": "natural light and ventilation"},
                {"label": "Bedroom wing", "lat": base_lat + 0.0003, "lng": base_lng - 0.0004, "focus": "privacy, noise, nursery/work setup"},
                {"label": "Amenities/parking", "lat": base_lat - 0.0004, "lng": base_lng + 0.0002, "focus": "parking, lift, society amenities"},
                {"label": "Locality context", "lat": base_lat - 0.0008, "lng": base_lng - 0.0005, "focus": "metro/rail, schools, retail, commute"},
            ],
            next_action="Offer to book a physical visit or hand off to WhatsApp/call agent for follow-up.",
        )
