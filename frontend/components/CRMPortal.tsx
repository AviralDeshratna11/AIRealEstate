"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  Activity,
  BadgeIndianRupee,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  GanttChartSquare,
  Home,
  LayoutDashboard,
  MessageCircle,
  Network,
  PhoneCall,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
  Wand2,
} from "lucide-react";
import type { CRMActivity, CRMCommission, CRMDashboard, CRMLead, CRMOpportunity, CRMPipelinePayload } from "@/lib/api";
import {
  formatCr,
  getCRMAccounts,
  getCRMActivities,
  getCRMCampaigns,
  getCRMCommissions,
  getCRMContacts,
  getCRMDashboard,
  getCRMLeads,
  getCRMOpportunities,
  getCRMPipeline,
  getCRMReports,
  getVoiceAnalytics,
  callCRMLeadWithElevenLabs,
  runCRMAutomation,
  type VoiceAnalytics,
  type VoiceCallResult,
} from "@/lib/api";

export type CRMView =
  | "dashboard"
  | "pipeline"
  | "leads"
  | "opportunities"
  | "opportunity-detail"
  | "contacts"
  | "accounts"
  | "properties"
  | "activities"
  | "calendar"
  | "quotations"
  | "offers"
  | "commissions"
  | "campaigns"
  | "automation"
  | "reports"
  | "team"
  | "documents"
  | "approvals"
  | "settings"
  | "messages";

const navItems = [
  { view: "dashboard", label: "Dashboard", href: "/crm", icon: LayoutDashboard },
  { view: "pipeline", label: "Pipeline", href: "/crm/pipeline", icon: GanttChartSquare },
  { view: "leads", label: "Leads", href: "/crm/leads", icon: Target },
  { view: "opportunities", label: "Opportunities", href: "/crm/opportunities", icon: BriefcaseBusiness },
  { view: "contacts", label: "Contacts", href: "/crm/contacts", icon: UsersRound },
  { view: "accounts", label: "Accounts", href: "/crm/accounts", icon: Network },
  { view: "properties", label: "Properties", href: "/crm/properties", icon: Home },
  { view: "activities", label: "Activities", href: "/crm/activities", icon: Activity },
  { view: "calendar", label: "Calendar", href: "/crm/calendar", icon: CalendarClock },
  { view: "quotations", label: "Quotations", href: "/crm/quotations", icon: FileText },
  { view: "offers", label: "Offers", href: "/crm/offers", icon: ClipboardList },
  { view: "commissions", label: "Commissions", href: "/crm/commissions", icon: BadgeIndianRupee },
  { view: "campaigns", label: "Campaigns", href: "/crm/campaigns", icon: MessageCircle },
  { view: "automation", label: "Automation", href: "/crm/automation", icon: Bot },
  { view: "reports", label: "Reports", href: "/crm/reports", icon: BarChart3 },
  { view: "team", label: "Team", href: "/crm/team", icon: UsersRound },
  { view: "documents", label: "Documents", href: "/crm/documents", icon: ShieldCheck },
  { view: "approvals", label: "Approvals", href: "/crm/approvals", icon: CheckCircle2 },
  { view: "settings", label: "Settings", href: "/crm/settings", icon: Settings2 },
] as const;

type PortalData = {
  dashboard: CRMDashboard | null;
  pipeline: CRMPipelinePayload | null;
  leads: CRMLead[];
  opportunities: CRMOpportunity[];
  activities: CRMActivity[];
  commissions: CRMCommission[];
  campaigns: Array<Record<string, unknown>>;
  contacts: Array<Record<string, unknown>>;
  accounts: Array<Record<string, unknown>>;
  reports: Record<string, unknown>;
  voiceAnalytics: VoiceAnalytics | null;
};

export function CRMPortal({ view, id }: { view: CRMView; id?: string | null }) {
  const [data, setData] = useState<PortalData>({ dashboard: null, pipeline: null, leads: [], opportunities: [], activities: [], commissions: [], campaigns: [], contacts: [], accounts: [], reports: {}, voiceAnalytics: null });
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([getCRMDashboard(), getCRMPipeline(), getCRMLeads(), getCRMOpportunities(), getCRMActivities(), getCRMCommissions(), getCRMCampaigns(), getCRMContacts(), getCRMAccounts(), getCRMReports(), getVoiceAnalytics()])
      .then(([dashboard, pipeline, leads, opportunities, activities, commissions, campaigns, contacts, accounts, reports, voiceAnalytics]) => setData({ dashboard, pipeline, leads, opportunities, activities, commissions, campaigns, contacts, accounts, reports, voiceAnalytics }))
      .catch(console.error);
  }, []);

  const dashboard = data.dashboard || emptyDashboard();
  const pipeline = data.pipeline || { stages: dashboard.pipeline_stages, opportunities: dashboard.open_opportunities };
  const filteredOpps = useMemo(() => {
    const lower = query.toLowerCase();
    if (!lower) return data.opportunities.length ? data.opportunities : dashboard.open_opportunities;
    return (data.opportunities.length ? data.opportunities : dashboard.open_opportunities).filter((item) => [item.title, item.buyer_name, item.property_name, item.locality, item.source, item.stage].some((value) => String(value || "").toLowerCase().includes(lower)));
  }, [query, data.opportunities, dashboard.open_opportunities]);
  const activeOpportunity = filteredOpps.find((item) => item.id === id) || filteredOpps[0];

  async function runAutomation() {
    setBusy(true);
    try {
      const result = await runCRMAutomation({ user_request: "Who should I call today?", lead_id: dashboard.hot_leads[0]?.id, opportunity_id: activeOpportunity?.id });
      if (result?.dashboard) setData((current) => ({ ...current, dashboard: result.dashboard as CRMDashboard }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="mx-auto flex min-h-screen max-w-[1780px] gap-4 px-3 py-3 md:px-5 lg:px-7">
        <aside className="hidden w-[274px] shrink-0 lg:block">
          <div className="sticky top-3 rounded-xl border border-ink/12 bg-ivory p-3 shadow-lx">
            <div className="rounded-xl border border-gold/25 bg-gold/8 p-4 text-ink">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold"><Sparkles size={14} /> ASTRA Sales OS</div>
              <h1 className="mt-3 text-2xl font-bold leading-tight">Real Estate CRM / ERP</h1>
              <p className="mt-2 text-sm leading-6 text-ink/62">Leads, pipeline, broker attribution, visits, offers, commissions, reports, and next actions.</p>
            </div>
            <nav className="mt-3 space-y-1">
              <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink/60 hover:bg-sand"><span className="grid h-7 w-7 place-items-center rounded-xl border border-ink/15 bg-ivory text-ink/70"><Home size={16} /></span> Home</Link>
              <Link href="/radar" className="flex items-center gap-3 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2.5 text-sm font-semibold text-ink/80 transition-colors hover:bg-gold hover:text-ivory"><span className="grid h-7 w-7 place-items-center rounded-xl border border-gold/40 bg-ivory text-gold"><ChevronRight size={16} /></span> Redevelopment Radar</Link>
              {navItems.map((item) => {
                const Icon = item.icon;
                const selected = item.view === view || (view === "opportunity-detail" && item.view === "opportunities");
                return (
                  <Link key={item.href} href={item.href} className={clsx("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors", selected ? "bg-ink text-ivory" : "text-ink/60 hover:bg-sand")}>
                    <span className={clsx("grid h-7 w-7 place-items-center rounded-xl", selected ? "bg-gold text-ivory" : "border border-ink/15 bg-ivory text-ink/70")}><Icon size={16} /></span>
                    <span className="flex-1">{item.label}</span>
                    {selected && <ChevronRight size={15} />}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <section className="min-w-0 flex-1 space-y-4 pb-28">
          <header className="portal-surface rounded-xl border border-ink/12 p-4 shadow-lx">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex items-center gap-3"><span className="h-px w-10 bg-gold" /><span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">Mumbai sales workspace</span></div>
                <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">Pipeline, leads, and property deals in one CRM view.</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="flex min-h-11 items-center gap-2 rounded-xl border border-ink/15 bg-ivory px-3 text-sm font-semibold text-ink/60 focus-within:border-gold">
                  <Search size={17} />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search leads, properties, brokers" className="w-64 bg-transparent outline-none" />
                </label>
                <button onClick={runAutomation} className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory shadow-lx transition-colors hover:bg-[#1d4ed8]">
                  <Wand2 size={17} />
                  {busy ? "Running..." : "Ask CRM AI"}
                </button>
              </div>
            </div>
          </header>

          {view === "dashboard" && <DashboardView dashboard={dashboard} pipeline={pipeline} voiceAnalytics={data.voiceAnalytics} />}
          {view === "pipeline" && <PipelineView pipeline={{ ...pipeline, opportunities: filteredOpps }} />}
          {view === "leads" && <LeadsView leads={data.leads.length ? data.leads : dashboard.hot_leads} />}
          {view === "opportunities" && <OpportunitiesView opportunities={filteredOpps} />}
          {view === "opportunity-detail" && activeOpportunity && <OpportunityDetail opportunity={activeOpportunity} activities={data.activities} commissions={data.commissions} />}
          {view === "activities" && <ActivitiesView activities={data.activities} />}
          {view === "calendar" && <CalendarView activities={data.activities} />}
          {(view === "contacts" || view === "accounts") && <DirectoryView title={view === "contacts" ? "Contacts" : "Accounts"} items={view === "contacts" ? data.contacts : data.accounts} />}
          {view === "properties" && <PropertiesCRMView opportunities={filteredOpps} />}
          {(view === "quotations" || view === "offers") && <ProposalView type={view} opportunities={filteredOpps} />}
          {view === "commissions" && <CommissionsView commissions={data.commissions} opportunities={filteredOpps} />}
          {view === "campaigns" && <CampaignsView campaigns={data.campaigns} />}
          {view === "automation" && <AutomationView dashboard={dashboard} onRun={runAutomation} busy={busy} />}
          {view === "reports" && <ReportsView dashboard={dashboard} reports={data.reports} />}
          {view === "team" && <TeamView />}
          {view === "documents" && <DocumentsView />}
          {view === "approvals" && <ApprovalsView />}
          {view === "settings" && <SettingsView />}
          {view === "messages" && <MessagesView leads={data.leads} />}
          <AssistantDock actions={dashboard.priority_inbox} />
        </section>
      </div>
    </main>
  );
}

export function CRMAppLanding() {
  const modules = ["Manager Selling Portal", "Buyer Intelligence Portal", "Broker Partner Portal", "PropertyPool", "XR Property Tour", "WhatsApp Assistant", "Call Agent", "Document Agent", "Finance Agent", "Negotiation Agent", "Market Intelligence Agent"];
  return (
    <main className="min-h-screen bg-ivory text-ink">
      <section className="border-b border-ink/12 bg-ivory">
        <div className="mx-auto grid min-h-[86vh] max-w-7xl gap-8 px-4 py-8 md:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <div className="flex items-center gap-3"><span className="h-px w-10 bg-gold" /><span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">ASTRA CRM / ERP</span></div>
            <h1 className="lx-display mt-4 text-4xl font-light tracking-tight text-ink md:text-6xl">Real Estate Sales Teams, From Lead Chaos to Closing Intelligence</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/65">ASTRA CRM is an AI-native sales and ERP system built for Mumbai real estate teams. Track leads, automate follow-ups, manage broker tie-ups, schedule visits, forecast revenue, and close property deals faster.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/crm" className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-[#1d4ed8]">Start Free</Link>
              <Link href="/crm/pipeline" className="inline-flex items-center gap-2 rounded-xl border border-ink/15 bg-ivory px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-sand">View Demo</Link>
              <Link href="/crm/messages" className="inline-flex items-center gap-2 rounded-xl border border-ink/15 bg-ivory px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-sand">Talk to Sales</Link>
            </div>
          </div>
          <div className="rounded-xl border border-ink/12 bg-ivory p-4 shadow-lx">
            <PipelineMini />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            ["Pipeline at a Glance", "Visual Kanban, stage revenue, probability-weighted forecasts, property-linked cards, and broker/buyer attribution."],
            ["Never Miss a Follow-Up", "Automatic next activity, call reminders, WhatsApp nudges, site visit reminders, and post-visit offer follow-up."],
            ["Communication in One Place", "WhatsApp, calls, email, buyer portal chat, XR questions, PropertyPool RSVPs, and broker messages attached to every record."],
            ["Real Estate Quotations and Offers", "Buyer proposals, EMI sheets, payment schedules, offer summaries, negotiation briefs, and commission estimates."],
            ["Reporting That Turns Data Into Closings", "Revenue forecast, commission pipeline, demand, conversion, team performance, broker performance, and campaign ROI."],
            ["AI Automation", "Lead scoring, buyer-property matching, follow-up generation, legal summaries, negotiation recommendations, and CRM hygiene cleanup."],
          ].map(([title, body]) => <Panel key={title} title={title} eyebrow="Sales OS"><p className="text-sm leading-7 text-ink/55">{body}</p></Panel>)}
        </div>
      </section>
      <section className="bg-espresso px-4 py-12 text-ivory md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3"><span className="h-px w-10 bg-goldsoft" /><span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-goldsoft">Apps that work together</span></div>
          <div className="mt-5 grid gap-3 md:grid-cols-3 lg:grid-cols-4">{modules.map((item) => <div key={item} className="rounded-xl border border-ivory/15 bg-ivory/5 p-4 text-sm font-semibold">{item}</div>)}</div>
        </div>
      </section>
    </main>
  );
}

function DashboardView({ dashboard, pipeline, voiceAnalytics }: { dashboard: CRMDashboard; pipeline: CRMPipelinePayload; voiceAnalytics: VoiceAnalytics | null }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{dashboard.summary_cards.map((card) => <MetricCard key={card.label} {...card} />)}</div>
      <Panel title="ASTRA Voice Closer" eyebrow="ElevenLabs credit protection">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <MiniMetric label="Mode" value={voiceAnalytics?.mode || "mock"} />
          <MiniMetric label="Calls today" value={voiceAnalytics?.calls_today ?? 0} />
          <MiniMetric label="Calls this week" value={voiceAnalytics?.calls_this_week ?? 0} />
          <MiniMetric label="Credits used" value={voiceAnalytics?.estimated_credits_used ?? 0} />
          <MiniMetric label="Remaining budget" value={voiceAnalytics?.remaining_call_budget ?? 10} />
          <MiniMetric label="Visits booked" value={voiceAnalytics?.visits_booked_from_calls ?? 0} />
        </div>
      </Panel>
      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Panel title="Sales pipeline preview" eyebrow="Odoo-style kanban discipline"><PipelineView pipeline={pipeline} compact /></Panel>
        <Panel title="AI priority inbox" eyebrow="Next best action">{dashboard.priority_inbox.map((item) => <ActionRow key={item.id} action={item} />)}</Panel>
      </div>
      <Panel title="Activity feed" eyebrow="Audit-backed sales operations"><div className="grid gap-3 md:grid-cols-2">{dashboard.activity_feed.map((item) => <FeedRow key={item.id} item={item} />)}</div></Panel>
    </div>
  );
}

function PipelineView({ pipeline, compact = false }: { pipeline: CRMPipelinePayload; compact?: boolean }) {
  return (
    <div className={clsx("overflow-x-auto", !compact && "rounded-xl border border-ink/12 bg-ivory p-4")}>
      <div className="flex min-w-[1180px] gap-3">
        {pipeline.stages.filter((stage) => compact ? stage.opportunity_count > 0 : true).map((stage) => {
          const opps = pipeline.opportunities.filter((opp) => opp.stage === stage.stage_name);
          return (
            <section key={stage.id} className="w-[260px] shrink-0 rounded-xl border border-ink/12 bg-sand p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{stage.stage_name}</p>
                  <p className="mt-1 text-xs font-semibold text-ink/55">{opps.length} deals · {formatCr(stage.weighted_value)} weighted</p>
                </div>
                <span className="h-3 w-3 rounded-full" style={{ background: stage.color }} />
              </div>
              <div className="mt-3 space-y-3">{opps.map((opp) => <OpportunityCard key={opp.id} opportunity={opp} />)}</div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function OpportunityCard({ opportunity }: { opportunity: CRMOpportunity }) {
  return (
    <Link href={`/crm/opportunities/${opportunity.id}`} className="block rounded-xl border border-ink/12 bg-ivory p-3 shadow-lx transition hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink">{opportunity.buyer_name}</p>
          <p className="mt-1 text-xs font-semibold text-ink/55">{opportunity.property_name}</p>
        </div>
        <Score score={opportunity.lead_score} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <MiniMetric label="Value" value={formatCr(opportunity.opportunity_value)} />
        <MiniMetric label="Prob." value={`${opportunity.probability}%`} />
      </div>
      <p className="mt-3 text-xs font-semibold text-ink/60">{opportunity.next_activity}</p>
      <div className="mt-3 flex flex-wrap gap-1">{opportunity.warning_badges.slice(0, 3).map((badge) => <StatusBadge key={badge} status={badge} />)}</div>
    </Link>
  );
}

function LeadsView({ leads }: { leads: CRMLead[] }) {
  return <Panel title="Unified lead inbox" eyebrow="WhatsApp, calls, web, XR, PropertyPool, broker"><div className="grid gap-3">{leads.map((lead) => <LeadVoiceRow key={lead.id} lead={lead} />)}</div></Panel>;
}

function LeadVoiceRow({ lead }: { lead: CRMLead }) {
  const [result, setResult] = useState<VoiceCallResult | null>(null);
  const [busy, setBusy] = useState(false);
  async function callLead() {
    setBusy(true);
    try {
      setResult(await callCRMLeadWithElevenLabs(lead.id, { property_id: "seller-demo-powai-1", call_goal: "property_detail", preferred_language: "Hinglish", force_call: true }));
    } finally {
      setBusy(false);
    }
  }
  return <div className="rounded-xl border border-ink/12 bg-sand p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><p className="font-semibold text-ink">{lead.full_name}</p><p className="mt-1 text-sm text-ink/55">{lead.source} · {formatCr(lead.budget_max)} · score {lead.lead_score}/100 · {lead.qualification_status}</p></div><button onClick={callLead} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-[#1d4ed8]"><PhoneCall size={16} />{busy ? "Calling..." : "Call with ElevenLabs"}</button></div>{result ? <p className="mt-3 rounded-xl border border-ink/12 bg-ivory p-3 text-sm font-semibold text-ink/70">{result.call_status} · {result.reason}</p> : null}</div>;
}

function OpportunitiesView({ opportunities }: { opportunities: CRMOpportunity[] }) {
  const [stage, setStage] = useState("all");
  const [sort, setSort] = useState<"value" | "probability">("value");

  const filtered = useMemo(() => {
    const items = stage === "all" ? opportunities : opportunities.filter((item) => item.stage === stage);
    return [...items].sort((a, b) => (sort === "value" ? b.opportunity_value - a.opportunity_value : b.probability - a.probability));
  }, [opportunities, stage, sort]);

  const stages = useMemo(() => Array.from(new Set(opportunities.map((item) => item.stage))), [opportunities]);

  return (
    <Panel title="Opportunity workspace" eyebrow="Property-specific sales discipline">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select value={stage} onChange={(event) => setStage(event.target.value)} className="rounded-xl border border-ink/15 bg-ivory px-3 py-2.5 text-sm font-semibold text-ink/70 outline-none focus:border-gold">
          <option value="all">All stages</option>
          {stages.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value as "value" | "probability")} className="rounded-xl border border-ink/15 bg-ivory px-3 py-2.5 text-sm font-semibold text-ink/70 outline-none focus:border-gold">
          <option value="value">Sort: Highest value</option>
          <option value="probability">Sort: Highest probability</option>
        </select>
        <span className="text-xs font-semibold text-ink/45">{filtered.length} opportunities</span>
      </div>
      <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">{filtered.map((opp) => <OpportunityCard key={opp.id} opportunity={opp} />)}</div>
    </Panel>
  );
}

function OpportunityDetail({ opportunity, activities, commissions }: { opportunity: CRMOpportunity; activities: CRMActivity[]; commissions: CRMCommission[] }) {
  const tabs = ["Overview", "Buyer Profile", "Property Match", "Interactions", "Activities", "Site Visits", "Offers", "Documents", "Negotiation", "Commission", "Audit Log"];
  const commission = commissions.find((item) => item.opportunity_id === opportunity.id);
  return (
    <div className="space-y-4">
      <Panel title={opportunity.title} eyebrow="Opportunity detail">
        <div className="grid gap-3 md:grid-cols-4"><MiniMetric label="Stage" value={opportunity.stage} /><MiniMetric label="Expected value" value={formatCr(opportunity.opportunity_value)} /><MiniMetric label="Probability" value={`${opportunity.probability}%`} /><MiniMetric label="Weighted forecast" value={formatCr(opportunity.weighted_value)} /></div>
        <p className="mt-4 rounded-xl bg-espresso p-4 text-sm leading-7 text-ivory">AI summary: {opportunity.buyer_name} is a {opportunity.lead_score >= 85 ? "high-intent" : "qualified"} buyer for {opportunity.locality}. Next action: {opportunity.next_activity}.</p>
      </Panel>
      <div className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
        <Panel title="Tabs" eyebrow="CRM record">{tabs.map((tab) => <div key={tab} className="mb-2 rounded-xl border border-ink/12 bg-sand px-3 py-2 text-sm font-semibold text-ink/70">{tab}</div>)}</Panel>
        <Panel title="Live record intelligence" eyebrow="AI + ERP context">
          <div className="grid gap-3 md:grid-cols-2">
            <InfoBlock title="Buyer profile" items={["Budget fit aligned", "Family and EMI needs captured", "Loan readiness affects score"]} />
            <InfoBlock title="Property match" items={[opportunity.property_name || "Matched property", `Locality: ${opportunity.locality}`, "AI explanation stored in metadata"]} />
            <InfoBlock title="Activities" items={activities.filter((item) => item.opportunity_id === opportunity.id).map((item) => item.title).slice(0, 4)} />
            <InfoBlock title="Commission" items={[`Expected: ${formatCr(commission?.expected_commission || opportunity.expected_commission)}`, `Attribution: ${opportunity.broker_attribution || "direct"}`, `Dispute: ${commission?.dispute_status || "none"}`]} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ActivitiesView({ activities }: { activities: CRMActivity[] }) {
  return <Panel title="Activities and automation" eyebrow="Calls, WhatsApp, visits, approvals"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{activities.map((item) => <TaskCard key={item.id} item={item} />)}</div></Panel>;
}

function CalendarView({ activities }: { activities: CRMActivity[] }) {
  return <Panel title="Calendar" eyebrow="Due today, overdue, site visits"><div className="grid gap-3 md:grid-cols-2">{activities.map((item) => <TaskCard key={item.id} item={item} />)}</div></Panel>;
}

function DirectoryView({ title, items }: { title: string; items: Array<Record<string, unknown>> }) {
  return <Panel title={title} eyebrow="CRM directory"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <div key={String(item.id)} className="rounded-xl border border-ink/12 bg-sand p-4"><p className="font-semibold text-ink">{String(item.full_name || item.account_name)}</p><p className="mt-1 text-sm text-ink/55">{String(item.phone || item.email || item.account_type || "")}</p><div className="mt-3 flex flex-wrap gap-1">{(Array.isArray(item.tags) ? item.tags : [item.source || item.contact_type || item.account_type]).filter(Boolean).map((tag) => <StatusBadge key={String(tag)} status={String(tag)} />)}</div></div>)}</div></Panel>;
}

function PropertiesCRMView({ opportunities }: { opportunities: CRMOpportunity[] }) {
  return <Panel title="CRM properties" eyebrow="Manager listings connected to sales"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{opportunities.map((opp) => <div key={opp.id} className="rounded-xl border border-ink/12 bg-sand p-4"><p className="lx-display text-lg font-light text-ink">{opp.property_name}</p><p className="mt-1 text-sm text-ink/55">{opp.locality} · {formatCr(opp.opportunity_value)} pipeline</p><MiniMetric label="Demand signal" value={`${opp.lead_score}/100`} /></div>)}</div></Panel>;
}

function ProposalView({ type, opportunities }: { type: "quotations" | "offers"; opportunities: CRMOpportunity[] }) {
  return <Panel title={type === "quotations" ? "Quotations and buyer proposals" : "Offers and negotiation"} eyebrow="PDF, WhatsApp, email, approval workflow"><div className="grid gap-3 md:grid-cols-2">{opportunities.slice(0, 4).map((opp) => <InfoBlock key={opp.id} title={`${type === "offers" ? "Offer" : "Proposal"} for ${opp.buyer_name}`} items={["Property pitch", "EMI sheet", "Stamp duty and registration estimate", "Negotiation summary", "Broker commission estimate"]} />)}</div></Panel>;
}

function CommissionsView({ commissions, opportunities }: { commissions: CRMCommission[]; opportunities: CRMOpportunity[] }) {
  const total = commissions.reduce((sum, item) => sum + item.expected_commission, 0) || opportunities.reduce((sum, item) => sum + item.expected_commission, 0);
  return <Panel title="Commission management" eyebrow="Attribution-backed payout control"><div className="mb-4 rounded-xl bg-espresso p-5 text-ivory"><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-goldsoft">Expected commission</p><p className="lx-display mt-2 text-4xl font-light">{formatCr(total)}</p></div><div className="grid gap-3 md:grid-cols-2">{(commissions.length ? commissions : opportunities.map((opp) => ({ id: opp.id, deal_value: opp.opportunity_value, commission_percentage: 2, expected_commission: opp.expected_commission, payout_status: "pending", dispute_status: "none", created_at: "" }))).map((item) => <InfoBlock key={item.id} title={formatCr(item.expected_commission)} items={[`Deal value: ${formatCr(item.deal_value)}`, `Rule: ${item.commission_percentage}%`, `Payout: ${item.payout_status}`, `Dispute: ${item.dispute_status}`]} />)}</div></Panel>;
}

function CampaignsView({ campaigns }: { campaigns: Array<Record<string, unknown>> }) {
  return <Panel title="Campaign builder" eyebrow="WhatsApp, launch, NRI, locality, PropertyPool"><div className="grid gap-3 md:grid-cols-2">{campaigns.map((item) => <InfoBlock key={String(item.id)} title={String(item.campaign_name)} items={[`Type: ${item.campaign_type}`, `Target: ${item.target_segment}`, `Sent: ${item.sent_count}`, `Replies: ${item.reply_count}`, `Pipeline: ${formatCr(Number(item.revenue_pipeline || 0))}`]} />)}</div></Panel>;
}

function AutomationView({ dashboard, onRun, busy }: { dashboard: CRMDashboard; onRun: () => void; busy: boolean }) {
  return <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]"><Panel title="AI automation controls" eyebrow="CRM agent swarm"><button onClick={onRun} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-[#1d4ed8]"><Wand2 size={17} />{busy ? "Running..." : "Run CRM Orchestrator"}</button><div className="mt-4 space-y-2">{["Lead score > 80 creates call task within 15 minutes", "XR tour completion asks for a site visit", "Visit completion follows up within 2 hours", "Offer routes to negotiation agent", "Stale lead after 5 days alerts owner"].map((item) => <TaskLine key={item} text={item} />)}</div></Panel><Panel title="Agent recommendations" eyebrow="Command-routed state machines">{dashboard.priority_inbox.map((item) => <ActionRow key={item.id} action={item} />)}</Panel></div>;
}

function ReportsView({ dashboard, reports }: { dashboard: CRMDashboard; reports: Record<string, unknown> }) {
  const source = (reports.lead_sources || dashboard.reports.lead_sources || {}) as Record<string, number>;
  return <div className="grid gap-4 xl:grid-cols-2"><Panel title="Sales forecast" eyebrow="Revenue and stage discipline"><div className="grid gap-3 md:grid-cols-2">{dashboard.pipeline_stages.filter((item) => item.opportunity_count).map((stage) => <MiniMetric key={stage.id} label={stage.stage_name} value={formatCr(stage.weighted_value)} />)}</div></Panel><Panel title="Lead source report" eyebrow="Attribution"><div className="grid gap-3 md:grid-cols-2">{Object.entries(source).map(([key, value]) => <MiniMetric key={key} label={key} value={String(value)} />)}</div></Panel><Panel title="Team performance" eyebrow="Calls, visits, offers, deals"><InfoBlock title="Asha Kulkarni" items={["42 calls", "11 visits", "5 offers", "2 closed deals", "INR 84L commission"]} /></Panel><Panel title="Broker performance" eyebrow="Tie-ups and commission"><InfoBlock title="Shah Homes Network" items={["4 tie-ups approved", "14 buyers introduced", "8 visits completed", "2 deals closed"]} /></Panel></div>;
}

function TeamView() {
  return <Panel title="Team management" eyebrow="Roles, targets, performance"><div className="grid gap-3 md:grid-cols-3">{["Sales Manager", "Sales Agent", "Property Manager", "Broker Partner", "Finance Executive", "Legal Executive"].map((role, index) => <InfoBlock key={role} title={role} items={[`Target: ${formatCr((index + 2) * 50000000)}`, `Assigned leads: ${12 + index * 3}`, `Conversion: ${24 + index * 3}%`]} />)}</div></Panel>;
}

function DocumentsView() {
  return <Panel title="Documents" eyebrow="Buyer, seller, property, legal, proposals"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{["OC missing for Bandra", "Title report extracted", "Offer letter draft", "Proposal PDF v2", "EMI sheet", "Agreement checklist"].map((item) => <TaskLine key={item} text={item} />)}</div></Panel>;
}

function ApprovalsView() {
  return <Panel title="Approvals" eyebrow="Broker, offer, documents, commissions"><div className="grid gap-3 md:grid-cols-2">{["Broker tie-up approval", "PropertyPool approval", "Price change approval", "Offer approval", "Document sharing approval", "Commission dispute approval"].map((item) => <InfoBlock key={item} title={item} items={["Pending manager review", "AI recommendation attached", "Audit log enabled"]} />)}</div></Panel>;
}

function SettingsView() {
  return <Panel title="CRM settings" eyebrow="Roles and permission scope"><div className="grid gap-3 md:grid-cols-3">{["Admin", "Sales Manager", "Sales Agent", "Property Manager", "Broker Partner", "Finance Executive", "Legal Executive", "Marketing Executive", "Viewer"].map((role) => <TaskLine key={role} text={`${role}: role-aware CRM access`} />)}</div></Panel>;
}

function MessagesView({ leads }: { leads: CRMLead[] }) {
  return <Panel title="Communication hub" eyebrow="WhatsApp, calls, email, chat, XR transcripts"><div className="grid gap-3 md:grid-cols-2">{leads.map((lead) => <InfoBlock key={lead.id} title={lead.full_name} items={[`Channel: ${lead.source}`, `Intent score: ${lead.lead_score}`, "Suggested reply: share shortlist, EMI, and visit slot", "Attach to opportunity and create follow-up"]} />)}</div></Panel>;
}

function AssistantDock({ actions }: { actions: CRMDashboard["priority_inbox"] }) {
  return <div className="rounded-xl border border-ink/12 bg-ivory p-4 shadow-lx"><div className="flex items-center gap-2 text-sm font-semibold text-gold"><Bot size={17} /> CRM assistant</div><p className="mt-2 text-sm leading-6 text-ink/55">Ask: show my hot leads, calculate commission, generate proposal, or explain why pipeline is weak.</p><div className="mt-3 grid gap-2 md:grid-cols-2">{actions.slice(0, 2).map((item) => <TaskLine key={item.id} text={item.title} />)}</div></div>;
}

function PipelineMini() {
  const payload = { stages: ["New", "Qualified", "Visit", "Offer", "Won"], cards: ["Rahul", "Priya", "Kabir", "Nisha"] };
  return <div className="grid gap-3"><div className="grid grid-cols-5 gap-2">{payload.stages.map((stage) => <div key={stage} className="rounded-xl border border-ink/12 bg-ivory p-3 text-xs font-semibold text-ink/70 shadow-lx">{stage}</div>)}</div><div className="grid gap-2 md:grid-cols-2">{payload.cards.map((card, index) => <div key={card} className="rounded-xl border border-ink/12 bg-ivory p-4"><p className="font-semibold text-ink">{card}</p><p className="mt-1 text-sm text-ink/55">{["AI score 91", "Offer ready", "XR engaged", "Legal risk"][index]}</p></div>)}</div><div className="rounded-xl bg-espresso p-4 text-ivory"><p className="text-sm font-semibold">AI lead score card</p><p className="lx-display mt-2 text-3xl font-light">94/100</p><p className="mt-1 text-sm text-ivory/70">PropertyPool buyer, Bandra, ready in 30 days.</p></div></div>;
}

function Panel({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return <section className="rounded-xl border border-ink/12 bg-ivory p-5 shadow-lx"><div className="mb-4 flex items-start justify-between gap-4"><div><p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-gold">{eyebrow}</p><h3 className="lx-display mt-1 text-2xl font-light tracking-tight text-ink">{title}</h3></div><Sparkles size={19} className="text-gold" /></div>{children}</section>;
}

function MetricCard({ label, value, detail, tone = "slate" }: { label: string; value: string; detail?: string | null; tone?: string }) {
  const highlighted = tone === "emerald" || tone === "gold" || tone === "amber";
  return <div className="rounded-xl border border-ink/12 bg-ivory p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/45">{label}</p><p className={clsx("lx-display mt-2 text-3xl font-light", highlighted ? "text-gold" : "text-ink")}>{value}</p><p className="mt-1 text-sm text-ink/55">{detail}</p></div>;
}

function MiniMetric({ label, value }: { label: string; value?: string | number | null }) {
  return <div className="rounded-xl border border-ink/12 bg-ivory p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-ink/45">{label}</p><p className="lx-display mt-1 text-sm font-light text-ink">{value || "-"}</p></div>;
}

function StatusBadge({ status }: { status: string }) {
  const lower = status.toLowerCase();
  const positive = ["won", "active", "approved", "hot", "ready", "scheduled", "qualified", "booked"];
  const pending = ["review", "pending", "warm", "working"];
  const negative = ["lost", "cold"];
  const tone = positive.some((key) => lower.includes(key)) ? "border-gold/45 bg-gold/10 text-[#1d4ed8]" : pending.some((key) => lower.includes(key)) ? "border-ink/20 bg-ink/5 text-ink/60" : negative.some((key) => lower.includes(key)) ? "border-coral/40 bg-coral/10 text-coral" : "border-ink/15 text-ink/55";
  return <span className={clsx("rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] capitalize", tone)}>{status}</span>;
}

function Score({ score }: { score: number }) {
  return <span className={clsx("rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]", score >= 85 ? "border-gold/45 bg-gold/10 text-[#1d4ed8]" : score >= 70 ? "border-ink/20 bg-ink/5 text-ink/60" : "border-ink/15 text-ink/55")}>{score}</span>;
}

function ActionRow({ action }: { action: CRMDashboard["priority_inbox"][number] }) {
  return <div className="mb-3 rounded-xl border border-ink/12 bg-sand p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-ink">{action.title}</p><p className="mt-1 text-sm leading-6 text-ink/60">{action.reason}</p><p className="mt-2 text-xs font-semibold text-gold">{action.recommended_action}</p></div><StatusBadge status={action.priority} /></div></div>;
}

function FeedRow({ item }: { item: { action: string; actor_type: string; details_json: Record<string, unknown>; created_at: string } }) {
  return <div className="rounded-xl border border-ink/12 bg-sand p-3"><p className="text-sm font-semibold capitalize text-ink">{item.action.replace(/_/g, " ")}</p><p className="mt-1 text-sm text-ink/60">{String(item.details_json.summary || item.actor_type)}</p><p className="mt-2 text-xs font-semibold text-ink/40">{new Date(item.created_at).toLocaleString("en-IN")}</p></div>;
}

function TaskCard({ item }: { item: CRMActivity }) {
  return <div className="rounded-xl border border-ink/12 bg-sand p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-ink">{item.title}</p><p className="mt-1 text-sm text-ink/55">{item.activity_type} · {item.due_at ? new Date(item.due_at).toLocaleString("en-IN") : "No due date"}</p></div><StatusBadge status={item.status} /></div><p className="mt-3 text-sm leading-6 text-ink/60">{item.description}</p></div>;
}

function InfoBlock({ title, items }: { title: string; items: string[] }) {
  return <div className="rounded-xl border border-ink/12 bg-sand p-4"><p className="font-semibold text-ink">{title}</p><div className="mt-3 space-y-2">{items.filter(Boolean).map((item) => <TaskLine key={item} text={item} />)}</div></div>;
}

function TaskLine({ text }: { text: string }) {
  return <div className="flex items-start gap-2 rounded-xl border border-ink/12 bg-ivory px-3 py-2 text-sm font-semibold text-ink/70"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-gold" />{text}</div>;
}

function emptyDashboard(): CRMDashboard {
  return { summary_cards: [], pipeline_stages: [], priority_inbox: [], activity_feed: [], hot_leads: [], open_opportunities: [], reports: {} };
}
