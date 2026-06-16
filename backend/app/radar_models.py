"""Pydantic models and shared types for the Mumbai Redevelopment Radar.

The Radar is ASTRA's future-locality intelligence layer: it converts government
infrastructure plans, redevelopment schemes, zoning changes and internal demand
signals into explainable, evidence-backed locality transformation scores.

Safety: nothing here ever asserts guaranteed price appreciation. Every projected
impact carries a status, a confidence, and a source. Callers must surface those.
"""

from __future__ import annotations

from enum import Enum
from typing import Any, Literal, TypedDict

from pydantic import BaseModel, Field


# --------------------------------------------------------------------------- #
# Enumerations
# --------------------------------------------------------------------------- #
class RadarZone(str, Enum):
    south_mumbai = "South Mumbai"
    central_mumbai = "Central Mumbai"
    western_suburbs = "Western Suburbs"
    eastern_suburbs = "Eastern Suburbs"
    thane = "Thane"
    navi_mumbai = "Navi Mumbai"
    mmr_growth_belt = "MMR Growth Belt"


class ProjectType(str, Enum):
    metro = "metro"
    rail = "rail"
    road = "road"
    bridge = "bridge"
    tunnel = "tunnel"
    coastal = "coastal"
    airport = "airport"
    new_town = "new_town"
    business_park = "business_park"
    redevelopment = "redevelopment"
    slum_redevelopment = "slum_redevelopment"
    mhada = "mhada"
    sra = "sra"
    dp_road = "dp_road"
    public_realm = "public_realm"
    zoning = "zoning"
    commercial_hub = "commercial_hub"


class ProjectStatus(str, Enum):
    proposed = "proposed"
    approved = "approved"
    tendering = "tendering"
    under_construction = "under_construction"
    partially_operational = "partially_operational"
    operational = "operational"
    delayed = "delayed"
    stalled = "stalled"
    cancelled = "cancelled"


class ZoneType(str, Enum):
    cluster_redevelopment = "cluster_redevelopment"
    sra = "sra"
    mhada = "mhada"
    bdd = "bdd"
    cessed_building = "cessed_building"
    old_society = "old_society"
    slum_cluster = "slum_cluster"
    industrial_conversion = "industrial_conversion"
    government_layout = "government_layout"


class SourceType(str, Enum):
    official = "official"          # MMRDA / BMC / MHADA / CIDCO / MRVC / RERA / notification
    news = "news"                  # verified publications
    internal = "internal"          # ASTRA CRM / demand signals
    document = "document"          # uploaded PDF / tender / EC
    manual = "manual"              # admin entry


class ClaimStatus(str, Enum):
    verified = "verified"
    likely = "likely"
    unverified = "unverified"
    disputed = "disputed"
    outdated = "outdated"


class TimeHorizon(str, Enum):
    h_0_1 = "0-1y"
    h_1_3 = "1-3y"
    h_3_5 = "3-5y"
    h_5_10 = "5-10y"


# Map locality colour-coding (frontend mirrors these keys).
LocalitySignal = Literal[
    "growth",         # green   - strong confirmed growth
    "connectivity",   # blue    - connectivity uplift
    "redevelopment",  # purple  - redevelopment momentum
    "premium",        # gold    - premiumization opportunity
    "speculative",    # orange  - speculative opportunity
    "risk",           # red     - high execution / disruption risk
    "insufficient",   # gray    - insufficient data
]


# --------------------------------------------------------------------------- #
# Scoring
# --------------------------------------------------------------------------- #
class ScoreInput(BaseModel):
    """A single transparent contributor to a score, with its provenance."""

    label: str
    value: float
    weight: float | None = None
    source_type: SourceType = SourceType.internal
    reliability: float = 0.6
    note: str | None = None


class ScoreBreakdown(BaseModel):
    """An explainable sub-score: the number, what fed it, and why."""

    key: str
    label: str
    score: float = Field(ge=0, le=100)
    weight: float = 0.0
    confidence: float = Field(default=0.6, ge=0, le=1)
    reason: str = ""
    inputs: list[ScoreInput] = Field(default_factory=list)
    last_updated: str | None = None


class LocalityScores(BaseModel):
    """The full Future Score plus every sub-score and risk adjustment."""

    future_score: float = Field(ge=0, le=100)
    confidence_score: float = Field(default=0.6, ge=0, le=1)

    # Opportunity sub-scores
    infrastructure_score: float = 0
    redevelopment_score: float = 0
    connectivity_score: float = 0
    government_confidence_score: float = 0
    livability_score: float = 0
    employment_score: float = 0
    rental_demand_score: float = 0
    investment_score: float = 0
    market_demand_score: float = 0

    # Risk sub-scores (higher = more risk)
    execution_risk_score: float = 0
    disruption_risk_score: float = 0
    affordability_risk_score: float = 0
    oversupply_risk_score: float = 0

    # Persona convenience scores
    self_use_score: float = 0

    breakdown: list[ScoreBreakdown] = Field(default_factory=list)


# --------------------------------------------------------------------------- #
# Evidence / claim ledger
# --------------------------------------------------------------------------- #
class RadarClaim(BaseModel):
    id: str
    claim_text: str
    claim_type: str = "impact"
    entity_type: Literal["locality", "project", "property", "zone"] = "locality"
    entity_id: str | None = None
    locality_id: str | None = None
    project_id: str | None = None
    property_id: str | None = None
    source_url: str | None = None
    source_name: str | None = None
    source_type: SourceType = SourceType.official
    source_date: str | None = None
    extracted_at: str | None = None
    status: ClaimStatus = ClaimStatus.unverified
    confidence_score: float = Field(default=0.6, ge=0, le=1)
    reliability_score: float = Field(default=0.6, ge=0, le=1)
    evidence_snippet: str | None = None
    last_checked_at: str | None = None


# --------------------------------------------------------------------------- #
# Projects + impacts
# --------------------------------------------------------------------------- #
class ProjectLocalityImpact(BaseModel):
    id: str | None = None
    project_id: str
    locality_id: str
    locality_name: str | None = None
    impact_type: str = "connectivity"
    impact_score: float = Field(default=0, ge=0, le=100)
    time_horizon: TimeHorizon = TimeHorizon.h_3_5
    distance_km: float | None = None
    explanation: str = ""
    positive_factors: list[str] = Field(default_factory=list)
    negative_factors: list[str] = Field(default_factory=list)
    confidence_score: float = Field(default=0.6, ge=0, le=1)


class RadarProject(BaseModel):
    id: str
    name: str
    slug: str
    project_type: ProjectType
    authority: str
    status: ProjectStatus
    description: str = ""
    budget_amount: float | None = None          # INR crore
    start_date: str | None = None
    expected_completion_date: str | None = None
    actual_completion_date: str | None = None
    source_url: str | None = None
    source_type: SourceType = SourceType.official
    source_date: str | None = None
    reliability_score: float = Field(default=0.7, ge=0, le=1)
    confidence_score: float = Field(default=0.7, ge=0, le=1)
    last_verified_at: str | None = None
    stale: bool = False
    geometry_geojson: dict[str, Any] | None = None
    affected_localities: list[str] = Field(default_factory=list)
    impact_categories: list[str] = Field(default_factory=list)
    impact_summary: str = ""
    risk_summary: str = ""
    impacts: list[ProjectLocalityImpact] = Field(default_factory=list)
    claims: list[RadarClaim] = Field(default_factory=list)


# --------------------------------------------------------------------------- #
# Redevelopment zones
# --------------------------------------------------------------------------- #
class RadarRedevelopmentZone(BaseModel):
    id: str
    name: str
    slug: str
    locality_id: str | None = None
    locality_name: str | None = None
    zone_type: ZoneType
    authority: str = ""
    status: ProjectStatus = ProjectStatus.proposed
    area_acres: float | None = None
    estimated_units: int | None = None
    developer_name: str | None = None
    scheme_type: str | None = None
    source_url: str | None = None
    source_type: SourceType = SourceType.official
    geometry_geojson: dict[str, Any] | None = None
    opportunity_score: float = Field(default=0, ge=0, le=100)
    risk_score: float = Field(default=0, ge=0, le=100)
    confidence_score: float = Field(default=0.6, ge=0, le=1)
    notes: str = ""


# --------------------------------------------------------------------------- #
# Localities
# --------------------------------------------------------------------------- #
class TimelineMilestone(BaseModel):
    horizon: TimeHorizon
    project_id: str | None = None
    title: str
    effect: str
    uncertainty: Literal["low", "medium", "high"] = "medium"
    micro_markets: list[str] = Field(default_factory=list)


class OpportunityNote(BaseModel):
    persona: str            # family / investor / broker / developer / rental / redevelopment / nri
    headline: str
    detail: str


class RiskNote(BaseModel):
    kind: str               # delay / disruption / legal / oversupply / affordability / opposition / environmental / displacement
    severity: Literal["low", "medium", "high"] = "medium"
    detail: str
    confidence: float = Field(default=0.6, ge=0, le=1)


class SuggestedAction(BaseModel):
    role: str               # buyer / broker / manager / crm
    label: str
    detail: str
    href: str | None = None


class RadarLocality(BaseModel):
    id: str
    slug: str
    name: str
    zone: RadarZone
    city: str = "Mumbai"
    latitude: float
    longitude: float
    boundary_geojson: dict[str, Any] | None = None
    signal: LocalitySignal = "insufficient"
    summary: str = ""
    headline_catalysts: list[str] = Field(default_factory=list)
    headline_risks: list[str] = Field(default_factory=list)
    price_psf: float | None = None
    price_trend_pct: float | None = None
    rental_yield_pct: float | None = None
    scores: LocalityScores
    last_scored_at: str | None = None


class LocalityDetail(BaseModel):
    locality: RadarLocality
    timeline: list[TimelineMilestone] = Field(default_factory=list)
    projects: list[RadarProject] = Field(default_factory=list)
    redevelopment_zones: list[RadarRedevelopmentZone] = Field(default_factory=list)
    opportunities: list[OpportunityNote] = Field(default_factory=list)
    risks: list[RiskNote] = Field(default_factory=list)
    actions: list[SuggestedAction] = Field(default_factory=list)
    claims: list[RadarClaim] = Field(default_factory=list)
    related_property_ids: list[str] = Field(default_factory=list)


# --------------------------------------------------------------------------- #
# Watchlist / alerts
# --------------------------------------------------------------------------- #
class WatchlistItem(BaseModel):
    id: str
    user_id: str | None = None
    entity_type: Literal["locality", "project", "property", "zone"] = "locality"
    entity_id: str
    entity_name: str | None = None
    alert_type: str = "any_update"
    status: str = "active"
    created_at: str | None = None


class WatchlistCreate(BaseModel):
    entity_type: Literal["locality", "project", "property", "zone"] = "locality"
    entity_id: str
    alert_type: str = "any_update"


class RadarAlert(BaseModel):
    id: str
    user_id: str | None = None
    locality_id: str | None = None
    project_id: str | None = None
    property_id: str | None = None
    alert_type: str = "update"
    title: str
    message: str
    priority: Literal["low", "medium", "high"] = "medium"
    status: Literal["unread", "read"] = "unread"
    created_at: str | None = None
    read_at: str | None = None


class AlertSubscribe(BaseModel):
    locality_slug: str | None = None
    project_id: str | None = None
    alert_type: str = "any_update"


# --------------------------------------------------------------------------- #
# Map / dashboard / compare
# --------------------------------------------------------------------------- #
class MapLocalityFeature(BaseModel):
    id: str
    slug: str
    name: str
    zone: RadarZone
    latitude: float
    longitude: float
    signal: LocalitySignal
    future_score: float
    boundary_geojson: dict[str, Any] | None = None
    top_catalysts: list[str] = Field(default_factory=list)
    top_risks: list[str] = Field(default_factory=list)


class MapLayer(BaseModel):
    key: str
    label: str
    kind: Literal["localities", "projects", "zones", "properties", "heatmap"]
    color: str
    features: list[dict[str, Any]] = Field(default_factory=list)


class RadarMapResponse(BaseModel):
    center: list[float] = Field(default_factory=lambda: [19.076, 72.8777])
    zoom: int = 11
    localities: list[MapLocalityFeature] = Field(default_factory=list)
    layers: list[MapLayer] = Field(default_factory=list)


class DashboardStat(BaseModel):
    label: str
    value: str
    detail: str | None = None
    tone: str = "ink"


class RadarDashboard(BaseModel):
    stats: list[DashboardStat] = Field(default_factory=list)
    top_growth: list[RadarLocality] = Field(default_factory=list)
    top_redevelopment: list[RadarLocality] = Field(default_factory=list)
    watch_risk: list[RadarLocality] = Field(default_factory=list)
    active_projects: list[RadarProject] = Field(default_factory=list)
    recent_alerts: list[RadarAlert] = Field(default_factory=list)
    last_updated: str | None = None


class CompareRequest(BaseModel):
    locality_slugs: list[str] = Field(min_length=2, max_length=4)
    time_horizon: TimeHorizon | None = None
    investment_goal: str | None = None


class CompareVerdict(BaseModel):
    label: str
    winner_slug: str
    reason: str


class CompareResponse(BaseModel):
    localities: list[RadarLocality] = Field(default_factory=list)
    verdicts: list[CompareVerdict] = Field(default_factory=list)
    narrative: str = ""


class AnalyzeLocalityRequest(BaseModel):
    locality_slug: str
    role: str = "buyer"
    investment_goal: str | None = None
    risk_tolerance: str | None = None
    time_horizon: TimeHorizon | None = None
    query: str | None = None


class AnalyzeLocalityResponse(BaseModel):
    locality_slug: str
    role: str
    answer: str
    confidence_score: float = 0.6
    recommendation: str = ""
    opportunities: list[OpportunityNote] = Field(default_factory=list)
    risks: list[RiskNote] = Field(default_factory=list)
    actions: list[SuggestedAction] = Field(default_factory=list)
    evidence: list[RadarClaim] = Field(default_factory=list)
    audit_events: list[str] = Field(default_factory=list)


class LocalityReport(BaseModel):
    locality_slug: str
    title: str
    generated_at: str | None = None
    summary: str
    sections: list[dict[str, Any]] = Field(default_factory=list)
    evidence: list[RadarClaim] = Field(default_factory=list)
    disclaimer: str = (
        "This report is decision support, not investment advice or a guarantee of "
        "price appreciation. Project timelines and impacts are subject to government "
        "approvals, execution risk and change. Verify with official sources."
    )


# --------------------------------------------------------------------------- #
# Property-level Future Radar card
# --------------------------------------------------------------------------- #
class PropertyRadarCard(BaseModel):
    property_id: str
    locality_slug: str | None = None
    locality_name: str | None = None
    future_score: float = 0
    confidence_score: float = 0.6
    signal: LocalitySignal = "insufficient"
    nearest_catalyst: str | None = None
    nearest_catalyst_distance_km: float | None = None
    connectivity_uplift: str | None = None
    redevelopment_momentum: str | None = None
    livability_improvement: str | None = None
    major_risks: list[str] = Field(default_factory=list)
    timeline: list[TimelineMilestone] = Field(default_factory=list)
    summary: str = ""
    investor_view: dict[str, Any] = Field(default_factory=dict)
    family_view: dict[str, Any] = Field(default_factory=dict)
    broker_pitch: list[str] = Field(default_factory=list)
    manager_positioning: list[str] = Field(default_factory=list)
    similar_property_ids: list[str] = Field(default_factory=list)
    evidence: list[RadarClaim] = Field(default_factory=list)


# --------------------------------------------------------------------------- #
# Ingestion / audit
# --------------------------------------------------------------------------- #
class IngestSourceRequest(BaseModel):
    source_name: str
    source_url: str | None = None
    source_type: SourceType = SourceType.official
    job_type: str = "project"
    payload: dict[str, Any] | None = None


class IngestionJob(BaseModel):
    id: str
    source_name: str
    source_url: str | None = None
    job_type: str = "project"
    status: Literal["queued", "running", "completed", "failed"] = "completed"
    records_found: int = 0
    records_created: int = 0
    records_updated: int = 0
    error_message: str | None = None
    started_at: str | None = None
    completed_at: str | None = None


class AuditEvent(BaseModel):
    id: str
    actor: str = "radar"
    action: str
    entity_type: str | None = None
    entity_id: str | None = None
    detail: str | None = None
    created_at: str | None = None


# --------------------------------------------------------------------------- #
# Agent state (LangGraph)
# --------------------------------------------------------------------------- #
class RadarState(TypedDict, total=False):
    user_id: str
    role: str
    query: str
    locality_slug: str
    property_id: str
    project_id: str
    buyer_id: str
    broker_id: str
    manager_id: str
    crm_opportunity_id: str
    selected_time_horizon: str
    investment_goal: str
    risk_tolerance: str
    locality_snapshot: dict[str, Any]
    project_snapshot: dict[str, Any]
    evidence_context: list[dict[str, Any]]
    market_context: dict[str, Any]
    crm_demand_context: dict[str, Any]
    property_context: dict[str, Any]
    scoring_context: dict[str, Any]
    recommendation_context: dict[str, Any]
    route: str
    answer: str
    next_action: str
    confidence_score: float
    audit_events: list[str]
    messages: list[dict[str, Any]]
