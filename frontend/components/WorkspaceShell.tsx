"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  Bot,
  Building2,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  GanttChartSquare,
  Home,
  IndianRupee,
  LayoutGrid,
  MessagesSquare,
  RadioTower,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { AgentConsole } from "@/components/AgentConsole";
import { AgentSwarmPanel } from "@/components/AgentSwarmPanel";
import { AvailabilityTicker } from "@/components/AvailabilityTicker";
import { CompareDrawer } from "@/components/CompareDrawer";
import { ChannelAgentsPanel } from "@/components/ChannelAgentsPanel";
import { DocumentAndNegotiation } from "@/components/DocumentAndNegotiation";
import { FinancePanel } from "@/components/FinancePanel";
import { MarketDashboard } from "@/components/MarketDashboard";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyMap } from "@/components/PropertyMap";
import { TourGuidePanel } from "@/components/TourGuidePanel";
import { Property, formatCr, getProperties } from "@/lib/api";

type TabId = "search" | "market" | "finance" | "tour" | "channels" | "documents" | "agents";

const tabs: Array<{
  id: TabId;
  label: string;
  description: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}> = [
  { id: "search", label: "Search", description: "Map, filters, ranked list", icon: LayoutGrid },
  { id: "market", label: "Market", description: "Inventory and redevelopment", icon: TrendingUp },
  { id: "finance", label: "Finance", description: "EMI and materials", icon: IndianRupee },
  { id: "tour", label: "Tours", description: "Viewing route control", icon: CalendarClock },
  { id: "channels", label: "Channels", description: "WhatsApp, calls, slots", icon: MessagesSquare },
  { id: "documents", label: "Docs & Deals", description: "Extraction and offers", icon: FileText },
  { id: "agents", label: "Agents", description: "Swarm operations", icon: Bot },
];

type Filters = {
  minPrice: number | null;
  maxPrice: number | null;
  minBeds: number | null;
  propertyType: string | null;
};

const EMPTY_FILTERS: Filters = { minPrice: null, maxPrice: null, minBeds: null, propertyType: null };
const PRICE_PRESETS: Array<{ label: string; min: number | null; max: number | null }> = [
  { label: "Under ₹1 Cr", min: null, max: 1_00_00_000 },
  { label: "₹1-2 Cr", min: 1_00_00_000, max: 2_00_00_000 },
  { label: "₹2-5 Cr", min: 2_00_00_000, max: 5_00_00_000 },
  { label: "₹5 Cr+", min: 5_00_00_000, max: null },
];
const BED_OPTIONS = [1, 2, 3, 4];
const TYPE_OPTIONS = ["apartment", "villa", "plot", "commercial"];

export function WorkspaceShell() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [focused, setFocused] = useState<Property | null>(null);
  const [compare, setCompare] = useState<Property[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("search");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showAiSearch, setShowAiSearch] = useState(false);

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab && tabs.some((item) => item.id === tab)) {
      setActiveTab(tab as TabId);
    }
  }, []);

  useEffect(() => {
    getProperties()
      .then((items) => {
        setProperties(items);
        setFocused(items[0] || null);
      })
      .catch(console.error);
  }, []);

  const active = useMemo(() => tabs.find((tab) => tab.id === activeTab) || tabs[0], [activeTab]);
  const ActiveIcon = active.icon;
  const filteredProperties = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return properties.filter((property) => {
      if (lower) {
        const matchesText = [
          property.title,
          property.locality,
          property.micro_market,
          property.status,
          property.builder,
          property.description,
          `${property.bedrooms}bhk`,
          `${property.bedrooms} bed`,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(lower));
        if (!matchesText) return false;
      }
      if (filters.minPrice != null && property.price < filters.minPrice) return false;
      if (filters.maxPrice != null && property.price > filters.maxPrice) return false;
      if (filters.minBeds != null && (property.bedrooms || 0) < filters.minBeds) return false;
      if (filters.propertyType && property.property_type?.toLowerCase() !== filters.propertyType) return false;
      return true;
    });
  }, [properties, query, filters]);
  const activeFilterCount = Number(filters.minPrice != null || filters.maxPrice != null) + Number(filters.minBeds != null) + Number(filters.propertyType != null);

  function toggleCompare(property: Property) {
    setCompare((items) => {
      if (items.some((p) => p.id === property.id)) {
        return items.filter((p) => p.id !== property.id);
      }
      return [...items, property].slice(-3);
    });
  }

  function updateProperties(items: Property[]) {
    setProperties(items);
    setFocused(items[0] || null);
    selectTab("search");
  }

  function selectTab(tab: TabId) {
    setActiveTab(tab);
    // Preserve the current pathname (incl. any basePath, e.g. /AIRealEstate on
    // GitHub Pages) instead of hardcoding /workspace/, which would 404 on reload.
    window.history.replaceState(null, "", `${window.location.pathname}?tab=${tab}`);
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-[1560px] flex-col px-4 py-4 md:px-6 lg:px-8">
        <header className="mb-5 overflow-hidden rounded-xl border border-ink/12 bg-ivory shadow-lx">
          <div className="border-b border-ink/10 px-5 py-4 md:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-ink/15 bg-ivory px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-sand">
                  <Home size={14} />
                  Home
                </Link>
                <Link href="/radar" className="inline-flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/8 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold hover:text-ivory">
                  <RadioTower size={13} />
                  Radar
                </Link>
                <Link href="/broker" className="inline-flex items-center gap-2 rounded-xl border border-ink/15 bg-ivory px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-sand">
                  <Building2 size={13} />
                  Broker
                </Link>
                <Link href="/manager" className="inline-flex items-center gap-2 rounded-xl border border-ink/15 bg-ivory px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-sand">
                  <Building2 size={13} />
                  Manager
                </Link>
                <Link href="/crm" className="inline-flex items-center gap-2 rounded-xl border border-ink/15 bg-ivory px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-sand">
                  <GanttChartSquare size={13} />
                  CRM
                </Link>
              </div>
              <span className="inline-flex items-center gap-2 rounded-xl bg-gold px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ivory">
                <RadioTower size={13} />
                Live listings
              </span>
            </div>
          </div>
          <div className="grid gap-0 xl:grid-cols-[1fr_420px]">
            <div className="p-5 md:p-6">
              <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-gold">ASTRA Estate Mumbai</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-5xl">
                Homes, data, and visits in one Mumbai search.
              </h1>
              <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-ink/60">
                Browse live inventory with map context, finance checks, tour planning, documents, and broker-ready follow-up panels.
              </p>
              <div className="portal-search mt-6 flex flex-col gap-2 rounded-xl border border-ink/12 bg-ivory p-2 md:flex-row md:items-center">
                <label className="flex min-h-12 flex-1 items-center gap-3 px-3 text-sm font-semibold text-ink/55">
                  <Search size={19} className="text-gold" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search locality, budget, bedrooms, market signal..."
                    className="w-full bg-transparent outline-none placeholder:text-ink/35"
                  />
                </label>
                <button onClick={() => selectTab("search")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gold px-5 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-[#1d4ed8]">
                  <Search size={16} />
                  Search
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-[12px] font-semibold text-ink/60">
                {["2BHK", "Under 5 Cr", "Sea link", "Low legal risk", "XR ready"].map((chip) => (
                  <button key={chip} onClick={() => setQuery(chip)} className="rounded-full border border-ink/12 bg-sand px-3 py-1.5 transition-colors hover:border-gold hover:bg-gold/10 hover:text-gold">
                    {chip}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid border-t border-ink/12 bg-[#f8fafc] text-ink sm:grid-cols-3 xl:border-l xl:border-t-0">
              <Metric label="Inventory" value={String(properties.length || "-")} />
              <Metric label="Shortlist" value={String(compare.length)} />
              <Metric label="Focus" value={focused ? formatCr(focused.price) : "-"} />
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-5 xl:grid-cols-[286px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <nav className="rounded-xl border border-ink/12 bg-ivory p-2 shadow-lx">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const selected = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    onClick={() => selectTab(tab.id)}
                    className={clsx(
                      "group mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors last:mb-0",
                      selected
                        ? "bg-ink text-ivory"
                        : "text-ink/60 hover:bg-sand hover:text-ink"
                    )}
                  >
                    <span className={clsx("grid h-9 w-9 shrink-0 place-items-center rounded-xl", selected ? "bg-gold text-ivory" : "border border-ink/15 bg-ivory text-ink/70")}>
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{String(index + 1).padStart(2, "0")} / {tab.label}</span>
                      <span className={clsx("mt-0.5 block truncate text-[11px] font-medium", selected ? "text-ivory/55" : "text-ink/45")}>
                        {tab.description}
                      </span>
                    </span>
                    <ChevronRight size={15} className={clsx(selected ? "text-ivory/55" : "text-ink/25 group-hover:text-gold")} />
                  </button>
                );
              })}
            </nav>

            <FocusedProperty property={focused} />
            <AvailabilityTicker />
          </aside>

          <section className="min-w-0">
            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-ink/12 bg-ivory px-4 py-4 shadow-lx lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gold text-ivory">
                  <ActiveIcon size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-px w-8 bg-gold" />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">Current workflow</p>
                  </div>
                  <h2 className="lx-display mt-1 text-3xl font-light leading-none text-ink">{active.label}</h2>
                </div>
              </div>
              <p className="max-w-2xl text-sm font-medium leading-6 text-ink/55">{active.description}</p>
            </div>

            {activeTab === "search" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <FilterBar filters={filters} setFilters={setFilters} activeCount={activeFilterCount} />
                  <button
                    onClick={() => setShowAiSearch((value) => !value)}
                    className={clsx(
                      "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] transition-colors",
                      showAiSearch ? "border-gold bg-gold text-ivory" : "border-ink/15 bg-ivory text-ink hover:bg-sand"
                    )}
                  >
                    <Sparkles size={14} />
                    Ask AI agent
                  </button>
                </div>

                {showAiSearch && <AgentConsole onProperties={updateProperties} />}

                <div className="grid gap-5 2xl:grid-cols-[460px_1fr]">
                  <div className="max-h-[calc(100vh-260px)] min-h-[420px] overflow-y-auto pr-1">
                    <InventoryRail properties={filteredProperties} focused={focused} compare={compare} onCompare={toggleCompare} onFocus={setFocused} />
                  </div>
                  <div className="hidden 2xl:block">
                    <div className="sticky top-4">
                      <PropertyMap properties={filteredProperties} focused={focused} onFocus={setFocused} compact heightClassName="h-[calc(100vh-260px)] min-h-[420px]" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "market" && (
              <div className="space-y-5">
                <MarketDashboard />
                <InventoryGrid properties={filteredProperties} compare={compare} onCompare={toggleCompare} onFocus={setFocused} compact />
              </div>
            )}

            {activeTab === "finance" && (
              <div className="grid gap-5 xl:grid-cols-[440px_1fr]">
                <FinancePanel focused={focused} />
                <InventoryRail properties={filteredProperties} focused={focused} compare={compare} onCompare={toggleCompare} onFocus={setFocused} />
              </div>
            )}

            {activeTab === "tour" && (
              <div className="grid gap-5 xl:grid-cols-[440px_1fr]">
                <TourGuidePanel focused={focused} />
                <PropertyMap properties={filteredProperties} focused={focused} onFocus={setFocused} />
              </div>
            )}

            {activeTab === "channels" && <ChannelAgentsPanel focused={focused} />}

            {activeTab === "documents" && <DocumentAndNegotiation />}

            {activeTab === "agents" && (
              <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
                <AgentConsole onProperties={updateProperties} />
                <AgentSwarmPanel />
              </div>
            )}
          </section>
        </div>
      </div>
      <CompareDrawer items={compare} onClear={() => setCompare([])} />
    </main>
  );
}

function FilterBar({
  filters,
  setFilters,
  activeCount,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  activeCount: number;
}) {
  const [open, setOpen] = useState<"price" | "beds" | "type" | null>(null);
  const priceLabel =
    filters.minPrice != null && filters.maxPrice != null
      ? `${formatCr(filters.minPrice)} - ${formatCr(filters.maxPrice)}`
      : filters.maxPrice != null
      ? `Under ${formatCr(filters.maxPrice)}`
      : filters.minPrice != null
      ? `${formatCr(filters.minPrice)}+`
      : "Price";
  const bedsLabel = filters.minBeds != null ? `${filters.minBeds}+ beds` : "Beds";
  const typeLabel = filters.propertyType ? filters.propertyType[0].toUpperCase() + filters.propertyType.slice(1) : "Home type";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {open && <div className="fixed inset-0 z-20" onClick={() => setOpen(null)} />}

      <div className="relative">
        <FilterPill label={priceLabel} active={filters.minPrice != null || filters.maxPrice != null} open={open === "price"} onClick={() => setOpen(open === "price" ? null : "price")} />
        {open === "price" && (
          <div className="absolute left-0 top-full z-30 mt-2 w-72 rounded-xl border border-ink/12 bg-ivory p-4 shadow-lx">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/45">Price range</p>
            <div className="grid grid-cols-2 gap-2">
              {PRICE_PRESETS.map((preset) => {
                const selected = filters.minPrice === preset.min && filters.maxPrice === preset.max;
                return (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setFilters((f) => ({ ...f, minPrice: preset.min, maxPrice: preset.max }));
                      setOpen(null);
                    }}
                    className={clsx("rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-colors", selected ? "border-gold bg-gold/10 text-gold" : "border-ink/12 text-ink/70 hover:bg-sand")}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => {
                setFilters((f) => ({ ...f, minPrice: null, maxPrice: null }));
                setOpen(null);
              }}
              className="mt-3 text-xs font-semibold text-ink/50 hover:text-gold"
            >
              Clear price
            </button>
          </div>
        )}
      </div>

      <div className="relative">
        <FilterPill label={bedsLabel} active={filters.minBeds != null} open={open === "beds"} onClick={() => setOpen(open === "beds" ? null : "beds")} />
        {open === "beds" && (
          <div className="absolute left-0 top-full z-30 mt-2 w-64 rounded-xl border border-ink/12 bg-ivory p-4 shadow-lx">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/45">Minimum bedrooms</p>
            <div className="flex flex-wrap gap-2">
              {BED_OPTIONS.map((n) => {
                const selected = filters.minBeds === n;
                return (
                  <button
                    key={n}
                    onClick={() => {
                      setFilters((f) => ({ ...f, minBeds: selected ? null : n }));
                      setOpen(null);
                    }}
                    className={clsx("grid h-11 w-11 place-items-center rounded-xl border text-sm font-semibold transition-colors", selected ? "border-gold bg-gold text-ivory" : "border-ink/12 text-ink/70 hover:bg-sand")}
                  >
                    {n}+
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <FilterPill label={typeLabel} active={Boolean(filters.propertyType)} open={open === "type"} onClick={() => setOpen(open === "type" ? null : "type")} />
        {open === "type" && (
          <div className="absolute left-0 top-full z-30 mt-2 w-56 rounded-xl border border-ink/12 bg-ivory p-2 shadow-lx">
            {TYPE_OPTIONS.map((type) => {
              const selected = filters.propertyType === type;
              return (
                <button
                  key={type}
                  onClick={() => {
                    setFilters((f) => ({ ...f, propertyType: selected ? null : type }));
                    setOpen(null);
                  }}
                  className={clsx("flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold capitalize transition-colors", selected ? "bg-gold/10 text-gold" : "text-ink/70 hover:bg-sand")}
                >
                  {type}
                  {selected && <Check size={15} />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {activeCount > 0 && (
        <button
          onClick={() => setFilters(EMPTY_FILTERS)}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-[12px] font-semibold text-ink/50 transition-colors hover:text-gold"
        >
          <X size={14} />
          Clear all ({activeCount})
        </button>
      )}
    </div>
  );
}

function FilterPill({ label, active, open, onClick }: { label: string; active: boolean; open: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "relative z-30 inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-[12px] font-semibold transition-colors",
        active || open ? "border-gold bg-gold/10 text-gold" : "border-ink/15 bg-ivory text-ink/70 hover:bg-sand"
      )}
    >
      <SlidersHorizontal size={13} />
      {label}
      <ChevronDown size={14} className={clsx("transition-transform", open && "rotate-180")} />
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-ink/10 p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="text-3xl font-bold leading-none text-ink">{value}</p>
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/50">{label}</p>
    </div>
  );
}

function FocusedProperty({ property }: { property: Property | null }) {
  return (
    <section className="rounded-xl border border-ink/12 bg-ivory p-4 shadow-lx">
      <div className="mb-3 flex items-center gap-2">
        <Building2 size={16} className="text-gold" />
        <p className="lx-display text-lg font-light text-ink">Focused property</p>
      </div>
      {property ? (
        <div>
          <p className="lx-display text-base font-light leading-tight text-ink">{property.title}</p>
          <p className="mt-1 text-[13px] font-medium text-ink/50">{property.locality}, Mumbai</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <Info label="Price" value={formatCr(property.price)} />
            <Info label="Type" value={`${property.bedrooms}BHK`} />
            <Info label="Area" value={`${property.area_sqft} sq ft`} />
            <Info label="Status" value={property.status} />
          </div>
        </div>
      ) : (
        <p className="text-sm leading-6 text-ink/50">Select a property to sync finance, map, and tour workflows.</p>
      )}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink/12 bg-ivory p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/40">{label}</p>
      <p className="mt-1 font-semibold text-ink">{value}</p>
    </div>
  );
}

function InventoryGrid({
  properties,
  compare,
  onCompare,
  onFocus,
  compact,
}: {
  properties: Property[];
  compare: Property[];
  onCompare: (property: Property) => void;
  onFocus: (property: Property) => void;
  compact?: boolean;
}) {
  return (
    <section className="min-w-0">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-px w-8 bg-gold" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">Recommended inventory</p>
          </div>
          <h3 className="lx-display mt-1 text-3xl font-light leading-none text-ink">Ranked property matches</h3>
        </div>
        <p className="rounded-xl bg-ink px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ivory">{properties.length} listings</p>
      </div>
      <div className={clsx("grid gap-4", compact ? "lg:grid-cols-3" : "lg:grid-cols-2 2xl:grid-cols-3")}>
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            selected={compare.some((p) => p.id === property.id)}
            onCompare={onCompare}
            onFocus={onFocus}
          />
        ))}
      </div>
    </section>
  );
}

function InventoryRail({
  properties,
  focused,
  compare,
  onCompare,
  onFocus,
}: {
  properties: Property[];
  focused: Property | null;
  compare: Property[];
  onCompare: (property: Property) => void;
  onFocus: (property: Property) => void;
}) {
  return (
    <aside className="space-y-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="h-px w-8 bg-gold" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">Inventory rail</p>
        </div>
        <h3 className="lx-display mt-1 text-3xl font-light leading-none text-ink">Active listings</h3>
      </div>
      <div className="grid gap-3">
        {properties.map((property) => {
          const selected = focused?.id === property.id;
          const compared = compare.some((p) => p.id === property.id);
          return (
            <div
              key={property.id}
              className={clsx(
                "rounded-xl border bg-ivory p-4 text-left shadow-lx transition-colors",
                selected ? "border-gold" : "border-ink/12 hover:border-gold/50"
              )}
            >
              <button onClick={() => onFocus(property)} className="w-full text-left">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="lx-display text-lg font-light leading-tight text-ink">{property.title}</p>
                    <p className="mt-1 text-[13px] font-medium text-ink/50">{property.locality} · {formatCr(property.price)}</p>
                  </div>
                  <span className="rounded-full border border-ink/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/50">
                    {property.status}
                  </span>
                </div>
              </button>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-[11px] font-medium text-ink/45">
                  {property.bedrooms}BHK · {property.area_sqft} sq ft · ReDev {Math.round(property.redevelopment_score || 0)}/100
                </p>
                <button
                  onClick={() => onCompare(property)}
                  className={clsx(
                    "rounded-xl border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors",
                    compared ? "border-gold bg-gold text-ivory" : "border-ink/15 bg-ivory text-ink hover:bg-sand"
                  )}
                >
                  {compared ? "Added" : "Compare"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
