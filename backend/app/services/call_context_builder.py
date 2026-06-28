from __future__ import annotations

from typing import Any

from app.services.scheduler import scheduler_service
from app.services.mumbai_market import monthly_emi
from app.services.property_repository import PropertyRepository


def _format_inr(value: float | int | None) -> str:
    if not value:
        return "not verified"
    return f"INR {float(value) / 10_000_000:.2f} Cr"


class CallContextBuilder:
    def __init__(self) -> None:
        self.property_repository = PropertyRepository()

    async def build(
        self,
        *,
        buyer_id: str | None,
        lead_id: str | None,
        buyer_name: str | None,
        buyer_phone: str | None,
        property_id: str,
        preferred_language: str = "Hinglish",
        source: str = "web",
        broker_id: str | None = None,
    ) -> dict[str, Any]:
        prop = await self.property_repository.get_property(property_id)
        if prop is None:
            props = await self.property_repository.list_properties()
            prop = props[0] if props else None
        property_context = self._property_context(prop, property_id)
        finance_context = await self._finance_context(prop)
        slots = await scheduler_service.get_slots(days=5)
        buyer_context = {
            "buyer_id": buyer_id,
            "lead_id": lead_id,
            "name": buyer_name or "Buyer",
            "phone": buyer_phone,
            "email": None,
            "budget": None,
            "preferred_localities": [property_context["locality"]] if property_context.get("locality") else [],
            "property_preferences": property_context.get("bhk"),
            "lead_score": 82 if source in {"Talk to Expert", "Schedule Visit", "XR tour", "PropertyPool", "CRM"} else 68,
            "crm_stage": "Qualified",
            "previous_interactions": [source],
            "call_consent": "confirmed" if buyer_phone else "missing_phone",
            "preferred_language": preferred_language,
            "source": source,
        }
        return {
            "buyer_context": buyer_context,
            "property_context": property_context,
            "finance_context": finance_context,
            "scheduling_context": {
                "calcom_event_type": "property-viewing",
                "available_slots": slots[:3],
                "manager_availability": "Use Cal.com or demo slots",
                "propertypool_availability": "Available when broker tie-up permits",
            },
            "safety_context": {
                "unverified_claims": property_context.get("missing_details", []),
                "missing_documents": property_context.get("missing_details", []),
                "legal_warnings": ["Do not claim legal clearance unless verified.", "Recommend professional legal review before payment."],
                "call_restrictions": ["10 AM to 7 PM IST", "One automated call per buyer/property per 24 hours", "Maximum three automated calls per buyer in seven days"],
                "opt_out_status": False,
                "hidden_fields": ["seller walk-away price", "broker commission"],
            },
            "broker_attribution": {"broker_id": broker_id, "protected": bool(broker_id), "commission_hidden_from_call": True},
        }

    def _property_context(self, prop: Any, property_id: str) -> dict[str, Any]:
        if prop is None:
            return {
                "property_id": property_id,
                "title": "Selected Mumbai property",
                "locality": "Mumbai",
                "price": None,
                "price_label": "not verified",
                "bhk": "not verified",
                "carpet_area": None,
                "rera_status": "not verified",
                "legal_risk_score": 50,
                "market_heat_score": 50,
                "visit_availability": "This week",
                "amenities": [],
                "short_description": "Property details need manager confirmation.",
                "missing_details": ["property record"],
            }
        price = getattr(prop, "price", None)
        missing = []
        if not getattr(prop, "rera_id", None):
            missing.append("RERA number")
        if not getattr(prop, "amenities", None):
            missing.append("amenities")
        return {
            "property_id": str(getattr(prop, "id", property_id)),
            "title": getattr(prop, "title", "Selected Mumbai property"),
            "building_name": getattr(prop, "builder", None),
            "locality": getattr(prop, "locality", "Mumbai"),
            "price": price,
            "price_label": _format_inr(price),
            "price_per_sqft": getattr(prop, "price_per_sqft", None),
            "bhk": f"{getattr(prop, 'bedrooms', '-') } BHK",
            "carpet_area": getattr(prop, "carpet_area_sqft", None) or getattr(prop, "area_sqft", None),
            "floor": None,
            "possession_status": getattr(prop, "possession", None),
            "rera_status": getattr(prop, "rera_id", None) or "not verified",
            "legal_risk_score": 35 if getattr(prop, "rera_id", None) else 65,
            "market_heat_score": getattr(prop, "score", None) or 78,
            "visit_availability": getattr(prop, "availability", "This week"),
            "amenities": getattr(prop, "amenities", [])[:8],
            "short_description": getattr(prop, "description", ""),
            "manager_contact_availability": "available after qualification",
            "missing_details": missing,
        }

    async def _finance_context(self, prop: Any) -> dict[str, Any]:
        if prop is None:
            return {"estimated_emi": None, "loan_amount_assumption": None, "affordability_note": "Property price is not verified."}
        try:
            price = float(getattr(prop, "price", 0) or 0)
            loan = price * 0.8
            return {
                "estimated_emi": monthly_emi(loan, 8.5, 20),
                "down_payment_assumption": round(price * 0.2, 0),
                "loan_amount_assumption": loan,
                "affordability_score": 72,
                "emi_note": "Indicative EMI only. Final loan terms depend on lender approval.",
            }
        except Exception:
            return {"estimated_emi": None, "loan_amount_assumption": None, "affordability_note": "Finance estimate unavailable."}


call_context_builder = CallContextBuilder()
