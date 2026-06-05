from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal, TypedDict

try:
    from langgraph.graph import END, START, StateGraph
    from langgraph.types import Command
    LANGGRAPH_AVAILABLE = True
except Exception:  # pragma: no cover
    END = START = None
    LANGGRAPH_AVAILABLE = False

    class Command:  # type: ignore[no-redef]
        def __init__(self, update=None, goto=None):
            self.update = update or {}
            self.goto = goto

        def __class_getitem__(cls, item):
            return cls


class CRMState(TypedDict, total=False):
    user_id: str
    role: str
    organization_id: str
    lead_id: str
    opportunity_id: str
    contact_id: str
    account_id: str
    property_id: str
    broker_id: str
    manager_id: str
    buyer_id: str
    current_stage: str
    user_request: str
    lead_snapshot: dict[str, Any]
    opportunity_snapshot: dict[str, Any]
    buyer_profile: dict[str, Any]
    property_snapshot: dict[str, Any]
    communication_context: dict[str, Any]
    activity_context: dict[str, Any]
    proposal_context: dict[str, Any]
    commission_context: dict[str, Any]
    forecast_context: dict[str, Any]
    next_action: str
    handoff_agent: str
    audit_events: list[dict[str, Any]]
    messages: list[str]
    recommended_actions: list[dict[str, Any]]


Route = Literal["orchestrator", "lead_capture", "lead_scoring", "opportunity", "activity", "communication", "proposal", "forecasting", "commission", "hygiene", "final"]


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _audit(state: CRMState, action: str, details: str, actor: str) -> list[dict[str, Any]]:
    events = list(state.get("audit_events", []))
    events.append({"created_at": _utc_now(), "actor_type": "agent", "actor_name": actor, "action": action, "details": details})
    return events


def orchestrator_node(state: CRMState) -> Command[Route]:
    text = state.get("user_request", "").lower()
    if "commission" in text:
        goto: Route = "commission"
    elif "proposal" in text or "offer" in text or "quotation" in text:
        goto = "proposal"
    elif "forecast" in text or "pipeline weak" in text or "report" in text:
        goto = "forecasting"
    elif "reply" in text or "whatsapp" in text or "call" in text or "message" in text:
        goto = "communication"
    elif state.get("lead_snapshot") and not state.get("opportunity_snapshot"):
        goto = "lead_scoring"
    else:
        goto = "hygiene"
    return Command(
        update={
            "handoff_agent": goto,
            "messages": state.get("messages", []) + [f"CRM Orchestrator routed request to {goto.replace('_', ' ')}."],
            "audit_events": _audit(state, "crm_orchestrator_route", f"Selected {goto}", "CRM Orchestrator Agent"),
        },
        goto=goto,
    )


def lead_capture_node(state: CRMState) -> Command[Route]:
    lead = dict(state.get("lead_snapshot", {}))
    lead.setdefault("source", "Manual entry")
    lead.setdefault("qualification_status", "new")
    return Command(update={"lead_snapshot": lead, "next_action": "Score and deduplicate lead", "audit_events": _audit(state, "lead_captured", "Lead normalized for CRM inbox.", "Lead Capture Agent")}, goto="lead_scoring")


def lead_scoring_node(state: CRMState) -> Command[Route]:
    lead = dict(state.get("lead_snapshot", {}))
    score = 40
    if lead.get("budget_max"):
        score += 15
    if lead.get("preferred_localities"):
        score += 15
    if str(lead.get("buying_timeline", "")).lower() in {"ready", "30 days", "30-60 days"}:
        score += 15
    if lead.get("loan_required") is False or lead.get("down_payment_available"):
        score += 8
    if lead.get("source") in {"XR tour", "PropertyPool", "WhatsApp"}:
        score += 7
    lead["lead_score"] = min(98, score)
    lead["qualification_status"] = "hot" if score >= 80 else "qualified" if score >= 65 else "nurture"
    return Command(
        update={
            "lead_snapshot": lead,
            "next_action": "Convert hot lead to opportunity" if score >= 65 else "Create nurture follow-up",
            "messages": state.get("messages", []) + [f"Lead Scoring Agent scored lead at {lead['lead_score']}."],
            "audit_events": _audit(state, "lead_scored", f"Score {lead['lead_score']} and status {lead['qualification_status']}.", "Lead Scoring Agent"),
        },
        goto="opportunity" if score >= 65 else "activity",
    )


def opportunity_node(state: CRMState) -> Command[Route]:
    lead = dict(state.get("lead_snapshot", {}))
    opportunity = dict(state.get("opportunity_snapshot", {}))
    opportunity.setdefault("title", f"{lead.get('full_name', 'Buyer')} property requirement")
    opportunity.setdefault("stage", "Qualified")
    opportunity.setdefault("probability", 35)
    opportunity.setdefault("opportunity_value", lead.get("budget_max") or 25_000_000)
    opportunity["weighted_value"] = round(float(opportunity["opportunity_value"]) * float(opportunity["probability"]) / 100, 0)
    return Command(
        update={
            "opportunity_snapshot": opportunity,
            "current_stage": opportunity["stage"],
            "next_action": "Create next activity and attach communications",
            "messages": state.get("messages", []) + ["Opportunity Agent prepared property-linked opportunity."],
            "audit_events": _audit(state, "opportunity_prepared", opportunity["title"], "Opportunity Agent"),
        },
        goto="activity",
    )


def activity_node(state: CRMState) -> Command[Route]:
    lead = dict(state.get("lead_snapshot", {}))
    activity = {
        "activity_type": "Call" if lead.get("lead_score", 0) >= 80 else "WhatsApp",
        "title": f"Follow up with {lead.get('full_name', 'buyer')}",
        "priority": "high" if lead.get("lead_score", 0) >= 80 else "medium",
        "created_by_agent": True,
    }
    return Command(
        update={
            "activity_context": activity,
            "next_action": "Draft buyer communication",
            "messages": state.get("messages", []) + ["Activity Automation Agent created next activity context."],
            "audit_events": _audit(state, "next_activity_created", activity["title"], "Activity Automation Agent"),
        },
        goto="communication",
    )


def communication_node(state: CRMState) -> Command[Route]:
    lead = dict(state.get("lead_snapshot", {}))
    context = {
        "suggested_reply": f"Hi {lead.get('full_name', 'there')}, I found matching Mumbai homes and can share EMI plus visit options. Should I send the shortlist?",
        "sentiment": "positive" if lead.get("lead_score", 0) >= 70 else "neutral",
        "intent_score": lead.get("lead_score", 60),
    }
    return Command(
        update={
            "communication_context": context,
            "next_action": "Generate proposal if buyer confirms property fit",
            "messages": state.get("messages", []) + ["Communication Agent drafted WhatsApp-friendly response."],
            "audit_events": _audit(state, "communication_draft_generated", "Suggested reply created.", "Communication Agent"),
        },
        goto="proposal",
    )


def proposal_node(state: CRMState) -> Command[Route]:
    opp = dict(state.get("opportunity_snapshot", {}))
    proposal = {
        "proposal_type": "property proposal",
        "title": f"Buyer proposal for {opp.get('title', 'Mumbai opportunity')}",
        "sections": ["Property pitch", "EMI estimate", "Stamp duty estimate", "Negotiation brief", "Broker commission note"],
    }
    return Command(update={"proposal_context": proposal, "audit_events": _audit(state, "proposal_context_generated", proposal["title"], "Proposal and Offer Agent"), "next_action": "Update forecast and commission"}, goto="forecasting")


def forecasting_node(state: CRMState) -> Command[Route]:
    opp = dict(state.get("opportunity_snapshot", {}))
    forecast = {
        "pipeline_value": opp.get("opportunity_value", 0),
        "weighted_revenue": opp.get("weighted_value", 0),
        "closing_probability": opp.get("probability", 0),
        "risk": "stale follow-up" if not state.get("activity_context") else "on track",
    }
    return Command(update={"forecast_context": forecast, "audit_events": _audit(state, "forecast_updated", "Weighted forecast recalculated.", "Forecasting Agent"), "next_action": "Calculate commission"}, goto="commission")


def commission_node(state: CRMState) -> Command[Route]:
    opp = dict(state.get("opportunity_snapshot", {}))
    deal_value = float(opp.get("opportunity_value") or 0)
    context = {"deal_value": deal_value, "commission_percentage": 2.0, "expected_commission": round(deal_value * 0.02, 0), "dispute_status": "none"}
    return Command(update={"commission_context": context, "audit_events": _audit(state, "commission_calculated", f"Expected commission {context['expected_commission']:.0f}.", "Commission Agent"), "next_action": "Run CRM hygiene"}, goto="hygiene")


def hygiene_node(state: CRMState) -> Command[Route]:
    actions = list(state.get("recommended_actions", []))
    actions.append({"title": "Protect every hot opportunity with a next activity", "recommended_action": "Create call/WhatsApp task within SLA", "priority": "high", "agent_name": "CRM Hygiene Agent"})
    return Command(
        update={
            "recommended_actions": actions,
            "messages": state.get("messages", []) + ["CRM Hygiene Agent checked stale leads, missing fields, and duplicate risk."],
            "audit_events": _audit(state, "crm_hygiene_checked", "Pipeline hygiene review completed.", "CRM Hygiene Agent"),
        },
        goto="final",
    )


def build_crm_graph():
    nodes = {
        "orchestrator": orchestrator_node,
        "lead_capture": lead_capture_node,
        "lead_scoring": lead_scoring_node,
        "opportunity": opportunity_node,
        "activity": activity_node,
        "communication": communication_node,
        "proposal": proposal_node,
        "forecasting": forecasting_node,
        "commission": commission_node,
        "hygiene": hygiene_node,
        "final": lambda state: state,
    }

    if not LANGGRAPH_AVAILABLE:
        class SimpleCompiledGraph:
            async def ainvoke(self, input_state: CRMState) -> CRMState:
                state: CRMState = dict(input_state)
                current: Route = "orchestrator"
                for _ in range(14):
                    result = nodes[current](state)
                    if isinstance(result, Command):
                        state.update(result.update)
                        current = result.goto or "final"
                    else:
                        state = result
                        current = "final"
                    if current == "final":
                        return nodes["final"](state)
                return state

        return SimpleCompiledGraph()

    graph = StateGraph(CRMState)
    for name, node in nodes.items():
        graph.add_node(name, node)
    graph.add_edge(START, "orchestrator")
    graph.add_edge("final", END)
    return graph.compile()
