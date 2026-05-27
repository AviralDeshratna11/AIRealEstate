from __future__ import annotations

import re
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

from app.config import get_settings
from app.services.openai_client import get_openai_client


ALLOWED_COLUMNS = {
    "city": "text",
    "locality": "text",
    "micro_market": "text",
    "property_type": "text",
    "transaction_type": "text",
    "price": "numeric",
    "price_per_sqft": "numeric",
    "bedrooms": "int",
    "bathrooms": "int",
    "area_sqft": "int",
    "built_up_area_sqft": "int",
    "status": "text",
    "possession": "text",
    "description": "text",
    "amenities": "array_text",
    "tags": "array_text",
    "inventory_months": "int",
    "redevelopment_score": "numeric",
    "expected_rent_yield": "numeric",
    "walkability_score": "numeric",
    "commute_score": "numeric",
}


class Operator(str, Enum):
    eq = "="
    lte = "<="
    gte = ">="
    lt = "<"
    gt = ">"
    ilike = "ILIKE"
    contains_any = "CONTAINS_ANY"


class FilterCondition(BaseModel):
    column: str
    operator: Operator
    value: str | int | float | list[str]

    @field_validator("column")
    @classmethod
    def validate_column(cls, value: str) -> str:
        if value not in ALLOWED_COLUMNS:
            raise ValueError(f"Column {value} is not allowed")
        return value


class SortClause(BaseModel):
    column: Literal[
        "price",
        "price_per_sqft",
        "area_sqft",
        "built_up_area_sqft",
        "bedrooms",
        "created_at",
        "inventory_months",
        "redevelopment_score",
        "expected_rent_yield",
        "walkability_score",
        "commute_score",
        "semantic_score",
    ] = "semantic_score"
    direction: Literal["asc", "desc"] = "desc"


class PropertyQueryPlan(BaseModel):
    semantic_query: str = Field(description="The user preference text to embed for semantic retrieval.")
    filters: list[FilterCondition] = Field(default_factory=list)
    sort: list[SortClause] = Field(default_factory=lambda: [SortClause()])
    limit: int = Field(default=8, ge=1, le=30)
    explanation: str


SYSTEM_PROMPT = """
You are ASTRA's Mumbai Semantic NL2SQL Sorting Agent.
Convert buyer/broker natural language into a safe PropertyQueryPlan.
Use ONLY the allowed schema fields. Never output raw SQL or invent columns.
Business logic:
- Current launch market is Mumbai. Add city = Mumbai unless another city is explicitly mentioned.
- Always include status = available unless the user explicitly asks reserved/sold.
- Budget is INR: 1 crore = 10000000, 1 lakh = 100000.
- For redevelopment-led demand, use redevelopment_score sorting/filtering and terms like Borivali, Andheri, Bandra, Malad, Ghatkopar.
- For liquidity/resale, prefer lower inventory_months and below-5-cr bucket reasoning.
- For affordability, use price and price_per_sqft; finance/EMI is handled by Finance Agent.
- For soft concepts like quiet, morning light, family, metro, sea view, nursery, construction quality, use semantic_query plus optional tags/amenities.
Allowed columns: city, locality, micro_market, property_type, transaction_type, price, price_per_sqft, bedrooms, bathrooms, area_sqft, built_up_area_sqft, status, possession, description, amenities, tags, inventory_months, redevelopment_score, expected_rent_yield, walkability_score, commute_score.
"""


async def create_property_query_plan(query: str, limit: int = 8) -> PropertyQueryPlan:
    client = get_openai_client()
    settings = get_settings()
    if client:
        completion = await client.beta.chat.completions.parse(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": query},
            ],
            response_format=PropertyQueryPlan,
        )
        parsed = completion.choices[0].message.parsed
        if parsed:
            parsed.limit = min(parsed.limit or limit, limit)
            return parsed
    return fallback_query_plan(query, limit)


def fallback_query_plan(query: str, limit: int = 8) -> PropertyQueryPlan:
    """Deterministic parser used when OPENAI_API_KEY is not configured."""
    q = query.lower()
    filters: list[FilterCondition] = [
        FilterCondition(column="status", operator=Operator.eq, value="available"),
        FilterCondition(column="city", operator=Operator.ilike, value="%Mumbai%"),
    ]
    sort: list[SortClause] = [SortClause(column="semantic_score", direction="desc")]

    locality_aliases = {
        "powai": "Powai",
        "bandra": "Bandra",
        "borivali": "Borivali",
        "andheri": "Andheri",
        "worli": "Worli",
        "ghatkopar": "Ghatkopar",
        "malad": "Malad",
        "chembur": "Chembur",
    }
    for token, label in locality_aliases.items():
        if token in q:
            filters.append(FilterCondition(column="locality", operator=Operator.ilike, value=f"%{label}%"))
            break

    bhk = re.search(r"(\d+)\s*(bhk|bed|bedroom)", q)
    if bhk:
        filters.append(FilterCondition(column="bedrooms", operator=Operator.gte, value=int(bhk.group(1))))

    budget = parse_indian_money(q)
    if budget:
        filters.append(FilterCondition(column="price", operator=Operator.lte, value=budget))

    if any(t in q for t in ["redevelopment", "society redevelopment", "da signed", "development agreement"]):
        filters.append(FilterCondition(column="redevelopment_score", operator=Operator.gte, value=55))
        sort = [SortClause(column="redevelopment_score", direction="desc")]

    if any(t in q for t in ["resale", "liquidity", "liquid", "low inventory"]):
        filters.append(FilterCondition(column="inventory_months", operator=Operator.lte, value=22))
        sort = [SortClause(column="inventory_months", direction="asc")]

    if any(t in q for t in ["rental", "yield", "invest", "investment"]):
        sort = [SortClause(column="expected_rent_yield", direction="desc")]

    fuzzy_terms = []
    for term in [
        "quiet", "morning light", "metro", "sea view", "lake", "family", "school",
        "walkable", "green", "ev", "work", "airport", "bkc", "commute", "premium",
        "value", "construction", "material", "emi", "loan", "redevelopment",
    ]:
        if term in q:
            fuzzy_terms.append(term)

    return PropertyQueryPlan(
        semantic_query=query if not fuzzy_terms else f"{query} {' '.join(fuzzy_terms)}",
        filters=filters,
        sort=sort,
        limit=limit,
        explanation=(
            "Parsed with deterministic Mumbai fallback. Structured Outputs will replace this "
            "when OPENAI_API_KEY is configured."
        ),
    )


def parse_indian_money(q: str) -> int | None:
    patterns = [
        (r"(?:under|below|less than|upto|up to|within|budget)\s*(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?)\s*cr", 10_000_000),
        (r"(?:under|below|less than|upto|up to|within|budget)\s*(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?)\s*crore", 10_000_000),
        (r"(?:under|below|less than|upto|up to|within|budget)\s*(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?)\s*lakh", 100_000),
        (r"(?:under|below|less than|upto|up to|within|budget)\s*(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?)\s*l", 100_000),
        (r"(?:₹|rs\.?|inr)\s*([0-9]+(?:\.[0-9]+)?)\s*cr", 10_000_000),
    ]
    for pattern, multiplier in patterns:
        match = re.search(pattern, q)
        if match:
            return int(float(match.group(1)) * multiplier)
    return None


def property_select_columns(include_score: bool = False) -> str:
    base = """
        id, title, address, city, locality, micro_market, property_type, transaction_type,
        price, price_per_sqft, bedrooms, bathrooms, area_sqft, carpet_area_sqft,
        built_up_area_sqft, latitude, longitude, status, availability, possession, builder,
        description, amenities, tags, image_url, splat_url, rera_id, inventory_months,
        cost_bucket, redevelopment_score, redevelopment_das_signed, construction_cost_low,
        construction_cost_high, material_estimate, emi_20y_per_lakh, monthly_emi_estimate,
        expected_rent_yield, walkability_score, commute_score, risk_flags
    """
    if include_score:
        return base + ", 1 - (embedding <=> $1::vector) as score"
    return base


def compile_property_sql(plan: PropertyQueryPlan) -> tuple[str, list[Any], str]:
    """Compile a validated plan into parameterized Postgres SQL."""
    where = []
    params: list[Any] = []

    for cond in plan.filters:
        col_type = ALLOWED_COLUMNS[cond.column]
        if cond.operator == Operator.contains_any:
            if col_type != "array_text":
                continue
            params.append(cond.value if isinstance(cond.value, list) else [str(cond.value)])
            where.append(f"{cond.column} && ${len(params)}::text[]")
        elif cond.operator == Operator.ilike:
            if col_type != "text":
                continue
            params.append(str(cond.value))
            where.append(f"{cond.column} ILIKE ${len(params)}")
        else:
            params.append(cond.value)
            where.append(f"{cond.column} {cond.operator.value} ${len(params)}")

    base = f"select {property_select_columns()} from properties"
    if where:
        base += " where " + " and ".join(where)

    order_sql = []
    for sort in plan.sort:
        if sort.column == "semantic_score":
            continue
        order_sql.append(f"{sort.column} {sort.direction}")
    if order_sql:
        base += " order by " + ", ".join(order_sql)
    else:
        base += " order by updated_at desc"

    params.append(plan.limit)
    base += f" limit ${len(params)}"
    sql_preview = re.sub(r"\s+", " ", base).strip()
    return base, params, sql_preview
