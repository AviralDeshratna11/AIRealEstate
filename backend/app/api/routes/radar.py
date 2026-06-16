"""Mumbai Redevelopment Radar API routes.

GET routes are PUBLIC (no auth dependency, like market.py). User-scoped routes
(watchlist / alerts) accept an optional user id via a lightweight dependency and
default to "demo" — they do NOT hard-require auth.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.radar_models import (
    AlertSubscribe,
    AnalyzeLocalityRequest,
    AnalyzeLocalityResponse,
    AuditEvent,
    CompareRequest,
    CompareResponse,
    IngestionJob,
    IngestSourceRequest,
    LocalityDetail,
    LocalityReport,
    LocalityScores,
    PropertyRadarCard,
    RadarAlert,
    RadarDashboard,
    RadarLocality,
    RadarMapResponse,
    RadarProject,
    RadarRedevelopmentZone,
    WatchlistCreate,
    WatchlistItem,
)
from app.agents.radar_graph import run_radar_agent
from app.services import radar_data as data

router = APIRouter(prefix="/api/radar", tags=["radar"])


def _current_user(user_id: str | None = Query(default=None, description="Optional user id; defaults to 'demo'.")) -> str:
    """Lightweight optional-user dependency. No hard auth requirement."""
    return user_id or "demo"


# --------------------------------------------------------------------------- #
# Dashboard / localities / projects
# --------------------------------------------------------------------------- #
@router.get("/dashboard", response_model=RadarDashboard)
async def get_dashboard():
    return data.build_dashboard()


@router.get("/localities", response_model=list[RadarLocality])
async def get_localities(
    zone: str | None = Query(default=None),
    signal: str | None = Query(default=None),
    min_score: float | None = Query(default=None),
):
    return data.list_localities({"zone": zone, "signal": signal, "min_score": min_score})


@router.get("/localities/{slug}", response_model=LocalityDetail)
async def get_locality_detail(slug: str):
    detail = data.get_locality_detail(slug)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Locality '{slug}' not found.")
    return detail


@router.get("/projects", response_model=list[RadarProject])
async def get_projects(
    project_type: str | None = Query(default=None),
    status: str | None = Query(default=None),
):
    return data.list_projects({"project_type": project_type, "status": status})


@router.get("/projects/{project_id}", response_model=RadarProject)
async def get_project(project_id: str):
    project = data.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")
    return project


# --------------------------------------------------------------------------- #
# Map / zones / corridors / scores
# --------------------------------------------------------------------------- #
@router.get("/map", response_model=RadarMapResponse)
async def get_map():
    return data.build_map()


@router.get("/redevelopment-zones", response_model=list[RadarRedevelopmentZone])
async def get_redevelopment_zones():
    return data.list_redevelopment_zones()


@router.get("/infrastructure-corridors", response_model=list[RadarProject])
async def get_infrastructure_corridors():
    return data.infrastructure_corridors()


@router.get("/scores/{locality_slug}", response_model=LocalityScores)
async def get_scores(locality_slug: str):
    loc = data.get_locality(locality_slug)
    if not loc:
        raise HTTPException(status_code=404, detail=f"Locality '{locality_slug}' not found.")
    return data.compute_locality_scores(loc.slug)


@router.get("/property/{property_id}", response_model=PropertyRadarCard)
async def property_radar_card(property_id: str, locality: str | None = Query(default=None)):
    """Future Value Radar card for a property page (infers locality by name)."""
    return data.property_radar_card(property_id, locality)


# --------------------------------------------------------------------------- #
# Analyze / compare (agent-backed)
# --------------------------------------------------------------------------- #
@router.post("/analyze-locality", response_model=AnalyzeLocalityResponse)
async def analyze_locality(request: AnalyzeLocalityRequest):
    loc = data.get_locality(request.locality_slug)
    result = await run_radar_agent(
        query=request.query or f"Analyze {request.locality_slug} for a {request.role}",
        role=request.role,
        locality_slug=request.locality_slug,
        investment_goal=request.investment_goal,
        risk_tolerance=request.risk_tolerance,
        time_horizon=request.time_horizon.value if request.time_horizon else None,
    )
    detail = data.get_locality_detail(request.locality_slug)
    return AnalyzeLocalityResponse(
        locality_slug=request.locality_slug,
        role=request.role,
        answer=result["answer"],
        confidence_score=result["confidence_score"],
        recommendation=result.get("recommendation_context", {}).get("narrative", ""),
        opportunities=detail.opportunities if detail else [],
        risks=detail.risks if detail else [],
        actions=detail.actions if detail else [],
        evidence=detail.claims if detail else [],
        audit_events=result["audit_events"],
    )


@router.post("/compare-localities", response_model=CompareResponse)
async def compare_localities(request: CompareRequest):
    return data.compare_localities(
        request.locality_slugs,
        time_horizon=request.time_horizon.value if request.time_horizon else None,
        investment_goal=request.investment_goal,
    )


# --------------------------------------------------------------------------- #
# Watchlist (user-scoped, optional user)
# --------------------------------------------------------------------------- #
@router.post("/watchlist", response_model=WatchlistItem)
async def create_watchlist_item(
    payload: WatchlistCreate,
    user_id: str | None = Query(default=None),
):
    return data.add_watchlist_item(payload, user_id=user_id or "demo")


@router.get("/watchlist", response_model=list[WatchlistItem])
async def get_watchlist(user_id: str | None = Query(default=None)):
    return data.list_watchlist(user_id=user_id or "demo")


# --------------------------------------------------------------------------- #
# Alerts (user-scoped, optional user)
# --------------------------------------------------------------------------- #
@router.post("/alerts", response_model=RadarAlert)
async def subscribe_alert(payload: AlertSubscribe, user_id: str | None = Query(default=None)):
    return data.subscribe_alert(payload, user_id=user_id or "demo")


@router.get("/alerts", response_model=list[RadarAlert])
async def get_alerts(user_id: str | None = Query(default=None)):
    return data.list_alerts(user_id=user_id or "demo")


# --------------------------------------------------------------------------- #
# Reports
# --------------------------------------------------------------------------- #
@router.get("/reports/{locality_slug}", response_model=LocalityReport)
async def get_report(locality_slug: str):
    report = data.build_locality_report(locality_slug)
    if not report:
        raise HTTPException(status_code=404, detail=f"Locality '{locality_slug}' not found.")
    return report


# --------------------------------------------------------------------------- #
# Ingestion / audit
# --------------------------------------------------------------------------- #
@router.post("/ingest/source", response_model=IngestionJob)
async def ingest_source(request: IngestSourceRequest):
    return data.run_ingest(request)


@router.post("/ingest/run", response_model=list[IngestionJob])
async def ingest_run():
    return data.run_ingest_all()


@router.get("/audit-log", response_model=list[AuditEvent])
async def get_audit_log():
    return data.audit_log()
