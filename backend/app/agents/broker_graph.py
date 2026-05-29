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


class BrokerAutomationState(TypedDict, total=False):
    broker_id: str
    manager_id: str
    listing_id: str
    buyer_id: str
    tieup_id: str
    propertypool_event_id: str
    user_request: str
    broker_profile: dict[str, Any]
    broker_verification_status: str
    selected_property: dict[str, Any]
    buyer_network_snapshot: list[dict[str, Any]]
    tieup_request: dict[str, Any]
    tieup_terms: dict[str, Any]
    lead_attribution_context: dict[str, Any]
    propertypool_context: dict[str, Any]
    tour_context: dict[str, Any]
    commission_context: dict[str, Any]
    missing_fields: list[str]
    next_action: str
    messages: list[str]
    audit_events: list[dict[str, Any]]
    recommendations: list[dict[str, Any]]
    tasks: list[dict[str, Any]]


Route = Literal[
    "onboarding",
    "inventory_discovery",
    "tieup_negotiation",
    "buyer_matching",
    "lead_attribution",
    "propertypool_planning",
    "tour_guide",
    "follow_up",
    "commission",
    "growth",
    "final",
]


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _audit(state: BrokerAutomationState, action: str, details: str, actor: str) -> list[dict[str, Any]]:
    events = list(state.get("audit_events", []))
    events.append({"created_at": _utc_now(), "actor_type": "agent", "actor_name": actor, "action": action, "details": details})
    return events


def onboarding_node(state: BrokerAutomationState) -> Command[Route]:
    profile = dict(state.get("broker_profile", {}))
    required = ["full_name", "phone", "email", "operating_localities", "buyer_network_size"]
    missing = [field for field in required if not profile.get(field)]
    if not profile.get("kyc_document_url"):
        missing.append("kyc_document_url")
    status = "verified" if not missing and profile.get("rera_agent_id") else ("needs_review" if not profile.get("rera_agent_id") else "pending")
    trust = 45 + min(int(profile.get("years_experience") or 0) * 4, 20) + min(int(profile.get("buyer_network_size") or 0) / 20, 20)
    if profile.get("rera_agent_id"):
        trust += 10
    if profile.get("kyc_document_url"):
        trust += 5
    return Command(
        update={
            "broker_verification_status": status,
            "missing_fields": missing,
            "broker_profile": {**profile, "verification_status": status, "trust_score": round(min(trust, 96), 1)},
            "messages": ["Broker Onboarding Agent validated profile, RERA/KYC status, and trust score."],
            "next_action": "Discover broker-ready inventory" if status in {"verified", "needs_review"} else "Complete broker KYC before premium tie-ups",
            "audit_events": _audit(state, "broker_onboarding_checked", f"Status {status}; missing {', '.join(missing) or 'none'}", "Broker Onboarding Agent"),
        },
        goto="inventory_discovery",
    )


def inventory_node(state: BrokerAutomationState) -> Command[Route]:
    buyers = list(state.get("buyer_network_snapshot", []))
    recommendations = list(state.get("recommendations", []))
    localities = {loc for buyer in buyers for loc in buyer.get("preferred_localities", [])}
    recommendations.append(
        {
            "agent": "Broker Inventory Discovery Agent",
            "title": "Tie-up shortlist prepared",
            "summary": f"Ranked manager inventory against {len(buyers)} buyers and locality demand in {', '.join(sorted(localities)) or 'Mumbai'}.",
        }
    )
    return Command(
        update={
            "recommendations": recommendations,
            "messages": state.get("messages", []) + ["Inventory Discovery Agent ranked open tie-up inventory by buyer fit and commission upside."],
            "next_action": "Request tie-up for the strongest property match",
            "audit_events": _audit(state, "broker_inventory_discovered", "Generated tie-up recommendations from buyer network snapshot.", "Broker Inventory Discovery Agent"),
        },
        goto="tieup_negotiation" if state.get("selected_property") else "buyer_matching",
    )


def tieup_node(state: BrokerAutomationState) -> Command[Route]:
    selected = dict(state.get("selected_property", {}))
    request = dict(state.get("tieup_request", {}))
    terms = {
        "recommended_commission": request.get("requested_commission", 2.0),
        "validity_days": request.get("requested_validity_days", 45),
        "marketing_restrictions": ["Use only verified facts", "No legal status claims beyond supplied RERA/docs", "Broker attribution required"],
        "propertypool_rights": bool(request.get("requested_propertypool_rights", True) and selected.get("propertypool_eligible", True)),
        "manager_summary": f"Broker fit is strong for {request.get('intended_buyer_segment', 'qualified buyers')} with expected count {request.get('expected_buyer_count', 0)}.",
    }
    return Command(
        update={
            "tieup_terms": terms,
            "messages": state.get("messages", []) + ["Tie-Up Negotiation Agent drafted terms, restrictions, and manager recommendation."],
            "next_action": "Route request to manager approval queue",
            "audit_events": _audit(state, "tieup_terms_drafted", terms["manager_summary"], "Tie-Up Negotiation Agent"),
        },
        goto="lead_attribution",
    )


def buyer_matching_node(state: BrokerAutomationState) -> Command[Route]:
    buyers = list(state.get("buyer_network_snapshot", []))
    hot = [buyer for buyer in buyers if buyer.get("lead_temperature") in {"hot", "ready_to_offer"}]
    context = {"matched_buyers": len(buyers), "hot_buyers": len(hot), "recommended_invites": [buyer.get("id") for buyer in hot[:8]]}
    return Command(
        update={
            "propertypool_context": {**dict(state.get("propertypool_context", {})), **context},
            "messages": state.get("messages", []) + ["Broker Buyer Matching Agent qualified buyers and recommended invite groups."],
            "next_action": "Plan PropertyPool when multiple buyers match one listing",
            "audit_events": _audit(state, "buyer_matching_completed", f"Matched {len(buyers)} buyers; {len(hot)} hot.", "Broker Buyer Matching Agent"),
        },
        goto="propertypool_planning" if len(buyers) >= 2 else "follow_up",
    )


def attribution_node(state: BrokerAutomationState) -> Command[Route]:
    context = {
        "broker_id": state.get("broker_id"),
        "buyer_id": state.get("buyer_id"),
        "listing_id": state.get("listing_id"),
        "protected": bool(state.get("buyer_id") and state.get("listing_id")),
        "conflict_check": "duplicate phone/email scan required before commission eligibility",
    }
    return Command(
        update={
            "lead_attribution_context": context,
            "messages": state.get("messages", []) + ["Lead Attribution Agent prepared timestamped protection context."],
            "next_action": "Match buyers or plan group visit",
            "audit_events": _audit(state, "lead_attribution_checked", "Attribution context updated for broker/property/buyer.", "Lead Attribution Agent"),
        },
        goto="buyer_matching",
    )


def propertypool_node(state: BrokerAutomationState) -> Command[Route]:
    selected = dict(state.get("selected_property", {}))
    title = selected.get("title", "Mumbai property")
    context = dict(state.get("propertypool_context", {}))
    context.update(
        {
            "event_title": f"{selected.get('locality', 'Mumbai')} verified group visit: {title}",
            "best_slot": "Saturday 5:00 PM",
            "invite_message": f"Hi, I found a verified {title} that matches your budget. I am hosting a group visit this Saturday at 5 PM. Should I reserve your slot?",
            "checklist": ["Budget pre-qualified", "RERA/legal summary reviewed", "Route and meeting point confirmed"],
        }
    )
    return Command(
        update={
            "propertypool_context": context,
            "messages": state.get("messages", []) + ["PropertyPool Planning Agent generated event plan, invite copy, and reminder checklist."],
            "next_action": "Open mobile tour guide during the visit",
            "audit_events": _audit(state, "propertypool_planned", f"Event plan generated for {title}.", "PropertyPool Planning Agent"),
        },
        goto="tour_guide",
    )


def tour_node(state: BrokerAutomationState) -> Command[Route]:
    selected = dict(state.get("selected_property", {}))
    locality = selected.get("locality", "Mumbai")
    route = {
        "route_name": f"{locality} broker-led viewing route",
        "waypoints": ["Building approach", "Lobby and lift area", "Living room", "Kitchen", "Bedroom wing", "Bathrooms", "Amenities and parking", "Locality context", "Closing discussion"],
        "objections": ["Price comparison", "Legal/RERA status", "Traffic and commute", "Maintenance quality", "Offer timing"],
    }
    script = f"Open with {locality} positioning, explain verified facts, highlight light/ventilation, summarize RERA/document status without unsupported claims, then close with EMI and offer next steps."
    return Command(
        update={
            "tour_context": {"route": route, "broker_script": script},
            "messages": state.get("messages", []) + ["Broker Tour Guide Agent generated mobile route, talking points, and objection responses."],
            "next_action": "Collect feedback and trigger follow-up after visit",
            "audit_events": _audit(state, "broker_tour_route_generated", route["route_name"], "Broker Tour Guide Agent"),
        },
        goto="follow_up",
    )


def follow_up_node(state: BrokerAutomationState) -> Command[Route]:
    tasks = list(state.get("tasks", []))
    tasks.extend(
        [
            {"agent_name": "Broker Follow-Up Agent", "task_type": "visit_feedback", "priority": "high", "status": "open", "title": "Collect feedback from PropertyPool attendees"},
            {"agent_name": "Broker Follow-Up Agent", "task_type": "hot_buyer_whatsapp", "priority": "high", "status": "open", "title": "Send personalized WhatsApp follow-up to hot buyers"},
        ]
    )
    return Command(
        update={
            "tasks": tasks,
            "messages": state.get("messages", []) + ["Broker Follow-Up Agent created post-visit conversion tasks."],
            "next_action": "Calculate commission pipeline",
            "audit_events": _audit(state, "broker_follow_up_tasks_created", "Feedback and WhatsApp follow-up tasks queued.", "Broker Follow-Up Agent"),
        },
        goto="commission",
    )


def commission_node(state: BrokerAutomationState) -> Command[Route]:
    selected = dict(state.get("selected_property", {}))
    price = float(selected.get("price") or 0)
    pct = float(dict(state.get("tieup_terms", {})).get("recommended_commission") or 2.0)
    context = {"expected_commission": round(price * pct / 100, 0), "commission_percentage": pct, "dispute_status": "none"}
    return Command(
        update={
            "commission_context": context,
            "messages": state.get("messages", []) + ["Broker Commission Agent updated expected payout and dispute watch."],
            "next_action": "Generate broker growth recommendations",
            "audit_events": _audit(state, "broker_commission_pipeline_updated", f"Expected commission {context['expected_commission']:.0f}.", "Broker Commission Agent"),
        },
        goto="growth",
    )


def growth_node(state: BrokerAutomationState) -> Command[Route]:
    recommendations = list(state.get("recommendations", []))
    recommendations.append(
        {
            "agent": "Broker Growth Agent",
            "title": "Weekly broker growth report",
            "summary": "Prioritize approved inventory with low legal risk, run one PropertyPool for the strongest locality cluster, and protect every buyer through attribution before sharing.",
        }
    )
    return Command(
        update={
            "recommendations": recommendations,
            "messages": state.get("messages", []) + ["Broker Growth Agent generated next best actions and weekly report summary."],
            "next_action": "Review recommendations in Broker Automation",
            "audit_events": _audit(state, "broker_growth_report_generated", "Generated growth recommendations.", "Broker Growth Agent"),
        },
        goto="final",
    )


def build_broker_graph():
    nodes = {
        "onboarding": onboarding_node,
        "inventory_discovery": inventory_node,
        "tieup_negotiation": tieup_node,
        "buyer_matching": buyer_matching_node,
        "lead_attribution": attribution_node,
        "propertypool_planning": propertypool_node,
        "tour_guide": tour_node,
        "follow_up": follow_up_node,
        "commission": commission_node,
        "growth": growth_node,
        "final": lambda state: state,
    }

    if not LANGGRAPH_AVAILABLE:
        class SimpleCompiledGraph:
            async def ainvoke(self, input_state: BrokerAutomationState) -> BrokerAutomationState:
                state: BrokerAutomationState = dict(input_state)
                current = "onboarding"
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

    graph = StateGraph(BrokerAutomationState)
    for name, node in nodes.items():
        graph.add_node(name, node)
    graph.add_edge(START, "onboarding")
    graph.add_edge("final", END)
    return graph.compile()

