from __future__ import annotations

import asyncio
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import uuid4

from fastapi import HTTPException

from app.agents.crm_graph import build_crm_graph
from app.crm_models import (
    CRMAccount,
    CRMAccountCreate,
    CRMActivity,
    CRMActivityCreate,
    CRMAuditLog,
    CRMAutomationRunRequest,
    CRMCampaign,
    CRMCampaignCreate,
    CRMCommission,
    CRMContact,
    CRMContactCreate,
    CRMDashboard,
    CRMInteraction,
    CRMLead,
    CRMLeadCreate,
    CRMLeadImportRequest,
    CRMNextBestActionSchema,
    CRMOpportunity,
    CRMOpportunityCreate,
    CRMPipelineStage,
    CRMProposal,
    CRMSummaryCard,
    LeadScoreSchema,
)
from app.db.session import get_pool


DDL_STATEMENTS = [
    """
    create table if not exists crm_leads (
      id text primary key default gen_random_uuid()::text,
      organization_id text,
      full_name text not null,
      phone text,
      email text,
      source text,
      source_detail text,
      buyer_type text,
      budget_min numeric,
      budget_max numeric,
      preferred_localities text[] not null default '{}',
      property_type_preference text,
      bhk_preference text,
      buying_timeline text,
      loan_required boolean not null default true,
      down_payment_available numeric,
      family_size int,
      purpose text,
      assigned_user_id text,
      broker_id text,
      manager_id text,
      lead_score numeric default 0,
      qualification_status text,
      duplicate_status text,
      status text,
      last_contacted_at timestamptz,
      next_follow_up_at timestamptz,
      notes text,
      metadata_json jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
    """,
    """
    create table if not exists crm_contacts (
      id text primary key default gen_random_uuid()::text,
      organization_id text,
      full_name text not null,
      phone text,
      email text,
      contact_type text,
      linked_buyer_id text,
      linked_broker_id text,
      linked_manager_id text,
      source text,
      tags text[] not null default '{}',
      notes text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
    """,
    """
    create table if not exists crm_accounts (
      id text primary key default gen_random_uuid()::text,
      organization_id text,
      account_name text not null,
      account_type text,
      company_name text,
      primary_contact_id text,
      phone text,
      email text,
      address text,
      gst_number text,
      rera_id text,
      notes text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
    """,
    """
    create table if not exists crm_opportunities (
      id text primary key default gen_random_uuid()::text,
      organization_id text,
      lead_id text,
      contact_id text,
      buyer_id text,
      property_id text,
      broker_id text,
      manager_id text,
      title text not null,
      stage text,
      opportunity_value numeric,
      expected_commission numeric,
      probability numeric,
      weighted_value numeric,
      source text,
      assigned_user_id text,
      next_activity_id text,
      expected_close_date timestamptz,
      lost_reason text,
      won_at timestamptz,
      lost_at timestamptz,
      metadata_json jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
    """,
    """
    create table if not exists crm_pipeline_stages (
      id text primary key default gen_random_uuid()::text,
      organization_id text,
      stage_name text not null,
      display_order int,
      default_probability numeric,
      color text,
      is_closed_won boolean not null default false,
      is_closed_lost boolean not null default false,
      created_at timestamptz not null default now()
    )
    """,
    """
    create table if not exists crm_activities (
      id text primary key default gen_random_uuid()::text,
      organization_id text,
      lead_id text,
      opportunity_id text,
      contact_id text,
      property_id text,
      assigned_user_id text,
      activity_type text,
      title text,
      description text,
      due_at timestamptz,
      status text,
      priority text,
      created_by_agent boolean not null default false,
      completed_at timestamptz,
      outcome text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
    """,
    """
    create table if not exists crm_interactions (
      id text primary key default gen_random_uuid()::text,
      organization_id text,
      lead_id text,
      opportunity_id text,
      contact_id text,
      property_id text,
      channel text,
      direction text,
      summary text,
      transcript text,
      sentiment text,
      intent_score numeric,
      metadata_json jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )
    """,
    """
    create table if not exists crm_proposals (
      id text primary key default gen_random_uuid()::text,
      organization_id text,
      opportunity_id text,
      property_id text,
      buyer_id text,
      proposal_type text,
      title text,
      content_json jsonb not null default '{}'::jsonb,
      pdf_url text,
      status text,
      version int not null default 1,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
    """,
    """
    create table if not exists crm_commissions (
      id text primary key default gen_random_uuid()::text,
      organization_id text,
      opportunity_id text,
      broker_id text,
      agent_id text,
      manager_id text,
      property_id text,
      deal_value numeric,
      commission_percentage numeric,
      expected_commission numeric,
      approved_commission numeric,
      payout_status text,
      dispute_status text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
    """,
    """
    create table if not exists crm_campaigns (
      id text primary key default gen_random_uuid()::text,
      organization_id text,
      campaign_name text,
      campaign_type text,
      target_segment text,
      property_id text,
      message_template text,
      status text,
      sent_count int not null default 0,
      reply_count int not null default 0,
      visit_count int not null default 0,
      offer_count int not null default 0,
      revenue_pipeline numeric not null default 0,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
    """,
    """
    create table if not exists crm_audit_logs (
      id text primary key default gen_random_uuid()::text,
      organization_id text,
      actor_type text,
      actor_id text,
      action text,
      entity_type text,
      entity_id text,
      details_json jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )
    """,
]


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _future(days: int) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()


def _id(prefix: str) -> str:
    return f"{prefix}-{uuid4().hex[:10]}"


class CRMERPService:
    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._seeded = False
        self._stages = [
            ("new", "New Lead", 1, 5, "#64748b"),
            ("qualified", "Qualified", 2, 18, "#0f766e"),
            ("matched", "Property Matched", 3, 28, "#059669"),
            ("visit_scheduled", "Visit Scheduled", 4, 38, "#2563eb"),
            ("visit_completed", "Visit Completed", 5, 48, "#7c3aed"),
            ("offer_discussed", "Offer Discussed", 6, 58, "#b45309"),
            ("negotiation", "Negotiation", 7, 68, "#ea580c"),
            ("documents_shared", "Documents Shared", 8, 78, "#0891b2"),
            ("agreement_drafting", "Agreement Drafting", 9, 88, "#16a34a"),
            ("closed_won", "Closed Won", 10, 100, "#15803d"),
            ("closed_lost", "Closed Lost", 11, 0, "#dc2626"),
        ]
        self._leads: dict[str, dict[str, Any]] = {}
        self._contacts: dict[str, dict[str, Any]] = {}
        self._accounts: dict[str, dict[str, Any]] = {}
        self._opportunities: dict[str, dict[str, Any]] = {}
        self._activities: dict[str, dict[str, Any]] = {}
        self._interactions: dict[str, dict[str, Any]] = {}
        self._proposals: dict[str, dict[str, Any]] = {}
        self._commissions: dict[str, dict[str, Any]] = {}
        self._campaigns: dict[str, dict[str, Any]] = {}
        self._audit: list[dict[str, Any]] = []
        self._seed_demo_records()

    async def ensure_ready(self) -> None:
        if self._seeded:
            return
        async with self._lock:
            if self._seeded:
                return
            try:
                pool = await get_pool()
            except Exception:
                pool = None
            if pool is not None:
                async with pool.acquire() as conn:
                    for statement in DDL_STATEMENTS:
                        await conn.execute(statement)
            self._seeded = True

    def _add_audit(self, action: str, entity_type: str, entity_id: str | None, details: dict[str, Any], actor_type: str = "agent", actor_id: str | None = "crm-agent") -> dict[str, Any]:
        item = {
            "id": _id("crm-audit"),
            "organization_id": "org-astra-demo",
            "actor_type": actor_type,
            "actor_id": actor_id,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "details_json": details,
            "created_at": _utc_now(),
        }
        self._audit.insert(0, item)
        return item

    def _score_value(self, lead: dict[str, Any]) -> float:
        score = 38
        if lead.get("budget_max"):
            score += 14
        if lead.get("preferred_localities"):
            score += 14
        timeline = str(lead.get("buying_timeline") or "").lower()
        if any(token in timeline for token in ["ready", "30", "60", "this month"]):
            score += 16
        if lead.get("loan_required") is False or lead.get("down_payment_available"):
            score += 8
        if lead.get("source") in {"WhatsApp", "Vapi call", "XR tour", "PropertyPool"}:
            score += 8
        return float(min(98, score))

    def _seed_demo_records(self) -> None:
        demo_leads = [
            ("Rahul Mehta", "+91 90000 02001", "WhatsApp", ["Chembur", "Ghatkopar"], 42_000_000, "ready", "Call buyer after Chembur XR tour"),
            ("Priya Nair", "+91 90000 02002", "PropertyPool", ["Bandra", "Worli"], 66_000_000, "30 days", "Send revised Bandra offer"),
            ("Kabir Merchant", "+91 90000 02003", "XR tour", ["Powai", "Andheri"], 31_500_000, "30-60 days", "Schedule Powai visit"),
            ("Ananya Rao", "+91 90000 02004", "Broker referral", ["Borivali", "Malad"], 20_800_000, "90 days", "Send EMI sheet"),
            ("Nisha Iyer", "+91 90000 02005", "Vapi call", ["Worli", "Bandra"], 185_000_000, "ready", "Prepare negotiation brief"),
        ]
        property_names = ["Chembur Garden-View 3BHK", "Bandra West Sea-Breeze 2.5BHK", "Powai Lakeview Smart 3BHK", "Malad West Growth-Corridor 2BHK", "Worli Sea-Link Luxury 4BHK"]
        stages = ["Visit Completed", "Negotiation", "Visit Scheduled", "Property Matched", "Offer Discussed"]
        for index, (name, phone, source, localities, budget, timeline, next_action) in enumerate(demo_leads):
            lead = CRMLeadCreate(full_name=name, phone=phone, source=source, preferred_localities=localities, budget_min=budget * 0.75, budget_max=budget, buying_timeline=timeline, bhk_preference="2-3 BHK", notes=next_action)
            item = self._lead_dict(lead)
            item["id"] = f"crm-lead-demo-{index + 1}"
            item["lead_score"] = self._score_value(item)
            item["qualification_status"] = "hot" if item["lead_score"] >= 80 else "qualified"
            item["last_contacted_at"] = _future(-index)
            item["next_follow_up_at"] = _future(1 if index < 3 else -1)
            self._leads[item["id"]] = item
            contact_id = f"crm-contact-demo-{index + 1}"
            self._contacts[contact_id] = CRMContact(id=contact_id, organization_id=item["organization_id"], full_name=name, phone=phone, contact_type="buyer", source=source, tags=[item["qualification_status"], source.lower().replace(" ", "_")], notes=next_action, created_at=item["created_at"]).model_dump(mode="json")
            opp = CRMOpportunityCreate(
                lead_id=item["id"],
                contact_id=contact_id,
                property_id=f"mumbai-property-demo-{index + 1}",
                broker_id="broker-demo-1" if source in {"Broker referral", "PropertyPool"} else None,
                title=f"{name} - {property_names[index]}",
                stage=stages[index],
                opportunity_value=budget,
                expected_commission=round(budget * 0.02, 0),
                probability=[48, 72, 40, 28, 64][index],
                source=source,
                expected_close_date=_future(20 + index * 7),
            )
            opp_item = self._opportunity_dict(opp, item, property_names[index], localities[0])
            opp_item["id"] = f"crm-opp-demo-{index + 1}"
            opp_item["next_activity"] = next_action
            opp_item["lead_score"] = item["lead_score"]
            opp_item["warning_badges"] = ["XR engaged"] if source == "XR tour" else ["Broker attributed"] if source in {"Broker referral", "PropertyPool"} else []
            if index == 4:
                opp_item["warning_badges"].append("Legal risk")
            self._opportunities[opp_item["id"]] = opp_item
            self._activities[f"crm-act-demo-{index + 1}"] = CRMActivity(
                id=f"crm-act-demo-{index + 1}",
                organization_id=item["organization_id"],
                lead_id=item["id"],
                opportunity_id=opp_item["id"],
                property_id=opp_item["property_id"],
                activity_type="Call" if index < 3 else "WhatsApp",
                title=next_action,
                description=f"AI generated next activity for {name}.",
                due_at=item["next_follow_up_at"],
                status="overdue" if index == 3 else "open",
                priority="high" if item["lead_score"] >= 80 else "medium",
                created_by_agent=True,
                created_at=_utc_now(),
            ).model_dump(mode="json")
            self._interactions[f"crm-int-demo-{index + 1}"] = CRMInteraction(
                id=f"crm-int-demo-{index + 1}",
                organization_id=item["organization_id"],
                lead_id=item["id"],
                opportunity_id=opp_item["id"],
                contact_id=contact_id,
                property_id=opp_item["property_id"],
                channel=source,
                direction="inbound",
                summary=f"{name} showed interest in {localities[0]} and asked for {next_action.lower()}.",
                sentiment="positive",
                intent_score=item["lead_score"],
                metadata_json={"source": source, "propertypool_attribution": source == "PropertyPool"},
                created_at=_utc_now(),
            ).model_dump(mode="json")
        self._campaigns["crm-campaign-demo-1"] = CRMCampaign(id="crm-campaign-demo-1", organization_id="org-astra-demo", campaign_name="Andheri Saturday PropertyPool", campaign_type="WhatsApp", target_segment="Andheri/Powai hot buyers", property_id="mumbai-property-demo-3", message_template="Saturday verified group visit invite with EMI and route checklist.", status="active", sent_count=84, reply_count=29, visit_count=11, offer_count=3, revenue_pipeline=94_500_000, created_at=_utc_now()).model_dump(mode="json")
        self._add_audit("crm_seeded", "system", None, {"summary": "CRM demo records seeded from WhatsApp, calls, XR, PropertyPool, and broker referrals."})

    def _lead_dict(self, request: CRMLeadCreate) -> dict[str, Any]:
        now = _utc_now()
        duplicate = next((lead for lead in self._leads.values() if lead.get("phone") == request.phone), None)
        data = request.model_dump(mode="json")
        return {
            "id": _id("crm-lead"),
            **data,
            "lead_score": 0,
            "qualification_status": "new",
            "duplicate_status": "possible_duplicate" if duplicate else "unique",
            "status": "open",
            "last_contacted_at": None,
            "next_follow_up_at": _future(1),
            "metadata_json": {"source_integrations": ["WhatsApp", "Vapi", "XR", "PropertyPool", "Broker Portal"]},
            "created_at": now,
            "updated_at": now,
        }

    def _opportunity_dict(self, request: CRMOpportunityCreate, lead: dict[str, Any] | None = None, property_name: str | None = None, locality: str | None = None) -> dict[str, Any]:
        now = _utc_now()
        lead = lead or self._leads.get(request.lead_id or "") or {}
        value = float(request.opportunity_value or lead.get("budget_max") or 0)
        probability = float(request.probability)
        return {
            "id": _id("crm-opp"),
            **request.model_dump(mode="json"),
            "buyer_name": lead.get("full_name") or request.title.split("-")[0].strip(),
            "property_name": property_name or "Mumbai matched property",
            "locality": locality or (lead.get("preferred_localities") or ["Mumbai"])[0],
            "opportunity_value": value,
            "expected_commission": request.expected_commission or round(value * 0.02, 0),
            "probability": probability,
            "weighted_value": round(value * probability / 100, 0),
            "assigned_agent_name": "Asha Kulkarni",
            "next_activity_id": None,
            "next_activity": "Call buyer within SLA",
            "lead_score": lead.get("lead_score", 0),
            "broker_attribution": "protected" if request.broker_id else None,
            "last_interaction": _utc_now(),
            "warning_badges": [],
            "metadata_json": {"ai_match_reason": "Budget, locality, urgency, and interaction history fit."},
            "created_at": now,
            "updated_at": now,
        }

    def _stage_models(self) -> list[CRMPipelineStage]:
        opportunities = list(self._opportunities.values())
        output = []
        for stage_id, name, order, probability, color in self._stages:
            stage_opps = [opp for opp in opportunities if opp["stage"] == name]
            total = sum(float(opp["opportunity_value"]) for opp in stage_opps)
            weighted = sum(float(opp["weighted_value"]) for opp in stage_opps)
            output.append(CRMPipelineStage(id=stage_id, stage_name=name, display_order=order, default_probability=probability, color=color, is_closed_won=name == "Closed Won", is_closed_lost=name == "Closed Lost", opportunity_count=len(stage_opps), total_value=total, weighted_value=weighted, average_age_days=3 + order, stale_count=sum(1 for opp in stage_opps if "Follow-up overdue" in opp.get("warning_badges", []))))
        return output

    async def dashboard(self) -> CRMDashboard:
        await self.ensure_ready()
        leads = [CRMLead(**item) for item in self._leads.values()]
        opps = [CRMOpportunity(**item) for item in self._opportunities.values()]
        hot = [lead for lead in leads if lead.lead_score >= 80]
        pipeline = sum(opp.opportunity_value for opp in opps)
        weighted = sum(opp.weighted_value for opp in opps)
        commission = sum(opp.expected_commission for opp in opps)
        due = sum(1 for item in self._activities.values() if item["status"] in {"open", "overdue"})
        cards = [
            ("Total leads", str(len(leads)), "Unified inbox", "slate"),
            ("New leads today", "7", "WhatsApp + web + XR", "emerald"),
            ("Hot leads", str(len(hot)), "Score above 80", "emerald"),
            ("Open opportunities", str(len(opps)), "Active pipeline", "slate"),
            ("Pipeline value", self._format_cr(pipeline), "All open stages", "gold"),
            ("Expected revenue", self._format_cr(weighted), "Probability weighted", "gold"),
            ("Expected commission", self._format_cr(commission), "Broker + agent", "amber"),
            ("Site visits this week", "18", "11 booked by AI", "emerald"),
            ("Offers active", "6", "3 need approval", "amber"),
            ("Closings expected", "4", "This month", "emerald"),
            ("Stale leads", "9", "Need nurture", "amber"),
            ("Follow-ups due", str(due), "SLA watch", "amber"),
            ("AI tasks completed", "128", "This week", "slate"),
            ("Avg response time", "8m", "WhatsApp/call", "emerald"),
            ("Conversion rate", "31%", "Visit to offer", "gold"),
        ]
        priority = [
            CRMNextBestActionSchema(id="nba-1", title="Call Rahul after Chembur visit", reason="Visited yesterday and asked EMI twice.", recommended_action="Call within 15 minutes and send EMI sheet.", entity_type="lead", entity_id="crm-lead-demo-1", priority="high", agent_name="Lead Scoring Agent"),
            CRMNextBestActionSchema(id="nba-2", title="Send revised offer to Priya", reason="Negotiation likely to close near INR 4.85 Cr.", recommended_action="Generate manager approval and counter note.", entity_type="opportunity", entity_id="crm-opp-demo-2", priority="high", agent_name="Proposal and Offer Agent"),
            CRMNextBestActionSchema(id="nba-3", title="Invite Andheri buyers to PropertyPool", reason="8 hot buyers match one locality cluster.", recommended_action="Launch WhatsApp campaign.", entity_type="campaign", entity_id="crm-campaign-demo-1", priority="medium", agent_name="Activity Automation Agent"),
            CRMNextBestActionSchema(id="nba-4", title="Confirm broker Aman attribution", reason="3 leads pending attribution confirmation.", recommended_action="Review source timestamps and tie-up record.", entity_type="broker", entity_id="broker-demo-1", priority="medium", agent_name="Commission Agent"),
            CRMNextBestActionSchema(id="nba-5", title="Upload missing OC for Bandra listing", reason="Legal summary blocked before sharing proposal.", recommended_action="Create document task for legal executive.", entity_type="document", entity_id=None, priority="high", agent_name="CRM Hygiene Agent"),
        ]
        return CRMDashboard(summary_cards=[CRMSummaryCard(label=label, value=value, detail=detail, tone=tone) for label, value, detail, tone in cards], pipeline_stages=self._stage_models(), priority_inbox=priority, activity_feed=[CRMAuditLog(**item) for item in self._audit[:12]], hot_leads=hot, open_opportunities=opps, reports=await self.reports_sales())

    def _format_cr(self, value: float) -> str:
        return f"INR {value / 10_000_000:.2f} Cr"

    async def pipeline(self) -> dict[str, Any]:
        await self.ensure_ready()
        return {"stages": [item.model_dump(mode="json") for item in self._stage_models()], "opportunities": [CRMOpportunity(**item).model_dump(mode="json") for item in self._opportunities.values()]}

    async def leads(self) -> list[CRMLead]:
        await self.ensure_ready()
        return [CRMLead(**item) for item in self._leads.values()]

    async def create_lead(self, request: CRMLeadCreate) -> CRMLead:
        await self.ensure_ready()
        item = self._lead_dict(request)
        item["lead_score"] = self._score_value(item)
        item["qualification_status"] = "hot" if item["lead_score"] >= 80 else "qualified" if item["lead_score"] >= 65 else "nurture"
        self._leads[item["id"]] = item
        self._add_audit("lead_created", "lead", item["id"], {"summary": f"Lead {item['full_name']} created from {item['source']}."}, "user", item.get("assigned_user_id"))
        if item["lead_score"] >= 80:
            await self.create_activity(CRMActivityCreate(lead_id=item["id"], title=f"Call {item['full_name']} within 15 minutes", priority="high", created_by_agent=True))
        return CRMLead(**item)

    async def import_leads(self, request: CRMLeadImportRequest) -> dict[str, Any]:
        created = [await self.create_lead(lead) for lead in request.leads]
        self._add_audit("leads_imported", "lead", None, {"count": len(created)}, "agent", "Lead Capture Agent")
        return {"count": len(created), "created": [item.model_dump(mode="json") for item in created]}

    async def score_lead(self, lead_id: str) -> LeadScoreSchema:
        await self.ensure_ready()
        lead = self._require(self._leads, lead_id, "Lead")
        lead["lead_score"] = self._score_value(lead)
        lead["qualification_status"] = "hot" if lead["lead_score"] >= 80 else "qualified" if lead["lead_score"] >= 65 else "nurture"
        score = LeadScoreSchema(lead_id=lead_id, score=lead["lead_score"], priority=lead["qualification_status"], budget_fit=86 if lead.get("budget_max") else 45, locality_fit=88 if lead.get("preferred_localities") else 40, urgency=90 if "ready" in str(lead.get("buying_timeline", "")).lower() else 68, loan_readiness=80 if not lead.get("loan_required") or lead.get("down_payment_available") else 62, next_best_action="Call and schedule visit" if lead["lead_score"] >= 80 else "Send shortlist and EMI", explanation="Score combines budget, locality, timeline, source engagement, loan readiness, and interaction urgency.")
        self._add_audit("lead_scored", "lead", lead_id, score.model_dump(mode="json"), "agent", "Lead Scoring Agent")
        return score

    async def convert_lead(self, lead_id: str) -> CRMOpportunity:
        await self.ensure_ready()
        lead = self._require(self._leads, lead_id, "Lead")
        request = CRMOpportunityCreate(lead_id=lead_id, title=f"{lead['full_name']} - Mumbai matched property", stage="Qualified", opportunity_value=float(lead.get("budget_max") or 25_000_000), expected_commission=round(float(lead.get("budget_max") or 25_000_000) * 0.02, 0), probability=35, source=lead["source"], broker_id=lead.get("broker_id"), manager_id=lead.get("manager_id"))
        item = self._opportunity_dict(request, lead)
        self._opportunities[item["id"]] = item
        self._add_audit("lead_converted", "opportunity", item["id"], {"lead_id": lead_id, "title": item["title"]}, "agent", "Opportunity Agent")
        await self.create_activity(CRMActivityCreate(lead_id=lead_id, opportunity_id=item["id"], title=f"Match properties for {lead['full_name']}", activity_type="Send brochure", created_by_agent=True))
        return CRMOpportunity(**item)

    async def opportunities(self) -> list[CRMOpportunity]:
        await self.ensure_ready()
        return [CRMOpportunity(**item) for item in self._opportunities.values()]

    async def create_opportunity(self, request: CRMOpportunityCreate) -> CRMOpportunity:
        await self.ensure_ready()
        item = self._opportunity_dict(request)
        self._opportunities[item["id"]] = item
        self._add_audit("opportunity_created", "opportunity", item["id"], {"title": item["title"]}, "user", request.assigned_user_id)
        return CRMOpportunity(**item)

    async def update_opportunity(self, opportunity_id: str, payload: dict[str, Any]) -> CRMOpportunity:
        await self.ensure_ready()
        item = self._require(self._opportunities, opportunity_id, "Opportunity")
        item.update({key: value for key, value in payload.items() if key in item})
        if "opportunity_value" in payload or "probability" in payload:
            item["weighted_value"] = round(float(item.get("opportunity_value") or 0) * float(item.get("probability") or 0) / 100, 0)
        item["updated_at"] = _utc_now()
        self._add_audit("opportunity_updated", "opportunity", opportunity_id, payload, "user", item.get("assigned_user_id"))
        return CRMOpportunity(**item)

    async def move_stage(self, opportunity_id: str, stage: str) -> CRMOpportunity:
        item = await self.update_opportunity(opportunity_id, {"stage": stage})
        self._add_audit("opportunity_stage_moved", "opportunity", opportunity_id, {"stage": stage}, "agent", "Opportunity Agent")
        return item

    async def contacts(self) -> list[CRMContact]:
        await self.ensure_ready()
        return [CRMContact(**item) for item in self._contacts.values()]

    async def create_contact(self, request: CRMContactCreate) -> CRMContact:
        item = {"id": _id("crm-contact"), **request.model_dump(mode="json"), "created_at": _utc_now(), "updated_at": _utc_now()}
        self._contacts[item["id"]] = item
        return CRMContact(**item)

    async def accounts(self) -> list[CRMAccount]:
        await self.ensure_ready()
        return [CRMAccount(**item) for item in self._accounts.values()]

    async def create_account(self, request: CRMAccountCreate) -> CRMAccount:
        item = {"id": _id("crm-account"), **request.model_dump(mode="json"), "created_at": _utc_now(), "updated_at": _utc_now(), "primary_contact_id": None, "address": None, "gst_number": None, "rera_id": None}
        self._accounts[item["id"]] = item
        return CRMAccount(**item)

    async def activities(self) -> list[CRMActivity]:
        await self.ensure_ready()
        return [CRMActivity(**item) for item in self._activities.values()]

    async def create_activity(self, request: CRMActivityCreate) -> CRMActivity:
        item = {"id": _id("crm-act"), **request.model_dump(mode="json"), "status": "open", "completed_at": None, "outcome": None, "created_at": _utc_now(), "updated_at": _utc_now()}
        self._activities[item["id"]] = item
        self._add_audit("activity_created", "activity", item["id"], {"title": item["title"], "priority": item["priority"]}, "agent" if request.created_by_agent else "user", "Activity Automation Agent")
        return CRMActivity(**item)

    async def complete_activity(self, activity_id: str) -> CRMActivity:
        item = self._require(self._activities, activity_id, "Activity")
        item.update({"status": "completed", "completed_at": _utc_now(), "outcome": "Completed and logged", "updated_at": _utc_now()})
        self._add_audit("activity_completed", "activity", activity_id, {"title": item["title"]}, "user", item.get("assigned_user_id"))
        return CRMActivity(**item)

    async def calendar(self) -> dict[str, Any]:
        return {"events": [item.model_dump(mode="json") for item in await self.activities() if item.due_at], "site_visits": [item for item in self._activities.values() if item["activity_type"] == "Site visit"]}

    async def create_site_visit(self, payload: dict[str, Any]) -> CRMActivity:
        return await self.create_activity(CRMActivityCreate(activity_type="Site visit", title=payload.get("title") or "Buyer site visit", description=payload.get("description"), due_at=payload.get("scheduled_start"), lead_id=payload.get("lead_id"), opportunity_id=payload.get("opportunity_id"), property_id=payload.get("property_id"), priority="high", created_by_agent=bool(payload.get("created_by_agent", False))))

    async def quotations(self) -> list[CRMProposal]:
        await self.ensure_ready()
        return [CRMProposal(**item) for item in self._proposals.values() if item.get("proposal_type") == "quotation"]

    async def create_quotation(self, payload: dict[str, Any]) -> CRMProposal:
        return self._create_proposal("quotation", payload)

    async def offers(self) -> list[CRMProposal]:
        await self.ensure_ready()
        return [CRMProposal(**item) for item in self._proposals.values() if item.get("proposal_type") == "offer"]

    async def create_offer(self, payload: dict[str, Any]) -> CRMProposal:
        return self._create_proposal("offer", payload)

    def _create_proposal(self, proposal_type: str, payload: dict[str, Any]) -> CRMProposal:
        item = CRMProposal(id=_id("crm-proposal"), organization_id=payload.get("organization_id", "org-astra-demo"), opportunity_id=payload.get("opportunity_id"), property_id=payload.get("property_id"), buyer_id=payload.get("buyer_id"), proposal_type=proposal_type, title=payload.get("title") or f"{proposal_type.title()} draft", content_json=payload.get("content_json") or {"sections": ["Property proposal", "EMI sheet", "Offer summary", "Negotiation brief", "Commission estimate"]}, status="draft", version=1, created_at=_utc_now()).model_dump(mode="json")
        self._proposals[item["id"]] = item
        self._add_audit(f"{proposal_type}_generated", "proposal", item["id"], {"title": item["title"]}, "agent", "Proposal and Offer Agent")
        return CRMProposal(**item)

    async def commissions(self) -> list[CRMCommission]:
        await self.ensure_ready()
        if not self._commissions:
            for opp in self._opportunities.values():
                item = CRMCommission(id=_id("crm-commission"), organization_id=opp["organization_id"], opportunity_id=opp["id"], broker_id=opp.get("broker_id"), agent_id=opp.get("assigned_user_id"), manager_id=opp.get("manager_id"), property_id=opp.get("property_id"), deal_value=opp["opportunity_value"], commission_percentage=2.0, expected_commission=opp["expected_commission"], payout_status="pending", dispute_status="none", created_at=_utc_now()).model_dump(mode="json")
                self._commissions[item["id"]] = item
        return [CRMCommission(**item) for item in self._commissions.values()]

    async def campaigns(self) -> list[CRMCampaign]:
        await self.ensure_ready()
        return [CRMCampaign(**item) for item in self._campaigns.values()]

    async def create_campaign(self, request: CRMCampaignCreate) -> CRMCampaign:
        item = CRMCampaign(id=_id("crm-campaign"), **request.model_dump(mode="json"), status="draft", created_at=_utc_now()).model_dump(mode="json")
        self._campaigns[item["id"]] = item
        self._add_audit("campaign_created", "campaign", item["id"], {"target_segment": item["target_segment"]}, "agent", "Campaign Agent")
        return CRMCampaign(**item)

    async def run_automation(self, request: CRMAutomationRunRequest) -> dict[str, Any]:
        await self.ensure_ready()
        lead = deepcopy(self._leads.get(request.lead_id or "") or next(iter(self._leads.values()), {}))
        opp = deepcopy(self._opportunities.get(request.opportunity_id or "") or {})
        graph = build_crm_graph()
        state = await graph.ainvoke({"user_id": request.user_id, "role": request.role, "organization_id": "org-astra-demo", "lead_id": request.lead_id, "opportunity_id": request.opportunity_id, "property_id": request.property_id, "user_request": request.user_request, "lead_snapshot": lead, "opportunity_snapshot": opp, "messages": [], "audit_events": [], "recommended_actions": []})
        for event in state.get("audit_events", []):
            self._add_audit(event.get("action", "crm_automation_event"), "automation", request.opportunity_id or request.lead_id, {"summary": event.get("details"), "actor": event.get("actor_name")}, "agent", event.get("actor_name", "CRM Orchestrator Agent"))
        if request.create_activity and state.get("activity_context"):
            ctx = state["activity_context"]
            await self.create_activity(CRMActivityCreate(lead_id=request.lead_id or lead.get("id"), opportunity_id=request.opportunity_id or opp.get("id"), activity_type=ctx.get("activity_type", "Call"), title=ctx.get("title", "AI follow-up"), priority=ctx.get("priority", "medium"), created_by_agent=True))
        return {"automation_state": state, "dashboard": (await self.dashboard()).model_dump(mode="json")}

    async def reports_sales(self) -> dict[str, Any]:
        opps = list(self._opportunities.values())
        return {
            "sales_forecast": {"pipeline_value": sum(opp["opportunity_value"] for opp in opps), "weighted_forecast": sum(opp["weighted_value"] for opp in opps), "month_wise_expected_closing": {"June 2026": 4, "July 2026": 8}},
            "lead_sources": {source: sum(1 for lead in self._leads.values() if lead["source"] == source) for source in ["WhatsApp", "Vapi call", "Website form", "Broker referral", "XR tour", "PropertyPool", "Campaign"]},
            "team_performance": [{"name": "Asha Kulkarni", "calls": 42, "visits": 11, "offers": 5, "closed": 2, "commission": 8_400_000}, {"name": "Rohan Shah", "calls": 36, "visits": 8, "offers": 3, "closed": 1, "commission": 4_200_000}],
            "property_performance": [{"property": opp["property_name"], "locality": opp["locality"], "offers": 1 if opp["stage"] in {"Offer Discussed", "Negotiation"} else 0, "conversion_rate": round(opp["probability"] / 100, 2)} for opp in opps],
            "broker_performance": [{"broker_id": "broker-demo-1", "tieups_approved": 4, "buyers_introduced": 14, "deals_closed": 2, "commission_earned": 6_800_000}],
        }

    async def reports_team(self) -> dict[str, Any]:
        return (await self.reports_sales())["team_performance"]

    async def reports_revenue(self) -> dict[str, Any]:
        return (await self.reports_sales())["sales_forecast"]

    async def audit_log(self) -> list[CRMAuditLog]:
        await self.ensure_ready()
        return [CRMAuditLog(**item) for item in self._audit]

    def _require(self, collection: dict[str, dict[str, Any]], item_id: str, label: str) -> dict[str, Any]:
        if item_id not in collection:
            raise HTTPException(status_code=404, detail=f"{label} not found")
        return collection[item_id]


crm_erp_service = CRMERPService()
