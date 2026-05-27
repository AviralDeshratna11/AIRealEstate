from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models import FinanceEstimateRequest, FinanceEstimateResponse
from app.services.mumbai_market import emi_per_lakh, estimate_construction_cost, estimate_materials, monthly_emi
from app.services.property_repository import PropertyRepository

router = APIRouter(prefix="/api/finance", tags=["finance"])
repo = PropertyRepository()


@router.post("/estimate", response_model=FinanceEstimateResponse)
async def estimate_finance(request: FinanceEstimateRequest):
    prop = await repo.get_property(request.property_id) if request.property_id else None
    price = request.price or (prop.price if prop else None)
    area = request.built_up_area_sqft or (prop.built_up_area_sqft if prop else None)
    if not price and not area:
        raise HTTPException(status_code=400, detail="Send property_id, price, or built_up_area_sqft.")
    loan_amount = price * (1 - request.down_payment_pct / 100) if price else None
    construction = estimate_construction_cost(area, request.construction_quality) if area else None
    return FinanceEstimateResponse(
        property_price=price,
        loan_amount=loan_amount,
        monthly_emi=monthly_emi(loan_amount, request.annual_rate_pct, request.tenure_years) if loan_amount else None,
        emi_per_lakh=emi_per_lakh(request.annual_rate_pct, request.tenure_years),
        annual_rate_pct=request.annual_rate_pct,
        tenure_years=request.tenure_years,
        construction_cost_range=construction,
        material_estimate=estimate_materials(area) if area else None,
        notes=[
            "Construction estimates are high-quality directional ranges and exclude premium interiors, lifts, modular kitchen, and extra AC points.",
            "Loan EMI is a mathematical estimate; banks may change rates, fees, and eligibility checks.",
        ],
    )
