"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  BadgeCheck,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Home,
  IndianRupee,
  LayoutDashboard,
  MessageCircle,
  Network,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Wand2,
} from "lucide-react";
import type {
  BrokerBuyer,
  BrokerDashboard,
  BrokerProperty,
  BrokerTieup,
  PropertyPoolEvent,
  VoiceCallResult,
} from "@/lib/api";
import {
  callBrokerBuyerWithElevenLabs,
  createBrokerBuyer,
  createPropertyPool,
  formatCr,
  getBrokerDashboard,
  requestBrokerTieup,
  runBrokerAutomation,
  saveBrokerProfile,
} from "@/lib/api";

type BrokerView =
  | "dashboard"
  | "onboarding"
  | "profile"
  | "properties"
  | "property-detail"
  | "tieups"
  | "tieup-detail"
  | "propertypool"
  | "propertypool-new"
  | "propertypool-detail"
  | "buyers"
  | "buyer-detail"
  | "leads"
  | "visits"
  | "commissions"
  | "automation"
  | "messages"
  | "analytics"
  | "settings";

type BrokerPortalProps = {
  view: BrokerView;
  id?: string | null;
};

const navItems = [
  { view: "home", label: "Home", href: "/", icon: Home },
  { view: "dashboard", label: "Dashboard", href: "/broker", icon: LayoutDashboard },
  { view: "onboarding", label: "Onboarding", href: "/broker/onboarding", icon: ShieldCheck },
  { view: "properties", label: "Properties", href: "/broker/properties", icon: Search },
  { view: "tieups", label: "Tie-ups", href: "/broker/tieups", icon: Network },
  { view: "propertypool", label: "PropertyPool", href: "/broker/propertypool", icon: CalendarClock },
  { view: "buyers", label: "Buyers", href: "/broker/buyers", icon: UsersRound },
  { view: "leads", label: "Leads", href: "/broker/leads", icon: ClipboardCheck },
  { view: "commissions", label: "Commissions", href: "/broker/commissions", icon: IndianRupee },
  { view: "automation", label: "Automation", href: "/broker/automation", icon: Bot },
  { view: "messages", label: "Messages", href: "/broker/messages", icon: MessageCircle },
  { view: "analytics", label: "Analytics", href: "/broker/analytics", icon: BarChart3 },
  { view: "settings", label: "Settings", href: "/broker/settings", icon: Settings2 },
] as const;

const naturalQueries = [
  "Show me 2BHK properties in Andheri where broker tie-up is open.",
  "Find high commission opportunities below INR 5 Cr.",
  "Show properties suitable for my NRI buyers in Bandra and Worli.",
  "Find properties where I can organize a group site visit this weekend.",
  "Find low legal-risk listings that I can share immediately on WhatsApp.",
];

const pendingTieupStatuses = new Set(["requested", "under_review", "terms_updated"]);
const approvedTieupStatuses = new Set(["approved", "agreement_accepted", "active"]);

function isTieupActionLocked(status: string) {
  return pendingTieupStatuses.has(status) || approvedTieupStatuses.has(status);
}

function tieupActionLabel(status: string, busy: boolean) {
  if (busy) return "Requesting...";
  if (pendingTieupStatuses.has(status)) return "Under review";
  if (approvedTieupStatuses.has(status)) return "Tie-up active";
  return "Request tie-up";
}

export function BrokerPortal({ view, id }: BrokerPortalProps) {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<BrokerDashboard | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<BrokerProperty | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [buyerDraft, setBuyerDraft] = useState({ full_name: "", phone: "", budget_max: 25000000, preferred_localities: "Andheri, Powai" });

  useEffect(() => {
    getBrokerDashboard().then((data) => {
      setDashboard(data);
      setSelectedProperty(data.available_properties.find((item) => item.id === id) || data.available_properties[0] || null);
    }).catch(console.error);
  }, [id]);

  const data = dashboard || emptyDashboard();
  const properties = useMemo(() => {
    if (!query.trim()) return data.available_properties;
    const lower = query.toLowerCase();
    return data.available_properties.filter((property) =>
      [property.title, property.locality, property.tieup_status, property.allowed_marketing_status, property.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(lower))
    );
  }, [data.available_properties, query]);
  const activeProperty = selectedProperty || properties[0] || data.available_properties[0];
  const activeTieup = data.tieup_feed.find((item) => item.id === id) || data.tieup_feed[0];
  const activeBuyer = data.buyers.find((item) => item.id === id) || data.buyers[0];
  const activeEvent = data.propertypool_events.find((item) => item.id === id) || data.propertypool_events[0];

  async function onRunAutomation(createPool = false) {
    setBusy(createPool ? "propertypool-auto" : "growth");
    try {
      const result = await runBrokerAutomation({ listing_id: activeProperty?.id, create_propertypool: createPool });
      if (result?.dashboard) setDashboard(result.dashboard);
    } finally {
      setBusy(null);
    }
  }

  async function onRequestTieup(property: BrokerProperty) {
    setBusy(`tieup-${property.id}`);
    try {
      const tieup = await requestBrokerTieup({
        listing_id: property.id,
        intended_buyer_segment: "qualified family and NRI buyers",
        expected_buyer_count: 6,
        requested_commission: 2,
        broker_message: `I have qualified buyers for ${property.locality} and want approved sharing rights with protected attribution.`,
      });
      const nextStatus = tieup.status || "under_review";
      const nextMarketingStatus = approvedTieupStatuses.has(nextStatus) ? "approved channels active" : "awaiting manager approval";
      const updateProperty = (item: BrokerProperty): BrokerProperty => item.id === property.id
        ? { ...item, tieup_status: nextStatus, allowed_marketing_status: nextMarketingStatus, map_color: approvedTieupStatuses.has(nextStatus) ? "blue" : "yellow" }
        : item;
      setDashboard((current) => current ? {
        ...current,
        available_properties: current.available_properties.map(updateProperty),
        map_pins: current.map_pins.map((pin) => pin.id === property.id ? { ...pin, tieup_status: nextStatus, color: approvedTieupStatuses.has(nextStatus) ? "blue" : "yellow" } : pin),
        tieup_feed: [tieup, ...current.tieup_feed.filter((item) => item.id !== tieup.id)],
      } : current);
      setSelectedProperty((current) => current && current.id === property.id ? updateProperty(current) : current);
    } finally {
      setBusy(null);
    }
  }

  async function onCreateBuyer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("buyer");
    try {
      const buyer = await createBrokerBuyer({
        full_name: buyerDraft.full_name,
        phone: buyerDraft.phone,
        budget_max: Number(buyerDraft.budget_max),
        preferred_localities: buyerDraft.preferred_localities.split(",").map((item) => item.trim()).filter(Boolean),
        lead_temperature: "hot",
      });
      setDashboard((current) => current ? { ...current, buyers: [buyer, ...current.buyers] } : current);
      setBuyerDraft({ full_name: "", phone: "", budget_max: 25000000, preferred_localities: "Andheri, Powai" });
    } finally {
      setBusy(null);
    }
  }

  async function onCreatePropertyPool() {
    if (!activeProperty) return;
    setBusy("pool");
    try {
      const event = await createPropertyPool({
        listing_id: activeProperty.id,
        tieup_id: activeTieup?.id,
        event_title: `${activeProperty.locality} verified PropertyPool`,
        buyer_segment: "qualified family and NRI buyers",
      });
      setDashboard((current) => current ? { ...current, propertypool_events: [event, ...current.propertypool_events] } : current);
      router.push(`/broker/propertypool/${event.id}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="min-h-screen bg-ivory text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-[1740px] gap-5 px-4 py-4 md:px-6 lg:px-8">
        <aside className="hidden w-[284px] shrink-0 lg:block">
          <div className="sticky top-4 space-y-4 rounded-[3px] border border-ink/12 bg-ivory p-4 shadow-lx">
            <div className="rounded-[3px] bg-espresso px-4 py-4 text-ivory">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-goldsoft">ASTRA Partner</p>
              <h1 className="lx-display font-light mt-3 text-2xl leading-none">Broker Partner Portal</h1>
              <p className="mt-2 text-sm leading-6 text-ivory/68">Verified inventory, tie-ups, buyers, PropertyPool, attribution, and commissions.</p>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const selected = item.view === view || (view.includes("detail") && item.view === (view.startsWith("property") ? "properties" : view.startsWith("tieup") ? "tieups" : "buyers"));
                return (
                  <Link key={item.href} href={item.href} className={clsx("flex items-center gap-3 rounded-[3px] px-3 py-3 transition", selected ? "bg-ink text-ivory" : "text-ink/60 hover:bg-sand")}>
                    <span className={clsx("grid h-9 w-9 place-items-center rounded-[3px]", selected ? "bg-gold text-ivory" : "border border-ink/15 bg-ivory text-ink/70")}>
                      <Icon size={17} />
                    </span>
                    <span className="flex-1 text-sm font-semibold">{item.label}</span>
                    <ChevronRight size={15} className="text-ink/30" />
                  </Link>
                );
              })}
            </nav>
            <div className="rounded-[3px] border border-ink/12 bg-sand p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Trust score</p>
              <p className="lx-display mt-2 text-3xl font-light text-ink">{data.broker.trust_score}/100</p>
              <p className="text-sm font-semibold text-ink/55">{data.broker.verification_status.replace(/_/g, " ")}</p>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1 space-y-5 pb-8">
          <header className="rounded-[3px] border border-ink/12 bg-ivory px-5 py-5 shadow-lx">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
                  <span className="h-px w-10 bg-gold" />
                  <Sparkles size={14} className="text-gold" />
                  PropertyPool Network
                </div>
                <h2 className="lx-display mt-2 text-3xl font-light tracking-tight md:text-5xl">AI-powered brokerage office for independent Mumbai agents.</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-ink/60">
                  Discover manager inventory, request tie-ups, protect attribution, bring buyers, organize collective visits, and track commissions from one command center.
                </p>
              </div>
            <div className="flex flex-wrap gap-3">
                <Link href="/" className="inline-flex items-center gap-2 rounded-[3px] border border-ink/15 bg-ivory px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-sand">
                  <Home size={16} />
                  Home
                </Link>
                <Link href="/workspace" className="inline-flex items-center gap-2 rounded-[3px] border border-ink/15 bg-ivory px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-sand">
                  <Home size={16} />
                  Buyer OS
                </Link>
                <Link href="/manager" className="inline-flex items-center gap-2 rounded-[3px] border border-ink/15 bg-ivory px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-sand">
                  <BriefcaseBusiness size={16} />
                  Manager OS
                </Link>
                <button onClick={() => onRunAutomation(false)} className="inline-flex items-center gap-2 rounded-[3px] bg-gold px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-[#8f6d32]">
                  <Wand2 size={16} />
                  {busy === "growth" ? "Running..." : "Run Broker Growth Automation"}
                </button>
              </div>
            </div>
          </header>

          {view === "dashboard" && <DashboardView dashboard={data} properties={properties} selected={activeProperty} setSelected={setSelectedProperty} onRequestTieup={onRequestTieup} onCreatePropertyPool={onCreatePropertyPool} busy={busy} />}
          {(view === "onboarding" || view === "profile" || view === "settings") && <ProfileView dashboard={data} mode={view} onSave={async () => setDashboard({ ...data, broker: await saveBrokerProfile(data.broker) })} />}
          {view === "properties" && <PropertiesView properties={properties} query={query} setQuery={setQuery} onOpen={(property) => router.push(`/broker/properties/${property.id}`)} onRequestTieup={onRequestTieup} busy={busy} />}
          {view === "property-detail" && activeProperty && <PropertyDetailView property={activeProperty} onRequestTieup={onRequestTieup} onCreatePropertyPool={onCreatePropertyPool} busy={busy} />}
          {(view === "tieups" || view === "tieup-detail") && <TieupsView tieups={view === "tieup-detail" && activeTieup ? [activeTieup] : data.tieup_feed} properties={data.available_properties} />}
          {view === "propertypool" && <PropertyPoolView events={data.propertypool_events} onNew={() => router.push("/broker/propertypool/new")} />}
          {view === "propertypool-new" && <PropertyPoolNewView properties={data.available_properties} selected={activeProperty} setSelected={setSelectedProperty} onCreate={onCreatePropertyPool} busy={busy === "pool"} />}
          {view === "propertypool-detail" && activeEvent && <PropertyPoolDetailView event={activeEvent} buyers={data.buyers} />}
          {(view === "buyers" || view === "buyer-detail") && <BuyersView buyers={view === "buyer-detail" && activeBuyer ? [activeBuyer] : data.buyers} draft={buyerDraft} setDraft={setBuyerDraft} onSubmit={onCreateBuyer} busy={busy === "buyer"} />}
          {view === "leads" && <LeadsView dashboard={data} />}
          {view === "visits" && <VisitsView events={data.propertypool_events} buyers={data.buyers} />}
          {view === "commissions" && <CommissionsView dashboard={data} />}
          {view === "automation" && <AutomationView dashboard={data} onRun={onRunAutomation} busy={busy} />}
          {view === "messages" && <MessagesView dashboard={data} />}
          {view === "analytics" && <AnalyticsView dashboard={data} />}
        </section>
      </div>
    </main>
  );
}

function DashboardView({ dashboard, properties, selected, setSelected, onRequestTieup, onCreatePropertyPool, busy }: { dashboard: BrokerDashboard; properties: BrokerProperty[]; selected: BrokerProperty | null; setSelected: (property: BrokerProperty) => void; onRequestTieup: (property: BrokerProperty) => void; onCreatePropertyPool: () => void; busy: string | null }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        {dashboard.summary_cards.map((card) => <MetricCard key={card.label} label={card.label} value={card.value} detail={card.detail || ""} tone={card.tone || "slate"} />)}
      </div>
      <div className="grid gap-5 2xl:grid-cols-[1.2fr_0.8fr]">
        <BrokerMap properties={properties} focused={selected?.id || null} onFocus={(id) => {
          const property = properties.find((item) => item.id === id);
          if (property) setSelected(property);
        }} />
        <div className="space-y-5">
          <Panel title="AI broker assistant feed" eyebrow="Autonomous actions">
            <div className="space-y-3">{dashboard.activity_feed.map((entry) => <FeedRow key={entry.id} entry={entry} />)}</div>
          </Panel>
          <Panel title="Focused opportunity" eyebrow="Map-selected property">
            {selected ? <OpportunityCard property={selected} onRequestTieup={onRequestTieup} onCreatePropertyPool={onCreatePropertyPool} busy={busy} /> : <p className="text-sm text-ink/55">Select a property pin.</p>}
          </Panel>
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <TieupsView tieups={dashboard.tieup_feed} properties={dashboard.available_properties} compact />
        <Panel title="Next best actions" eyebrow="Broker growth queue">
          <div className="grid gap-3">{dashboard.next_best_actions.map((task) => <TaskRow key={task.id} title={String(task.output_json?.title || task.task_type)} agent={task.agent_name} priority={task.priority} />)}</div>
        </Panel>
      </div>
    </div>
  );
}

function ProfileView({ dashboard, mode, onSave }: { dashboard: BrokerDashboard; mode: string; onSave: () => void }) {
  const profile = dashboard.broker;
  const completion = Math.round(Math.min(100, (profile.trust_score || 0) + (profile.verification_status === "verified" ? 8 : 0)));
  return (
    <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <Panel title={mode === "onboarding" ? "Broker onboarding" : "Broker profile"} eyebrow="Verification agent">
        <div className="space-y-4">
          <div className="rounded-[3px] bg-espresso p-5 text-ivory">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-goldsoft">Profile completion</p>
            <p className="lx-display mt-2 text-4xl font-light">{completion}%</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-ivory/15"><div className="h-full rounded-full bg-gold" style={{ width: `${completion}%` }} /></div>
          </div>
          <InfoGrid items={[
            ["Name", profile.full_name],
            ["Agency", profile.agency_name || "-"],
            ["RERA", profile.rera_agent_id || "Not supplied"],
            ["Localities", profile.operating_localities.join(", ")],
            ["Buyer network", String(profile.buyer_network_size)],
            ["Monthly visits", String(profile.average_monthly_visits)],
          ]} />
          <button onClick={onSave} className="inline-flex items-center gap-2 rounded-[3px] bg-gold px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-[#8f6d32]">
            <BadgeCheck size={16} />
            Run Verification Agent
          </button>
        </div>
      </Panel>
      <Panel title="Onboarding checklist" eyebrow="Required for premium tie-ups">
        <div className="grid gap-3 md:grid-cols-2">
          {["Full name", "Agency details", "Phone and WhatsApp", "Email", "RERA agent ID", "Operating localities", "Buyer network size", "KYC document", "Business card", "PAN/GST", "Languages", "Specialization"].map((item) => (
            <TaskChip key={item} title={item} done={profile.verification_status === "verified" || !["KYC document", "PAN/GST"].includes(item)} />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function PropertiesView({ properties, query, setQuery, onOpen, onRequestTieup, busy }: { properties: BrokerProperty[]; query: string; setQuery: (value: string) => void; onOpen: (property: BrokerProperty) => void; onRequestTieup: (property: BrokerProperty) => void; busy: string | null }) {
  return (
    <div className="space-y-5">
      <Panel title="Property discovery" eyebrow="Natural-language inventory search">
        <div className="flex flex-col gap-3 lg:flex-row">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by locality, commission, tie-up status, buyer fit, legal risk..." className="min-h-12 flex-1 rounded-[3px] border border-ink/15 bg-ivory px-4 text-sm outline-none focus:border-gold" />
          <button className="inline-flex items-center justify-center gap-2 rounded-[3px] bg-ink px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-[#2b251f]"><Search size={16} />Search</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {naturalQueries.map((item) => <button key={item} onClick={() => setQuery(item)} className="rounded-full border border-ink/15 bg-sand px-3 py-2 text-xs font-semibold text-ink/60 hover:bg-gold/10">{item}</button>)}
        </div>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {properties.map((property) => <PropertyCard key={property.id} property={property} onOpen={() => onOpen(property)} onRequestTieup={() => onRequestTieup(property)} busy={busy === `tieup-${property.id}`} />)}
      </div>
    </div>
  );
}

function PropertyDetailView({ property, onRequestTieup, onCreatePropertyPool, busy }: { property: BrokerProperty; onRequestTieup: (property: BrokerProperty) => void; onCreatePropertyPool: () => void; busy: string | null }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
      <Panel title={property.title} eyebrow={`${property.locality} broker inventory`}>
        <div className="space-y-4">
          <OpportunityCard property={property} onRequestTieup={onRequestTieup} onCreatePropertyPool={onCreatePropertyPool} busy={busy} />
          <InfoGrid items={[
            ["Price", formatCr(property.price)],
            ["Commission", property.commission_range],
            ["Buyer match", `${Math.round(property.buyer_match_score)} / 100`],
            ["Legal risk", `${Math.round(property.legal_risk_score)} / 100`],
            ["Market heat", `${Math.round(property.market_heat_score)} / 100`],
            ["RERA", property.rera_number || "Pending"],
          ]} />
        </div>
      </Panel>
      <Panel title="AI shareable pitch" eyebrow="Verified-claims only">
        <p className="rounded-[3px] bg-espresso p-4 text-sm font-semibold leading-7 text-ivory">{property.shareable_pitch || `${property.title} in ${property.locality}. Request tie-up before sharing full details.`}</p>
        <div className="mt-4 space-y-3">
          {(property.tour_route?.waypoints || []).map((item, index) => <RouteRow key={index} label={item.label} focus={item.focus} />)}
        </div>
      </Panel>
    </div>
  );
}

function TieupsView({ tieups, properties, compact }: { tieups: BrokerTieup[]; properties: BrokerProperty[]; compact?: boolean }) {
  return (
    <Panel title="Tie-up request feed" eyebrow="Formal broker-manager agreements">
      <div className={clsx("grid gap-3", !compact && "xl:grid-cols-2")}>
        {tieups.length ? tieups.map((tieup) => {
          const property = properties.find((item) => item.id === tieup.listing_id);
          return <div key={tieup.id} className="rounded-[3px] border border-ink/12 bg-ivory p-4">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-sm font-semibold text-ink">{tieup.property_title}</p><p className="mt-1 text-sm text-ink/55">{tieup.manager_name} · {property?.locality || "Mumbai"}</p></div>
              <StatusBadge status={tieup.status} />
            </div>
            <div className="mt-4 grid gap-2 text-sm text-ink/60 md:grid-cols-2">
              <p>Commission: {tieup.approved_commission || tieup.requested_commission}%</p>
              <p>Validity: {tieup.approved_validity_days || tieup.requested_validity_days} days</p>
              <p>PropertyPool: {tieup.approved_propertypool_rights ? "Approved" : tieup.requested_propertypool_rights ? "Requested" : "No"}</p>
              <p>Channels: {tieup.marketing_channels.join(", ")}</p>
            </div>
          </div>;
        }) : <p className="text-sm text-ink/55">No tie-up requests yet. Request access from property discovery.</p>}
      </div>
    </Panel>
  );
}

function PropertyPoolView({ events, onNew }: { events: PropertyPoolEvent[]; onNew: () => void }) {
  return (
    <div className="space-y-5">
      <div className="flex justify-end"><button onClick={onNew} className="inline-flex items-center gap-2 rounded-[3px] bg-ink px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-[#2b251f]"><Plus size={16} />New PropertyPool</button></div>
      <div className="grid gap-4 xl:grid-cols-2">
        {events.map((event) => <EventCard key={event.id} event={event} />)}
      </div>
    </div>
  );
}

function PropertyPoolNewView({ properties, selected, setSelected, onCreate, busy }: { properties: BrokerProperty[]; selected: BrokerProperty | null; setSelected: (property: BrokerProperty) => void; onCreate: () => void; busy: boolean }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <Panel title="Create PropertyPool automatically" eyebrow="Collective site visit">
        <div className="space-y-3">
          {properties.map((property) => <button key={property.id} onClick={() => setSelected(property)} className={clsx("w-full rounded-[3px] border p-4 text-left", selected?.id === property.id ? "border-gold/45 bg-gold/10" : "border-ink/12 bg-ivory")}>
            <p className="font-semibold text-ink">{property.title}</p>
            <p className="text-sm text-ink/55">{property.locality} · {property.propertypool_status}</p>
          </button>)}
        </div>
      </Panel>
      <Panel title="Auto-generated event plan" eyebrow="PropertyPool agent">
        {selected ? <div className="space-y-4">
          <InfoGrid items={[["Property", selected.title], ["Buyer segment", "qualified family and NRI buyers"], ["Max buyers", "8"], ["Meeting point", selected.address], ["Pre-qualification", "Budget and locality fit confirmed"], ["Reminder schedule", "24h, 2h, post-visit"]]} />
          <button onClick={onCreate} className="inline-flex items-center gap-2 rounded-[3px] bg-gold px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-[#8f6d32]"><CalendarClock size={16} />{busy ? "Creating..." : "Create PropertyPool"}</button>
        </div> : <p className="text-sm text-ink/55">Select an approved property to generate event details.</p>}
      </Panel>
    </div>
  );
}

function PropertyPoolDetailView({ event, buyers }: { event: PropertyPoolEvent; buyers: BrokerBuyer[] }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
      <Panel title={event.event_title} eyebrow="Mobile site visit command">
        <InfoGrid items={[["Status", event.status], ["Time", new Date(event.scheduled_start).toLocaleString("en-IN")], ["Registered", String(event.registered_buyers)], ["Attended", String(event.attended_buyers)], ["Manager approval", event.manager_approval_status], ["Offer pipeline", String(event.offer_pipeline)]]} />
        <div className="mt-4 rounded-[3px] bg-espresso p-4 text-ivory">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-goldsoft">Broker tour script</p>
          <p className="mt-2 text-sm font-semibold leading-7 text-ivory/78">{event.tour_script}</p>
        </div>
      </Panel>
      <Panel title="QR check-in and route" eyebrow="PropertyPool operations">
        <div className="mb-4 grid h-36 w-36 place-items-center rounded-[3px] border border-ink/12 bg-sand"><QrCode size={84} className="text-ink" /></div>
        <div className="space-y-3">{(event.route_json.waypoints || []).map((item, index) => <RouteRow key={index} label={item.label} focus={item.focus} />)}</div>
        <div className="mt-4 grid gap-2">{buyers.slice(0, 4).map((buyer) => <TaskRow key={buyer.id} title={buyer.full_name} agent={buyer.lead_temperature.replace(/_/g, " ")} priority="medium" />)}</div>
      </Panel>
    </div>
  );
}

function BuyersView({ buyers, draft, setDraft, onSubmit, busy }: { buyers: BrokerBuyer[]; draft: { full_name: string; phone: string; budget_max: number; preferred_localities: string }; setDraft: (value: { full_name: string; phone: string; budget_max: number; preferred_localities: string }) => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; busy: boolean }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <Panel title="Add buyer" eyebrow="Lead qualification agent">
        <form onSubmit={onSubmit} className="space-y-3">
          <Input label="Full name" value={draft.full_name} onChange={(value) => setDraft({ ...draft, full_name: value })} />
          <Input label="Phone" value={draft.phone} onChange={(value) => setDraft({ ...draft, phone: value })} />
          <Input label="Budget max" value={String(draft.budget_max)} onChange={(value) => setDraft({ ...draft, budget_max: Number(value) })} />
          <Input label="Preferred localities" value={draft.preferred_localities} onChange={(value) => setDraft({ ...draft, preferred_localities: value })} />
          <button className="inline-flex items-center gap-2 rounded-[3px] bg-ink px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-[#2b251f]"><Plus size={16} />{busy ? "Adding..." : "Add and qualify"}</button>
        </form>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-2">
        {buyers.map((buyer) => <BuyerCard key={buyer.id} buyer={buyer} />)}
      </div>
    </div>
  );
}

function LeadsView({ dashboard }: { dashboard: BrokerDashboard }) {
  return <Panel title="Lead attribution protection" eyebrow="Commission dispute prevention"><div className="grid gap-3 xl:grid-cols-2">{dashboard.buyers.map((buyer) => <div key={buyer.id} className="rounded-[3px] border border-ink/12 bg-ivory p-4"><p className="font-semibold text-ink">{buyer.full_name}</p><p className="mt-1 text-sm text-ink/55">{buyer.phone} · protected when attached to property</p><div className="mt-3 flex flex-wrap gap-2"><StatusBadge status={buyer.lead_temperature} /><StatusBadge status={buyer.follow_up_status} /></div></div>)}</div></Panel>;
}

function VisitsView({ events, buyers }: { events: PropertyPoolEvent[]; buyers: BrokerBuyer[] }) {
  return <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]"><PropertyPoolView events={events} onNew={() => undefined} /><Panel title="Visit attendance" eyebrow="RSVP, check-in, feedback"><div className="space-y-3">{buyers.map((buyer) => <TaskRow key={buyer.id} title={`${buyer.full_name} · ${buyer.communication_channel}`} agent="Invite to next PropertyPool" priority={buyer.lead_temperature === "hot" ? "high" : "medium"} />)}</div></Panel></div>;
}

function CommissionsView({ dashboard }: { dashboard: BrokerDashboard }) {
  const total = dashboard.commissions.reduce((sum, item) => sum + item.expected_commission, 0);
  return <Panel title="Commission pipeline" eyebrow="Attribution-backed payouts"><div className="mb-4 rounded-[3px] bg-espresso p-5 text-ivory"><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-goldsoft">Expected commission</p><p className="lx-display mt-2 text-4xl font-light">{formatCr(total)}</p></div><div className="grid gap-3 xl:grid-cols-2">{dashboard.commissions.map((item) => <InfoGrid key={item.id} items={[["Deal status", item.deal_status], ["Property value", formatCr(item.property_value)], ["Commission", `${item.commission_percentage}%`], ["Expected", formatCr(item.expected_commission)], ["Payout", item.payout_status], ["Dispute", item.dispute_status]]} />)}</div></Panel>;
}

function AutomationView({ dashboard, onRun, busy }: { dashboard: BrokerDashboard; onRun: (createPool?: boolean) => void; busy: string | null }) {
  return <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]"><Panel title="Broker automation controls" eyebrow="Codex operations engine"><div className="space-y-3"><button onClick={() => onRun(false)} className="inline-flex w-full items-center justify-center gap-2 rounded-[3px] bg-ink px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-[#2b251f]"><RefreshCw size={16} />{busy === "growth" ? "Running..." : "Run Broker Growth Automation"}</button><button onClick={() => onRun(true)} className="inline-flex w-full items-center justify-center gap-2 rounded-[3px] bg-gold px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-[#8f6d32]"><CalendarClock size={16} />{busy === "propertypool-auto" ? "Planning..." : "Create PropertyPool Automatically"}</button></div></Panel><Panel title="Agent task queue" eyebrow="LangGraph broker swarm"><div className="grid gap-3">{dashboard.next_best_actions.map((task) => <TaskRow key={task.id} title={String(task.output_json?.title || task.task_type)} agent={task.agent_name} priority={task.priority} />)}</div></Panel></div>;
}

function MessagesView({ dashboard }: { dashboard: BrokerDashboard }) {
  const event = dashboard.propertypool_events[0];
  return <Panel title="WhatsApp automation drafts" eyebrow="Approved claims and attribution-aware"><div className="grid gap-4 xl:grid-cols-2">{dashboard.buyers.map((buyer) => <div key={buyer.id} className="rounded-[3px] border border-ink/12 bg-ivory p-4"><div className="flex items-center justify-between"><p className="font-semibold text-ink">{buyer.full_name}</p><MessageCircle size={18} className="text-gold" /></div><p className="mt-3 text-sm leading-7 text-ink/60">{event?.invite_message || `Hi ${buyer.full_name}, I found verified inventory matching your budget. Should I reserve a visit slot?`}</p><button className="mt-3 inline-flex items-center gap-2 rounded-[3px] bg-gold px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-[#8f6d32]"><Send size={14} />Draft WhatsApp</button></div>)}</div></Panel>;
}

function AnalyticsView({ dashboard }: { dashboard: BrokerDashboard }) {
  return <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]"><Panel title="Broker performance analytics" eyebrow="What is working"><InfoGrid items={[["Best locality", "Andheri / Bandra"], ["Buyer conversion", "31%"], ["Avg response SLA", "8 min"], ["PropertyPool show-up", "74%"], ["Protected leads", String(dashboard.buyers.length)], ["Pipeline", formatCr(dashboard.commissions.reduce((sum, item) => sum + item.expected_commission, 0))]]} /></Panel><Panel title="Growth recommendations" eyebrow="Broker Growth Agent"><div className="space-y-3">{["Request tie-ups on low legal-risk inventory before WhatsApp sharing.", "Run one PropertyPool for Andheri/Powai cluster this weekend.", "Move ready-to-offer buyers into negotiation within 2 hours of visit feedback.", "Prioritize NRI buyer copy for Bandra/Worli premium listings."].map((item) => <TaskRow key={item} title={item} agent="Broker Growth Agent" priority="high" />)}</div></Panel></div>;
}

function BrokerMap({ properties, focused, onFocus }: { properties: BrokerProperty[]; focused: string | null; onFocus: (id: string) => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const markersRef = useRef<Array<import("leaflet").Marker>>([]);

  useEffect(() => {
    let mounted = true;
    async function init() {
      if (!containerRef.current || mapRef.current) return;
      const L = await import("leaflet");
      if (!mounted || !containerRef.current) return;
      leafletRef.current = L;
      mapRef.current = L.map(containerRef.current, { zoomControl: false, attributionControl: true }).setView([19.076, 72.8777], 11);
      L.control.zoom({ position: "bottomright" }).addTo(mapRef.current);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }).addTo(mapRef.current);
    }
    init();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    const bounds: Array<[number, number]> = [];
    properties.forEach((property) => {
      const tone = property.map_color === "blue" ? "#2563eb" : property.map_color === "yellow" ? "#ca8a04" : property.map_color === "purple" ? "#7c3aed" : property.map_color === "gold" ? "#b45309" : property.map_color === "red" ? "#dc2626" : property.map_color === "gray" ? "#64748b" : "#059669";
      const marker = L.marker([property.latitude, property.longitude], { icon: L.divIcon({ className: "astra-marker", html: `<div style="background:${tone};" class="astra-marker-dot ${focused === property.id ? "active" : ""}">${property.locality}</div>`, iconSize: [94, 34], iconAnchor: [47, 34] }) });
      marker.on("click", () => onFocus(property.id));
      marker.bindPopup(`<strong>${property.title}</strong><br/>${property.locality}<br/>${formatCr(property.price)}<br/>${property.commission_range} commission`);
      marker.addTo(map);
      markersRef.current.push(marker);
      bounds.push([property.latitude, property.longitude]);
    });
    const selected = properties.find((item) => item.id === focused);
    if (selected) map.flyTo([selected.latitude, selected.longitude], 13, { duration: 0.8 });
    else if (bounds.length > 1) map.fitBounds(bounds, { padding: [30, 30] });
  }, [properties, focused, onFocus]);

  return <Panel title="Broker opportunity map" eyebrow="Mumbai manager inventory"><div ref={containerRef} className="h-[620px] overflow-hidden rounded-[3px] border border-ink/12 bg-sand" /><div className="mt-4 grid gap-2 md:grid-cols-4"><Legend color="bg-emerald-500" label="Open tie-up" /><Legend color="bg-blue-500" label="Approved" /><Legend color="bg-amber-500" label="Pending" /><Legend color="bg-violet-500" label="High commission" /></div></Panel>;
}

function OpportunityCard({ property, onRequestTieup, onCreatePropertyPool, busy }: { property: BrokerProperty; onRequestTieup: (property: BrokerProperty) => void; onCreatePropertyPool: () => void; busy: string | null }) {
  const requesting = busy === `tieup-${property.id}`;
  const locked = isTieupActionLocked(property.tieup_status);
  return <div className="rounded-[3px] border border-ink/12 bg-ivory p-4"><div className="flex items-start justify-between gap-4"><div><p className="lx-display text-xl font-light text-ink">{property.title}</p><p className="mt-1 text-sm text-ink/55">{property.locality} · {formatCr(property.price)} · {property.commission_range}</p></div><StatusBadge status={property.tieup_status} /></div><div className="mt-4 grid gap-2 md:grid-cols-3"><MiniMetric label="Buyer demand" value={`${Math.round(property.buyer_demand_score)}`} /><MiniMetric label="Legal risk" value={`${Math.round(property.legal_risk_score)}`} /><MiniMetric label="Market heat" value={`${Math.round(property.market_heat_score)}`} /></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => onRequestTieup(property)} disabled={locked || requesting} className="inline-flex items-center gap-2 rounded-[3px] bg-ink px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-[#2b251f] disabled:cursor-not-allowed disabled:bg-ink/25 disabled:text-ivory/60"><ShieldCheck size={14} />{tieupActionLabel(property.tieup_status, requesting)}</button><button className="inline-flex items-center gap-2 rounded-[3px] border border-ink/15 bg-ivory px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-sand"><Send size={14} />Share pitch</button><button onClick={onCreatePropertyPool} className="inline-flex items-center gap-2 rounded-[3px] bg-gold px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-[#8f6d32]"><CalendarClock size={14} />Create PropertyPool</button></div></div>;
}

function PropertyCard({ property, onOpen, onRequestTieup, busy }: { property: BrokerProperty; onOpen: () => void; onRequestTieup: () => void; busy: boolean }) {
  const locked = isTieupActionLocked(property.tieup_status);
  return <div className="rounded-[3px] border border-ink/12 bg-ivory p-4 shadow-lx"><button onClick={onOpen} className="w-full text-left"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{property.locality}</p><h3 className="lx-display mt-1 text-xl font-light text-ink">{property.title}</h3><p className="mt-1 text-sm text-ink/55">{property.bedrooms || "-"} BHK · {property.carpet_area_sqft || "-"} sq ft · {formatCr(property.price)}</p></div><StatusBadge status={property.tieup_status} /></div></button><div className="mt-4 grid gap-2 md:grid-cols-2"><MiniMetric label="Commission" value={formatCr(property.commission_estimate)} /><MiniMetric label="Buyer match" value={`${Math.round(property.buyer_match_score)}/100`} /></div><p className="mt-3 text-sm font-semibold text-ink/55">{property.allowed_marketing_status}</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={onRequestTieup} disabled={locked || busy} className="rounded-[3px] bg-ink px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-[#2b251f] disabled:cursor-not-allowed disabled:bg-ink/25 disabled:text-ivory/60">{tieupActionLabel(property.tieup_status, busy)}</button><button onClick={onOpen} className="rounded-[3px] border border-ink/15 bg-ivory px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-sand">Open</button></div></div>;
}

function EventCard({ event }: { event: PropertyPoolEvent }) {
  return <Link href={`/broker/propertypool/${event.id}`} className="rounded-[3px] border border-ink/12 bg-ivory p-5 shadow-lx transition hover:-translate-y-1"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{event.event_type}</p><h3 className="lx-display mt-1 text-xl font-light text-ink">{event.event_title}</h3><p className="mt-1 text-sm text-ink/55">{new Date(event.scheduled_start).toLocaleString("en-IN")} · {event.meeting_point}</p></div><StatusBadge status={event.status} /></div><div className="mt-4 grid gap-2 md:grid-cols-3"><MiniMetric label="Registered" value={String(event.registered_buyers)} /><MiniMetric label="Max" value={String(event.max_buyers)} /><MiniMetric label="Offers" value={String(event.offer_pipeline)} /></div></Link>;
}

function BuyerCard({ buyer }: { buyer: BrokerBuyer }) {
  const [callResult, setCallResult] = useState<VoiceCallResult | null>(null);
  const [busy, setBusy] = useState(false);
  async function callBuyer(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      setCallResult(await callBrokerBuyerWithElevenLabs(buyer.id, { property_id: buyer.assigned_properties[0] || "seller-demo-powai-1", broker_id: buyer.broker_id, call_goal: "property_detail", preferred_language: "Hinglish" }));
    } finally {
      setBusy(false);
    }
  }
  return <Link href={`/broker/buyers/${buyer.id}`} className="rounded-[3px] border border-ink/12 bg-ivory p-5 shadow-lx transition hover:-translate-y-1"><div className="flex items-start justify-between gap-3"><div><p className="lx-display text-xl font-light text-ink">{buyer.full_name}</p><p className="mt-1 text-sm text-ink/55">{buyer.phone} · {buyer.communication_channel}</p></div><StatusBadge status={buyer.lead_temperature} /></div><div className="mt-4 grid gap-2 md:grid-cols-2"><MiniMetric label="Budget" value={formatCr(buyer.budget_max)} /><MiniMetric label="Qualification" value={`${buyer.qualification_score}/100`} /></div><p className="mt-3 text-sm text-ink/55">{buyer.preferred_localities.join(", ")} · {buyer.follow_up_status}</p><button onClick={callBuyer} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[3px] bg-gold px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-[#8f6d32]"><MessageCircle size={14} />{busy ? "Calling..." : "Call buyer with ASTRA Voice Closer"}</button>{callResult ? <p className="mt-3 rounded-[3px] bg-sand p-3 text-xs font-semibold text-ink/70">{callResult.call_status}: {callResult.reason}</p> : null}</Link>;
}

function Panel({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return <section className="rounded-[3px] border border-ink/12 bg-ivory p-5 shadow-lx"><div className="mb-4 flex items-start justify-between gap-4"><div><p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-gold">{eyebrow}</p><h3 className="lx-display mt-2 text-2xl font-light tracking-tight text-ink">{title}</h3></div><Sparkles size={20} className="text-gold" /></div>{children}</section>;
}

function MetricCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) {
  const valueColor = tone === "emerald" || tone === "amber" || tone === "gold" ? "text-gold" : "text-ink";
  return <div className="rounded-[3px] border border-ink/12 bg-ivory p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/45">{label}</p><p className={clsx("lx-display mt-3 text-3xl font-light", valueColor)}>{value}</p><p className="mt-2 text-sm text-ink/55">{detail}</p></div>;
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[3px] border border-ink/12 bg-ivory p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/45">{label}</p><p className="lx-display mt-1 text-lg font-light text-ink">{value}</p></div>;
}

function InfoGrid({ items }: { items: Array<[string, string]> }) {
  return <div className="grid gap-3 md:grid-cols-2">{items.map(([label, value]) => <MiniMetric key={label} label={label} value={value} />)}</div>;
}

function FeedRow({ entry }: { entry: { actor_name: string; action: string; details: string; tone?: string } }) {
  const tone = entry.tone === "emerald" ? "border-gold/30 bg-gold/8 text-ink" : entry.tone === "gold" ? "border-gold/30 bg-sand text-ink" : "border-ink/12 bg-ivory text-ink/70";
  return <div className={clsx("rounded-[3px] border p-4", tone)}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{entry.actor_name}</p><p className="mt-1 text-sm leading-6">{entry.details}</p></div><span className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">{entry.action.replace(/_/g, " ")}</span></div></div>;
}

function TaskRow({ title, agent, priority }: { title: string; agent: string; priority: string }) {
  return <div className="rounded-[3px] border border-ink/12 bg-ivory p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-ink">{title}</p><p className="mt-1 text-sm text-ink/55">{agent}</p></div><span className={clsx("rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]", priority === "high" ? "bg-gold/12 text-[#8f6d32]" : "bg-ink/5 text-ink/55")}>{priority}</span></div></div>;
}

function RouteRow({ label, focus }: { label: string; focus: string }) {
  return <div className="rounded-[3px] border border-ink/12 bg-ivory p-3"><p className="text-sm font-semibold text-ink">{label}</p><p className="mt-1 text-sm text-ink/55">{focus}</p></div>;
}

function TaskChip({ title, done }: { title: string; done: boolean }) {
  return <div className={clsx("flex items-center gap-2 rounded-[3px] border px-4 py-3 text-sm font-semibold", done ? "border-gold/40 bg-gold/10 text-[#8f6d32]" : "border-ink/15 bg-sand text-ink/70")}><CheckCircle2 size={16} />{title}</div>;
}

function StatusBadge({ status }: { status: string }) {
  const clean = status.replace(/_/g, " ");
  const tone = status.includes("active") || status.includes("approved") || status.includes("hot") || status.includes("ready") || status.includes("scheduled") ? "border-gold/45 bg-gold/10 text-[#8f6d32]" : status.includes("review") || status.includes("pending") || status.includes("warm") ? "border-ink/20 bg-ink/5 text-ink/60" : "border-ink/15 text-ink/55";
  return <span className={clsx("rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] capitalize", tone)}>{clean}</span>;
}

function Legend({ color, label }: { color: string; label: string }) {
  return <div className="flex items-center gap-2 rounded-[3px] border border-ink/12 bg-ivory px-3 py-2 text-xs font-semibold text-ink/60"><span className={clsx("h-3 w-3 rounded-full", color)} />{label}</div>;
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-ink/50">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 w-full rounded-[3px] border border-ink/15 bg-ivory px-3 text-sm outline-none focus:border-gold" /></label>;
}

function emptyDashboard(): BrokerDashboard {
  return {
    broker: { id: "broker-demo-1", full_name: "Loading...", phone: "", email: "", operating_localities: [], years_experience: 0, property_categories: [], buyer_network_size: 0, average_monthly_visits: 0, languages_spoken: [], specialization: [], verification_status: "pending", trust_score: 0 },
    summary_cards: [],
    map_pins: [],
    available_properties: [],
    tieup_feed: [],
    propertypool_events: [],
    buyers: [],
    commissions: [],
    activity_feed: [],
    next_best_actions: [],
    attribution_alerts: [],
  };
}
