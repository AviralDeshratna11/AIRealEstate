"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ImageIcon,
  MessagesSquare,
  Plus,
  RefreshCw,
  Settings2,
  Shield,
  Sparkles,
  SquareStack,
  TimerReset,
  TrendingUp,
  Upload,
  Wand2,
} from "lucide-react";
import type {
  ManagerAutomationRule,
  ManagerDashboard,
  ManagerLead,
  ManagerListing,
  ManagerTask,
} from "@/lib/api";
import {
  createManagerListing,
  formatCr,
  getManagerAuditLog,
  getManagerDashboard,
  getManagerLeads,
  getManagerListing,
  getManagerListings,
  getManagerMarket,
  getManagerTasks,
  publishManagerListing,
  runManagerAutomation,
  runManagerListingAgents,
} from "@/lib/api";
import { DEMO_MANAGER_LISTINGS } from "@/lib/manager-demo";

type ViewMode = "dashboard" | "listings" | "new" | "detail" | "leads" | "automation" | "market" | "tasks" | "settings";

type ManagerMarketResponse = {
  insights?: {
    inventory_by_price_bucket?: Array<{
      cost_range: string;
      annual_sales_units: number;
      unsold_units: number;
      months_inventory: number;
    }>;
  };
};

type ManagerAuditEntry = {
  id: string;
  created_at: string;
  actor_type: string;
  actor_name: string;
  action: string;
  details: string;
  tone?: string;
};

type AuditRecord = {
  id?: string | number;
  created_at?: string;
  actor_type?: string;
  actor_name?: string;
  action?: string;
  details_json?: {
    summary?: string;
    details?: string;
  };
};

type ListingDraft = {
  title: string;
  property_type: string;
  transaction_type: string;
  locality: string;
  address: string;
  latitude: number;
  longitude: number;
  carpet_area_sqft: number;
  builtup_area_sqft: number;
  bedrooms: number;
  bathrooms: number;
  parking_count: number;
  furnishing_status: string;
  possession_status: string;
  availability_date: string;
  rera_number: string;
  asking_price: number;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  notes: string;
};

type ListingDraftField = keyof ListingDraft;

const navItems: Array<{ mode: ViewMode; label: string; href: string; icon: typeof Building2 }> = [
  { mode: "dashboard", label: "Manager", href: "/manager", icon: Building2 },
  { mode: "listings", label: "Listings", href: "/manager/listings", icon: SquareStack },
  { mode: "new", label: "New Listing", href: "/manager/listings/new", icon: Plus },
  { mode: "leads", label: "Broker Tie-ups", href: "/manager/tieups", icon: Shield },
  { mode: "leads", label: "Leads", href: "/manager/leads", icon: MessagesSquare },
  { mode: "automation", label: "Automation", href: "/manager/automation", icon: Wand2 },
  { mode: "market", label: "Market", href: "/manager/market", icon: TrendingUp },
  { mode: "tasks", label: "Tasks", href: "/manager/tasks", icon: CheckCircle2 },
  { mode: "settings", label: "Settings", href: "/manager/settings", icon: Settings2 },
];

const detailTabs = ["overview", "documents", "media", "pricing", "leads", "site-visits", "negotiation", "market", "automation", "audit"] as const;

type ManagerPortalProps = {
  view: ViewMode;
  listingId?: string | null;
};

export function ManagerPortal({ view, listingId }: ManagerPortalProps) {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<ManagerDashboard | null>(null);
  const [listings, setListings] = useState<ManagerListing[]>([]);
  const [listing, setListing] = useState<ManagerListing | null>(null);
  const [leads, setLeads] = useState<ManagerLead[]>([]);
  const [tasks, setTasks] = useState<ManagerTask[]>([]);
  const [market, setMarket] = useState<ManagerMarketResponse | null>(null);
  const [audit, setAudit] = useState<ManagerAuditEntry[]>([]);
  const [automationRules, setAutomationRules] = useState<ManagerAutomationRule[]>([]);
  const [detailTab, setDetailTab] = useState<(typeof detailTabs)[number]>("overview");
  const [busy, setBusy] = useState<string | null>(null);

  const [draft, setDraft] = useState<ListingDraft>({
    title: "",
    property_type: "apartment",
    transaction_type: "sale",
    locality: "Powai",
    address: "",
    latitude: 19.1176,
    longitude: 72.906,
    carpet_area_sqft: 0,
    builtup_area_sqft: 0,
    bedrooms: 2,
    bathrooms: 2,
    parking_count: 1,
    furnishing_status: "semi-furnished",
    possession_status: "Ready to move",
    availability_date: "",
    rera_number: "",
    asking_price: 0,
    owner_name: "",
    owner_phone: "",
    owner_email: "",
    notes: "",
  });

  const [search, setSearch] = useState("");

  useEffect(() => {
    if (view !== "dashboard") return;
    getManagerDashboard().then(setDashboard).catch(console.error);
    getManagerListings().then(setListings).catch(console.error);
    getManagerTasks().then(setTasks).catch(console.error);
    getManagerMarket().then(setMarket).catch(console.error);
    getManagerAuditLog().then(setAudit).catch(console.error);
  }, [view]);

  useEffect(() => {
    if (view === "listings") {
      getManagerListings().then(setListings).catch(console.error);
    }
    if (view === "leads") {
      getManagerLeads().then(setLeads).catch(console.error);
    }
    if (view === "automation") {
      getManagerDashboard().then((data) => {
        setDashboard(data);
        const firstListing = data.listings[0];
        setAutomationRules((firstListing?.automation_rules as ManagerAutomationRule[] | undefined) || []);
      });
    }
    if (view === "market") {
      getManagerMarket().then(setMarket).catch(console.error);
    }
    if (view === "tasks") {
      getManagerTasks().then(setTasks).catch(console.error);
      getManagerAuditLog().then(setAudit).catch(console.error);
    }
  }, [view]);

  useEffect(() => {
    if (view !== "detail" || !listingId) return;
    getManagerListing(listingId).then((item) => {
      setListing(item);
      setDetailTab("overview");
      setAutomationRules((item.automation_rules as ManagerAutomationRule[] | undefined) || []);
    }).catch(console.error);
  }, [view, listingId]);

  const currentDashboard = dashboard || {
    manager: { id: "manager-demo-1", full_name: "Patel Panel Manager", company_name: "Patel Panel Realty", operating_localities: ["Bandra", "Andheri", "Borivali"] },
    summary_cards: [],
    map_pins: [],
    pipeline_columns: [],
    activity_feed: [],
    urgent_tasks: [],
    listings: DEMO_MANAGER_LISTINGS,
    market_highlights: {},
  };

  const filteredListings = useMemo(() => {
    if (!search.trim()) return listings;
    const lower = search.toLowerCase();
    return listings.filter((item) => [item.title, item.locality, item.address, item.status, item.seo_title].filter(Boolean).some((value) => String(value).toLowerCase().includes(lower)));
  }, [listings, search]);

  const activeListing = listing || filteredListings[0] || DEMO_MANAGER_LISTINGS[0];
  async function onCreateListing(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("create");
    try {
      const created = await createManagerListing({
        title: draft.title,
        property_type: draft.property_type,
        transaction_type: draft.transaction_type,
        locality: draft.locality,
        address: draft.address,
        latitude: Number(draft.latitude),
        longitude: Number(draft.longitude),
        carpet_area_sqft: Number(draft.carpet_area_sqft) || null,
        builtup_area_sqft: Number(draft.builtup_area_sqft) || null,
        bedrooms: Number(draft.bedrooms) || null,
        bathrooms: Number(draft.bathrooms) || null,
        parking_count: Number(draft.parking_count) || null,
        furnishing_status: draft.furnishing_status,
        possession_status: draft.possession_status,
        availability_date: draft.availability_date,
        rera_number: draft.rera_number,
        asking_price: Number(draft.asking_price) || null,
        owner_name: draft.owner_name,
        owner_phone: draft.owner_phone,
        owner_email: draft.owner_email,
        notes: draft.notes,
      });
      router.push(`/manager/listings/${created.id}`);
    } finally {
      setBusy(null);
    }
  }

  async function onRunAutomation() {
    if (!listingId && !activeListing?.id) return;
    setBusy("automation");
    const id = listingId || activeListing.id;
    const result = await runManagerAutomation({ listing_id: id, auto_publish: true, current_task: "manager_full_automation" });
    if (result?.listing) setListing(result.listing);
    const refreshed = await getManagerDashboard().catch(() => null);
    if (refreshed) setDashboard(refreshed);
    setBusy(null);
  }

  async function onPublish() {
    if (!activeListing?.id) return;
    setBusy("publish");
    try {
      const result = await publishManagerListing(activeListing.id);
      setListing(result.listing);
      const refreshed = await getManagerDashboard().catch(() => null);
      if (refreshed) setDashboard(refreshed);
    } finally {
      setBusy(null);
    }
  }

  async function onRunListingAgents() {
    if (!activeListing?.id) return;
    setBusy("run-agents");
    const result = await runManagerListingAgents(activeListing.id, { user_request: "Run seller automation", auto_publish: false });
    if (result?.listing) setListing(result.listing);
    setBusy(null);
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[1720px] gap-5 px-4 py-4 md:px-6 lg:px-8">
        <aside className="hidden w-[280px] shrink-0 lg:block">
          <div className="sticky top-4 space-y-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="rounded-[22px] bg-slate-950 px-4 py-4 text-white">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-200">Patel Panel</p>
              <h1 className="mt-3 text-2xl font-black leading-none">Manager Selling Portal</h1>
              <p className="mt-2 text-sm leading-6 text-white/68">Seller command center for Mumbai listings, documents, media, pricing, and lead automation.</p>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const selected = view === item.mode;
                return (
                  <Link key={item.href} href={item.href} className={clsx("flex items-center gap-3 rounded-2xl px-4 py-3 transition", selected ? "bg-emerald-50 text-slate-950 ring-1 ring-emerald-200" : "text-slate-600 hover:bg-slate-50") }>
                    <span className={clsx("grid h-9 w-9 place-items-center rounded-xl", selected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600") }>
                      <Icon size={17} />
                    </span>
                    <span className="flex-1 text-sm font-black">{item.label}</span>
                    <ChevronRight size={16} className="text-slate-400" />
                  </Link>
                );
              })}
            </nav>
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Live status</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{currentDashboard.listings.length} listings tracked</p>
              <p className="text-sm font-semibold text-slate-500">{currentDashboard.urgent_tasks.length} urgent actions</p>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1 space-y-5 pb-6">
          <header className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700">
                  <Sparkles size={14} />
                  Manager selling OS
                </div>
                <h2 className="text-3xl font-black tracking-tight text-slate-950 md:text-5xl">Autonomous seller operating system for Mumbai brokers and owners.</h2>
                <p className="max-w-3xl text-sm leading-7 text-slate-600">This portal handles listing intake, document extraction, media intelligence, pricing, copy generation, publishing, lead qualification, site visits, negotiation, and Codex-backed automation.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={onRunListingAgents} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5">
                  <Wand2 size={16} />
                  Run AI Review
                </button>
                <button onClick={onRunAutomation} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800 transition hover:-translate-y-0.5">
                  <TimerReset size={16} />
                  Run Full Listing Automation
                </button>
                <button onClick={onPublish} className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-900 transition hover:-translate-y-0.5">
                  <BadgeCheck size={16} />
                  Publish Listing
                </button>
              </div>
            </div>
          </header>

          {view === "dashboard" && <DashboardView dashboard={currentDashboard} listings={currentDashboard.listings} mapPins={currentDashboard.map_pins} onFocus={(id) => router.push(`/manager/listings/${id}`)} />}
          {view === "listings" && <ListingsView listings={filteredListings} search={search} setSearch={setSearch} onOpen={(id) => router.push(`/manager/listings/${id}`)} />}
          {view === "new" && <NewListingView draft={draft} setDraft={setDraft} onSubmit={onCreateListing} busy={busy === "create"} />}
          {view === "detail" && activeListing && <ListingDetailView listing={activeListing} tab={detailTab} setTab={setDetailTab} onPublish={onPublish} onRunAutomation={onRunAutomation} onRunAgents={onRunListingAgents} onRefetch={async () => setListing(await getManagerListing(activeListing.id))} />}
          {view === "leads" && <LeadsView leads={leads.length ? leads : (currentDashboard.listings.flatMap((item) => item.leads || []) as ManagerLead[])} onOpen={(id) => router.push(`/manager/listings/${id}`)} />}
          {view === "automation" && <AutomationView rules={automationRules.length ? automationRules : (currentDashboard.listings[0]?.automation_rules as ManagerAutomationRule[] | undefined) || []} />}
          {view === "market" && <MarketView market={market} listings={listings.length ? listings : currentDashboard.listings} onOpen={(id) => router.push(`/manager/listings/${id}`)} />}
          {view === "tasks" && <TasksView tasks={tasks.length ? tasks : currentDashboard.urgent_tasks as ManagerTask[]} audit={audit} />}
          {view === "settings" && <SettingsView />}
        </section>
      </div>
    </main>
  );
}

function DashboardView({ dashboard, listings, mapPins, onFocus }: { dashboard: ManagerDashboard; listings: ManagerListing[]; mapPins: ManagerDashboard["map_pins"]; onFocus: (id: string) => void }) {
  const [focused, setFocused] = useState<string | null>(mapPins[0]?.id || listings[0]?.id || null);
  const active = mapPins.find((pin) => pin.id === focused) || mapPins[0];

  useEffect(() => {
    setFocused(mapPins[0]?.id || listings[0]?.id || null);
  }, [mapPins, listings]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {dashboard.summary_cards.map((card) => (
          <MetricCard key={card.label} label={card.label} value={card.value} detail={card.detail || ""} tone={card.tone || "neutral"} />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <ManagerMap pins={mapPins} focused={focused} onFocus={(id) => { setFocused(id); onFocus(id); }} />
        <div className="space-y-5">
          <Panel title="AI automation feed" eyebrow="Autonomous activity">
            <div className="space-y-3">
              {dashboard.activity_feed.slice(0, 6).map((entry) => <FeedRow key={entry.id} entry={entry} />)}
            </div>
          </Panel>
          <Panel title="Urgent tasks" eyebrow="Needs attention">
            <div className="space-y-3">
              {dashboard.urgent_tasks.slice(0, 5).map((task) => <TaskCard key={task.id} task={task} compact />)}
            </div>
          </Panel>
        </div>
      </div>
      <Panel title="Pipeline board" eyebrow="Kanban-style workflow">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5 2xl:grid-cols-10">
          {dashboard.pipeline_columns.map((column) => (
            <div key={column.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{column.label}</p>
                <span className="rounded-full bg-white px-2 py-1 text-[11px] font-black text-slate-600">{column.count}</span>
              </div>
              <div className="mt-3 space-y-2">
                {column.listing_ids.map((listingId) => {
                  const item = listings.find((entry) => entry.id === listingId);
                  if (!item) return null;
                  return <ListingMiniCard key={item.id} listing={item} onOpen={() => onFocus(item.id)} />;
                })}
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Focused listing preview" eyebrow="Map click preview">
        {active ? (
          <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
            <div>
              <p className="text-sm font-black text-slate-900">{active.title}</p>
              <p className="mt-1 text-sm text-slate-600">{active.locality} · {active.status} · {active.lead_count} leads · {active.market_heat_score} market heat</p>
              <p className="mt-2 text-sm text-slate-500">{active.address}</p>
            </div>
            <div className="rounded-[18px] bg-slate-950 p-4 text-white">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-200">Quick actions</p>
              <div className="mt-3 space-y-2 text-sm font-semibold text-white/78">
                <p>Legal risk score: {active.legal_risk_score}</p>
                <p>Readiness score: {active.readiness_score}</p>
                <p>Next visit: {active.next_visit || "Needs scheduling"}</p>
              </div>
            </div>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}

function ListingsView({ listings, search, setSearch, onOpen }: { listings: ManagerListing[]; search: string; setSearch: (value: string) => void; onOpen: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <Panel title="Listings pipeline" eyebrow="Seller command center">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, locality, status, address" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none ring-0 placeholder:text-slate-400 md:max-w-lg" />
          <Link href="/manager/listings/new" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
            <Plus size={16} />
            New listing
          </Link>
        </div>
      </Panel>
      <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        {listings.map((listing) => <ListingCard key={listing.id} listing={listing} onOpen={() => onOpen(listing.id)} />)}
      </div>
    </div>
  );
}

function NewListingView({ draft, setDraft, onSubmit, busy }: { draft: ListingDraft; setDraft: React.Dispatch<React.SetStateAction<ListingDraft>>; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; busy: boolean }) {
  function update(field: string, value: string | number) {
    setDraft({ ...draft, [field]: value });
  }

  const textFields: Array<[ListingDraftField, string]> = [
    ["title", "Property name"],
    ["locality", "Locality"],
    ["address", "Exact address"],
    ["rera_number", "RERA number"],
    ["owner_name", "Owner / broker name"],
    ["owner_phone", "Phone"],
    ["owner_email", "Email"],
  ];

  const numberFields: Array<[ListingDraftField, string]> = [
    ["latitude", "Latitude"],
    ["longitude", "Longitude"],
    ["carpet_area_sqft", "Carpet area"],
    ["builtup_area_sqft", "Built-up area"],
    ["bedrooms", "Bedrooms"],
    ["bathrooms", "Bathrooms"],
    ["parking_count", "Parking"],
    ["asking_price", "Asking price"],
  ];

  const optionFields: Array<[ListingDraftField, string]> = [
    ["property_type", "Property type"],
    ["transaction_type", "Transaction type"],
    ["furnishing_status", "Furnishing status"],
    ["possession_status", "Possession status"],
    ["availability_date", "Availability"],
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Panel title="Create a new listing" eyebrow="Guided seller intake">
        <div className="grid gap-4 lg:grid-cols-2">
          {textFields.map(([field, label]) => (
            <label key={field} className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</span>
              <input value={draft[field] || ""} onChange={(e) => update(field, e.target.value)} required={field === "title" || field === "locality" || field === "address"} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none" />
            </label>
          ))}
          {numberFields.map(([field, label]) => (
            <label key={field} className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</span>
              <input type="number" value={draft[field] || ""} onChange={(e) => update(field, e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none" />
            </label>
          ))}
          {optionFields.map(([field, label]) => (
            <label key={field} className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</span>
              <input value={draft[field] || ""} onChange={(e) => update(field, e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none" />
            </label>
          ))}
          <label className="space-y-2 lg:col-span-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Seller notes</span>
            <textarea value={draft.notes || ""} onChange={(e) => update("notes", e.target.value)} rows={4} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none" />
          </label>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-[22px] bg-slate-950 px-4 py-4 text-white">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-200">Map preview</p>
            <p className="mt-1 text-sm text-white/68">Place the location pin and continue to documents, media, pricing, and publishing.</p>
          </div>
          <div className="text-right text-sm font-semibold text-white/78">
            <p>{draft.locality}</p>
            <p>{draft.latitude}, {draft.longitude}</p>
          </div>
        </div>
      </Panel>
      <div className="flex justify-end">
        <button disabled={busy} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:opacity-60">
          <Plus size={16} />
          Create listing
        </button>
      </div>
    </form>
  );
}

function ListingDetailView({ listing, tab, setTab, onPublish, onRunAutomation, onRunAgents, onRefetch }: { listing: ManagerListing; tab: typeof detailTabs[number]; setTab: (tab: typeof detailTabs[number]) => void; onPublish: () => Promise<void>; onRunAutomation: () => Promise<void>; onRunAgents: () => Promise<void>; onRefetch: () => Promise<void> }) {
  return (
    <div className="space-y-5">
      <Panel title="Listing operating screen" eyebrow="Main operating context">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              <span className={clsx("rounded-full px-3 py-1", listing.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900")}>{listing.status}</span>
              <span>{listing.locality}</span>
              <span>{listing.lead_count} leads</span>
              <span>{listing.readiness_score} readiness</span>
            </div>
            <h3 className="text-3xl font-black tracking-tight text-slate-950">{listing.title}</h3>
            <p className="max-w-3xl text-sm leading-7 text-slate-600">{listing.description_long}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px]">
            <button onClick={onRunAgents} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800">
              <RefreshCw size={16} />
              Run AI Review
            </button>
            <button onClick={onRunAutomation} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
              <TimerReset size={16} />
              Run Full Automation
            </button>
            <button onClick={onPublish} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-900">
              <BadgeCheck size={16} />
              Publish
            </button>
            <button onClick={onRefetch} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800">
              <ArrowRight size={16} />
              Refresh
            </button>
          </div>
        </div>
      </Panel>

      <div className="rounded-[28px] border border-slate-200 bg-white p-2 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap gap-2">
          {detailTabs.map((item) => (
            <button key={item} onClick={() => setTab(item)} className={clsx("rounded-2xl px-4 py-3 text-sm font-black transition", tab === item ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100")}>
              {item.replace("-", " ")}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" && <OverviewTab listing={listing} />}
      {tab === "documents" && <DocumentsTab listing={listing} />}
      {tab === "media" && <MediaTab listing={listing} />}
      {tab === "pricing" && <PricingTab listing={listing} />}
      {tab === "leads" && <ListingLeadsTab listing={listing} />}
      {tab === "site-visits" && <VisitsTab listing={listing} />}
      {tab === "negotiation" && <NegotiationTab listing={listing} />}
      {tab === "market" && <MarketIntelTab listing={listing} />}
      {tab === "automation" && <AutomationTab listing={listing} />}
      {tab === "audit" && <AuditTab listing={listing} />}
    </div>
  );
}

function OverviewTab({ listing }: { listing: ManagerListing }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <Panel title="Overview" eyebrow="Public preview">
        <div className="grid gap-4 md:grid-cols-2">
          <StatPair label="Price" value={formatCr(listing.asking_price)} />
          <StatPair label="Recommended" value={formatCr(listing.recommended_price)} />
          <StatPair label="Legal risk" value={`${listing.legal_risk_score}`} />
          <StatPair label="Market heat" value={`${listing.market_heat_score}`} />
        </div>
        <div className="mt-5 rounded-[22px] bg-slate-950 p-4 text-white">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-200">Buyer preview</p>
          <p className="mt-2 text-lg font-black">{listing.seo_title || listing.title}</p>
          <p className="mt-2 text-sm leading-6 text-white/72">{listing.description_short}</p>
        </div>
      </Panel>
      <Panel title="Map pin" eyebrow="Location proof">
        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-900">{listing.locality}</p>
          <p className="mt-1 text-sm text-slate-600">{listing.address}</p>
          <div className="mt-4 rounded-[18px] bg-slate-950 px-4 py-4 text-white">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-200">Coordinates</p>
            <p className="mt-2 text-sm font-semibold">{listing.latitude}, {listing.longitude}</p>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function DocumentsTab({ listing }: { listing: ManagerListing }) {
  return <TwoColumnSection left={<Panel title="Documents" eyebrow="Extraction status"><div className="space-y-3">{(listing.documents || []).map((doc, index) => <DocumentCard key={index} doc={doc} />)}</div></Panel>} right={<Panel title="Missing items" eyebrow="Manager approval"><div className="space-y-3">{(listing.missing_fields || ["Title report", "Encumbrance certificate"]).map((item) => <TaskChip key={item} title={item} tone="amber" />)}</div></Panel>} />;
}

function MediaTab({ listing }: { listing: ManagerListing }) {
  return <TwoColumnSection left={<Panel title="Media" eyebrow="Uploads and room classification"><div className="space-y-3">{(listing.media || []).map((media, index) => <MediaCard key={index} media={media} />)}</div></Panel>} right={<Panel title="Media actions" eyebrow="Open workflow"><div className="space-y-3"><Dropzone label="Upload images / floor plans" icon={ImageIcon} /><Dropzone label="Upload walkthrough video" icon={Upload} /><TaskChip title="Select hero image" tone="emerald" /><TaskChip title="Generate captions and alt text" tone="slate" /></div></Panel>} />;
}

function PricingTab({ listing }: { listing: ManagerListing }) {
  const pricing = listing.pricing || {};
  return <TwoColumnSection left={<Panel title="Pricing" eyebrow="AI valuation"><div className="grid gap-3 md:grid-cols-2">{[
    ["Recommended price", pricing.recommended_price],
    ["Minimum acceptable", pricing.minimum_acceptable_price],
    ["Optimistic price", pricing.optimistic_price],
    ["Fast-sale price", pricing.fast_sale_price],
    ["Price per sq ft", pricing.price_per_sqft],
    ["Confidence", pricing.confidence_score],
  ].map(([label, value]) => <StatPair key={String(label)} label={String(label)} value={typeof value === "number" ? (String(label).includes("price") || String(label).includes("Recommended") ? formatCr(value as number) : String(value)) : String(value || "-")} />)}</div><div className="mt-4 rounded-[22px] bg-slate-950 p-4 text-white"><p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-200">Explanation</p><p className="mt-2 text-sm leading-6 text-white/72">{String(pricing.explanation || "No pricing explanation yet.")}</p></div></Panel>} right={<Panel title="Pricing chart" eyebrow="Negotiation band"><div className="space-y-3"><Progress label="Recommended" value={70} tone="emerald" /><Progress label="Fast sale" value={56} tone="amber" /><Progress label="Optimistic" value={88} tone="slate" /><TaskChip title={`Buyer affordability: ${pricing.buyer_affordability_segment || "pending"}`} tone="emerald" /></div></Panel>} />;
}

function ListingLeadsTab({ listing }: { listing: ManagerListing }) {
  return <Panel title="Leads" eyebrow="WhatsApp, calls, web"><div className="grid gap-3 xl:grid-cols-2">{(listing.leads || []).map((lead, index) => <LeadCard key={index} lead={lead as ManagerLead} />)}</div></Panel>;
}

function VisitsTab({ listing }: { listing: ManagerListing }) {
  return <Panel title="Site visits" eyebrow="Calendar automation"><div className="grid gap-3 xl:grid-cols-2">{(listing.site_visits || []).map((visit, index) => <VisitCard key={index} visit={visit} />)}</div></Panel>;
}

function NegotiationTab({ listing }: { listing: ManagerListing }) {
  return <TwoColumnSection left={<Panel title="Negotiation" eyebrow="ASTRA strategy"><div className="space-y-3"><StatPair label="Current offer" value={formatCr(listing.asking_price ? listing.asking_price * 0.96 : undefined)} /><StatPair label="Seller target" value={formatCr(listing.recommended_price)} /><StatPair label="Hidden walk-away" value="Manager only" /><TaskChip title="Buyer seriousness: high" tone="emerald" /><TaskChip title="Suggested counter-offer: keep buffer tight" tone="amber" /></div></Panel>} right={<Panel title="Recommended reply" eyebrow="Safe and professional"><p className="text-sm leading-7 text-slate-600">Thank you for the offer. We are reviewing the seller-side position and can revert with a counter once the legal and pricing pack is fully approved.</p></Panel>} />;
}

function MarketIntelTab({ listing }: { listing: ManagerListing }) {
  return <TwoColumnSection left={<Panel title="Mumbai market intelligence" eyebrow="Locality context"><div className="space-y-3">{["Redevelopment potential", "Inventory pressure", "EMI sensitivity", "Builder credibility", "RERA risk"].map((label) => <Progress key={label} label={label} value={label === "Redevelopment potential" ? (listing.redevelopment_score || 55) : label === "Inventory pressure" ? 72 : 64} tone="emerald" />)}</div></Panel>} right={<Panel title="Comparable listings" eyebrow="Database comparable set"><div className="space-y-3">{(listing.market_comparables || []).slice(0, 5).map((item, index) => <div key={index} className="rounded-[18px] border border-slate-200 bg-slate-50 p-4 text-sm"><p className="font-black text-slate-900">{String(item.locality || listing.locality)}</p><p className="text-slate-500">₹{Number(item.price || 0).toLocaleString("en-IN")} · {String(item.property_type || listing.property_type)} · {String(item.source || "database")}</p></div>)}</div></Panel>} />;
}

function AutomationTab({ listing }: { listing: ManagerListing }) {
  return <Panel title="Automation" eyebrow="Toggles and logs"><div className="grid gap-3 xl:grid-cols-2">{(listing.automation_rules || []).map((rule, index) => <RuleCard key={index} rule={rule as ManagerAutomationRule} />)}</div></Panel>;
}

function AuditTab({ listing }: { listing: ManagerListing }) {
  return <Panel title="Audit log" eyebrow="Every autonomous action"><div className="space-y-3">{(listing.audit_log || []).map((item, index) => {
    const auditItem = item as AuditRecord;
    return <FeedRow key={index} entry={{ id: String(auditItem.id || index), created_at: String(auditItem.created_at || new Date().toISOString()), actor_type: String(auditItem.actor_type || "agent"), actor_name: String(auditItem.actor_name || "Agent"), action: String(auditItem.action || "audit"), details: String(auditItem.details_json?.summary || auditItem.details_json?.details || "Audit event"), tone: "slate" }} />;
  })}</div></Panel>;
}

function LeadsView({ leads, onOpen }: { leads: ManagerLead[]; onOpen: (id: string) => void }) {
  return <div className="grid gap-4 xl:grid-cols-2">{leads.map((lead) => <div key={lead.id} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.07)]"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{lead.source}</p><h3 className="mt-1 text-xl font-black text-slate-950">{lead.name}</h3><p className="mt-1 text-sm text-slate-500">{lead.buyer_profile || "buyer"} · {lead.status}</p></div><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">{lead.qualification_score}/100</span></div><div className="mt-4 grid gap-2 text-sm text-slate-600"><p>Budget: {formatCr(lead.budget_min)} - {formatCr(lead.budget_max)}</p><p>Preferred visit: {lead.preferred_visit_time || "Any time"}</p><p>Last summary: {lead.last_agent_summary || "No summary yet"}</p></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => onOpen(lead.listing_id)} className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Open listing</button><button className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">WhatsApp</button><button className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">Schedule</button></div></div>)}</div>;
}

function MarketView({ market, listings, onOpen }: { market: ManagerMarketResponse | null; listings: ManagerListing[]; onOpen: (id: string) => void }) {
  const buckets = market?.insights?.inventory_by_price_bucket || [];
  return <div className="space-y-4"><Panel title="Mumbai market intelligence" eyebrow="Seller-side intelligence"><div className="grid gap-3 md:grid-cols-3">{buckets.map((bucket) => <div key={bucket.cost_range} className="rounded-[20px] border border-slate-200 bg-white p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{bucket.cost_range}</p><p className="mt-2 text-3xl font-black text-slate-950">{bucket.months_inventory} mo</p><p className="text-sm text-slate-500">{bucket.unsold_units} unsold · {bucket.annual_sales_units} annual sales</p></div>)}</div></Panel><Panel title="Comparable listings" eyebrow="Database comps"><div className="grid gap-3 xl:grid-cols-2">{listings.map((listing) => <button key={listing.id} onClick={() => onOpen(listing.id)} className="rounded-[20px] border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5"><div className="flex items-center justify-between gap-3"><div><p className="font-black text-slate-950">{listing.title}</p><p className="text-sm text-slate-500">{listing.locality} · {listing.status}</p></div><span className="text-sm font-black text-emerald-700">{formatCr(listing.asking_price)}</span></div></button>)}</div></Panel></div>;
}

function TasksView({ tasks, audit }: { tasks: ManagerTask[]; audit: ManagerAuditEntry[] }) {
  return <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]"><Panel title="Urgent tasks" eyebrow="Actionable work"><div className="space-y-3">{tasks.map((task) => <TaskCard key={task.id} task={task} />)}</div></Panel><Panel title="Audit feed" eyebrow="Action history"><div className="space-y-3">{audit.slice(0, 8).map((entry) => <FeedRow key={entry.id} entry={entry} />)}</div></Panel></div>;
}

function SettingsView() {
  return <Panel title="Settings" eyebrow="Manager profile and automation controls"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"><TaskChip title="Auto-publish disabled by default" tone="amber" /><TaskChip title="Document sharing gated by manager approval" tone="slate" /><TaskChip title="WhatsApp and call agents enabled for published listings" tone="emerald" /><TaskChip title="Audit logging active for every autonomous action" tone="emerald" /><TaskChip title="Cal.com integration ready for setup" tone="slate" /><TaskChip title="Supabase / Postgres compatibility on" tone="emerald" /></div></Panel>;
}

function ManagerMap({ pins, focused, onFocus }: { pins: ManagerDashboard["map_pins"]; focused: string | null; onFocus: (id: string) => void }) {
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
    pins.forEach((pin) => {
      const active = focused === pin.id;
      const tone = pin.color === "red" ? "#dc2626" : pin.color === "purple" ? "#7c3aed" : pin.color === "blue" ? "#2563eb" : pin.color === "green" ? "#059669" : pin.color === "gray" ? "#64748b" : "#ca8a04";
      const marker = L.marker([pin.latitude, pin.longitude], {
        icon: L.divIcon({ className: "astra-marker", html: `<div style="background:${tone};" class="astra-marker-dot ${active ? "active" : ""}">${pin.locality}</div>`, iconSize: [92, 34], iconAnchor: [46, 34] }),
      });
      marker.on("click", () => onFocus(pin.id));
      marker.bindPopup(`<strong>${pin.title}</strong><br/>${pin.locality}<br/>${formatCr(pin.price)}<br/>Heat ${pin.market_heat_score} · Risk ${pin.legal_risk_score}`);
      marker.addTo(map);
      markersRef.current.push(marker);
      bounds.push([pin.latitude, pin.longitude]);
    });
    if (focused) {
      const pin = pins.find((item) => item.id === focused);
      if (pin) map.flyTo([pin.latitude, pin.longitude], 13, { duration: 0.8 });
    } else if (bounds.length > 1) {
      map.fitBounds(bounds as Array<[number, number]>, { padding: [32, 32] });
    }
  }, [pins, focused, onFocus]);

  const preview = pins.find((pin) => pin.id === focused) || pins[0];

  return (
    <Panel title="Mumbai map" eyebrow="Color-coded seller listings">
      <div ref={containerRef} className="h-[620px] overflow-hidden rounded-[22px] border border-slate-200 bg-slate-100" />
      {preview ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <InfoChip label="Price" value={formatCr(preview.price)} />
          <InfoChip label="Heat score" value={String(preview.market_heat_score)} />
          <InfoChip label="Legal risk" value={String(preview.legal_risk_score)} />
          <InfoChip label="Leads" value={String(preview.lead_count)} />
        </div>
      ) : null}
    </Panel>
  );
}

function Panel({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]"><div className="mb-4 flex items-start justify-between gap-4"><div><p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700">{eyebrow}</p><h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{title}</h3></div><Shield size={22} className="text-slate-400" /></div>{children}</section>;
}

function TwoColumnSection({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">{left}{right}</div>;
}

function MetricCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) {
  const color = tone === "emerald" ? "bg-emerald-50 text-emerald-800" : tone === "amber" ? "bg-amber-50 text-amber-900" : tone === "slate" ? "bg-slate-50 text-slate-800" : "bg-slate-50 text-slate-800";
  return <div className={clsx("rounded-[24px] border border-slate-200 p-4", color)}><p className="text-[11px] font-black uppercase tracking-[0.22em] opacity-70">{label}</p><p className="mt-3 text-3xl font-black tracking-tight">{value}</p><p className="mt-2 text-sm font-semibold opacity-70">{detail}</p></div>;
}

function ListingCard({ listing, onOpen }: { listing: ManagerListing; onOpen: () => void }) {
  return <button onClick={onOpen} className="rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-[0_16px_50px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(15,23,42,0.08)]"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{listing.status}</p><h4 className="mt-1 text-xl font-black text-slate-950">{listing.title}</h4><p className="mt-1 text-sm text-slate-500">{listing.locality} · {listing.property_type} · {listing.lead_count} leads</p></div><span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">{formatCr(listing.asking_price)}</span></div><div className="mt-4 grid gap-2 text-sm text-slate-600"><p>Legal risk: {listing.legal_risk_score}</p><p>Readiness: {listing.readiness_score}</p><p>Pending tasks: {listing.pending_tasks}</p></div></button>;
}

function ListingMiniCard({ listing, onOpen }: { listing: ManagerListing; onOpen: () => void }) {
  return <button onClick={onOpen} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50"><p className="text-sm font-black text-slate-950">{listing.title}</p><p className="text-xs text-slate-500">{listing.locality} · {formatCr(listing.asking_price)}</p></button>;
}

function LeadCard({ lead, onOpen }: { lead: ManagerLead; onOpen?: () => void }) {
  return <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{lead.source}</p><h3 className="mt-1 text-xl font-black text-slate-950">{lead.name}</h3><p className="mt-1 text-sm text-slate-500">{lead.buyer_profile || "buyer"} · {lead.status}</p></div><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">{lead.qualification_score}/100</span></div><div className="mt-4 grid gap-2 text-sm text-slate-600"><p>Budget: {formatCr(lead.budget_min)} - {formatCr(lead.budget_max)}</p><p>Preferred visit: {lead.preferred_visit_time || "Any time"}</p><p>Last summary: {lead.last_agent_summary || "No summary yet"}</p></div><div className="mt-4 flex flex-wrap gap-2">{onOpen ? <button onClick={onOpen} className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Open listing</button> : null}<button className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">WhatsApp</button><button className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">Schedule</button></div></div>;
}

function AutomationView({ rules }: { rules: ManagerAutomationRule[] }) {
  return <Panel title="Automation" eyebrow="Enabled rules and safety gates"><div className="grid gap-3 xl:grid-cols-2">{rules.map((rule) => <RuleCard key={rule.id} rule={rule} />)}</div></Panel>;
}

function FeedRow({ entry }: { entry: { id: string; created_at: string; actor_type?: string; actor_name: string; action: string; details: string; tone?: string } }) {
  const tone = entry.tone === "emerald" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : entry.tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-slate-50 text-slate-700";
  return <div className={clsx("rounded-[18px] border p-4", tone)}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black">{entry.actor_name}</p><p className="mt-1 text-sm leading-6">{entry.details}</p></div><span className="text-[11px] font-black uppercase tracking-[0.18em] opacity-70">{entry.action.replace(/_/g, " ")}</span></div></div>;
}

function TaskCard({ task, compact = false }: { task: { title: string; description: string; priority: string; action_label: string; listing_id?: string | null }; compact?: boolean }) {
  return <div className={clsx("rounded-[18px] border border-slate-200 bg-slate-50 p-4", compact && "bg-white") }><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-slate-950">{task.title}</p><p className="mt-1 text-sm text-slate-500">{task.description}</p></div><span className={clsx("rounded-full px-2 py-1 text-[11px] font-black uppercase tracking-[0.18em]", task.priority === "high" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600")}>{task.action_label}</span></div></div>;
}

function TaskChip({ title, tone }: { title: string; tone: string }) {
  const classes = tone === "emerald" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : tone === "amber" ? "bg-amber-50 text-amber-900 border-amber-200" : "bg-slate-50 text-slate-700 border-slate-200";
  return <div className={clsx("rounded-2xl border px-4 py-3 text-sm font-semibold", classes)}>{title}</div>;
}

function Dropzone({ label, icon: Icon }: { label: string; icon: typeof Upload }) {
  return <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[20px] border border-dashed border-slate-300 bg-white px-4 py-8 text-sm font-black text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50"><Icon size={16} />{label}<input type="file" multiple className="sr-only" /></label>;
}

function DocumentCard({ doc }: { doc: Record<string, unknown> }) {
  return <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-slate-950">{String(doc.file_name || doc.document_type || "Document")}</p><p className="mt-1 text-sm text-slate-500">Status: {String(doc.extraction_status || "pending")}</p></div><span className="rounded-full bg-white px-2 py-1 text-xs font-black text-slate-600">{String(doc.confidence_score || 0)}</span></div><pre className="mt-3 max-h-48 overflow-auto rounded-2xl bg-slate-950 p-3 text-[11px] text-emerald-100">{JSON.stringify(doc.extracted_json || doc, null, 2)}</pre></div>;
}

function MediaCard({ media }: { media: Record<string, unknown> }) {
  return <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-slate-950">{String(media.room_type || media.media_type || "Media")}</p><p className="mt-1 text-sm text-slate-500">{String(media.caption || "No caption yet")}</p></div><span className="rounded-full bg-white px-2 py-1 text-xs font-black text-slate-600">{String(media.quality_score || 0)}</span></div><div className="mt-3 rounded-2xl bg-slate-950 px-4 py-4 text-white"><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">Alt text</p><p className="mt-2 text-sm text-white/72">{String(media.alt_text || "Pending generation")}</p></div></div>;
}

function VisitCard({ visit }: { visit: Record<string, unknown> }) {
  return <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-slate-950">{String(visit.status || "requested")}</p><p className="mt-1 text-sm text-slate-500">{String(visit.scheduled_start || "Awaiting slot")}</p></div><CalendarClock size={18} className="text-slate-400" /></div><p className="mt-3 text-sm text-slate-600">{String(visit.notes || "No notes")}</p></div>;
}

function RuleCard({ rule }: { rule: ManagerAutomationRule }) {
  return <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-slate-950">{rule.name}</p><p className="mt-1 text-sm text-slate-500">{rule.agent_name}</p></div><span className={clsx("rounded-full px-2 py-1 text-xs font-black", rule.enabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500")}>{rule.enabled ? "Enabled" : "Disabled"}</span></div><div className="mt-3 space-y-1 text-sm text-slate-600"><p>Last run: {rule.last_run || "-"}</p><p>Next run: {rule.next_run || "-"}</p><p>Failure: {rule.failure_state || "None"}</p></div></div>;
}

function StatPair({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">{value}</p></div>;
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</p><p className="mt-2 text-xl font-black text-slate-950">{value}</p></div>;
}

function Progress({ label, value, tone }: { label: string; value: number; tone: string }) {
  const bar = tone === "emerald" ? "bg-emerald-500" : tone === "amber" ? "bg-amber-500" : "bg-slate-500";
  return <div className="space-y-2"><div className="flex items-center justify-between text-sm font-semibold text-slate-600"><span>{label}</span><span>{value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className={clsx("h-full rounded-full", bar)} style={{ width: `${value}%` }} /></div></div>;
}

