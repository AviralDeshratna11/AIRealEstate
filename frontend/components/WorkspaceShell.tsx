"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  Bot,
  Building2,
  CalendarClock,
  FileText,
  Home,
  IndianRupee,
  LayoutGrid,
  Map,
  MessagesSquare,
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
  { id: "search", label: "Search", description: "Client intent, ranked inventory, shortlist", icon: LayoutGrid },
  { id: "market", label: "Market", description: "Inventory, liquidity, redevelopment signals", icon: TrendingUp },
  { id: "map", label: "Map", description: "Locality pins and selected property context", icon: Map },
  { id: "finance", label: "Finance", description: "EMI, affordability, material estimates", icon: IndianRupee },
  { id: "tour", label: "Tours", description: "Viewing routes and availability workflow", icon: CalendarClock },
  { id: "channels", label: "Channels", description: "WhatsApp, calls, booking, availability", icon: MessagesSquare },
  { id: "documents", label: "Docs & Deals", description: "Extraction and negotiation automation", icon: FileText },
  { id: "agents", label: "Agents", description: "Swarm routing and operating model", icon: Bot },
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
    window.history.replaceState(null, "", `/workspace/?tab=${tab}`);
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-4 py-5 md:px-6 lg:px-8">
        <header className="mb-5 border-b border-slate-200 pb-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-estate-700">
                ASTRA Estate Mumbai
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
                Real-estate command workspace
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
                Dedicated workflows for search, market intelligence, maps, finance, tours, documents, negotiation, and agent operations.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Inventory" value={String(properties.length || "-")} />
              <Metric label="Shortlist" value={String(compare.length)} />
              <Metric label="Focus" value={focused ? formatCr(focused.price) : "-"} />
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-5 xl:grid-cols-[300px_1fr]">
          <aside className="space-y-4">
            <nav className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
              <Link
                href="/"
                className="mb-2 flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                title="Return home"
              >
                <Home size={18} className="shrink-0" />
                <span>
                  <span className="block text-sm font-black">Home</span>
                  <span className="mt-0.5 block text-xs leading-4 text-slate-500">Return to command home</span>
                </span>
              </Link>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const selected = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    onClick={() => selectTab(tab.id)}
                    className={clsx(
                      "flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition",
                      selected
                        ? "bg-slate-950 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                    )}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span>
                      <span className="block text-sm font-black">{tab.label}</span>
                      <span className={clsx("mt-0.5 block text-xs leading-4", selected ? "text-slate-300" : "text-slate-500")}>
                        {tab.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>

            <FocusedProperty property={focused} />
            <AvailabilityTicker />
          </aside>

          <section className="min-w-0">
            <div className="mb-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-estate-50 text-estate-700">
                  <ActiveIcon size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Current workflow</p>
                  <h2 className="text-xl font-black text-slate-950">{active.label}</h2>
                </div>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-slate-500">{active.description}</p>
            </div>

            {activeTab === "search" && (
              <div className="grid gap-5 2xl:grid-cols-[390px_1fr]">
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
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
    </div>
  );
}

function FocusedProperty({ property }: { property: Property | null }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Building2 size={17} className="text-estate-700" />
        <p className="text-sm font-black text-slate-950">Focused property</p>
      </div>
      {property ? (
        <div>
          <p className="text-base font-black leading-tight text-slate-950">{property.title}</p>
          <p className="mt-1 text-sm text-slate-500">{property.locality}, Mumbai</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <Info label="Price" value={formatCr(property.price)} />
            <Info label="Type" value={`${property.bedrooms}BHK`} />
            <Info label="Area" value={`${property.area_sqft} sq ft`} />
            <Info label="Status" value={property.status} />
          </div>
        </div>
      ) : (
        <p className="text-sm leading-6 text-slate-500">Select a property to keep finance, map, and tour workflows in sync.</p>
      )}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 font-black text-slate-950">{value}</p>
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
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-estate-700">Recommended inventory</p>
          <h3 className="text-2xl font-black text-slate-950">Ranked property matches</h3>
        </div>
        <p className="text-sm font-bold text-slate-400">{properties.length} listings</p>
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
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-estate-700">Inventory rail</p>
        <h3 className="text-2xl font-black text-slate-950">Active listings</h3>
      </div>
      <div className="grid gap-3">
        {properties.map((property) => {
          const selected = focused?.id === property.id;
          return (
            <div
              key={property.id}
              className={clsx(
                "rounded-lg border bg-white p-4 text-left shadow-sm transition",
                selected ? "border-slate-950 ring-2 ring-slate-950/10" : "border-slate-200 hover:border-estate-500"
              )}
            >
              <button onClick={() => onFocus(property)} className="w-full text-left">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black leading-tight text-slate-950">{property.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{property.locality} - {formatCr(property.price)}</p>
                  </div>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-black uppercase text-slate-500">
                    {property.status}
                  </span>
                </div>
              </button>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-slate-400">
                  {property.bedrooms}BHK - {property.area_sqft} sq ft - ReDev {Math.round(property.redevelopment_score || 0)}/100
                </p>
                <button
                  onClick={() => onCompare(property)}
                  className={clsx(
                    "rounded-md px-3 py-1.5 text-xs font-black",
                    compare.some((p) => p.id === property.id) ? "bg-estate-700 text-white" : "bg-slate-100 text-slate-700"
                  )}
                >
                  {compare.some((p) => p.id === property.id) ? "Added" : "Compare"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
