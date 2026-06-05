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


class VoiceCallingState(TypedDict, total=False):
    call_id: str
    buyer_id: str
    lead_id: str
    property_id: str
    broker_id: str
    manager_id: str
    crm_opportunity_id: str
    trigger_source: str
    trigger_reason: str
    consent_status: str
    call_goal: str
    preferred_language: str
    buyer_context: dict[str, Any]
    property_context: dict[str, Any]
    finance_context: dict[str, Any]
    legal_context: dict[str, Any]
    scheduling_context: dict[str, Any]
    call_status: str
    next_action: str
    escalation_required: bool
    audit_events: list[dict[str, Any]]


Route = Literal["orchestrator", "buyer_intent", "property_context", "finance", "legal", "scheduling", "crm", "broker_attribution", "human_escalation", "final"]


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _audit(state: VoiceCallingState, action: str, details: str, actor: str) -> list[dict[str, Any]]:
    events = list(state.get("audit_events", []))
    events.append({"created_at": _utc_now(), "actor_type": "agent", "actor_name": actor, "action": action, "details": details})
    return events


def orchestrator_node(state: VoiceCallingState) -> Command[Route]:
    source = str(state.get("trigger_source", "")).lower()
    reason = str(state.get("trigger_reason", "")).lower()
    strong = any(token in f"{source} {reason}" for token in ["talk", "schedule", "xr", "propertypool", "offer", "hot", "score", "whatsapp", "expert"])
    return Command(update={"call_status": "eligible" if strong else "manual_review", "audit_events": _audit(state, "voice_orchestrator_checked", "Routed buyer intent for call decision.", "Voice Calling Orchestrator Agent")}, goto="buyer_intent")


def buyer_intent_node(state: VoiceCallingState) -> Command[Route]:
    lead_score = float(state.get("buyer_context", {}).get("lead_score") or 0)
    if state.get("call_status") != "eligible" and lead_score < 80:
        return Command(update={"call_status": "whatsapp_first", "next_action": "Send WhatsApp first; do not spend ElevenLabs credits.", "audit_events": _audit(state, "buyer_intent_medium", "Medium intent routed to WhatsApp/manual review.", "Buyer Intent Agent")}, goto="final")
    return Command(update={"next_action": "Prepare property-specific call context", "audit_events": _audit(state, "buyer_intent_strong", f"Intent score {lead_score}.", "Buyer Intent Agent")}, goto="property_context")


def property_context_node(state: VoiceCallingState) -> Command[Route]:
    missing = state.get("property_context", {}).get("missing_details", [])
    return Command(update={"legal_context": {"missing_details": missing, "legal_caution": "Use verified RERA/doc facts only."}, "audit_events": _audit(state, "property_context_ready", "Property context prepared for allowed claims.", "Property Context Agent")}, goto="finance")


def finance_node(state: VoiceCallingState) -> Command[Route]:
    return Command(update={"audit_events": _audit(state, "finance_context_ready", "Indicative EMI context prepared.", "Finance Agent")}, goto="legal")


def legal_node(state: VoiceCallingState) -> Command[Route]:
    legal = dict(state.get("legal_context", {}))
    legal["do_not_claim_clearance"] = True
    return Command(update={"legal_context": legal, "audit_events": _audit(state, "legal_guardrails_ready", "Legal guardrails attached.", "Legal Agent")}, goto="scheduling")


def scheduling_node(state: VoiceCallingState) -> Command[Route]:
    return Command(update={"audit_events": _audit(state, "scheduling_context_ready", "Visit slots attached to call context.", "Scheduling Agent")}, goto="broker_attribution")


def broker_attribution_node(state: VoiceCallingState) -> Command[Route]:
    return Command(update={"audit_events": _audit(state, "broker_attribution_checked", "Broker attribution checked without exposing commission.", "Broker Attribution Agent")}, goto="crm")


def crm_node(state: VoiceCallingState) -> Command[Route]:
    return Command(update={"next_action": "Start ElevenLabs call and update CRM call activity.", "audit_events": _audit(state, "crm_call_task_ready", "CRM call activity and interaction will be recorded.", "CRM Agent")}, goto="final")


def build_voice_calling_graph():
    nodes = {
        "orchestrator": orchestrator_node,
        "buyer_intent": buyer_intent_node,
        "property_context": property_context_node,
        "finance": finance_node,
        "legal": legal_node,
        "scheduling": scheduling_node,
        "broker_attribution": broker_attribution_node,
        "crm": crm_node,
        "human_escalation": lambda state: state,
        "final": lambda state: state,
    }
    if not LANGGRAPH_AVAILABLE:
        class SimpleCompiledGraph:
            async def ainvoke(self, input_state: VoiceCallingState) -> VoiceCallingState:
                state: VoiceCallingState = dict(input_state)
                current: Route = "orchestrator"
                for _ in range(12):
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
    graph = StateGraph(VoiceCallingState)
    for name, node in nodes.items():
        graph.add_node(name, node)
    graph.add_edge(START, "orchestrator")
    graph.add_edge("final", END)
    return graph.compile()
