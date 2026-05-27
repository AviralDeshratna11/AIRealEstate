from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class MoneyRange(BaseModel):
    min: float | None = None
    max: float | None = None


class MaterialEstimate(BaseModel):
    cement_bags: tuple[int, int] | None = None
    steel_kg: tuple[int, int] | None = None
    bricks_nos: tuple[int, int] | None = None
    sand_cft: tuple[int, int] | None = None
    aggregate_cft: tuple[int, int] | None = None
    construction_months: tuple[float, float] | None = None


class Property(BaseModel):
    id: UUID | str
    title: str
    address: str
    city: str = "Mumbai"
    locality: str
    micro_market: str | None = None
    property_type: str = "apartment"
    transaction_type: Literal["buy", "rent", "redevelopment", "plot"] = "buy"
    price: float
    price_per_sqft: float | None = None
    bedrooms: int
    bathrooms: int
    area_sqft: int
    carpet_area_sqft: int | None = None
    built_up_area_sqft: int | None = None
    latitude: float
    longitude: float
    status: Literal["available", "reserved", "sold"] = "available"
    availability: str = "Viewing slots available this week"
    possession: str | None = None
    builder: str | None = None
    description: str
    amenities: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    image_url: str | None = None
    splat_url: str | None = None
    rera_id: str | None = None
    score: float | None = None

    # Mumbai intelligence fields derived from the user's attached references.
    inventory_months: int | None = None
    cost_bucket: str | None = None
    redevelopment_score: float | None = Field(default=None, ge=0, le=100)
    redevelopment_das_signed: int | None = None
    construction_cost_low: float | None = None
    construction_cost_high: float | None = None
    material_estimate: MaterialEstimate | None = None
    emi_20y_per_lakh: float | None = None
    monthly_emi_estimate: float | None = None
    expected_rent_yield: float | None = None
    walkability_score: float | None = Field(default=None, ge=0, le=100)
    commute_score: float | None = Field(default=None, ge=0, le=100)
    risk_flags: list[str] = Field(default_factory=list)


class AgentRunRequest(BaseModel):
    message: str
    session_id: str | None = None
    channel: Literal["web", "whatsapp", "call", "tour", "broker"] = "web"
    user_profile: dict[str, Any] = Field(default_factory=dict)


class AgentRunResponse(BaseModel):
    route: str
    answer: str
    data: dict[str, Any] = Field(default_factory=dict)


class AssistantRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    context: Literal["home", "workspace", "search", "market", "map", "finance", "tour", "documents", "agents"] = "workspace"
    history: list[dict[str, str]] = Field(default_factory=list)


class AssistantResponse(BaseModel):
    answer: str
    provider: str
    model: str | None = None
    configured: bool = False


class SearchRequest(BaseModel):
    query: str
    limit: int = Field(default=8, ge=1, le=30)


class SearchResponse(BaseModel):
    query: str
    route: str = "mumbai_semantic_sorting"
    sql_preview: str
    properties: list[Property]
    explanation: str


class FinanceEstimateRequest(BaseModel):
    property_id: str | None = None
    price: float | None = Field(default=None, gt=0)
    built_up_area_sqft: int | None = Field(default=None, ge=300)
    down_payment_pct: float = Field(default=20, ge=0, le=95)
    annual_rate_pct: float = Field(default=8.0, ge=1, le=25)
    tenure_years: int = Field(default=20, ge=1, le=30)
    construction_quality: Literal["standard", "good", "premium", "high_quality"] = "good"


class FinanceEstimateResponse(BaseModel):
    property_price: float | None
    loan_amount: float | None
    monthly_emi: float | None
    emi_per_lakh: float
    annual_rate_pct: float
    tenure_years: int
    construction_cost_range: MoneyRange | None = None
    material_estimate: MaterialEstimate | None = None
    notes: list[str] = Field(default_factory=list)


class MarketInsightResponse(BaseModel):
    city: str = "Mumbai"
    inventory_by_price_bucket: list[dict[str, Any]]
    redevelopment: dict[str, Any]
    construction_cost_guide: dict[str, Any]
    home_loan_reference: dict[str, Any]
    recommendations: list[str]


class TourGuideRequest(BaseModel):
    property_id: str | None = None
    query: str = "Give me a guided tour"
    mode: Literal["map", "3d", "phone", "whatsapp"] = "map"


class TourGuideResponse(BaseModel):
    property_id: str | None
    route_name: str
    narration: str
    waypoints: list[dict[str, Any]]
    next_action: str


class LeadChannel(str, Enum):
    web = "web"
    whatsapp = "whatsapp"
    call = "call"
    broker = "broker"


class LeadQualificationRequest(BaseModel):
    channel: LeadChannel = LeadChannel.web
    name: str | None = None
    phone: str | None = None
    message: str
    budget: float | None = None
    preferred_locality: str | None = None


class LeadQualificationResponse(BaseModel):
    lead_score: int = Field(ge=0, le=100)
    intent: str
    recommended_agent: str
    suggested_reply: str
    extracted_requirements: dict[str, Any] = Field(default_factory=dict)


class NegotiationRole(str, Enum):
    buyer = "buyer"
    seller = "seller"


class NegotiationRequest(BaseModel):
    role: NegotiationRole
    target_price: float = Field(gt=0)
    walk_away_price: float = Field(gt=0, description="Hidden reservation price; never returned.")
    opponent_offer: float = Field(gt=0)
    urgency: float = Field(default=0.35, ge=0, le=1)
    concession_value: float = Field(default=0, ge=0)
    opponent_concession_trend: float = Field(default=0.0, description="Positive means opponent is softening.")


class NegotiationResponse(BaseModel):
    counter_offer: float
    confidence: Literal["low", "medium", "high"]
    rationale: str
    suggested_terms: list[str]
    risk_flags: list[str] = Field(default_factory=list)


class Party(BaseModel):
    name: str | None = None
    role: str | None = None
    email: str | None = None
    phone: str | None = None


class ExtractedDate(BaseModel):
    label: str
    date: str
    confidence: float = Field(ge=0, le=1)


class Contingency(BaseModel):
    type: str
    summary: str
    deadline: str | None = None
    confidence: float = Field(ge=0, le=1)


class DocumentExtraction(BaseModel):
    document_type: str
    property_address: str | None = None
    parties: list[Party] = Field(default_factory=list)
    dates: list[ExtractedDate] = Field(default_factory=list)
    contingencies: list[Contingency] = Field(default_factory=list)
    purchase_price: float | None = None
    earnest_money: float | None = None
    risk_summary: str
    calendar_events: list[dict[str, Any]] = Field(default_factory=list)

    @field_validator("document_type")
    @classmethod
    def normalize_doc_type(cls, value: str) -> str:
        return value.strip().lower().replace(" ", "_")


class VapiMessage(BaseModel):
    message: dict[str, Any] = Field(default_factory=dict)
