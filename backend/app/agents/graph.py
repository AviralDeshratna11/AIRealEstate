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

from app.agents.nl2sql import create_property_query_plan
from app.agents.receptionist import ReceptionistAgent
from app.agents.state import AgentState
from app.agents.support_agents import FinanceAgent, MarketIntelligenceAgent, TourGuideAgent, WhatsAppAssistantAgent
from app.models import LeadChannel, LeadQualificationRequest, TourGuideRequest
from app.services.property_repository import PropertyRepository

Route = Literal[
    "voice_receptionist",
    "whatsapp_assistant",
    "mumbai_search_agent",
    "finance_construction_agent",
    "market_intelligence_agent",
    "tour_guide_agent",
    "negotiation",
    "document_agent",
    "availability_agent",
    "final",
]


async def triage_node(state: AgentState) -> Command[Route]:
    query = state.get("user_query", "").lower()
    channel = state.get("channel", "web")
    if channel == "whatsapp" or any(k in query for k in ["whatsapp", "wa.me", "message me"]):
        return Command(update={"intent": "whatsapp_assistant", "route": "whatsapp_assistant"}, goto="whatsapp_assistant")
    if any(k in query for k in ["call", "phone", "book", "schedule", "viewing", "visit"]):
        return Command(update={"intent": "voice_receptionist", "route": "voice_receptionist"}, goto="voice_receptionist")
    if any(k in query for k in ["tour", "guide", "3d", "virtual", "walkthrough", "show me inside"]):
        return Command(update={"intent": "tour_guide_agent", "route": "tour_guide_agent"}, goto="tour_guide_agent")
    if any(k in query for k in ["emi", "loan", "interest", "finance", "construction", "material", "cement", "steel", "build cost"]):
        return Command(update={"intent": "finance_construction_agent", "route": "finance_construction_agent"}, goto="finance_construction_agent")
    search_terms = ["find", "show", "search", "bhk", "bedroom", "under", "below", "property", "home", "flat", "apartment"]
    market_terms = ["market", "inventory", "redevelopment", "development agreement", "unsold", "micro-market", "liquidity"]
    if any(k in query for k in market_terms) and not any(k in query for k in search_terms):
        return Command(update={"intent": "market_intelligence_agent", "route": "market_intelligence_agent"}, goto="market_intelligence_agent")
    if any(k in query for k in ["negotiate", "counter", "offer", "walk away", "walk-away"]):
        return Command(update={"intent": "negotiation", "route": "negotiation"}, goto="negotiation")
    if any(k in query for k in ["pdf", "agreement", "inspection", "contingency", "document", "rera", "legal"]):
        return Command(update={"intent": "document_agent", "route": "document_agent"}, goto="document_agent")
    if any(k in query for k in ["available", "availability", "slots"]):
        return Command(update={"intent": "availability_agent", "route": "availability_agent"}, goto="availability_agent")
    if query.strip():
        return Command(update={"intent": "mumbai_search_agent", "route": "mumbai_search_agent"}, goto="mumbai_search_agent")
    return Command(update={"answer": "Tell me the Mumbai locality, budget, loan/material question, document, viewing, or negotiation you want help with."}, goto="final")


def build_agent_graph(repository: PropertyRepository | None = None):
    repo = repository or PropertyRepository()
    receptionist = ReceptionistAgent()
    whatsapp = WhatsAppAssistantAgent()
    market = MarketIntelligenceAgent()
    finance = FinanceAgent()
    tour = TourGuideAgent()

    async def search_node(state: AgentState) -> Command[Literal["final"]]:
        plan = await create_property_query_plan(state.get("user_query", ""), limit=8)
        properties, sql_preview = await repo.search_by_plan(plan)
        return Command(
            update={
                "answer": (
                    f"I found {len(properties)} Mumbai matches. Ranking considered semantic fit plus "
                    "redevelopment momentum, inventory liquidity, commute/walkability, EMI pressure, and live availability."
                ),
                "sql_preview": sql_preview,
                "data": {"plan": plan.model_dump(), "properties": [p.model_dump(mode="json") for p in properties]},
            },
            goto="final",
        )

    async def whatsapp_node(state: AgentState) -> Command[Literal["final"]]:
        result = await whatsapp.qualify(
            LeadQualificationRequest(channel=LeadChannel.whatsapp, message=state.get("user_query", ""))
        )
        return Command(update={"answer": result.suggested_reply, "data": result.model_dump()}, goto="final")

    async def voice_node(state: AgentState) -> Command[Literal["final"]]:
        result = await receptionist.handle(state.get("user_query", ""))
        return Command(update={"answer": result["answer"], "data": result}, goto="final")

    async def finance_node(state: AgentState) -> Command[Literal["final"]]:
        result = await finance.estimate_for_property(None, None, 8.0, 20, 20)
        return Command(
            update={
                "answer": result.get("answer", "Finance agent ready. Use /api/finance/estimate for exact EMI/material estimates."),
                "data": {"tool": "emi_and_material_estimator", **result},
            },
            goto="final",
        )

    async def market_node(state: AgentState) -> Command[Literal["final"]]:
        result = await market.summarize(state.get("user_query", ""))
        return Command(update={"answer": result["answer"], "data": result}, goto="final")

    async def tour_node(state: AgentState) -> Command[Literal["final"]]:
        result = await tour.guide(TourGuideRequest(query=state.get("user_query", ""), mode="map"))
        return Command(update={"answer": result.narration, "data": result.model_dump()}, goto="final")

    async def availability_node(state: AgentState) -> Command[Literal["final"]]:
        slots = await repo.update_random_availability_snapshot()
        return Command(update={"answer": "Live Mumbai viewing slots are ready for WhatsApp, call, or web booking.", "data": {"slots": slots}}, goto="final")

    async def negotiation_node(state: AgentState) -> Command[Literal["final"]]:
        return Command(
            update={
                "answer": "Use /api/negotiation/optimize with target, opponent offer, urgency, concessions, and hidden walk-away price. The hidden budget is enforced but never revealed.",
                "data": {"tool": "astra_lp_negotiation_optimizer", "status": "ready"},
            },
            goto="final",
        )

    async def document_node(state: AgentState) -> Command[Literal["final"]]:
        return Command(
            update={
                "answer": "Upload a PDF/image to /api/documents/extract. I will extract RERA/legal facts, parties, dates, contingencies, and calendar reminders.",
                "data": {"tool": "multimodal_document_extraction", "status": "ready"},
            },
            goto="final",
        )

    def final_node(state: AgentState) -> AgentState:
        return state

    nodes = {
        "triage": triage_node,
        "mumbai_search_agent": search_node,
        "whatsapp_assistant": whatsapp_node,
        "voice_receptionist": voice_node,
        "finance_construction_agent": finance_node,
        "market_intelligence_agent": market_node,
        "tour_guide_agent": tour_node,
        "availability_agent": availability_node,
        "negotiation": negotiation_node,
        "document_agent": document_node,
        "final": final_node,
    }

    if not LANGGRAPH_AVAILABLE:
        class SimpleCompiledGraph:
            async def ainvoke(self, input_state: AgentState) -> AgentState:
                state: AgentState = dict(input_state)
                current = "triage"
                for _ in range(8):
                    result = await nodes[current](state) if current != "final" else nodes[current](state)
                    if isinstance(result, Command):
                        state.update(result.update)
                        current = result.goto or "final"
                    else:
                        state = result
                        current = "final"
                    if current == "final":
                        final_result = nodes["final"](state)
                        return final_result
                state.setdefault("answer", "Agent routing stopped after safety limit.")
                return state
        return SimpleCompiledGraph()

    graph = StateGraph(AgentState)
    for name, node in nodes.items():
        graph.add_node(name, node)
    graph.add_edge(START, "triage")
    graph.add_edge("final", END)
    return graph.compile()
