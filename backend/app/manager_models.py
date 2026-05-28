from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


ListingStatus = Literal[
    "draft",
    "data_extraction",
    "needs_review",
    "ready_to_publish",
    "published",
    "leads_active",
    "offer_stage",
    "negotiation",
    "closed",
    "archived",
]


class ManagerProfile(BaseModel):
    id: str
    user_id: str | None = None
    full_name: str
    company_name: str
    phone: str | None = None
    email: str | None = None
    role: str = "manager"
    rera_agent_id: str | None = None
    operating_localities: list[str] = Field(default_factory=list)
    created_at: str | None = None
    updated_at: str | None = None


class ManagerSummaryCard(BaseModel):
    label: str
    value: str
    detail: str | None = None
    tone: str = "neutral"


class ManagerListingSummary(BaseModel):
    id: str
    manager_id: str
    title: str
    slug: str
    status: ListingStatus
    property_type: str
    transaction_type: str
    locality: str
    address: str
    latitude: float
    longitude: float
    carpet_area_sqft: int | None = None
    builtup_area_sqft: int | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    parking_count: int | None = None
    furnishing_status: str | None = None
    possession_status: str | None = None
    availability_date: str | None = None
    rera_number: str | None = None
    asking_price: float | None = None
    recommended_price: float | None = None
    fast_sale_price: float | None = None
    optimistic_price: float | None = None
    min_acceptable_price: float | None = None
    price_per_sqft: float | None = None
    market_heat_score: float = 0
    legal_risk_score: float = 0
    readiness_score: float = 0
    lead_quality_score: float = 0
    redevelopment_score: float = 0
    description_short: str | None = None
    description_long: str | None = None
    seo_title: str | None = None
    public_visibility: bool = False
    hero_image_url: str | None = None
    lead_count: int = 0
    pending_tasks: int = 0
    next_visit: str | None = None
    updated_at: str | None = None


class ManagerMapPin(BaseModel):
    id: str
    title: str
    locality: str
    status: ListingStatus
    color: str
    latitude: float
    longitude: float
    price: float | None = None
    market_heat_score: float = 0
    legal_risk_score: float = 0
    lead_count: int = 0
    readiness_score: float = 0


class ManagerPipelineColumn(BaseModel):
    id: str
    label: str
    listing_ids: list[str] = Field(default_factory=list)
    count: int = 0


class ManagerFeedEvent(BaseModel):
    id: str
    created_at: str
    actor_type: str
    actor_name: str
    action: str
    details: str
    tone: str = "neutral"


class ManagerTaskItem(BaseModel):
    id: str
    title: str
    description: str
    priority: str = "medium"
    status: str = "open"
    action_label: str = "Review"
    listing_id: str | None = None


class ManagerDashboard(BaseModel):
    manager: ManagerProfile
    summary_cards: list[ManagerSummaryCard]
    map_pins: list[ManagerMapPin]
    pipeline_columns: list[ManagerPipelineColumn]
    activity_feed: list[ManagerFeedEvent]
    urgent_tasks: list[ManagerTaskItem]
    listings: list[ManagerListingSummary]
    market_highlights: dict[str, Any]


class ListingDocument(BaseModel):
    id: str
    listing_id: str
    document_type: str
    file_url: str | None = None
    file_name: str | None = None
    extraction_status: str = "pending"
    extracted_json: dict[str, Any] = Field(default_factory=dict)
    confidence_score: float = 0
    red_flags: list[str] = Field(default_factory=list)
    missing_items: list[str] = Field(default_factory=list)
    created_at: str
    updated_at: str | None = None


class ListingMedia(BaseModel):
    id: str
    listing_id: str
    media_type: str
    room_type: str | None = None
    file_url: str | None = None
    thumbnail_url: str | None = None
    caption: str | None = None
    alt_text: str | None = None
    is_hero: bool = False
    quality_score: float = 0
    created_at: str


class ListingLead(BaseModel):
    id: str
    listing_id: str
    name: str
    phone: str | None = None
    email: str | None = None
    source: str
    budget_min: float | None = None
    budget_max: float | None = None
    preferred_visit_time: str | None = None
    buyer_profile: str | None = None
    intent_score: float = 0
    qualification_score: float = 0
    status: str = "new"
    last_agent_summary: str | None = None
    created_at: str
    updated_at: str | None = None


class SiteVisit(BaseModel):
    id: str
    listing_id: str
    lead_id: str | None = None
    cal_booking_id: str | None = None
    scheduled_start: str | None = None
    scheduled_end: str | None = None
    status: str = "requested"
    notes: str | None = None
    created_at: str
    updated_at: str | None = None


class ListingAuditLog(BaseModel):
    id: str
    listing_id: str
    actor_type: str
    actor_name: str
    action: str
    details_json: dict[str, Any] = Field(default_factory=dict)
    created_at: str


class ComparableListing(BaseModel):
    id: str
    locality: str
    property_type: str
    price: float
    price_per_sqft: float
    carpet_area_sqft: int | None = None
    bedrooms: int | None = None
    transaction_date: str | None = None
    source: str
    metadata_json: dict[str, Any] = Field(default_factory=dict)
    created_at: str


class AutomationRule(BaseModel):
    id: str
    name: str
    enabled: bool
    last_run: str | None = None
    next_run: str | None = None
    agent_name: str
    logs: list[str] = Field(default_factory=list)
    failure_state: str | None = None


class ListingPricing(BaseModel):
    recommended_price: float
    minimum_acceptable_price: float
    optimistic_price: float
    fast_sale_price: float
    price_per_sqft: float
    rental_yield_estimate: float
    buyer_affordability_segment: str
    negotiation_buffer: float
    market_heat_score: float
    redevelopment_upside_score: float
    confidence_score: float
    explanation: str


class ListingCopyPack(BaseModel):
    seo_title: str
    short_description: str
    long_description: str
    premium_description: str
    whatsapp_message: str
    broker_pitch: str
    investor_pitch: str
    family_buyer_pitch: str
    nri_buyer_pitch: str
    social_post: str
    bullet_points: list[str] = Field(default_factory=list)
    amenity_highlights: list[str] = Field(default_factory=list)
    locality_highlights: list[str] = Field(default_factory=list)
    redevelopment_angle: str | None = None
    compliance_highlights: list[str] = Field(default_factory=list)
    needs_confirmation: list[str] = Field(default_factory=list)


class ManagerListingDetail(ManagerListingSummary):
    owner_name: str | None = None
    owner_phone: str | None = None
    owner_email: str | None = None
    documents: list[ListingDocument] = Field(default_factory=list)
    media: list[ListingMedia] = Field(default_factory=list)
    leads: list[ListingLead] = Field(default_factory=list)
    site_visits: list[SiteVisit] = Field(default_factory=list)
    audit_log: list[ListingAuditLog] = Field(default_factory=list)
    automation_rules: list[AutomationRule] = Field(default_factory=list)
    market_comparables: list[ComparableListing] = Field(default_factory=list)
    pricing: ListingPricing | None = None
    listing_copy: ListingCopyPack | None = None
    readiness_breakdown: dict[str, Any] = Field(default_factory=dict)
    missing_fields: list[str] = Field(default_factory=list)
    legal_notes: list[str] = Field(default_factory=list)
    public_preview_url: str | None = None
    map_preview: dict[str, Any] = Field(default_factory=dict)


class ManagerCreateListingRequest(BaseModel):
    manager_id: str = "manager-demo-1"
    title: str
    property_type: str = "apartment"
    transaction_type: str = "sale"
    locality: str
    address: str
    latitude: float
    longitude: float
    carpet_area_sqft: int | None = None
    builtup_area_sqft: int | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    parking_count: int | None = None
    furnishing_status: str | None = None
    possession_status: str | None = None
    availability_date: str | None = None
    rera_number: str | None = None
    asking_price: float | None = None
    owner_name: str | None = None
    owner_phone: str | None = None
    owner_email: str | None = None
    notes: str | None = None


class ManagerAgentRunRequest(BaseModel):
    manager_id: str = "manager-demo-1"
    user_request: str = "Run seller automation"
    auto_publish: bool = False
    current_task: str | None = None


class ManagerAutomationRunRequest(BaseModel):
    manager_id: str = "manager-demo-1"
    listing_id: str
    auto_publish: bool = False
    current_task: str | None = None


class ManagerPublishResponse(BaseModel):
    published: bool
    missing_items: list[str] = Field(default_factory=list)
    listing: ManagerListingDetail
    audit_log: list[ListingAuditLog] = Field(default_factory=list)
