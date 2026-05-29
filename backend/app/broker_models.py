from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


VerificationStatus = Literal["pending", "verified", "needs_review", "rejected"]
TieupStatus = Literal["requested", "under_review", "approved", "rejected", "terms_updated", "agreement_accepted", "active", "expired", "cancelled"]
LeadTemperature = Literal["cold", "warm", "hot", "ready_to_offer"]
PropertyPoolStatus = Literal["draft", "pending_manager_approval", "scheduled", "live", "completed", "cancelled"]


class BrokerProfile(BaseModel):
    id: str
    user_id: str | None = None
    full_name: str
    agency_name: str | None = None
    phone: str
    email: str
    whatsapp_number: str | None = None
    rera_agent_id: str | None = None
    operating_localities: list[str] = Field(default_factory=list)
    years_experience: int = 0
    property_categories: list[str] = Field(default_factory=list)
    buyer_network_size: int = 0
    average_monthly_visits: int = 0
    preferred_commission_structure: str | None = None
    languages_spoken: list[str] = Field(default_factory=list)
    specialization: list[str] = Field(default_factory=list)
    verification_status: VerificationStatus = "pending"
    trust_score: float = 0
    profile_photo_url: str | None = None
    business_card_url: str | None = None
    kyc_document_url: str | None = None
    pan_gst_details: str | None = None
    past_transaction_proof_url: str | None = None
    missing_document_tasks: list[str] = Field(default_factory=list)
    created_at: str | None = None
    updated_at: str | None = None


class BrokerProfileUpsertRequest(BaseModel):
    user_id: str | None = "broker-user-demo"
    full_name: str
    agency_name: str | None = None
    phone: str
    email: str
    whatsapp_number: str | None = None
    rera_agent_id: str | None = None
    operating_localities: list[str] = Field(default_factory=list)
    years_experience: int = 0
    property_categories: list[str] = Field(default_factory=list)
    buyer_network_size: int = 0
    average_monthly_visits: int = 0
    preferred_commission_structure: str | None = None
    languages_spoken: list[str] = Field(default_factory=list)
    specialization: list[str] = Field(default_factory=list)
    profile_photo_url: str | None = None
    business_card_url: str | None = None
    kyc_document_url: str | None = None
    pan_gst_details: str | None = None
    past_transaction_proof_url: str | None = None


class BrokerInventoryProperty(BaseModel):
    id: str
    manager_id: str
    title: str
    locality: str
    address: str
    latitude: float
    longitude: float
    price: float | None = None
    carpet_area_sqft: int | None = None
    bedrooms: int | None = None
    property_type: str = "apartment"
    image_url: str | None = None
    commission_estimate: float = 0
    commission_range: str
    tieup_status: str
    map_color: str
    allowed_marketing_status: str
    buyer_match_score: float = 0
    buyer_demand_score: float = 0
    market_heat_score: float = 0
    legal_risk_score: float = 0
    redevelopment_score: float = 0
    visit_availability: str
    propertypool_status: str
    propertypool_eligible: bool = True
    sharing_rights: list[str] = Field(default_factory=list)
    rera_number: str | None = None
    description: str | None = None


class BrokerSummaryCard(BaseModel):
    label: str
    value: str
    detail: str | None = None
    tone: str = "slate"


class BrokerMapPin(BaseModel):
    id: str
    title: str
    locality: str
    latitude: float
    longitude: float
    price: float | None = None
    color: str
    commission_range: str
    tieup_status: str
    visit_availability: str
    buyer_demand_score: float
    legal_risk_score: float
    market_heat_score: float


class BrokerFeedEvent(BaseModel):
    id: str
    created_at: str
    actor_name: str
    action: str
    details: str
    tone: str = "slate"


class BrokerTieupRequestCreate(BaseModel):
    broker_id: str = "broker-demo-1"
    listing_id: str
    intended_buyer_segment: str = "family buyers"
    expected_buyer_count: int = 3
    marketing_channels: list[str] = Field(default_factory=lambda: ["WhatsApp", "Calls"])
    expected_site_visit_plan: str | None = None
    requested_commission: float = 2.0
    requested_validity_days: int = 45
    requested_propertypool_rights: bool = True
    requested_exclusivity: bool = False
    broker_message: str | None = None
    past_relevant_buyer_interest: str | None = None


class BrokerTieupRequest(BaseModel):
    id: str
    broker_id: str
    manager_id: str
    listing_id: str
    property_title: str
    manager_name: str
    status: TieupStatus
    requested_commission: float
    approved_commission: float | None = None
    requested_validity_days: int
    approved_validity_days: int | None = None
    requested_exclusivity: bool = False
    approved_exclusivity: bool = False
    requested_propertypool_rights: bool = False
    approved_propertypool_rights: bool = False
    intended_buyer_segment: str
    expected_buyer_count: int
    marketing_channels: list[str] = Field(default_factory=list)
    broker_message: str | None = None
    manager_response: str | None = None
    ai_recommendation_json: dict[str, Any] = Field(default_factory=dict)
    approved_terms_json: dict[str, Any] = Field(default_factory=dict)
    expires_at: str | None = None
    created_at: str
    updated_at: str | None = None


class ManagerTieupDecisionRequest(BaseModel):
    manager_response: str | None = None
    approved_commission: float | None = None
    approved_validity_days: int | None = None
    approved_propertypool_rights: bool | None = None
    approved_exclusivity: bool | None = None
    allowed_marketing_channels: list[str] | None = None


class BrokerBuyerCreate(BaseModel):
    broker_id: str = "broker-demo-1"
    full_name: str
    phone: str
    email: str | None = None
    budget_min: float | None = None
    budget_max: float | None = None
    preferred_localities: list[str] = Field(default_factory=list)
    property_type_preference: str | None = None
    bhk_preference: str | None = None
    purchase_purpose: str | None = None
    buying_timeline: str | None = None
    loan_required: bool = True
    family_size: int | None = None
    special_requirements: str | None = None
    site_visit_availability: str | None = None
    lead_temperature: LeadTemperature = "warm"
    communication_channel: str = "WhatsApp"
    notes: str | None = None


class BrokerBuyer(BaseModel):
    id: str
    broker_id: str
    full_name: str
    phone: str
    email: str | None = None
    budget_min: float | None = None
    budget_max: float | None = None
    preferred_localities: list[str] = Field(default_factory=list)
    property_type_preference: str | None = None
    bhk_preference: str | None = None
    purchase_purpose: str | None = None
    buying_timeline: str | None = None
    loan_required: bool = True
    family_size: int | None = None
    special_requirements: str | None = None
    site_visit_availability: str | None = None
    lead_temperature: LeadTemperature = "warm"
    communication_channel: str = "WhatsApp"
    assigned_properties: list[str] = Field(default_factory=list)
    visit_history: list[dict[str, Any]] = Field(default_factory=list)
    offer_history: list[dict[str, Any]] = Field(default_factory=list)
    follow_up_status: str = "due"
    qualification_score: float = 0
    notes: str | None = None
    created_at: str
    updated_at: str | None = None


class BrokerLeadAttribution(BaseModel):
    id: str
    broker_id: str
    buyer_id: str
    listing_id: str
    tieup_id: str | None = None
    attribution_status: str = "protected"
    first_introduced_at: str
    last_interaction_at: str | None = None
    expiry_at: str | None = None
    source: str
    duplicate_conflict: bool = False
    conflict_details_json: dict[str, Any] = Field(default_factory=dict)
    commission_eligible: bool = True
    created_at: str
    updated_at: str | None = None


class BrokerLeadImportRequest(BaseModel):
    broker_id: str = "broker-demo-1"
    leads: list[BrokerBuyerCreate] = Field(default_factory=list)


class PropertyPoolCreateRequest(BaseModel):
    broker_id: str = "broker-demo-1"
    listing_id: str
    tieup_id: str | None = None
    event_title: str | None = None
    event_type: str = "broker-led group visit"
    scheduled_start: str
    scheduled_end: str | None = None
    duration_minutes: int = 90
    max_buyers: int = 8
    buyer_segment: str = "family buyers"
    meeting_point: str | None = None
    required_documents: list[str] = Field(default_factory=list)
    prequalification_requirement: str = "Budget and locality fit confirmed"
    rsvp_deadline: str | None = None
    allowed_brokers: list[str] = Field(default_factory=list)
    allowed_buyers: list[str] = Field(default_factory=list)
    follow_up_automation: bool = True


class PropertyPoolEvent(BaseModel):
    id: str
    listing_id: str
    broker_id: str
    manager_id: str
    tieup_id: str | None = None
    event_title: str
    event_type: str
    status: PropertyPoolStatus
    scheduled_start: str
    scheduled_end: str | None = None
    max_buyers: int
    meeting_point: str
    buyer_segment: str
    route_json: dict[str, Any] = Field(default_factory=dict)
    tour_script: str
    invite_message: str
    reminder_schedule_json: dict[str, Any] = Field(default_factory=dict)
    manager_approval_status: str = "approved"
    registered_buyers: int = 0
    attended_buyers: int = 0
    offer_pipeline: int = 0
    created_at: str
    updated_at: str | None = None


class PropertyPoolRegistration(BaseModel):
    id: str
    event_id: str
    buyer_id: str
    broker_id: str
    rsvp_status: str = "invited"
    checkin_status: str = "pending"
    checkin_time: str | None = None
    feedback_json: dict[str, Any] = Field(default_factory=dict)
    interest_level: str | None = None
    next_action: str | None = None
    created_at: str
    updated_at: str | None = None


class BrokerCommission(BaseModel):
    id: str
    broker_id: str
    buyer_id: str | None = None
    listing_id: str
    tieup_id: str | None = None
    deal_status: str
    property_value: float
    commission_percentage: float
    expected_commission: float
    approved_commission: float | None = None
    payout_status: str = "pending"
    dispute_status: str = "none"
    created_at: str
    updated_at: str | None = None


class BrokerAgentTask(BaseModel):
    id: str
    broker_id: str
    listing_id: str | None = None
    buyer_id: str | None = None
    propertypool_event_id: str | None = None
    agent_name: str
    task_type: str
    status: str = "open"
    priority: str = "medium"
    input_json: dict[str, Any] = Field(default_factory=dict)
    output_json: dict[str, Any] = Field(default_factory=dict)
    error_message: str | None = None
    created_at: str
    updated_at: str | None = None
    completed_at: str | None = None


class BrokerAuditLog(BaseModel):
    id: str
    broker_id: str | None = None
    listing_id: str | None = None
    buyer_id: str | None = None
    action: str
    actor_type: str
    actor_name: str
    details_json: dict[str, Any] = Field(default_factory=dict)
    created_at: str


class BrokerDashboard(BaseModel):
    broker: BrokerProfile
    summary_cards: list[BrokerSummaryCard]
    map_pins: list[BrokerMapPin]
    available_properties: list[BrokerInventoryProperty]
    tieup_feed: list[BrokerTieupRequest]
    propertypool_events: list[PropertyPoolEvent]
    buyers: list[BrokerBuyer]
    commissions: list[BrokerCommission]
    activity_feed: list[BrokerFeedEvent]
    next_best_actions: list[BrokerAgentTask]
    attribution_alerts: list[BrokerLeadAttribution]


class BrokerAutomationRunRequest(BaseModel):
    broker_id: str = "broker-demo-1"
    user_request: str = "Run Broker Growth Automation"
    listing_id: str | None = None
    create_propertypool: bool = False

