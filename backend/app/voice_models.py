from __future__ import annotations

from typing import Any, Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


VoiceProvider = Literal["elevenlabs"]
VoiceMode = Literal["mock", "live"]
CallStatus = Literal["blocked", "queued", "calling", "completed", "failed", "mock_completed"]
CallGoal = Literal["property_detail", "visit_scheduling", "xr_follow_up", "propertypool_invite", "offer_follow_up", "stale_lead_reactivation"]


class VoiceInterestCallRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    buyer_id: str | None = None
    lead_id: str | None = None
    buyer_name: str | None = "Demo Buyer"
    buyer_phone: str | None = None
    property_id: str
    interest_source: str = Field(validation_alias=AliasChoices("interest_source", "source"))
    consent_confirmed: bool = Field(default=False, validation_alias=AliasChoices("consent_confirmed", "consent"))
    preferred_language: Literal["English", "Hindi", "Hinglish"] = Field(default="Hinglish", validation_alias=AliasChoices("preferred_language", "language"))
    trigger_reason: str = "Buyer showed high property intent"
    call_goal: CallGoal = "property_detail"
    force_call: bool = False
    broker_id: str | None = None
    manager_id: str | None = "manager-demo-1"
    crm_opportunity_id: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class ManualLeadCallRequest(BaseModel):
    property_id: str
    call_goal: CallGoal = "property_detail"
    preferred_language: Literal["English", "Hindi", "Hinglish"] = "Hinglish"
    force_call: bool = False


class BrokerBuyerCallRequest(BaseModel):
    property_id: str
    tieup_id: str | None = None
    broker_id: str = "broker-demo-1"
    call_goal: CallGoal = "property_detail"
    preferred_language: Literal["English", "Hindi", "Hinglish"] = "Hinglish"


class VoiceCallConfig(BaseModel):
    id: str
    provider: VoiceProvider = "elevenlabs"
    mode: VoiceMode = "mock"
    elevenlabs_agent_id: str | None = None
    elevenlabs_phone_number_id: str | None = None
    max_calls_per_day: int = 10
    max_call_seconds: int = 240
    allowed_start_hour: int = 10
    allowed_end_hour: int = 19
    cooldown_hours: int = 24
    enabled: bool = True
    created_at: str
    updated_at: str | None = None


class VoiceCallConsent(BaseModel):
    id: str
    buyer_id: str | None = None
    phone: str
    consent_status: str = "unknown"
    consent_source: str | None = None
    consent_timestamp: str | None = None
    opt_out: bool = False
    opt_out_reason: str | None = None
    last_called_at: str | None = None
    calls_last_7_days: int = 0
    created_at: str
    updated_at: str | None = None


class VoiceCallRecord(BaseModel):
    id: str
    provider: VoiceProvider = "elevenlabs"
    mode: VoiceMode = "mock"
    buyer_id: str | None = None
    lead_id: str | None = None
    property_id: str | None = None
    broker_id: str | None = None
    manager_id: str | None = None
    crm_opportunity_id: str | None = None
    trigger_source: str
    trigger_reason: str
    call_goal: str
    to_number: str
    provider_call_id: str | None = None
    provider_conversation_id: str | None = None
    status: str
    started_at: str | None = None
    ended_at: str | None = None
    duration_seconds: int = 0
    transcript: str | None = None
    summary_json: dict[str, Any] = Field(default_factory=dict)
    outcome: str | None = None
    intent_score: float = 0
    next_action: str | None = None
    error_message: str | None = None
    created_at: str
    updated_at: str | None = None


class VoiceTriggerResult(BaseModel):
    call_status: str
    call_id: str | None = None
    provider: VoiceProvider = "elevenlabs"
    reason: str
    crm_task_id: str | None = None
    scheduled_or_started: str | None = None
    mode: VoiceMode = "mock"
    payload_preview: dict[str, Any] = Field(default_factory=dict)


class VoiceToolRequest(BaseModel):
    property_id: str | None = None
    buyer_id: str | None = None
    lead_id: str | None = None
    call_id: str | None = None
    down_payment: float | None = None
    tenure_years: int = 20
    interest_rate: float = 8.5
    preferred_date: str | None = None
    slot: str | None = None
    attendee_name: str | None = None
    attendee_phone: str | None = None
    summary_type: str = "property_summary"
    reason: str | None = None
    buyer_phone: str | None = None
    call_summary: str | None = None
    intent_score: float | None = None
    next_action: str | None = None


class VoiceCallState(BaseModel):
    call_id: str | None = None
    provider: VoiceProvider = "elevenlabs"
    provider_call_id: str | None = None
    provider_conversation_id: str | None = None
    buyer_id: str | None = None
    lead_id: str | None = None
    property_id: str | None = None
    broker_id: str | None = None
    manager_id: str | None = None
    crm_opportunity_id: str | None = None
    trigger_source: str | None = None
    trigger_reason: str | None = None
    consent_status: str | None = None
    call_goal: str | None = None
    preferred_language: str = "Hinglish"
    buyer_context: dict[str, Any] = Field(default_factory=dict)
    property_context: dict[str, Any] = Field(default_factory=dict)
    finance_context: dict[str, Any] = Field(default_factory=dict)
    legal_context: dict[str, Any] = Field(default_factory=dict)
    scheduling_context: dict[str, Any] = Field(default_factory=dict)
    call_status: str | None = None
    transcript: str | None = None
    call_summary: str | None = None
    extracted_buyer_updates: dict[str, Any] = Field(default_factory=dict)
    intent_score: float = 0
    next_action: str | None = None
    escalation_required: bool = False
    audit_events: list[dict[str, Any]] = Field(default_factory=list)
