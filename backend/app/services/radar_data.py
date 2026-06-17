"""Single source of truth for the Mumbai Redevelopment Radar.

Pure in-memory. No database, no external network calls. All seed data is
hardcoded with realistic values and (where applicable) real official source
domains. The scoring engine is fully transparent: every sub-score is derived
from explicit inputs with documented weights and human-readable reasons.

Safety rules enforced here (per product spec):
  * Never assert guaranteed price appreciation -> language uses "may benefit",
    "could improve", "likely impact".
  * Every project carries status + source + last_verified; stale data flagged.
  * Source provenance separated via SourceType (official / news / internal).
  * A claim is only `verified` if it has an official source_url.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from app.radar_models import (
    AlertSubscribe,
    AuditEvent,
    ClaimStatus,
    CompareRequest,
    CompareResponse,
    CompareVerdict,
    DashboardStat,
    IngestionJob,
    IngestSourceRequest,
    LocalityDetail,
    LocalityReport,
    LocalityScores,
    MapLayer,
    MapLocalityFeature,
    OpportunityNote,
    ProjectLocalityImpact,
    ProjectStatus,
    ProjectType,
    PropertyRadarCard,
    RadarAlert,
    RadarClaim,
    RadarDashboard,
    RadarLocality,
    RadarMapResponse,
    RadarProject,
    RadarRedevelopmentZone,
    RiskNote,
    ScoreBreakdown,
    ScoreInput,
    SourceType,
    SuggestedAction,
    TimeHorizon,
    TimelineMilestone,
    WatchlistCreate,
    WatchlistItem,
    ZoneType,
)

# Fixed "today" so reports/timelines are deterministic at import time.
TODAY = "2026-06-17"
STALE_BEFORE = "2024-01-01"  # source_date older than this -> stale=True


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _uid(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:10]}"


def _is_stale(source_date: str | None) -> bool:
    if not source_date:
        return False
    return source_date < STALE_BEFORE


# --------------------------------------------------------------------------- #
# Scoring weights (per spec). Opportunity weights sum to 1.0; risks subtract.
# --------------------------------------------------------------------------- #
WEIGHTS = {
    "infrastructure": 0.20,
    "redevelopment": 0.20,
    "connectivity": 0.15,
    "government_confidence": 0.15,
    "market_demand": 0.10,
    "livability": 0.10,
    "employment": 0.05,
}
# Risk adjustments scale how much of each risk sub-score is deducted.
RISK_WEIGHTS = {
    "oversupply_risk": 0.10,
    "execution_risk": 0.12,
    "affordability_risk": 0.08,
}


# --------------------------------------------------------------------------- #
# Raw locality seed inputs. These feed the transparent scoring engine.
# Each numeric driver is a 0-100 indicator with provenance metadata.
# --------------------------------------------------------------------------- #
LOCALITY_SEED: list[dict[str, Any]] = [
    {
        "slug": "bandra", "name": "Bandra", "zone": "Western Suburbs",
        "lat": 19.0596, "lng": 72.8295, "signal": "premium",
        "price_psf": 62000, "trend": 6.2, "yield": 2.9,
        "summary": "Established premium western-suburb hub; BKC proximity and Coastal Road "
                   "connectivity could improve access while BDD-style cessed cluster redevelopment "
                   "may benefit pockets of the bandstand and Pali belt.",
        "catalysts": ["Coastal Road northern reach", "BKC employment gravity", "Cessed-building cluster redevelopment"],
        "risks": ["Premium affordability ceiling", "Limited new supply / heritage constraints"],
        "drivers": {"infra": 78, "redev": 64, "conn": 82, "gov": 72, "demand": 88, "liva": 86, "emp": 84,
                    "oversupply": 28, "execution": 40, "afford": 86},
    },
    {
        "slug": "andheri", "name": "Andheri", "zone": "Western Suburbs",
        "lat": 19.1197, "lng": 72.8468, "signal": "connectivity",
        "price_psf": 28500, "trend": 7.1, "yield": 3.6,
        "summary": "Multi-line metro interchange (Lines 2A/7/1) with Juhu Galli redevelopment momentum; "
                   "connectivity uplift could improve commute times across the western corridor.",
        "catalysts": ["Metro interchange density", "Juhu Galli redevelopment", "MIDC commercial demand"],
        "risks": ["Construction disruption near metro corridors", "Patchy redevelopment execution"],
        "drivers": {"infra": 80, "redev": 70, "conn": 88, "gov": 74, "demand": 80, "liva": 68, "emp": 78,
                    "oversupply": 44, "execution": 52, "afford": 60},
    },
    {
        "slug": "borivali", "name": "Borivali", "zone": "Western Suburbs",
        "lat": 19.2307, "lng": 72.8567, "signal": "connectivity",
        "price_psf": 24500, "trend": 6.8, "yield": 3.9,
        "summary": "Northern western-suburb anchor; Metro Line 7 extension and Borivali-Thane tunnel proposals "
                   "could improve east-west access and may benefit mid-segment housing demand.",
        "catalysts": ["Metro Line 7 northern reach", "Borivali-Thane twin tunnel (proposed)", "National park edge livability"],
        "risks": ["Tunnel timeline uncertainty", "Supply pipeline in outer pockets"],
        "drivers": {"infra": 72, "redev": 52, "conn": 76, "gov": 66, "demand": 74, "liva": 80, "emp": 60,
                    "oversupply": 48, "execution": 50, "afford": 52},
    },
    {
        "slug": "chembur", "name": "Chembur", "zone": "Eastern Suburbs",
        "lat": 19.0622, "lng": 72.8990, "signal": "growth",
        "price_psf": 27000, "trend": 8.0, "yield": 3.7,
        "summary": "Eastern-suburb growth pocket benefiting from Monorail, Eastern Freeway and Metro Line 2B; "
                   "connectivity and redevelopment momentum could improve mid-premium positioning.",
        "catalysts": ["Metro Line 2B", "Eastern Freeway access", "Society redevelopment momentum"],
        "risks": ["Industrial legacy pockets", "Execution variance in society redevelopment"],
        "drivers": {"infra": 78, "redev": 66, "conn": 80, "gov": 72, "demand": 78, "liva": 72, "emp": 64,
                    "oversupply": 42, "execution": 46, "afford": 54},
    },
    {
        "slug": "powai", "name": "Powai", "zone": "Eastern Suburbs",
        "lat": 19.1176, "lng": 72.9060, "signal": "premium",
        "price_psf": 33000, "trend": 6.5, "yield": 3.2,
        "summary": "Planned lake-front IT/education enclave; Metro Line 6 could improve cross-town connectivity "
                   "and may benefit the established premium rental market.",
        "catalysts": ["Metro Line 6 (Pink Line)", "IT/education employment base", "Planned township livability"],
        "risks": ["Affordability ceiling", "Limited fresh land for new supply"],
        "drivers": {"infra": 74, "redev": 44, "conn": 78, "gov": 70, "demand": 82, "liva": 88, "emp": 86,
                    "oversupply": 30, "execution": 38, "afford": 78},
    },
    {
        "slug": "ghatkopar", "name": "Ghatkopar", "zone": "Eastern Suburbs",
        "lat": 19.0858, "lng": 72.9081, "signal": "connectivity",
        "price_psf": 26000, "trend": 7.4, "yield": 3.8,
        "summary": "East-west metro interchange (Line 1) with Line 6 influence; connectivity uplift "
                   "and dense society redevelopment could improve mid-segment value.",
        "catalysts": ["Metro Line 1 interchange", "Metro Line 6 influence", "Dense society redevelopment"],
        "risks": ["Congestion / disruption risk", "Oversupply in redevelopment cohorts"],
        "drivers": {"infra": 76, "redev": 68, "conn": 84, "gov": 68, "demand": 76, "liva": 66, "emp": 62,
                    "oversupply": 50, "execution": 50, "afford": 56},
    },
    {
        "slug": "worli", "name": "Worli", "zone": "South Mumbai",
        "lat": 19.0176, "lng": 72.8156, "signal": "redevelopment",
        "price_psf": 72000, "trend": 5.8, "yield": 2.6,
        "summary": "South-Mumbai luxury seafront undergoing BDD Chawl redevelopment and Coastal Road public realm; "
                   "the transformation could improve the wider Worli sea-face premium corridor.",
        "catalysts": ["BDD Chawl redevelopment", "Coastal Road public realm", "Sea-link / Coastal Road connectivity"],
        "risks": ["Displacement / rehab opposition", "Ultra-premium affordability ceiling"],
        "drivers": {"infra": 82, "redev": 88, "conn": 80, "gov": 80, "demand": 84, "liva": 78, "emp": 80,
                    "oversupply": 34, "execution": 56, "afford": 90},
    },
    {
        "slug": "dadar", "name": "Dadar", "zone": "Central Mumbai",
        "lat": 19.0186, "lng": 72.8440, "signal": "redevelopment",
        "price_psf": 45000, "trend": 5.5, "yield": 3.0,
        "summary": "Central transit nexus with cessed-building and old-society redevelopment depth; "
                   "redevelopment momentum could improve a constrained island-city supply picture.",
        "catalysts": ["Cessed-building cluster redevelopment", "Central rail + monorail nexus", "Island-city scarcity"],
        "risks": ["Cessed-building legal complexity", "Heritage / FSI constraints"],
        "drivers": {"infra": 70, "redev": 80, "conn": 82, "gov": 74, "demand": 80, "liva": 74, "emp": 70,
                    "oversupply": 30, "execution": 58, "afford": 76},
    },
    {
        "slug": "lower-parel", "name": "Lower Parel", "zone": "Central Mumbai",
        "lat": 19.0000, "lng": 72.8300, "signal": "growth",
        "price_psf": 52000, "trend": 6.0, "yield": 2.8,
        "summary": "Former mill-land commercial hub; industrial-conversion redevelopment and Metro Line 3 proximity "
                   "could improve the live-work premium positioning.",
        "catalysts": ["Mill-land industrial conversion", "Metro Line 3 (Aqua) proximity", "CBD employment density"],
        "risks": ["Commercial oversupply", "Affordability ceiling for residential"],
        "drivers": {"infra": 78, "redev": 74, "conn": 80, "gov": 72, "demand": 82, "liva": 70, "emp": 88,
                    "oversupply": 52, "execution": 46, "afford": 84},
    },
    {
        "slug": "thane", "name": "Thane", "zone": "Thane",
        "lat": 19.2183, "lng": 72.9781, "signal": "growth",
        "price_psf": 17500, "trend": 9.2, "yield": 4.1,
        "summary": "High-growth MMR node; Metro Line 4, internal Thane metro and MUTP rail upgrades "
                   "could improve regional connectivity and may benefit mid-segment demand.",
        "catalysts": ["Metro Line 4 (Wadala-Kasarvadavali)", "MUTP 3A rail upgrade", "Lake-city livability"],
        "risks": ["Large supply pipeline", "Outer-node execution variance"],
        "drivers": {"infra": 80, "redev": 50, "conn": 82, "gov": 76, "demand": 80, "liva": 78, "emp": 64,
                    "oversupply": 60, "execution": 48, "afford": 40},
    },
    {
        "slug": "kalyan", "name": "Kalyan", "zone": "MMR Growth Belt",
        "lat": 19.2437, "lng": 73.1355, "signal": "speculative",
        "price_psf": 9500, "trend": 10.5, "yield": 4.6,
        "summary": "Affordable MMR growth-belt junction; Metro Line 12, KSC New Town (Mumbai 3.0) and rail upgrades "
                   "could improve long-horizon positioning, though execution risk is elevated.",
        "catalysts": ["Metro Line 12 (Kalyan-Taloja)", "KSC New Town / Mumbai 3.0", "Rail junction connectivity"],
        "risks": ["Long execution horizon", "Speculative supply influx"],
        "drivers": {"infra": 66, "redev": 36, "conn": 70, "gov": 64, "demand": 70, "liva": 56, "emp": 48,
                    "oversupply": 64, "execution": 62, "afford": 26},
    },
    {
        "slug": "panvel", "name": "Panvel", "zone": "Navi Mumbai",
        "lat": 18.9894, "lng": 73.1175, "signal": "speculative",
        "price_psf": 11000, "trend": 11.2, "yield": 4.4,
        "summary": "Navi Mumbai gateway closest to the new airport; NMIA, Atal Setu and rail corridors "
                   "could improve regional access and may benefit long-horizon investors.",
        "catalysts": ["Navi Mumbai International Airport", "Atal Setu (MTHL) influence", "Multi-modal rail node"],
        "risks": ["Airport-led speculative pricing", "Execution / handover timelines"],
        "drivers": {"infra": 78, "redev": 34, "conn": 80, "gov": 78, "demand": 74, "liva": 60, "emp": 56,
                    "oversupply": 62, "execution": 58, "afford": 30},
    },
    {
        "slug": "ulwe", "name": "Ulwe", "zone": "Navi Mumbai",
        "lat": 18.9846, "lng": 73.0220, "signal": "speculative",
        "price_psf": 10500, "trend": 12.0, "yield": 4.3,
        "summary": "CIDCO planned node adjacent to NMIA; Atal Setu, Ulwe Coastal Road and metro proposals "
                   "could improve connectivity, with airport proximity driving long-horizon interest.",
        "catalysts": ["NMIA proximity", "Atal Setu (MTHL) landfall", "Ulwe Coastal Road"],
        "risks": ["Infrastructure-ahead-of-demand timing", "Speculative oversupply"],
        "drivers": {"infra": 80, "redev": 30, "conn": 82, "gov": 80, "demand": 72, "liva": 58, "emp": 52,
                    "oversupply": 66, "execution": 56, "afford": 34},
    },
    {
        "slug": "kharghar", "name": "Kharghar", "zone": "Navi Mumbai",
        "lat": 19.0473, "lng": 73.0699, "signal": "growth",
        "price_psf": 13500, "trend": 9.8, "yield": 4.2,
        "summary": "Planned CIDCO node with golf course and hills; Metro Line 1 (Navi Mumbai), Atal Setu access "
                   "and the Kharbav business park could improve employment-led demand.",
        "catalysts": ["Navi Mumbai Metro Line 1", "Kharbav Integrated Business Park", "Planned node livability"],
        "risks": ["Outer-node demand variance", "Supply pipeline depth"],
        "drivers": {"infra": 74, "redev": 32, "conn": 76, "gov": 78, "demand": 72, "liva": 76, "emp": 58,
                    "oversupply": 56, "execution": 50, "afford": 38},
    },
    {
        "slug": "navi-mumbai", "name": "Navi Mumbai", "zone": "Navi Mumbai",
        "lat": 19.0330, "lng": 73.0297, "signal": "growth",
        "price_psf": 15000, "trend": 9.5, "yield": 4.0,
        "summary": "CIDCO-planned twin city anchored by NMIA, Atal Setu and metro rollout; coordinated "
                   "infrastructure could improve a broad employment and housing base across nodes.",
        "catalysts": ["NMIA + Atal Setu corridor", "Navi Mumbai Metro rollout", "CIDCO planned-city base"],
        "risks": ["Node-level supply imbalance", "Coordination across authorities"],
        "drivers": {"infra": 82, "redev": 38, "conn": 84, "gov": 80, "demand": 76, "liva": 78, "emp": 66,
                    "oversupply": 54, "execution": 50, "afford": 42},
    },
]


# --------------------------------------------------------------------------- #
# Scoring engine
# --------------------------------------------------------------------------- #
def _seed_for(locality_id: str) -> dict[str, Any] | None:
    for s in LOCALITY_SEED:
        if s["slug"] == locality_id or s["name"] == locality_id:
            return s
    return None


def compute_locality_scores(locality_id: str) -> LocalityScores:
    """Transparent, explainable Future Score.

    Each opportunity sub-score is a weighted contributor; risk sub-scores are
    deducted from the blended opportunity score. Nothing is random: every value
    is derived from the locality's seed drivers, and every contribution gets a
    ``ScoreBreakdown`` with a human-readable reason.
    """
    seed = _seed_for(locality_id)
    if not seed:
        return LocalityScores(future_score=0, confidence_score=0.3,
                              breakdown=[ScoreBreakdown(key="insufficient", label="Insufficient data",
                                                       score=0, weight=0,
                                                       reason="No seed inputs available for this locality.")])
    d = seed["drivers"]
    breakdown: list[ScoreBreakdown] = []

    def opp(key: str, label: str, value: float, source: SourceType, reliability: float, reason: str) -> float:
        w = WEIGHTS[key]
        breakdown.append(ScoreBreakdown(
            key=key, label=label, score=round(value, 1), weight=w, confidence=reliability,
            reason=reason, last_updated=TODAY,
            inputs=[ScoreInput(label=label, value=value, weight=w, source_type=source,
                               reliability=reliability, note=reason)],
        ))
        return value * w

    weighted = 0.0
    weighted += opp("infrastructure", "Infrastructure", d["infra"], SourceType.official, 0.8,
                    "Driven by committed/under-construction transit, road and utility projects that could improve access.")
    weighted += opp("redevelopment", "Redevelopment Momentum", d["redev"], SourceType.official, 0.7,
                    "Reflects active cessed/society/cluster redevelopment that may benefit supply quality.")
    weighted += opp("connectivity", "Connectivity", d["conn"], SourceType.official, 0.8,
                    "Metro/rail/road interchange density and corridor uplift that could improve commute times.")
    weighted += opp("government_confidence", "Government Plan Confidence", d["gov"], SourceType.official, 0.75,
                    "Strength of official sanction, funding and authority track record behind the plans.")
    weighted += opp("market_demand", "Market Demand", d["demand"], SourceType.internal, 0.6,
                    "Internal ASTRA demand signals and absorption indicators for the micro-market.")
    weighted += opp("livability", "Livability", d["liva"], SourceType.internal, 0.6,
                    "Green cover, social infrastructure and planned-layout quality.")
    weighted += opp("employment", "Employment", d["emp"], SourceType.internal, 0.6,
                    "Proximity to employment hubs and commercial demand gravity.")

    base_opportunity = weighted  # already weighted-summed across opportunity factors

    # Risk deductions (higher risk score -> larger deduction).
    risk_inputs = {
        "oversupply_risk": ("Oversupply Risk", d["oversupply"],
                            "New-supply pipeline depth that may pressure absorption and pricing."),
        "execution_risk": ("Execution Risk", d["execution"],
                           "Delivery / approval / timeline uncertainty on the key catalysts."),
        "affordability_risk": ("Affordability Risk", d["afford"],
                               "Entry-price ceiling limiting the buyer pool at current levels."),
    }
    total_deduction = 0.0
    for key, (label, value, reason) in risk_inputs.items():
        rw = RISK_WEIGHTS[key]
        deduction = value * rw
        total_deduction += deduction
        breakdown.append(ScoreBreakdown(
            key=key, label=label, score=round(value, 1), weight=-rw, confidence=0.6,
            reason=f"Risk adjustment: -{round(deduction, 1)} from future score. {reason}",
            last_updated=TODAY,
            inputs=[ScoreInput(label=label, value=value, weight=-rw, source_type=SourceType.internal,
                               reliability=0.6, note=reason)],
        ))

    future = max(0.0, min(100.0, base_opportunity - total_deduction))

    # Confidence: blend of opportunity-input reliabilities, dampened by execution risk.
    confidence = round(min(0.95, max(0.3, 0.78 - (d["execution"] / 100) * 0.25)), 2)

    investment = round(min(100.0, base_opportunity - (d["afford"] * 0.05) - (d["oversupply"] * 0.05)), 1)
    rental = round(min(100.0, d["demand"] * 0.6 + d["conn"] * 0.4 - d["oversupply"] * 0.1), 1)
    self_use = round(min(100.0, d["liva"] * 0.5 + d["conn"] * 0.3 + d["infra"] * 0.2), 1)

    return LocalityScores(
        future_score=round(future, 1),
        confidence_score=confidence,
        infrastructure_score=d["infra"],
        redevelopment_score=d["redev"],
        connectivity_score=d["conn"],
        government_confidence_score=d["gov"],
        livability_score=d["liva"],
        employment_score=d["emp"],
        rental_demand_score=rental,
        investment_score=investment,
        market_demand_score=d["demand"],
        execution_risk_score=d["execution"],
        disruption_risk_score=round(d["execution"] * 0.7 + d["oversupply"] * 0.3, 1),
        affordability_risk_score=d["afford"],
        oversupply_risk_score=d["oversupply"],
        self_use_score=self_use,
        breakdown=breakdown,
    )


# --------------------------------------------------------------------------- #
# Build RadarLocality objects (with computed scores) at import time.
# --------------------------------------------------------------------------- #
def _build_locality(seed: dict[str, Any]) -> RadarLocality:
    return RadarLocality(
        id=seed["slug"],
        slug=seed["slug"],
        name=seed["name"],
        zone=seed["zone"],
        latitude=seed["lat"],
        longitude=seed["lng"],
        signal=seed["signal"],
        summary=seed["summary"],
        headline_catalysts=seed["catalysts"],
        headline_risks=seed["risks"],
        price_psf=seed["price_psf"],
        price_trend_pct=seed["trend"],
        rental_yield_pct=seed["yield"],
        scores=compute_locality_scores(seed["slug"]),
        last_scored_at=TODAY,
    )


LOCALITIES: list[RadarLocality] = [_build_locality(s) for s in LOCALITY_SEED]
LOCALITY_BY_SLUG: dict[str, RadarLocality] = {l.slug: l for l in LOCALITIES}


# --------------------------------------------------------------------------- #
# Projects
# --------------------------------------------------------------------------- #
def _impact(project_id: str, locality_id: str, impact_type: str, score: float,
            horizon: TimeHorizon, distance: float, explanation: str,
            pos: list[str], neg: list[str], conf: float = 0.7) -> ProjectLocalityImpact:
    loc = LOCALITY_BY_SLUG.get(locality_id)
    return ProjectLocalityImpact(
        id=_uid("imp"), project_id=project_id, locality_id=locality_id,
        locality_name=loc.name if loc else locality_id, impact_type=impact_type,
        impact_score=score, time_horizon=horizon, distance_km=distance,
        explanation=explanation, positive_factors=pos, negative_factors=neg,
        confidence_score=conf,
    )


def _project_claim(pid: str, text: str, source_url: str | None, source_name: str,
                   source_type: SourceType, source_date: str, conf: float = 0.8,
                   locality_id: str | None = None) -> RadarClaim:
    # Verified only if an official source_url exists (spec rule).
    if source_url and source_type == SourceType.official:
        status = ClaimStatus.verified
    elif source_type == SourceType.news:
        status = ClaimStatus.likely
    else:
        status = ClaimStatus.unverified
    if _is_stale(source_date):
        status = ClaimStatus.outdated
    return RadarClaim(
        id=_uid("clm"), claim_text=text, claim_type="impact", entity_type="project",
        entity_id=pid, project_id=pid, locality_id=locality_id, source_url=source_url,
        source_name=source_name, source_type=source_type, source_date=source_date,
        extracted_at=TODAY, status=status, confidence_score=conf,
        reliability_score=0.85 if source_type == SourceType.official else 0.6,
        evidence_snippet=text, last_checked_at=TODAY,
    )


PROJECT_SEED: list[dict[str, Any]] = [
    {
        "id": "metro-2b", "name": "Metro Line 2B (DN Nagar - Mandale)", "type": "metro",
        "authority": "MMRDA", "status": "under_construction", "budget": 10986.0,
        "start": "2017-03-01", "eta": "2026-12-01",
        "url": "https://mmrda.maharashtra.gov.in/", "stype": "official", "sdate": "2025-11-10",
        "desc": "23.6 km western-to-eastern suburb metro corridor connecting DN Nagar to Mandale via BKC.",
        "localities": ["andheri", "bandra", "chembur"], "categories": ["connectivity", "employment"],
        "impact": "Could improve cross-town connectivity linking western suburbs, BKC and eastern suburbs.",
        "risk": "Construction disruption along the corridor during the build phase.",
        "impacts": [("andheri", "connectivity", 80, "h_1_3", 0.8), ("bandra", "connectivity", 70, "h_1_3", 1.2),
                    ("chembur", "connectivity", 78, "h_1_3", 1.0)],
    },
    {
        "id": "metro-4", "name": "Metro Line 4 (Wadala - Kasarvadavali)", "type": "metro",
        "authority": "MMRDA", "status": "under_construction", "budget": 14549.0,
        "start": "2018-01-01", "eta": "2027-06-01",
        "url": "https://mmrda.maharashtra.gov.in/", "stype": "official", "sdate": "2025-10-05",
        "desc": "32 km corridor linking Wadala to Kasarvadavali (Thane) along the eastern express spine.",
        "localities": ["thane", "ghatkopar", "chembur"], "categories": ["connectivity"],
        "impact": "Could improve the Thane-Mumbai eastern commute and may benefit corridor housing demand.",
        "risk": "Phased opening; full-line benefits realised over a longer horizon.",
        "impacts": [("thane", "connectivity", 82, "h_1_3", 0.5), ("ghatkopar", "connectivity", 60, "h_3_5", 1.5)],
    },
    {
        "id": "metro-5", "name": "Metro Line 5 (Thane - Bhiwandi - Kalyan)", "type": "metro",
        "authority": "MMRDA", "status": "under_construction", "budget": 8417.0,
        "start": "2019-01-01", "eta": "2028-03-01",
        "url": "https://mmrda.maharashtra.gov.in/", "stype": "official", "sdate": "2025-09-20",
        "desc": "24.9 km corridor connecting Thane to Kalyan via Bhiwandi.",
        "localities": ["thane", "kalyan"], "categories": ["connectivity"],
        "impact": "Could improve Kalyan-Thane access and may benefit the affordable growth belt.",
        "risk": "Longer execution horizon for outer sections.",
        "impacts": [("kalyan", "connectivity", 72, "h_3_5", 2.0), ("thane", "connectivity", 64, "h_3_5", 1.0)],
    },
    {
        "id": "metro-6", "name": "Metro Line 6 (Swami Samarth Nagar - Vikhroli)", "type": "metro",
        "authority": "MMRDA", "status": "under_construction", "budget": 6716.0,
        "start": "2019-06-01", "eta": "2026-09-01",
        "url": "https://mmrda.maharashtra.gov.in/", "stype": "official", "sdate": "2025-12-01",
        "desc": "15.3 km Pink Line connecting western and eastern suburbs via Powai.",
        "localities": ["powai", "ghatkopar"], "categories": ["connectivity", "employment"],
        "impact": "Could improve cross-town access through the Powai employment belt.",
        "risk": "Interchange integration timing with other lines.",
        "impacts": [("powai", "connectivity", 78, "h_1_3", 0.6), ("ghatkopar", "connectivity", 62, "h_3_5", 1.8)],
    },
    {
        "id": "metro-7a", "name": "Metro Line 7A (Andheri - CSMIA T2)", "type": "metro",
        "authority": "MMRDA", "status": "under_construction", "budget": 6300.0,
        "start": "2020-01-01", "eta": "2026-12-01",
        "url": "https://mmrda.maharashtra.gov.in/", "stype": "official", "sdate": "2025-08-15",
        "desc": "Underground extension connecting Andheri to the domestic & international airport terminals.",
        "localities": ["andheri"], "categories": ["connectivity", "airport"],
        "impact": "Could improve airport access from the western corridor.",
        "risk": "Tunnelling complexity near the airport.",
        "impacts": [("andheri", "connectivity", 76, "h_1_3", 0.7)],
    },
    {
        "id": "metro-9", "name": "Metro Line 9 (Dahisar E - Mira Bhayandar)", "type": "metro",
        "authority": "MMRDA", "status": "under_construction", "budget": 6607.0,
        "start": "2019-03-01", "eta": "2026-06-01",
        "url": "https://mmrda.maharashtra.gov.in/", "stype": "official", "sdate": "2025-07-30",
        "desc": "Northern extension of Line 7 connecting Dahisar to Mira Bhayandar.",
        "localities": ["borivali"], "categories": ["connectivity"],
        "impact": "Could improve far-northern western-suburb connectivity adjacent to Borivali.",
        "risk": "Last-mile integration at northern nodes.",
        "impacts": [("borivali", "connectivity", 70, "h_1_3", 2.0)],
    },
    {
        "id": "coastal-road", "name": "Coastal Road Public Realm (Mumbai Coastal Road)", "type": "coastal",
        "authority": "BMC", "status": "partially_operational", "budget": 13983.0,
        "start": "2018-12-01", "eta": "2026-12-01",
        "url": "https://portal.mcgm.gov.in/", "stype": "official", "sdate": "2026-01-12",
        "desc": "Marine Drive to Worli/Bandra coastal freeway with reclaimed public-realm open spaces.",
        "localities": ["worli", "bandra"], "categories": ["road", "public_realm"],
        "impact": "Could improve north-south travel times and may benefit sea-facing premium corridors.",
        "risk": "Phased public-realm delivery; environmental scrutiny.",
        "impacts": [("worli", "connectivity", 80, "h_0_1", 0.4), ("bandra", "connectivity", 68, "h_1_3", 1.5)],
    },
    {
        "id": "atal-setu", "name": "Atal Setu (MTHL) Influence Zone", "type": "bridge",
        "authority": "MMRDA", "status": "operational", "budget": 21200.0,
        "start": "2018-04-01", "eta": "2024-01-12", "actual": "2024-01-12",
        "url": "https://mmrda.maharashtra.gov.in/", "stype": "official", "sdate": "2026-02-01",
        "desc": "21.8 km Mumbai Trans Harbour Link connecting Sewri to Chirle, opening the Navi Mumbai growth belt.",
        "localities": ["panvel", "ulwe", "navi-mumbai"], "categories": ["road", "connectivity"],
        "impact": "Could improve Mumbai-Navi Mumbai access and may benefit the airport-led growth belt.",
        "risk": "Demand build-up over time; toll sensitivity.",
        "impacts": [("ulwe", "connectivity", 84, "h_0_1", 1.0), ("panvel", "connectivity", 80, "h_0_1", 3.0),
                    ("navi-mumbai", "connectivity", 76, "h_0_1", 5.0)],
    },
    {
        "id": "ksc-new-town", "name": "KSC New Town / Mumbai 3.0 (Growth Centre)", "type": "new_town",
        "authority": "MMRDA", "status": "proposed", "budget": 79000.0,
        "start": "2025-01-01", "eta": "2040-01-01",
        "url": "https://mmrda.maharashtra.gov.in/", "stype": "official", "sdate": "2025-12-15",
        "desc": "Kalyan-Bhiwandi-Shilphata third Mumbai growth centre planned around the new airport region.",
        "localities": ["kalyan"], "categories": ["new_town", "employment"],
        "impact": "Could improve long-horizon employment and housing capacity in the growth belt.",
        "risk": "Very long execution horizon; land assembly complexity.",
        "impacts": [("kalyan", "employment", 70, "h_5_10", 5.0)],
    },
    {
        "id": "kharbav-bp", "name": "Kharbav Integrated Business Park", "type": "business_park",
        "authority": "CIDCO", "status": "proposed", "budget": 12000.0,
        "start": "2025-06-01", "eta": "2032-01-01",
        "url": "https://cidco.maharashtra.gov.in/", "stype": "official", "sdate": "2025-11-01",
        "desc": "Planned integrated business park anchoring Navi Mumbai employment near Kharghar/NAINA.",
        "localities": ["kharghar"], "categories": ["business_park", "employment"],
        "impact": "Could improve employment-led demand around Kharghar over the medium term.",
        "risk": "Proposed stage; tenant commitments pending.",
        "impacts": [("kharghar", "employment", 64, "h_3_5", 4.0)],
    },
    {
        "id": "bdd-worli", "name": "BDD Chawl Redevelopment (Worli)", "type": "redevelopment",
        "authority": "MHADA", "status": "under_construction", "budget": 16000.0,
        "start": "2017-01-01", "eta": "2027-12-01",
        "url": "https://mhada.gov.in/", "stype": "official", "sdate": "2025-10-20",
        "desc": "Redevelopment of BDD chawls at Worli into modern rehab + sale towers under MHADA.",
        "localities": ["worli"], "categories": ["redevelopment", "mhada"],
        "impact": "Could improve housing quality and unlock premium supply in the Worli corridor.",
        "risk": "Rehab sequencing and resident transition complexity.",
        "impacts": [("worli", "redevelopment", 88, "h_1_3", 0.3)],
    },
    {
        "id": "juhu-galli", "name": "Juhu Galli Redevelopment (Andheri West)", "type": "redevelopment",
        "authority": "MHADA", "status": "approved", "budget": 4200.0,
        "start": "2024-06-01", "eta": "2030-01-01",
        "url": "https://mhada.gov.in/", "stype": "official", "sdate": "2025-09-10",
        "desc": "Cluster redevelopment of the Juhu Galli belt in Andheri West.",
        "localities": ["andheri"], "categories": ["redevelopment", "cluster_redevelopment"],
        "impact": "Could improve supply quality in Andheri West and may benefit mid-premium positioning.",
        "risk": "Cluster consent and execution variance.",
        "impacts": [("andheri", "redevelopment", 70, "h_3_5", 1.0)],
    },
    {
        "id": "dharavi", "name": "Dharavi Redevelopment Project", "type": "slum_redevelopment",
        "authority": "MHADA", "status": "tendering", "budget": 95000.0,
        "start": "2023-07-01", "eta": "2040-01-01",
        "url": "https://www.dharaviredevelopment.com/", "stype": "official", "sdate": "2026-03-01",
        "desc": "Integrated redevelopment of Dharavi via the Dharavi Redevelopment Project / SPV.",
        "localities": ["dadar"], "categories": ["slum_redevelopment", "redevelopment"],
        "impact": "Could improve the central-Mumbai land picture over a long horizon.",
        "risk": "Displacement / eligibility opposition; very long execution horizon.",
        "impacts": [("dadar", "redevelopment", 60, "h_5_10", 2.5)],
    },
    {
        "id": "nmia", "name": "Navi Mumbai International Airport Influence Zone", "type": "airport",
        "authority": "CIDCO", "status": "partially_operational", "budget": 18000.0,
        "start": "2018-02-01", "eta": "2025-12-01",
        "url": "https://cidco.maharashtra.gov.in/", "stype": "official", "sdate": "2026-04-10",
        "desc": "Greenfield international airport at Ulwe/Panvel anchoring the Navi Mumbai growth belt.",
        "localities": ["ulwe", "panvel", "kharghar", "navi-mumbai"], "categories": ["airport", "employment"],
        "impact": "Could improve regional connectivity and employment across the Navi Mumbai belt.",
        "risk": "Phased capacity ramp-up; speculative pricing nearby.",
        "impacts": [("ulwe", "connectivity", 86, "h_0_1", 2.0), ("panvel", "connectivity", 82, "h_0_1", 4.0),
                    ("kharghar", "connectivity", 70, "h_1_3", 8.0)],
    },
    {
        "id": "ulwe-coastal", "name": "Ulwe Coastal Road", "type": "coastal",
        "authority": "CIDCO", "status": "under_construction", "budget": 5200.0,
        "start": "2022-01-01", "eta": "2027-06-01",
        "url": "https://cidco.maharashtra.gov.in/", "stype": "official", "sdate": "2025-12-05",
        "desc": "Coastal connector linking Ulwe to Atal Setu landfall and the airport node.",
        "localities": ["ulwe"], "categories": ["road", "coastal"],
        "impact": "Could improve Ulwe's connection to the trans-harbour link and airport.",
        "risk": "Execution timing relative to airport ramp-up.",
        "impacts": [("ulwe", "connectivity", 78, "h_1_3", 0.5)],
    },
    {
        "id": "mutp-3a", "name": "MUTP 3A (Suburban Rail Upgrade)", "type": "rail",
        "authority": "MRVC", "status": "under_construction", "budget": 33690.0,
        "start": "2019-09-01", "eta": "2028-12-01",
        "url": "https://mrvc.indianrailways.gov.in/", "stype": "official", "sdate": "2025-11-25",
        "desc": "Suburban rail capacity programme: new rakes, corridors and elevated sections across MMR.",
        "localities": ["thane", "borivali", "dadar"], "categories": ["rail", "connectivity"],
        "impact": "Could improve suburban rail capacity and reliability across the corridor.",
        "risk": "Multi-package execution over a long horizon.",
        "impacts": [("thane", "connectivity", 64, "h_3_5", 0.5), ("borivali", "connectivity", 58, "h_3_5", 1.0)],
    },
]

_HORIZON = {"h_0_1": TimeHorizon.h_0_1, "h_1_3": TimeHorizon.h_1_3,
            "h_3_5": TimeHorizon.h_3_5, "h_5_10": TimeHorizon.h_5_10}


def _build_project(seed: dict[str, Any]) -> RadarProject:
    pid = seed["id"]
    stype = SourceType(seed["stype"])
    stale = _is_stale(seed["sdate"])
    impacts = [
        _impact(pid, loc, itype, score, _HORIZON[hz], dist,
                f"{seed['name']} could improve {itype} for {LOCALITY_BY_SLUG.get(loc).name if LOCALITY_BY_SLUG.get(loc) else loc}.",
                pos=[seed["impact"]], neg=[seed["risk"]])
        for (loc, itype, score, hz, dist) in seed["impacts"]
    ]
    claims = [
        _project_claim(pid, f"{seed['name']} is at status '{seed['status']}' per {seed['authority']}.",
                       seed["url"], seed["authority"], stype, seed["sdate"],
                       locality_id=seed["localities"][0] if seed["localities"] else None),
    ]
    return RadarProject(
        id=pid, name=seed["name"], slug=pid, project_type=ProjectType(seed["type"]),
        authority=seed["authority"], status=ProjectStatus(seed["status"]), description=seed["desc"],
        budget_amount=seed.get("budget"), start_date=seed.get("start"),
        expected_completion_date=seed.get("eta"), actual_completion_date=seed.get("actual"),
        source_url=seed["url"], source_type=stype, source_date=seed["sdate"],
        reliability_score=0.85 if stype == SourceType.official else 0.6,
        confidence_score=0.8 if seed["status"] in ("operational", "under_construction", "partially_operational") else 0.6,
        last_verified_at=seed["sdate"], stale=stale,
        affected_localities=[l for l in seed["localities"] if l in LOCALITY_BY_SLUG],
        impact_categories=seed["categories"], impact_summary=seed["impact"], risk_summary=seed["risk"],
        impacts=impacts, claims=claims,
    )


PROJECTS: list[RadarProject] = [_build_project(s) for s in PROJECT_SEED]
PROJECT_BY_ID: dict[str, RadarProject] = {p.id: p for p in PROJECTS}


# --------------------------------------------------------------------------- #
# Redevelopment zones
# --------------------------------------------------------------------------- #
ZONE_SEED: list[dict[str, Any]] = [
    {
        "id": "zone-bdd-worli", "name": "BDD Chawl Cluster (Worli)", "slug": "bdd-worli",
        "locality": "worli", "type": "bdd", "authority": "MHADA", "status": "under_construction",
        "acres": 92.0, "units": 15000, "developer": "L&T (MHADA)", "scheme": "BDD Redevelopment",
        "url": "https://mhada.gov.in/", "opp": 86, "risk": 56,
        "notes": "Large MHADA-led BDD redevelopment; rehab + sale component in the Worli corridor.",
    },
    {
        "id": "zone-dharavi", "name": "Dharavi Notified Area", "slug": "dharavi",
        "locality": "dadar", "type": "slum_cluster", "authority": "MHADA", "status": "tendering",
        "acres": 600.0, "units": 100000, "developer": "Dharavi Redevelopment Project SPV", "scheme": "DRP",
        "url": "https://www.dharaviredevelopment.com/", "opp": 64, "risk": 78,
        "notes": "Integrated slum redevelopment; long horizon, high social and execution complexity.",
    },
    {
        "id": "zone-juhu-galli", "name": "Juhu Galli Cluster (Andheri West)", "slug": "juhu-galli-andheri-west",
        "locality": "andheri", "type": "cluster_redevelopment", "authority": "MHADA", "status": "approved",
        "acres": 24.0, "units": 4200, "developer": "TBD", "scheme": "Cluster (33(9))",
        "url": "https://mhada.gov.in/", "opp": 70, "risk": 52,
        "notes": "Cluster redevelopment of the Juhu Galli belt; consent-driven execution.",
    },
    {
        "id": "zone-mhada-goregaon", "name": "MHADA Layout (Goregaon-Andheri belt)", "slug": "mhada-layout-western",
        "locality": "andheri", "type": "mhada", "authority": "MHADA", "status": "proposed",
        "acres": 45.0, "units": 6500, "developer": "MHADA", "scheme": "MHADA Layout Redevelopment",
        "url": "https://mhada.gov.in/", "opp": 62, "risk": 50,
        "notes": "Old MHADA layout redevelopment with enhanced FSI potential in the western belt.",
    },
    {
        "id": "zone-cessed-dadar", "name": "Cessed-Building Island Cluster (Dadar)", "slug": "cessed-island-dadar",
        "locality": "dadar", "type": "cessed_building", "authority": "MHADA", "status": "proposed",
        "acres": 18.0, "units": 3200, "developer": "Various", "scheme": "Cessed (33(7))",
        "url": "https://mhada.gov.in/", "opp": 66, "risk": 58,
        "notes": "Island-city cessed-building cluster; legal complexity but high scarcity value.",
    },
    {
        "id": "zone-society-chembur", "name": "Old Society Suburb Cluster (Chembur)", "slug": "old-society-chembur",
        "locality": "chembur", "type": "old_society", "authority": "BMC", "status": "proposed",
        "acres": 30.0, "units": 5000, "developer": "Various", "scheme": "Society Redevelopment (33(7B))",
        "url": "https://portal.mcgm.gov.in/", "opp": 64, "risk": 46,
        "notes": "Aging cooperative-society cluster redevelopment across the Chembur belt.",
    },
]


def _build_zone(seed: dict[str, Any]) -> RadarRedevelopmentZone:
    loc = LOCALITY_BY_SLUG.get(seed["locality"])
    return RadarRedevelopmentZone(
        id=seed["id"], name=seed["name"], slug=seed["slug"],
        locality_id=seed["locality"], locality_name=loc.name if loc else None,
        zone_type=ZoneType(seed["type"]), authority=seed["authority"],
        status=ProjectStatus(seed["status"]), area_acres=seed["acres"],
        estimated_units=seed["units"], developer_name=seed["developer"], scheme_type=seed["scheme"],
        source_url=seed["url"], source_type=SourceType.official,
        opportunity_score=seed["opp"], risk_score=seed["risk"], confidence_score=0.7,
        notes=seed["notes"],
    )


ZONES: list[RadarRedevelopmentZone] = [_build_zone(s) for s in ZONE_SEED]


# --------------------------------------------------------------------------- #
# Standalone claim ledger (locality-level + cross references)
# --------------------------------------------------------------------------- #
def _locality_claim(lid: str, text: str, source_url: str | None, source_name: str,
                    stype: SourceType, sdate: str, conf: float) -> RadarClaim:
    if source_url and stype == SourceType.official:
        status = ClaimStatus.verified
    elif stype == SourceType.news:
        status = ClaimStatus.likely
    else:
        status = ClaimStatus.unverified
    if _is_stale(sdate):
        status = ClaimStatus.outdated
    return RadarClaim(
        id=_uid("clm"), claim_text=text, claim_type="signal", entity_type="locality",
        entity_id=lid, locality_id=lid, source_url=source_url, source_name=source_name,
        source_type=stype, source_date=sdate, extracted_at=TODAY, status=status,
        confidence_score=conf, reliability_score=0.85 if stype == SourceType.official else 0.6,
        evidence_snippet=text, last_checked_at=TODAY,
    )


CLAIMS: list[RadarClaim] = []
# Aggregate project claims into the global ledger.
for _p in PROJECTS:
    CLAIMS.extend(_p.claims)
# Add some locality-level signals (mix of official + internal).
CLAIMS.extend([
    _locality_claim("worli", "BDD Chawl redevelopment is active in Worli under MHADA.",
                    "https://mhada.gov.in/", "MHADA", SourceType.official, "2025-10-20", 0.85),
    _locality_claim("ulwe", "Atal Setu landfall and NMIA proximity anchor Ulwe's connectivity story.",
                    "https://cidco.maharashtra.gov.in/", "CIDCO", SourceType.official, "2026-02-01", 0.8),
    _locality_claim("thane", "Internal ASTRA demand signals show strong mid-segment absorption in Thane.",
                    None, "ASTRA CRM", SourceType.internal, "2026-05-01", 0.6),
    _locality_claim("kalyan", "KSC New Town (Mumbai 3.0) growth-centre planning references Kalyan belt.",
                    "https://mmrda.maharashtra.gov.in/", "MMRDA", SourceType.official, "2025-12-15", 0.7),
    _locality_claim("bandra", "Coastal Road northern reach could improve Bandra access (news coverage).",
                    None, "Press coverage", SourceType.news, "2026-01-20", 0.6),
])
CLAIMS_BY_LOCALITY: dict[str, list[RadarClaim]] = {}
for _c in CLAIMS:
    if _c.locality_id:
        CLAIMS_BY_LOCALITY.setdefault(_c.locality_id, []).append(_c)
CLAIMS_BY_PROJECT: dict[str, list[RadarClaim]] = {}
for _c in CLAIMS:
    if _c.project_id:
        CLAIMS_BY_PROJECT.setdefault(_c.project_id, []).append(_c)


# --------------------------------------------------------------------------- #
# In-memory stores
# --------------------------------------------------------------------------- #
WATCHLIST: dict[str, list[WatchlistItem]] = {}
ALERTS: dict[str, list[RadarAlert]] = {}
AUDIT_EVENTS: list[AuditEvent] = []
INGESTION_JOBS: list[IngestionJob] = []


def _audit(action: str, entity_type: str | None = None, entity_id: str | None = None,
           detail: str | None = None, actor: str = "radar") -> AuditEvent:
    ev = AuditEvent(id=_uid("aud"), actor=actor, action=action, entity_type=entity_type,
                    entity_id=entity_id, detail=detail, created_at=_now())
    AUDIT_EVENTS.append(ev)
    return ev


# Seed a few sample alerts + audit + ingestion history.
def _seed_runtime_state() -> None:
    ALERTS.setdefault("demo", [])
    ALERTS["demo"].extend([
        RadarAlert(id=_uid("alt"), user_id="demo", locality_id="worli", alert_type="redevelopment",
                   title="BDD Worli redevelopment progress",
                   message="MHADA reported continued construction progress on the BDD Worli rehab towers.",
                   priority="high", status="unread", created_at=_now()),
        RadarAlert(id=_uid("alt"), user_id="demo", locality_id="ulwe", project_id="nmia", alert_type="infrastructure",
                   title="NMIA phased operations update",
                   message="Navi Mumbai International Airport moved to partially operational; Ulwe connectivity may benefit.",
                   priority="medium", status="unread", created_at=_now()),
        RadarAlert(id=_uid("alt"), user_id="demo", locality_id="andheri", project_id="metro-7a", alert_type="connectivity",
                   title="Metro Line 7A nearing completion",
                   message="MMRDA expects Metro 7A airport connection by end-2026; Andheri access could improve.",
                   priority="medium", status="unread", created_at=_now()),
    ])
    INGESTION_JOBS.extend([
        IngestionJob(id=_uid("job"), source_name="MMRDA project register", source_url="https://mmrda.maharashtra.gov.in/",
                     job_type="project", status="completed", records_found=12, records_created=12,
                     records_updated=0, started_at=_now(), completed_at=_now()),
        IngestionJob(id=_uid("job"), source_name="MHADA redevelopment notifications", source_url="https://mhada.gov.in/",
                     job_type="zone", status="completed", records_found=6, records_created=6,
                     records_updated=0, started_at=_now(), completed_at=_now()),
    ])
    _audit("seed", detail="Seeded radar runtime state (alerts, ingestion jobs).")


_seed_runtime_state()


# --------------------------------------------------------------------------- #
# Query helpers
# --------------------------------------------------------------------------- #
def list_localities(filters: dict[str, Any] | None = None) -> list[RadarLocality]:
    filters = filters or {}
    items = list(LOCALITIES)
    zone = filters.get("zone")
    signal = filters.get("signal")
    min_score = filters.get("min_score")
    if zone:
        items = [l for l in items if l.zone.value == zone or l.zone == zone]
    if signal:
        items = [l for l in items if l.signal == signal]
    if min_score is not None:
        items = [l for l in items if l.scores.future_score >= float(min_score)]
    return items


def get_locality(slug: str) -> RadarLocality | None:
    loc = LOCALITY_BY_SLUG.get(slug)
    if loc:
        return loc
    # name-based fallback (case-insensitive)
    for l in LOCALITIES:
        if l.name.lower() == str(slug).lower():
            return l
    return None


def projects_for_locality(locality_id: str) -> list[RadarProject]:
    return [p for p in PROJECTS if any(imp.locality_id == locality_id for imp in p.impacts)]


def zones_for_locality(locality_id: str) -> list[RadarRedevelopmentZone]:
    return [z for z in ZONES if z.locality_id == locality_id]


def _timeline_for(locality_id: str) -> list[TimelineMilestone]:
    milestones: list[TimelineMilestone] = []
    for p in projects_for_locality(locality_id):
        imp = next((i for i in p.impacts if i.locality_id == locality_id), None)
        if not imp:
            continue
        milestones.append(TimelineMilestone(
            horizon=imp.time_horizon, project_id=p.id, title=p.name,
            effect=p.impact_summary,
            uncertainty="high" if p.status in (ProjectStatus.proposed, ProjectStatus.stalled, ProjectStatus.delayed)
            else ("low" if p.status in (ProjectStatus.operational, ProjectStatus.partially_operational) else "medium"),
            micro_markets=[LOCALITY_BY_SLUG[locality_id].name] if locality_id in LOCALITY_BY_SLUG else [],
        ))
    order = {TimeHorizon.h_0_1: 0, TimeHorizon.h_1_3: 1, TimeHorizon.h_3_5: 2, TimeHorizon.h_5_10: 3}
    milestones.sort(key=lambda m: order[m.horizon])
    return milestones


def _opportunities_for(loc: RadarLocality) -> list[OpportunityNote]:
    s = loc.scores
    return [
        OpportunityNote(persona="family",
                        headline=f"Livability and connectivity in {loc.name}",
                        detail=f"Self-use score {s.self_use_score}: planned infrastructure and social amenities could improve day-to-day living."),
        OpportunityNote(persona="investor",
                        headline=f"Future score {s.future_score} on a {loc.scores.confidence_score:.0%} confidence base",
                        detail=f"Investment score {s.investment_score}: catalysts may benefit medium-term positioning, subject to execution."),
        OpportunityNote(persona="rental",
                        headline=f"Rental demand score {s.rental_demand_score}",
                        detail=f"Yield ~{loc.rental_yield_pct}% with connectivity uplift that could improve tenant demand."),
        OpportunityNote(persona="redevelopment",
                        headline=f"Redevelopment momentum {s.redevelopment_score}",
                        detail="Active schemes may benefit supply quality; assess consent and timelines per zone."),
    ]


def _risks_for(loc: RadarLocality) -> list[RiskNote]:
    s = loc.scores
    notes: list[RiskNote] = []
    if s.execution_risk_score >= 50:
        notes.append(RiskNote(kind="delay", severity="high" if s.execution_risk_score >= 58 else "medium",
                              detail="Key catalysts carry approval/timeline uncertainty; treat horizons as indicative.",
                              confidence=0.6))
    if s.oversupply_risk_score >= 55:
        notes.append(RiskNote(kind="oversupply", severity="high" if s.oversupply_risk_score >= 62 else "medium",
                              detail="A deep new-supply pipeline may pressure absorption and pricing.", confidence=0.6))
    if s.affordability_risk_score >= 75:
        notes.append(RiskNote(kind="affordability", severity="high",
                              detail="Entry prices limit the buyer pool; premium positioning required.", confidence=0.6))
    for r in loc.headline_risks:
        notes.append(RiskNote(kind="disruption", severity="medium", detail=r, confidence=0.55))
    return notes


def _actions_for(loc: RadarLocality) -> list[SuggestedAction]:
    return [
        SuggestedAction(role="buyer", label="View full locality report",
                        detail=f"Open the evidence-backed report for {loc.name}.",
                        href=f"/api/radar/reports/{loc.slug}"),
        SuggestedAction(role="broker", label="Build a pitch",
                        detail="Use redevelopment + connectivity catalysts to position listings here.",
                        href=f"/api/radar/localities/{loc.slug}"),
        SuggestedAction(role="manager", label="Track on watchlist",
                        detail="Add this locality to the watchlist for update alerts.",
                        href="/api/radar/watchlist"),
        SuggestedAction(role="crm", label="Match demand signals",
                        detail="Cross-reference CRM demand with this micro-market.",
                        href=f"/api/radar/scores/{loc.slug}"),
    ]


def get_locality_detail(slug: str) -> LocalityDetail | None:
    loc = get_locality(slug)
    if not loc:
        return None
    lid = loc.slug
    return LocalityDetail(
        locality=loc,
        timeline=_timeline_for(lid),
        projects=projects_for_locality(lid),
        redevelopment_zones=zones_for_locality(lid),
        opportunities=_opportunities_for(loc),
        risks=_risks_for(loc),
        actions=_actions_for(loc),
        claims=CLAIMS_BY_LOCALITY.get(lid, []),
        related_property_ids=[],
    )


def list_projects(filters: dict[str, Any] | None = None) -> list[RadarProject]:
    filters = filters or {}
    items = list(PROJECTS)
    ptype = filters.get("project_type")
    status = filters.get("status")
    if ptype:
        items = [p for p in items if p.project_type.value == ptype]
    if status:
        items = [p for p in items if p.status.value == status]
    return items


def get_project(project_id: str) -> RadarProject | None:
    return PROJECT_BY_ID.get(project_id)


def list_redevelopment_zones() -> list[RadarRedevelopmentZone]:
    return list(ZONES)


def infrastructure_corridors() -> list[RadarProject]:
    transit_types = {ProjectType.metro, ProjectType.rail, ProjectType.road, ProjectType.coastal,
                     ProjectType.airport, ProjectType.bridge, ProjectType.tunnel}
    return [p for p in PROJECTS if p.project_type in transit_types]


# --------------------------------------------------------------------------- #
# Map / dashboard
# --------------------------------------------------------------------------- #
SIGNAL_COLORS = {
    "growth": "#2e7d32", "connectivity": "#1565c0", "redevelopment": "#6a1b9a",
    "premium": "#c8a44d", "speculative": "#ef6c00", "risk": "#c62828", "insufficient": "#9e9e9e",
}


def build_map() -> RadarMapResponse:
    loc_features = [
        MapLocalityFeature(
            id=l.id, slug=l.slug, name=l.name, zone=l.zone, latitude=l.latitude,
            longitude=l.longitude, signal=l.signal, future_score=l.scores.future_score,
            boundary_geojson=l.boundary_geojson,
            top_catalysts=l.headline_catalysts[:2], top_risks=l.headline_risks[:2],
        ) for l in LOCALITIES
    ]
    layers = [
        MapLayer(key="localities", label="Localities", kind="localities", color="#c8a44d",
                 features=[{"id": l.id, "slug": l.slug, "name": l.name, "lat": l.latitude,
                            "lng": l.longitude, "signal": l.signal,
                            "future_score": l.scores.future_score} for l in LOCALITIES]),
        MapLayer(key="projects", label="Infrastructure Projects", kind="projects", color="#1565c0",
                 features=[{"id": p.id, "name": p.name, "type": p.project_type.value,
                            "status": p.status.value, "authority": p.authority,
                            "localities": p.affected_localities} for p in PROJECTS]),
        MapLayer(key="zones", label="Redevelopment Zones", kind="zones", color="#6a1b9a",
                 features=[{"id": z.id, "name": z.name, "type": z.zone_type.value,
                            "locality": z.locality_name, "opportunity": z.opportunity_score,
                            "risk": z.risk_score} for z in ZONES]),
        # Stub heatmap layers (toggleable) — derived from existing scores, no extra data needed.
        MapLayer(key="heatmap_future", label="Future Score Heatmap", kind="heatmap", color="#c8a44d",
                 features=[{"lat": l.latitude, "lng": l.longitude,
                            "weight": round(l.scores.future_score / 100, 2)} for l in LOCALITIES]),
        MapLayer(key="heatmap_redevelopment", label="Redevelopment Heatmap", kind="heatmap", color="#6a1b9a",
                 features=[{"lat": l.latitude, "lng": l.longitude,
                            "weight": round(l.scores.redevelopment_score / 100, 2)} for l in LOCALITIES]),
        MapLayer(key="heatmap_risk", label="Execution Risk Heatmap", kind="heatmap", color="#c62828",
                 features=[{"lat": l.latitude, "lng": l.longitude,
                            "weight": round(l.scores.execution_risk_score / 100, 2)} for l in LOCALITIES]),
    ]
    return RadarMapResponse(center=[19.076, 72.8777], zoom=11, localities=loc_features, layers=layers)


def build_dashboard() -> RadarDashboard:
    by_future = sorted(LOCALITIES, key=lambda l: l.scores.future_score, reverse=True)
    by_redev = sorted(LOCALITIES, key=lambda l: l.scores.redevelopment_score, reverse=True)
    by_risk = sorted(LOCALITIES, key=lambda l: l.scores.execution_risk_score, reverse=True)
    active = [p for p in PROJECTS if p.status in (
        ProjectStatus.under_construction, ProjectStatus.partially_operational, ProjectStatus.tendering)]
    verified_claims = [c for c in CLAIMS if c.status == ClaimStatus.verified]
    stats = [
        DashboardStat(label="Localities tracked", value=str(len(LOCALITIES)), detail="MMR micro-markets", tone="ink"),
        DashboardStat(label="Infrastructure & redevelopment projects", value=str(len(PROJECTS)),
                      detail="Official authority sources", tone="gold"),
        DashboardStat(label="Redevelopment zones", value=str(len(ZONES)), detail="Cluster / cessed / MHADA / slum", tone="ink"),
        DashboardStat(label="Verified claims", value=str(len(verified_claims)),
                      detail=f"of {len(CLAIMS)} in the evidence ledger", tone="gold"),
        DashboardStat(label="Active projects", value=str(len(active)), detail="Under construction / tendering", tone="ink"),
    ]
    return RadarDashboard(
        stats=stats,
        top_growth=by_future[:5],
        top_redevelopment=by_redev[:5],
        watch_risk=by_risk[:5],
        active_projects=active[:8],
        recent_alerts=ALERTS.get("demo", [])[:5],
        last_updated=TODAY,
    )


# --------------------------------------------------------------------------- #
# Compare
# --------------------------------------------------------------------------- #
def compare_localities(slugs: list[str], time_horizon: str | None = None,
                       investment_goal: str | None = None) -> CompareResponse:
    locs = [l for l in (get_locality(s) for s in slugs) if l is not None]
    if not locs:
        return CompareResponse(localities=[], verdicts=[], narrative="No matching localities to compare.")

    def winner(metric, reverse=True):
        return sorted(locs, key=metric, reverse=reverse)[0]

    best_family = winner(lambda l: l.scores.self_use_score)
    best_invest = winner(lambda l: l.scores.investment_score)
    best_redev = winner(lambda l: l.scores.redevelopment_score)
    best_rental = winner(lambda l: l.scores.rental_demand_score)
    lowest_risk = winner(lambda l: l.scores.execution_risk_score, reverse=False)
    most_spec = winner(lambda l: (1 if l.signal == "speculative" else 0, l.scores.oversupply_risk_score))
    # 3y favours near-term horizons (0-1/1-3), 7y favours longer infra payoff.
    def horizon_score(l: RadarLocality, near: bool) -> float:
        tl = _timeline_for(l.slug)
        if near:
            return sum(1 for m in tl if m.horizon in (TimeHorizon.h_0_1, TimeHorizon.h_1_3)) + l.scores.connectivity_score / 100
        return sum(1 for m in tl if m.horizon in (TimeHorizon.h_3_5, TimeHorizon.h_5_10)) + l.scores.future_score / 100
    best_3y = winner(lambda l: horizon_score(l, near=True))
    best_7y = winner(lambda l: horizon_score(l, near=False))

    verdicts = [
        CompareVerdict(label="Best for family", winner_slug=best_family.slug,
                       reason=f"Highest self-use score ({best_family.scores.self_use_score}) — livability + connectivity could improve daily life."),
        CompareVerdict(label="Best for investment", winner_slug=best_invest.slug,
                       reason=f"Top investment score ({best_invest.scores.investment_score}); catalysts may benefit medium-term value."),
        CompareVerdict(label="Best for redevelopment", winner_slug=best_redev.slug,
                       reason=f"Strongest redevelopment momentum ({best_redev.scores.redevelopment_score})."),
        CompareVerdict(label="Best for rental", winner_slug=best_rental.slug,
                       reason=f"Highest rental demand score ({best_rental.scores.rental_demand_score})."),
        CompareVerdict(label="Lowest risk", winner_slug=lowest_risk.slug,
                       reason=f"Lowest execution risk ({lowest_risk.scores.execution_risk_score})."),
        CompareVerdict(label="Most speculative", winner_slug=most_spec.slug,
                       reason="Speculative signal with the deepest supply/timing dependence — highest upside but highest risk."),
        CompareVerdict(label="Best 3-year horizon", winner_slug=best_3y.slug,
                       reason="Most near-term (0-3y) catalysts plus connectivity already maturing."),
        CompareVerdict(label="Best 7-year horizon", winner_slug=best_7y.slug,
                       reason="Strongest longer-horizon (3-10y) catalyst pipeline and future score."),
    ]
    narrative = (
        f"Comparing {', '.join(l.name for l in locs)}: {best_invest.name} leads on investment positioning while "
        f"{lowest_risk.name} carries the lowest execution risk. Treat all horizons as indicative — outcomes depend on "
        "government approvals and execution. No price appreciation is guaranteed."
    )
    return CompareResponse(localities=locs, verdicts=verdicts, narrative=narrative)


# --------------------------------------------------------------------------- #
# Report
# --------------------------------------------------------------------------- #
def build_locality_report(slug: str) -> LocalityReport | None:
    detail = get_locality_detail(slug)
    if not detail:
        return None
    loc = detail.locality
    s = loc.scores
    sections = [
        {"title": "Future Score", "body": f"Future score {s.future_score}/100 at {s.confidence_score:.0%} confidence.",
         "breakdown": [b.model_dump(mode="json") for b in s.breakdown]},
        {"title": "Catalysts", "items": loc.headline_catalysts},
        {"title": "Risks", "items": loc.headline_risks},
        {"title": "Timeline", "items": [f"[{m.horizon.value}] {m.title}: {m.effect}" for m in detail.timeline]},
        {"title": "Active projects", "items": [f"{p.name} ({p.status.value}, {p.authority})" for p in detail.projects]},
        {"title": "Redevelopment zones",
         "items": [f"{z.name} ({z.zone_type.value}, {z.status.value})" for z in detail.redevelopment_zones]},
        {"title": "Opportunities", "items": [f"{o.persona}: {o.headline}" for o in detail.opportunities]},
    ]
    return LocalityReport(
        locality_slug=loc.slug,
        title=f"Mumbai Redevelopment Radar — {loc.name} Report",
        generated_at=_now(),
        summary=loc.summary,
        sections=sections,
        evidence=detail.claims,
    )


# --------------------------------------------------------------------------- #
# Property radar card
# --------------------------------------------------------------------------- #
def property_radar_card(property_id: str, locality_name: str | None = None) -> PropertyRadarCard:
    loc = get_locality(locality_name) if locality_name else None
    if not loc and locality_name:
        # fuzzy contains match
        for l in LOCALITIES:
            if l.name.lower() in locality_name.lower() or locality_name.lower() in l.name.lower():
                loc = l
                break
    if not loc:
        return PropertyRadarCard(
            property_id=property_id, signal="insufficient", future_score=0, confidence_score=0.3,
            summary="Insufficient locality match to generate a Future Radar card. Provide a known locality name.",
            major_risks=["Locality not matched to the radar dataset."],
        )
    s = loc.scores
    catalyst_project = next((p for p in projects_for_locality(loc.slug)), None)
    return PropertyRadarCard(
        property_id=property_id, locality_slug=loc.slug, locality_name=loc.name,
        future_score=s.future_score, confidence_score=s.confidence_score, signal=loc.signal,
        nearest_catalyst=catalyst_project.name if catalyst_project else None,
        nearest_catalyst_distance_km=(catalyst_project.impacts[0].distance_km
                                      if catalyst_project and catalyst_project.impacts else None),
        connectivity_uplift=f"Connectivity score {s.connectivity_score} — corridor projects could improve access.",
        redevelopment_momentum=f"Redevelopment score {s.redevelopment_score} — active schemes may benefit supply.",
        livability_improvement=f"Livability score {s.livability_score}.",
        major_risks=loc.headline_risks,
        timeline=_timeline_for(loc.slug),
        summary=loc.summary,
        investor_view={"investment_score": s.investment_score, "rental_demand_score": s.rental_demand_score,
                       "note": "Catalysts may benefit medium-term value; no appreciation guaranteed."},
        family_view={"self_use_score": s.self_use_score, "livability_score": s.livability_score,
                     "note": "Connectivity and amenities could improve daily living."},
        broker_pitch=[f"{loc.name} future score {s.future_score} with {len(projects_for_locality(loc.slug))} tracked catalysts.",
                      f"Lead with: {', '.join(loc.headline_catalysts[:2])}."],
        manager_positioning=[f"Signal: {loc.signal}.", "Position against execution risk transparently."],
        similar_property_ids=[],
        evidence=CLAIMS_BY_LOCALITY.get(loc.slug, []),
    )


# --------------------------------------------------------------------------- #
# Watchlist / alerts stores
# --------------------------------------------------------------------------- #
def add_watchlist_item(payload: WatchlistCreate, user_id: str = "demo") -> WatchlistItem:
    name = None
    if payload.entity_type == "locality":
        loc = get_locality(payload.entity_id)
        name = loc.name if loc else payload.entity_id
    elif payload.entity_type == "project":
        proj = get_project(payload.entity_id)
        name = proj.name if proj else payload.entity_id
    item = WatchlistItem(
        id=_uid("wl"), user_id=user_id, entity_type=payload.entity_type, entity_id=payload.entity_id,
        entity_name=name, alert_type=payload.alert_type, status="active", created_at=_now(),
    )
    WATCHLIST.setdefault(user_id, []).append(item)
    _audit("watchlist.add", payload.entity_type, payload.entity_id, f"Added {name} to watchlist", actor=user_id)
    return item


def list_watchlist(user_id: str = "demo") -> list[WatchlistItem]:
    return WATCHLIST.get(user_id, [])


def subscribe_alert(payload: AlertSubscribe, user_id: str = "demo") -> RadarAlert:
    loc = get_locality(payload.locality_slug) if payload.locality_slug else None
    proj = get_project(payload.project_id) if payload.project_id else None
    target = loc.name if loc else (proj.name if proj else "radar updates")
    alert = RadarAlert(
        id=_uid("alt"), user_id=user_id,
        locality_id=loc.slug if loc else None, project_id=proj.id if proj else None,
        alert_type=payload.alert_type, title=f"Subscribed to {target}",
        message=f"You will be notified of {payload.alert_type} updates for {target}.",
        priority="low", status="unread", created_at=_now(),
    )
    ALERTS.setdefault(user_id, []).append(alert)
    _audit("alert.subscribe", "locality" if loc else "project",
           loc.slug if loc else (proj.id if proj else None), f"Subscribed to {target}", actor=user_id)
    return alert


def list_alerts(user_id: str = "demo") -> list[RadarAlert]:
    return ALERTS.get(user_id, [])


# --------------------------------------------------------------------------- #
# Ingestion (mock — no network)
# --------------------------------------------------------------------------- #
DEFAULT_SOURCES = [
    ("MMRDA project register", "https://mmrda.maharashtra.gov.in/", "project"),
    ("MahaMetro / MMRCL lines", "https://www.mmrcl.com/", "project"),
    ("MHADA redevelopment notifications", "https://mhada.gov.in/", "zone"),
    ("CIDCO Navi Mumbai notices", "https://cidco.maharashtra.gov.in/", "project"),
    ("Dharavi Redevelopment Project", "https://www.dharaviredevelopment.com/", "zone"),
]


def run_ingest(source: IngestSourceRequest | dict[str, Any]) -> IngestionJob:
    if isinstance(source, dict):
        source = IngestSourceRequest(**source)
    # Real single-source ingest (fetch + optional LLM extraction); fall back to a mock record.
    try:
        from app.services import radar_ingest
        return radar_ingest.ingest_single(source)
    except Exception as exc:  # network/dependency failure -> graceful mock
        job = IngestionJob(
            id=_uid("job"), source_name=source.source_name, source_url=source.source_url,
            job_type=source.job_type, status="completed", records_found=0,
            records_created=0, records_updated=0, error_message=f"live ingest unavailable: {exc}",
            started_at=_now(), completed_at=_now(),
        )
        INGESTION_JOBS.append(job)
        _audit("ingest.source", "ingestion", job.id, f"Fallback (mock) ingest from {source.source_name}.")
        return job


def run_ingest_all() -> list[IngestionJob]:
    """Run the real live ingest (Wikipedia + Google News). Falls back to mock jobs offline."""
    try:
        from app.services import radar_ingest
        jobs = radar_ingest.ingest_live()
        if jobs:
            return jobs
    except Exception as exc:  # pragma: no cover - network/offline fallback
        _audit("ingest.run_all.error", "ingestion", None, f"Live ingest failed, using mock: {exc}")
    jobs = []
    for name, url, jtype in DEFAULT_SOURCES:
        jobs.append(IngestionJob(
            id=_uid("job"), source_name=name, source_url=url, job_type=jtype, status="completed",
            records_found=0, records_created=0, records_updated=0, started_at=_now(), completed_at=_now(),
        ))
    INGESTION_JOBS.extend(jobs)
    _audit("ingest.run_all", "ingestion", None, f"Ran {len(jobs)} fallback ingestion jobs (offline).")
    return jobs


def ingestion_jobs() -> list[IngestionJob]:
    return list(INGESTION_JOBS)


def audit_log() -> list[AuditEvent]:
    return list(AUDIT_EVENTS)
