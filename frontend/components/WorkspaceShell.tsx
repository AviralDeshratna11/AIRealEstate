"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  Bot,
  Building2,
  CalendarClock,
  ChevronRight,
  FileText,
  GanttChartSquare,
  Home,
  IndianRupee,
  LayoutGrid,
  Map,
  MessagesSquare,
  RadioTower,
  TrendingUp,
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

type TabId = "search" | "market" | "map" | "finance" | "tour" | "channels" | "documents" | "agents";

const tabs: Array<{
  id: TabId;
  label: string;
  description: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}> = [
  { id: "search", label: "Search", description: "Intent, ranking, shortlist", icon: LayoutGrid },
  { id: "market", label: "Market", description: "Inventory and redevelopment", icon: TrendingUp },
  { id: "map", label: "Map", description: "Pins, locality, focus", icon: Map },
  { id: "finance", label: "Finance", description: "EMI and materials", icon: IndianRupee },
  { id: "tour", label: "Tours", description: "Viewing route control", icon: CalendarClock },
  { id: "channels", label: "Channels", description: "WhatsApp, calls, slots", icon: MessagesSquare },
  { id: "documents", label: "Docs & Deals", description: "Extraction and offers", icon: FileText },
  { id: "agents", label: "Agents", description: "Swarm operations", icon: Bot },
];

export function WorkspaceShell() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [focused, setFocused] = useState<Property | null>(null);
  const [compare, setCompare] = useState<Property[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("search");

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
    <main className="min-h-screen bg-ivory text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-[1560px] flex-col px-4 py-4 md:px-6 lg:px-8">
        <header className="mb-5 overflow-hidden rounded-[3px] border border-ink/12 bg-ivory shadow-lx">
          <div className="grid gap-0 xl:grid-cols-[1fr_520px]">
            <div className="p-5 md:p-6">
              <div className="mb-8 flex items-center justify-between gap-4">
                <Link href="/" className="inline-flex items-center gap-2 rounded-[3px] border border-ink/15 bg-ivory px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-sand">
                  <Home size={14} />
                  Home
                </Link>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Link href="/manager" className="inline-flex items-center gap-2 rounded-[3px] border border-ink/15 bg-ivory px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-sand">
                    <Building2 size={13} />
                    Manager portal
                  </Link>
                  <Link href="/crm" className="inline-flex items-center gap-2 rounded-[3px] border border-ink/15 bg-ivory px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-sand">
                    <GanttChartSquare size={13} />
                    Sales OS
                  </Link>
                  <span className="inline-flex items-center gap-2 rounded-[3px] bg-gold px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ivory">
                    <RadioTower size={13} />
                    Live desk
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-gold" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-gold">ASTRA Estate Mumbai</span>
              </div>
              <h1 className="lx-display mt-5 text-4xl font-light leading-[0.98] tracking-tight text-ink md:text-6xl">
                Real-estate command workspace
              </h1>
              <p className="mt-5 max-w-3xl text-base font-medium leading-7 text-ink/60">
                One operator surface for ranked inventory, maps, finance, viewings, lead channels, documents, and deal strategy.
              </p>
            </div>
            <div className="grid border-t border-ink/12 bg-espresso text-ivory sm:grid-cols-3 xl:border-l xl:border-t-0">
              <Metric label="Inventory" value={String(properties.length || "-")} />
              <Metric label="Shortlist" value={String(compare.length)} />
              <Metric label="Focus" value={focused ? formatCr(focused.price) : "-"} />
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-5 xl:grid-cols-[286px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <nav className="rounded-[3px] border border-ink/12 bg-ivory p-2 shadow-lx">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const selected = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    onClick={() => selectTab(tab.id)}
                    className={clsx(
                      "group mb-1 flex w-full items-center gap-3 rounded-[3px] px-3 py-3 text-left transition-colors last:mb-0",
                      selected
                        ? "bg-ink text-ivory"
                        : "text-ink/60 hover:bg-sand hover:text-ink"
                    )}
                  >
                    <span className={clsx("grid h-9 w-9 shrink-0 place-items-center rounded-[3px]", selected ? "bg-gold text-ivory" : "border border-ink/15 bg-ivory text-ink/70")}>
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
            <div className="mb-4 flex flex-col gap-3 rounded-[3px] border border-ink/12 bg-ivory px-4 py-4 shadow-lx lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-[3px] bg-gold text-ivory">
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
              <div className="grid gap-5 2xl:grid-cols-[410px_1fr]">
                <AgentConsole onProperties={updateProperties} />
                <InventoryGrid properties={properties} compare={compare} onCompare={toggleCompare} onFocus={setFocused} />
              </div>
            )}

            {activeTab === "market" && (
              <div className="space-y-5">
                <MarketDashboard />
                <InventoryGrid properties={properties} compare={compare} onCompare={toggleCompare} onFocus={setFocused} compact />
              </div>
            )}

            {activeTab === "map" && (
              <div className="grid gap-5 2xl:grid-cols-[1fr_420px]">
                <PropertyMap properties={properties} focused={focused} onFocus={setFocused} />
                <InventoryRail properties={properties} focused={focused} compare={compare} onCompare={toggleCompare} onFocus={setFocused} />
              </div>
            )}

            {activeTab === "finance" && (
              <div className="grid gap-5 xl:grid-cols-[440px_1fr]">
                <FinancePanel focused={focused} />
                <InventoryRail properties={properties} focused={focused} compare={compare} onCompare={toggleCompare} onFocus={setFocused} />
              </div>
            )}

            {activeTab === "tour" && (
              <div className="grid gap-5 xl:grid-cols-[440px_1fr]">
                <TourGuidePanel focused={focused} />
                <PropertyMap properties={properties} focused={focused} onFocus={setFocused} />
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-ivory/12 p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="lx-display text-3xl font-light leading-none text-ivory">{value}</p>
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ivory/50">{label}</p>
    </div>
  );
}

function FocusedProperty({ property }: { property: Property | null }) {
  return (
    <section className="rounded-[3px] border border-ink/12 bg-ivory p-4 shadow-lx">
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
    <div className="rounded-[3px] border border-ink/12 bg-ivory p-3">
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
        <p className="rounded-[3px] bg-ink px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ivory">{properties.length} listings</p>
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
                "rounded-[3px] border bg-ivory p-4 text-left shadow-lx transition-colors",
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
                    "rounded-[3px] border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors",
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
