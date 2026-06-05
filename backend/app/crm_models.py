from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


CRMRole = Literal["admin", "sales_manager", "sales_agent", "property_manager", "broker_partner", "finance_executive", "legal_executive", "marketing_executive", "viewer"]
LeadSource = Literal["WhatsApp", "Vapi call", "Website form", "Buyer portal", "Property detail page", "XR tour", "PropertyPool", "Broker referral", "Manager upload", "Campaign", "Manual entry"]
ActivityStatus = Literal["open", "overdue", "completed", "cancelled"]


class CRMSummaryCard(BaseModel):
    label: str
    value: str
    detail: str | None = None
    tone: str = "slate"


class CRMPipelineStage(BaseModel):
    id: str
    stage_name: str
    display_order: int
    default_probability: float
    color: str
    is_closed_won: bool = False
    is_closed_lost: bool = False
    opportunity_count: int = 0
    total_value: float = 0
    weighted_value: float = 0
    average_age_days: float = 0
    stale_count: int = 0


class CRMLeadCreate(BaseModel):
    organization_id: str = "org-astra-demo"
    full_name: str
    phone: str
    email: str | None = None
    source: LeadSource = "Manual entry"
    source_detail: str | None = None
    buyer_type: str = "family buyer"
    budget_min: float | None = None
    budget_max: float | None = None
    preferred_localities: list[str] = Field(default_factory=list)
    property_type_preference: str = "apartment"
    bhk_preference: str | None = None
    buying_timeline: str | None = None
    loan_required: bool = True
    down_payment_available: float | None = None
    family_size: int | None = None
    purpose: str | None = None
    assigned_user_id: str | None = "agent-demo-1"
    broker_id: str | None = None
    manager_id: str | None = "manager-demo-1"
    notes: str | None = None


class CRMLead(BaseModel):
    id: str
    organization_id: str
    full_name: str
    phone: str
    email: str | None = None
    source: str
    source_detail: str | None = None
    buyer_type: str = "family buyer"
    budget_min: float | None = None
    budget_max: float | None = None
    preferred_localities: list[str] = Field(default_factory=list)
    property_type_preference: str = "apartment"
    bhk_preference: str | None = None
    buying_timeline: str | None = None
    loan_required: bool = True
    down_payment_available: float | None = None
    family_size: int | None = None
    purpose: str | None = None
    assigned_user_id: str | None = None
    broker_id: str | None = None
    manager_id: str | None = None
    lead_score: float = 0
    qualification_status: str = "new"
    duplicate_status: str = "unique"
    status: str = "open"
    last_contacted_at: str | None = None
    next_follow_up_at: str | None = None
    notes: str | None = None
    metadata_json: dict[str, Any] = Field(default_factory=dict)
    created_at: str
    updated_at: str | None = None


class CRMLeadImportRequest(BaseModel):
    organization_id: str = "org-astra-demo"
    leads: list[CRMLeadCreate] = Field(default_factory=list)


class LeadScoreSchema(BaseModel):
    lead_id: str
    score: float
    priority: str
    budget_fit: float
    locality_fit: float
    urgency: float
    loan_readiness: float
    next_best_action: str
    explanation: str


class CRMContact(BaseModel):
    id: str
    organization_id: str
    full_name: str
    phone: str | None = None
    email: str | None = None
    contact_type: str = "buyer"
    linked_buyer_id: str | None = None
    linked_broker_id: str | None = None
    linked_manager_id: str | None = None
    source: str | None = None
    tags: list[str] = Field(default_factory=list)
    notes: str | None = None
    created_at: str
    updated_at: str | None = None


class CRMContactCreate(BaseModel):
    organization_id: str = "org-astra-demo"
    full_name: str
    phone: str | None = None
    email: str | None = None
    contact_type: str = "buyer"
    source: str | None = None
    tags: list[str] = Field(default_factory=list)
    notes: str | None = None


class CRMAccount(BaseModel):
    id: str
    organization_id: str
    account_name: str
    account_type: str = "buyer family"
    company_name: str | None = None
    primary_contact_id: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    gst_number: str | None = None
    rera_id: str | None = None
    notes: str | None = None
    created_at: str
    updated_at: str | None = None


class CRMAccountCreate(BaseModel):
    organization_id: str = "org-astra-demo"
    account_name: str
    account_type: str = "buyer family"
    company_name: str | None = None
    phone: str | None = None
    email: str | None = None
    notes: str | None = None


class CRMOpportunityCreate(BaseModel):
    organization_id: str = "org-astra-demo"
    lead_id: str | None = None
    contact_id: str | None = None
    buyer_id: str | None = None
    property_id: str | None = None
    broker_id: str | None = None
    manager_id: str | None = "manager-demo-1"
    title: str
    stage: str = "Qualified"
    opportunity_value: float = 0
    expected_commission: float = 0
    probability: float = 30
    source: str = "Manual entry"
    assigned_user_id: str | None = "agent-demo-1"
    expected_close_date: str | None = None


class CRMOpportunity(BaseModel):
    id: str
    organization_id: str
    lead_id: str | None = None
    contact_id: str | None = None
    buyer_id: str | None = None
    property_id: str | None = None
    broker_id: str | None = None
    manager_id: str | None = None
    title: str
    buyer_name: str
    property_name: str | None = None
    locality: str | None = None
    stage: str
    opportunity_value: float
    expected_commission: float
    probability: float
    weighted_value: float
    source: str
    assigned_user_id: str | None = None
    assigned_agent_name: str | None = None
    next_activity_id: str | None = None
    next_activity: str | None = None
    expected_close_date: str | None = None
    lost_reason: str | None = None
    won_at: str | None = None
    lost_at: str | None = None
    lead_score: float = 0
    broker_attribution: str | None = None
    last_interaction: str | None = None
    warning_badges: list[str] = Field(default_factory=list)
    metadata_json: dict[str, Any] = Field(default_factory=dict)
    created_at: str
    updated_at: str | None = None


class OpportunityStageUpdateSchema(BaseModel):
    stage: str


class CRMActivityCreate(BaseModel):
    organization_id: str = "org-astra-demo"
    lead_id: str | None = None
    opportunity_id: str | None = None
    contact_id: str | None = None
    property_id: str | None = None
    assigned_user_id: str | None = "agent-demo-1"
    activity_type: str = "Call"
    title: str
    description: str | None = None
    due_at: str | None = None
    priority: str = "medium"
    created_by_agent: bool = False


class CRMActivity(BaseModel):
    id: str
    organization_id: str
    lead_id: str | None = None
    opportunity_id: str | None = None
    contact_id: str | None = None
    property_id: str | None = None
    assigned_user_id: str | None = None
    activity_type: str
    title: str
    description: str | None = None
    due_at: str | None = None
    status: ActivityStatus = "open"
    priority: str = "medium"
    created_by_agent: bool = False
    completed_at: str | None = None
    outcome: str | None = None
    created_at: str
    updated_at: str | None = None


class CRMInteraction(BaseModel):
    id: str
    organization_id: str
    lead_id: str | None = None
    opportunity_id: str | None = None
    contact_id: str | None = None
    property_id: str | None = None
    channel: str
    direction: str
    summary: str
    transcript: str | None = None
    sentiment: str = "neutral"
    intent_score: float = 0
    metadata_json: dict[str, Any] = Field(default_factory=dict)
    created_at: str


class CRMProposal(BaseModel):
    id: str
    organization_id: str
    opportunity_id: str | None = None
    property_id: str | None = None
    buyer_id: str | None = None
    proposal_type: str
    title: str
    content_json: dict[str, Any] = Field(default_factory=dict)
    pdf_url: str | None = None
    status: str = "draft"
    version: int = 1
    created_at: str
    updated_at: str | None = None


class CRMCommission(BaseModel):
    id: str
    organization_id: str
    opportunity_id: str | None = None
    broker_id: str | None = None
    agent_id: str | None = None
    manager_id: str | None = None
    property_id: str | None = None
    deal_value: float
    commission_percentage: float
    expected_commission: float
    approved_commission: float | None = None
    payout_status: str = "pending"
    dispute_status: str = "none"
    created_at: str
    updated_at: str | None = None


class CRMCampaign(BaseModel):
    id: str
    organization_id: str
    campaign_name: str
    campaign_type: str
    target_segment: str
    property_id: str | None = None
    message_template: str
    status: str = "draft"
    sent_count: int = 0
    reply_count: int = 0
    visit_count: int = 0
    offer_count: int = 0
    revenue_pipeline: float = 0
    created_at: str
    updated_at: str | None = None


class CRMCampaignCreate(BaseModel):
    organization_id: str = "org-astra-demo"
    campaign_name: str
    campaign_type: str = "WhatsApp"
    target_segment: str
    property_id: str | None = None
    message_template: str


class CRMAuditLog(BaseModel):
    id: str
    organization_id: str
    actor_type: str
    actor_id: str | None = None
    action: str
    entity_type: str
    entity_id: str | None = None
    details_json: dict[str, Any] = Field(default_factory=dict)
    created_at: str


class CRMNextBestActionSchema(BaseModel):
    id: str
    title: str
    reason: str
    recommended_action: str
    entity_type: str
    entity_id: str | None = None
    priority: str = "medium"
    agent_name: str = "CRM Orchestrator Agent"


class CRMDashboard(BaseModel):
    summary_cards: list[CRMSummaryCard]
    pipeline_stages: list[CRMPipelineStage]
    priority_inbox: list[CRMNextBestActionSchema]
    activity_feed: list[CRMAuditLog]
    hot_leads: list[CRMLead]
    open_opportunities: list[CRMOpportunity]
    reports: dict[str, Any] = Field(default_factory=dict)


class CRMAutomationRunRequest(BaseModel):
    user_id: str = "user-demo-1"
    role: CRMRole = "sales_manager"
    user_request: str = "Run CRM automation"
    lead_id: str | None = None
    opportunity_id: str | None = None
    property_id: str | None = None
    create_activity: bool = True
