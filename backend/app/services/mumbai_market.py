from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.models import MaterialEstimate, MoneyRange

# Built directly from the user-provided estimate references. Values are deliberately stored
# as ranges because construction quotes change by contractor, brand, design, and locality.
CONSTRUCTION_TABLE: dict[int, dict[str, Any]] = {
    500: {"cost_lakh": (8.50, 11.00), "cement_bags": (160, 180), "steel_kg": (1600, 1800), "bricks_nos": (8000, 9000), "sand_cft": (300, 350), "aggregate_cft": (600, 650), "months": (2, 3)},
    600: {"cost_lakh": (10.20, 13.20), "cement_bags": (190, 210), "steel_kg": (1900, 2100), "bricks_nos": (9500, 10500), "sand_cft": (350, 420), "aggregate_cft": (700, 800), "months": (2.5, 3.5)},
    700: {"cost_lakh": (11.90, 15.40), "cement_bags": (220, 240), "steel_kg": (2200, 2500), "bricks_nos": (11000, 12000), "sand_cft": (400, 480), "aggregate_cft": (800, 950), "months": (3, 4)},
    800: {"cost_lakh": (13.60, 17.60), "cement_bags": (250, 280), "steel_kg": (2500, 2800), "bricks_nos": (12500, 13500), "sand_cft": (450, 550), "aggregate_cft": (900, 1050), "months": (3.5, 4.5)},
    900: {"cost_lakh": (15.30, 19.80), "cement_bags": (280, 310), "steel_kg": (2800, 3100), "bricks_nos": (14000, 15000), "sand_cft": (500, 600), "aggregate_cft": (1000, 1150), "months": (4, 5)},
    1000: {"cost_lakh": (17.00, 22.00), "cement_bags": (310, 340), "steel_kg": (3100, 3500), "bricks_nos": (15000, 16500), "sand_cft": (550, 650), "aggregate_cft": (1100, 1250), "months": (4.5, 5.5)},
    1200: {"cost_lakh": (20.40, 26.40), "cement_bags": (370, 410), "steel_kg": (3800, 4200), "bricks_nos": (18500, 19500), "sand_cft": (650, 750), "aggregate_cft": (1300, 1500), "months": (5, 6.5)},
    1500: {"cost_lakh": (25.50, 33.00), "cement_bags": (460, 510), "steel_kg": (4700, 5300), "bricks_nos": (22500, 24000), "sand_cft": (800, 950), "aggregate_cft": (1600, 1900), "months": (6, 8)},
    2000: {"cost_lakh": (34.00, 44.00), "cement_bags": (610, 680), "steel_kg": (6200, 7000), "bricks_nos": (30000, 32000), "sand_cft": (1050, 1250), "aggregate_cft": (2100, 2400), "months": (8, 11)},
    3000: {"cost_lakh": (51.00, 66.00), "cement_bags": (920, 1020), "steel_kg": (9300, 10500), "bricks_nos": (45000, 48000), "sand_cft": (1600, 1900), "aggregate_cft": (3200, 3800), "months": (12, 18)},
}

QUALITY_RATE_PER_SQFT = {
    "standard": (1700, 1900),
    "good": (1900, 2100),
    "premium": (2100, 2500),
    "high_quality": (1700, 2200),
}

MUMBAI_INVENTORY = [
    {"cost_range": "below 5 cr", "annual_sales_units": 47874, "unsold_units": 79271, "months_inventory": 20},
    {"cost_range": "5 - 10 cr", "annual_sales_units": 3286, "unsold_units": 5927, "months_inventory": 22},
    {"cost_range": "> 10 cr", "annual_sales_units": 1439, "unsold_units": 3589, "months_inventory": 30},
]

REDEVELOPMENT = {
    "development_agreements_signed_total": 1094,
    "period": "Jan 2020 - Mar 15 2026",
    "yoy_growth_2024_2025_pct": 16.8,
    "top_micro_markets": {
        "Borivali": 217,
        "Andheri": 115,
        "Bandra": 74,
        "Malad": 67,
        "Ghatkopar": 59,
    },
    "expected_housing_units": 59000,
    "land_unlocked_acres": 432,
}

HOME_LOAN_REFERENCE = {
    "repo_rate_reference_pct": 5.25,
    "typical_rate_range_pct": (7.10, 11.68),
    "emi_per_lakh_examples": {
        "5y_7_25pct": 1980,
        "10y_7_25pct": 1161,
        "15y_7_25pct": 899,
        "20y_7_25pct": 775,
        "25y_7_25pct": 707,
        "20y_8pct": 836,
        "20y_9pct": 900,
        "20y_10pct": 965,
    },
}


def emi_per_lakh(annual_rate_pct: float = 8.0, tenure_years: int = 20) -> float:
    monthly_rate = annual_rate_pct / 12 / 100
    months = tenure_years * 12
    principal = 100_000
    if monthly_rate == 0:
        return principal / months
    emi = principal * monthly_rate * (1 + monthly_rate) ** months / ((1 + monthly_rate) ** months - 1)
    return round(emi, 2)


def monthly_emi(loan_amount: float, annual_rate_pct: float = 8.0, tenure_years: int = 20) -> float:
    return round((loan_amount / 100_000) * emi_per_lakh(annual_rate_pct, tenure_years), 2)


def estimate_construction_cost(area_sqft: int, quality: str = "good") -> MoneyRange:
    low, high = QUALITY_RATE_PER_SQFT.get(quality, QUALITY_RATE_PER_SQFT["good"])
    return MoneyRange(min=area_sqft * low, max=area_sqft * high)


def estimate_materials(area_sqft: int) -> MaterialEstimate:
    nearest = min(CONSTRUCTION_TABLE.keys(), key=lambda x: abs(x - area_sqft))
    base = CONSTRUCTION_TABLE[nearest]
    ratio = area_sqft / nearest

    def scale(pair: tuple[int | float, int | float]) -> tuple[int, int]:
        return (round(pair[0] * ratio), round(pair[1] * ratio))

    def scale_months(pair: tuple[int | float, int | float]) -> tuple[float, float]:
        # Months do not scale perfectly linearly; use a softened exponent for realistic schedules.
        softened = ratio ** 0.65
        return (round(pair[0] * softened, 1), round(pair[1] * softened, 1))

    return MaterialEstimate(
        cement_bags=scale(base["cement_bags"]),
        steel_kg=scale(base["steel_kg"]),
        bricks_nos=scale(base["bricks_nos"]),
        sand_cft=scale(base["sand_cft"]),
        aggregate_cft=scale(base["aggregate_cft"]),
        construction_months=scale_months(base["months"]),
    )


def price_bucket(price: float) -> str:
    if price < 50_000_000:
        return "below 5 cr"
    if price <= 100_000_000:
        return "5 - 10 cr"
    return "> 10 cr"


def inventory_for_price(price: float) -> dict[str, Any]:
    bucket = price_bucket(price)
    return next(row for row in MUMBAI_INVENTORY if row["cost_range"] == bucket)


def redevelopment_score(locality: str) -> tuple[float, int]:
    counts = REDEVELOPMENT["top_micro_markets"]
    matched = next((count for name, count in counts.items() if name.lower() in locality.lower()), 0)
    if not matched:
        # Neighborhoods outside top five still get a small baseline score.
        return 35.0, 0
    max_count = max(counts.values())
    return round(55 + 45 * matched / max_count, 1), matched


def enrich_property_market_fields(item: dict[str, Any]) -> dict[str, Any]:
    enriched = dict(item)
    area = int(enriched.get("built_up_area_sqft") or enriched.get("area_sqft") or 1000)
    price = float(enriched.get("price", 0))
    construction = estimate_construction_cost(area, "good")
    inventory = inventory_for_price(price)
    score, das = redevelopment_score(enriched.get("locality", ""))
    loan_amount = price * 0.80 if price else 0
    enriched.setdefault("price_per_sqft", round(price / max(area, 1), 0))
    enriched.setdefault("built_up_area_sqft", area)
    enriched.setdefault("carpet_area_sqft", round(area * 0.72))
    enriched["construction_cost_low"] = construction.min
    enriched["construction_cost_high"] = construction.max
    enriched["material_estimate"] = estimate_materials(area).model_dump()
    enriched["inventory_months"] = inventory["months_inventory"]
    enriched["cost_bucket"] = inventory["cost_range"]
    enriched["redevelopment_score"] = score
    enriched["redevelopment_das_signed"] = das
    enriched["emi_20y_per_lakh"] = emi_per_lakh(8.0, 20)
    enriched["monthly_emi_estimate"] = monthly_emi(loan_amount, 8.0, 20) if loan_amount else None
    return enriched


def market_insights() -> dict[str, Any]:
    return {
        "city": "Mumbai",
        "inventory_by_price_bucket": MUMBAI_INVENTORY,
        "redevelopment": REDEVELOPMENT,
        "construction_cost_guide": {
            "rate_per_sqft": QUALITY_RATE_PER_SQFT,
            "included": [
                "foundation to roof construction",
                "brickwork, plaster, flooring",
                "plumbing, electrical, wiring",
                "doors, windows, painting",
                "waterproofing, staircase, parapet",
            ],
            "excluded": ["premium interiors", "lifts", "modular kitchen", "extra AC points"],
        },
        "home_loan_reference": HOME_LOAN_REFERENCE,
        "recommendations": [
            "Below-5-cr homes have deeper liquidity than premium buckets, so rank them higher for resale confidence.",
            "Borivali, Andheri, Bandra, Malad, and Ghatkopar should get a redevelopment-intelligence overlay in search results.",
            "For plots or independent construction, show material and timeline ranges before buyer shortlisting.",
            "For >10-cr inventory, negotiation agents should be more aggressive because months inventory is materially higher.",
        ],
    }
