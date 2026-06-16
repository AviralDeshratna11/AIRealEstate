"""Mumbai Redevelopment Radar agent swarm (LangGraph Command routing).

8 agents over ``RadarState``. Mirrors ``app/agents/graph.py``: the same
try/except shim defines a fallback ``Command`` so this module imports and runs
even when ``langgraph`` is NOT installed. The fallback executes a deterministic
sequential router that calls ``radar_data`` helpers.

Agents:
  1. RadarOrchestrator        - intent routing by keywords
  2. GovernmentProjectIngestion - pulls official project/zone context
  3. RedevelopmentIntelligence  - redevelopment momentum + zones
  4. InfrastructureImpact       - metro/road/rail corridor impact
  5. LocalityScoring            - transparent score breakdown
  6. InvestmentNarrative        - persona-aware narrative / pitch
  7. RadarAlert                 - alert / watchlist framing
  8. EvidenceVerification       - ensures any "verified" claim has a source

All agents update state explicitly and append to ``audit_events``.
Deterministic, dependency-light, no network.
"""

from __future__ import annotations

from typing import Literal

try:
    from langgraph.graph import END, START, StateGraph
    from langgraph.types import Command
    LANGGRAPH_AVAILABLE = True
except Exception:  # pragma: no cover - fallback lets demos run before dependency install
    END = START = None
    LANGGRAPH_AVAILABLE = False

    class Command:  # type: ignore[no-redef]
        def __init__(self, update=None, goto=None):
            self.update = update or {}
            self.goto = goto

        def __class_getitem__(cls, item):
            return cls

from app.radar_models import ClaimStatus, RadarState
from app.services import radar_data as data

Route = Literal[
    "government_project_ingestion",
    "redevelopment_intelligence",
    "infrastructure_impact",
    "locality_scoring",
    "investment_narrative",
    "radar_alert",
    "evidence_verification",
    "final",
]


def _audit(state: RadarState, msg: str) -> list[str]:
    events = list(state.get("audit_events", []))
    events.append(msg)
    return events


def _resolve_slug(state: RadarState) -> str | None:
    slug = state.get("locality_slug")
    if slug:
        loc = data.get_locality(slug)
        return loc.slug if loc else None
    # try to infer from the query text
    query = (state.get("query") or "").lower()
    for loc in data.LOCALITIES:
        if loc.name.lower() in query or loc.slug in query:
            return loc.slug
    return None


# --------------------------------------------------------------------------- #
# 1. Orchestrator
# --------------------------------------------------------------------------- #
def radar_orchestrator(state: RadarState) -> Command[Route]:
    query = (state.get("query") or "").lower()
    audit = _audit(state, "RadarOrchestrator: routing intent")

    if any(k in query for k in ["compare", "versus", " vs ", "better than"]):
        route = "investment_narrative"  # compare handled via narrative + scoring
    elif any(k in query for k in ["redevelop", "cessed", "bdd", "cluster", "mhada", "slum", "dharavi"]):
        route = "redevelopment_intelligence"
    elif any(k in query for k in ["metro", "infrastructure", "connectivity", "road", "rail", "coastal", "airport", "atal setu"]):
        route = "infrastructure_impact"
    elif any(k in query for k in ["risk", "delay", "oversupply", "disruption"]):
        route = "locality_scoring"
    elif any(k in query for k in ["pitch", "narrative", "story", "positioning", "sell"]):
        route = "investment_narrative"
    elif any(k in query for k in ["alert", "watch", "notify", "subscribe"]):
        route = "radar_alert"
    elif any(k in query for k in ["invest", "buy", "yield", "rental", "appreciat", "score", "future"]):
        route = "locality_scoring"
    else:
        route = "government_project_ingestion"

    return Command(update={"route": route, "audit_events": audit}, goto=route)


# --------------------------------------------------------------------------- #
# 2. Government project ingestion
# --------------------------------------------------------------------------- #
def government_project_ingestion(state: RadarState) -> Command[Route]:
    slug = _resolve_slug(state)
    audit = _audit(state, f"GovernmentProjectIngestion: gathering official projects for {slug or 'all'}")
    projects = data.projects_for_locality(slug) if slug else data.list_projects({})
    snapshot = {
        "projects": [
            {"name": p.name, "authority": p.authority, "status": p.status.value,
             "source_url": p.source_url, "source_type": p.source_type.value,
             "last_verified_at": p.last_verified_at, "stale": p.stale}
            for p in projects
        ]
    }
    evidence = list(state.get("evidence_context", []))
    for p in projects:
        for c in p.claims:
            evidence.append(c.model_dump(mode="json"))
    answer = (
        f"Found {len(projects)} tracked government projects"
        + (f" affecting {slug}" if slug else "")
        + ". Each carries an authority, status and official source; treat timelines as indicative."
    )
    return Command(
        update={"project_snapshot": snapshot, "evidence_context": evidence, "answer": answer,
                "locality_slug": slug or state.get("locality_slug", ""), "audit_events": audit},
        goto="locality_scoring",
    )


# --------------------------------------------------------------------------- #
# 3. Redevelopment intelligence
# --------------------------------------------------------------------------- #
def redevelopment_intelligence(state: RadarState) -> Command[Route]:
    slug = _resolve_slug(state)
    audit = _audit(state, f"RedevelopmentIntelligence: scanning zones for {slug or 'all'}")
    zones = data.zones_for_locality(slug) if slug else data.list_redevelopment_zones()
    snapshot = {
        "zones": [
            {"name": z.name, "type": z.zone_type.value, "authority": z.authority,
             "status": z.status.value, "opportunity": z.opportunity_score, "risk": z.risk_score,
             "source_url": z.source_url}
            for z in zones
        ]
    }
    answer = (
        f"Identified {len(zones)} redevelopment zone(s)"
        + (f" in {slug}" if slug else "")
        + ". Active schemes may benefit supply quality; assess consent and execution risk per zone."
    )
    return Command(
        update={"recommendation_context": {**state.get("recommendation_context", {}), **snapshot},
                "answer": answer, "locality_slug": slug or state.get("locality_slug", ""),
                "audit_events": audit},
        goto="locality_scoring",
    )


# --------------------------------------------------------------------------- #
# 4. Infrastructure impact
# --------------------------------------------------------------------------- #
def infrastructure_impact(state: RadarState) -> Command[Route]:
    slug = _resolve_slug(state)
    audit = _audit(state, f"InfrastructureImpact: assessing corridors for {slug or 'all'}")
    corridors = [p for p in data.infrastructure_corridors()
                 if (not slug) or any(i.locality_id == slug for i in p.impacts)]
    snapshot = {
        "corridors": [
            {"name": p.name, "type": p.project_type.value, "status": p.status.value,
             "impact_summary": p.impact_summary, "risk_summary": p.risk_summary}
            for p in corridors
        ]
    }
    answer = (
        f"{len(corridors)} infrastructure corridor(s) could improve connectivity"
        + (f" for {slug}" if slug else "")
        + ". Connectivity uplift is indicative and subject to phased delivery."
    )
    return Command(
        update={"market_context": {**state.get("market_context", {}), **snapshot},
                "answer": answer, "locality_slug": slug or state.get("locality_slug", ""),
                "audit_events": audit},
        goto="locality_scoring",
    )


# --------------------------------------------------------------------------- #
# 5. Locality scoring
# --------------------------------------------------------------------------- #
def locality_scoring(state: RadarState) -> Command[Route]:
    slug = _resolve_slug(state)
    audit = _audit(state, f"LocalityScoring: computing transparent scores for {slug or 'n/a'}")
    if not slug:
        return Command(
            update={"answer": state.get("answer", "Specify a locality to score."),
                    "confidence_score": 0.4, "audit_events": audit},
            goto="investment_narrative",
        )
    scores = data.compute_locality_scores(slug)
    loc = data.get_locality(slug)
    snapshot = {
        "future_score": scores.future_score,
        "confidence_score": scores.confidence_score,
        "breakdown": [{"label": b.label, "score": b.score, "weight": b.weight, "reason": b.reason}
                      for b in scores.breakdown],
    }
    return Command(
        update={"scoring_context": snapshot, "confidence_score": scores.confidence_score,
                "locality_snapshot": {"name": loc.name if loc else slug, "signal": loc.signal if loc else "insufficient",
                                      "future_score": scores.future_score},
                "audit_events": audit},
        goto="investment_narrative",
    )


# --------------------------------------------------------------------------- #
# 6. Investment narrative
# --------------------------------------------------------------------------- #
def investment_narrative(state: RadarState) -> Command[Route]:
    query = (state.get("query") or "").lower()
    role = state.get("role", "buyer")
    audit = _audit(state, f"InvestmentNarrative: building {role} narrative")

    # Compare intent: handle inline via radar_data.compare_localities.
    if any(k in query for k in ["compare", "versus", " vs ", "better than"]):
        slugs = [l.slug for l in data.LOCALITIES if l.name.lower() in query or l.slug in query][:4]
        if len(slugs) >= 2:
            cmp = data.compare_localities(slugs)
            return Command(update={"answer": cmp.narrative, "recommendation_context":
                                   {"verdicts": [v.model_dump() for v in cmp.verdicts]},
                                   "audit_events": audit}, goto="evidence_verification")

    slug = _resolve_slug(state)
    if not slug:
        return Command(update={"answer": state.get("answer", "Tell me which Mumbai locality to analyse."),
                               "audit_events": audit}, goto="evidence_verification")
    loc = data.get_locality(slug)
    s = loc.scores
    persona_line = {
        "investor": f"Investment score {s.investment_score}: catalysts may benefit medium-term positioning.",
        "family": f"Self-use score {s.self_use_score}: livability and connectivity could improve daily life.",
        "broker": f"Lead with {', '.join(loc.headline_catalysts[:2])} — future score {s.future_score}.",
        "rental": f"Rental demand score {s.rental_demand_score} at ~{loc.rental_yield_pct}% yield.",
    }.get(role, f"Future score {s.future_score} at {s.confidence_score:.0%} confidence.")
    answer = (
        f"{loc.name} — {loc.summary} {persona_line} "
        f"Key risks: {', '.join(loc.headline_risks)}. No price appreciation is guaranteed; "
        "outcomes depend on government approvals and execution."
    )
    return Command(
        update={"answer": answer, "recommendation_context":
                {**state.get("recommendation_context", {}), "narrative": answer},
                "audit_events": audit},
        goto="evidence_verification",
    )


# --------------------------------------------------------------------------- #
# 7. Radar alert
# --------------------------------------------------------------------------- #
def radar_alert(state: RadarState) -> Command[Route]:
    slug = _resolve_slug(state)
    audit = _audit(state, f"RadarAlert: framing alert/watch for {slug or 'n/a'}")
    loc = data.get_locality(slug) if slug else None
    if loc:
        answer = (f"You can watch {loc.name} for {loc.signal} updates. "
                  f"Recent catalysts: {', '.join(loc.headline_catalysts[:2])}.")
    else:
        answer = "Specify a locality or project to set up radar alerts."
    return Command(
        update={"answer": answer, "next_action": "subscribe_alert", "audit_events": audit},
        goto="evidence_verification",
    )


# --------------------------------------------------------------------------- #
# 8. Evidence verification
# --------------------------------------------------------------------------- #
def evidence_verification(state: RadarState) -> Command[Literal["final"]]:
    audit = _audit(state, "EvidenceVerification: enforcing source-backed claims")
    slug = state.get("locality_slug")
    claims = data.CLAIMS_BY_LOCALITY.get(slug, []) if slug else []
    # Enforce spec rule: a claim is only `verified` if it has an official source_url.
    safe_evidence = []
    for c in claims:
        cd = c.model_dump(mode="json")
        if cd.get("status") == ClaimStatus.verified.value and not cd.get("source_url"):
            cd["status"] = ClaimStatus.unverified.value
        safe_evidence.append(cd)
    verified = sum(1 for c in safe_evidence if c["status"] == ClaimStatus.verified.value)
    audit = _audit({"audit_events": audit}, f"EvidenceVerification: {verified}/{len(safe_evidence)} claims verified")
    confidence = state.get("confidence_score", 0.6)
    if not safe_evidence:
        confidence = min(confidence, 0.55)
    return Command(
        update={"evidence_context": (state.get("evidence_context", []) + safe_evidence),
                "confidence_score": confidence, "audit_events": audit, "next_action": "done"},
        goto="final",
    )


def final_node(state: RadarState) -> RadarState:
    return state


_NODES = {
    "radar_orchestrator": radar_orchestrator,
    "government_project_ingestion": government_project_ingestion,
    "redevelopment_intelligence": redevelopment_intelligence,
    "infrastructure_impact": infrastructure_impact,
    "locality_scoring": locality_scoring,
    "investment_narrative": investment_narrative,
    "radar_alert": radar_alert,
    "evidence_verification": evidence_verification,
    "final": final_node,
}


def build_radar_graph():
    if not LANGGRAPH_AVAILABLE:
        class SimpleCompiledGraph:
            async def ainvoke(self, input_state: RadarState) -> RadarState:
                state: RadarState = dict(input_state)
                current = "radar_orchestrator"
                for _ in range(10):
                    node = _NODES[current]
                    result = node(state)
                    if isinstance(result, Command):
                        state.update(result.update)
                        current = result.goto or "final"
                    else:
                        state = result
                        current = "final"
                    if current == "final":
                        return _NODES["final"](state)
                state.setdefault("answer", "Radar routing stopped after safety limit.")
                return state
        return SimpleCompiledGraph()

    graph = StateGraph(RadarState)
    for name, node in _NODES.items():
        graph.add_node(name, node)
    graph.add_edge(START, "radar_orchestrator")
    graph.add_edge("final", END)
    return graph.compile()


async def run_radar_agent(query: str, role: str = "buyer", locality_slug: str | None = None,
                          investment_goal: str | None = None, risk_tolerance: str | None = None,
                          time_horizon: str | None = None, user_id: str = "demo") -> dict:
    """Entrypoint that works WITH or WITHOUT langgraph."""
    initial: RadarState = {
        "user_id": user_id, "role": role, "query": query or "", "audit_events": [],
    }
    if locality_slug:
        initial["locality_slug"] = locality_slug
    if investment_goal:
        initial["investment_goal"] = investment_goal
    if risk_tolerance:
        initial["risk_tolerance"] = risk_tolerance
    if time_horizon:
        initial["selected_time_horizon"] = time_horizon

    graph = build_radar_graph()
    final_state = await graph.ainvoke(initial)
    return {
        "locality_slug": final_state.get("locality_slug", locality_slug or ""),
        "role": role,
        "answer": final_state.get("answer", "No answer produced."),
        "confidence_score": final_state.get("confidence_score", 0.6),
        "route": final_state.get("route", ""),
        "evidence": final_state.get("evidence_context", []),
        "scoring_context": final_state.get("scoring_context", {}),
        "recommendation_context": final_state.get("recommendation_context", {}),
        "audit_events": final_state.get("audit_events", []),
    }
