"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  IndianRupee,
  Map,
  MessageCircle,
  RadioTower,
  Route,
  SatelliteDish,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { DEMO_MARKET_INSIGHTS, DEMO_PROPERTIES } from "@/lib/demo";
import { formatCr, formatInr } from "@/lib/api";

const workflows = [
  { title: "Search", href: "/workspace/?tab=search", icon: Building2, copy: "Natural-language buyer intent becomes a ranked Mumbai shortlist." },
  { title: "Market", href: "/workspace/?tab=market", icon: TrendingUp, copy: "Inventory, liquidity, and redevelopment signals drive the position." },
  { title: "Map", href: "/workspace/?tab=map", icon: Map, copy: "Locality pins keep every deal anchored to actual Mumbai context." },
  { title: "Finance", href: "/workspace/?tab=finance", icon: IndianRupee, copy: "EMI, down payment, and construction material estimates stay visible." },
  { title: "Tours", href: "/workspace/?tab=tour", icon: CalendarClock, copy: "AI viewing routes convert shortlist energy into site visits." },
  { title: "Channels", href: "/workspace/?tab=channels", icon: MessageCircle, copy: "WhatsApp, call triage, slot lookup, and booking handoff in one lane." },
  { title: "Docs & Deals", href: "/workspace/?tab=documents", icon: FileText, copy: "Document extraction and negotiation logic protect the transaction." },
  { title: "Agents", href: "/workspace/?tab=agents", icon: Bot, copy: "Ten specialist agents route the broker desk without losing context." },
];

const signalStats = [
  ["10", "agent roles"],
  ["8", "workflows"],
  ["910", "DA signals"],
  ["0", "setup friction"],
];

const movingTape = [
  "Powai viewing slot opened",
  "Andheri metro match ranked up",
  "Bandra redevelopment signal active",
  "Worli negotiation leverage flagged",
  "Cal.com slots ready",
  "Document agent standing by",
];

export function LandingPage() {
  const [activeId, setActiveId] = useState(DEMO_PROPERTIES[1].id);
  const [cursor, setCursor] = useState({ x: 50, y: 45 });
  const active = useMemo(
    () => DEMO_PROPERTIES.find((property) => property.id === activeId) || DEMO_PROPERTIES[0],
    [activeId]
  );

  return (
    <main className="min-h-screen overflow-hidden text-ink">
      <section
        className="relative min-h-[92svh] overflow-hidden bg-ink text-[#fffaf0]"
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setCursor({
            x: Math.round(((event.clientX - rect.left) / rect.width) * 100),
            y: Math.round(((event.clientY - rect.top) / rect.height) * 100),
          });
        }}
      >
        <Image
          src={active.image_url || DEMO_PROPERTIES[0].image_url || ""}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-70 transition duration-700"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(25,23,19,0.92),rgba(25,23,19,0.58)_48%,rgba(25,23,19,0.18)),linear-gradient(180deg,rgba(25,23,19,0.12),rgba(25,23,19,0.82))]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background: `radial-gradient(circle at ${cursor.x}% ${cursor.y}%, rgba(255,250,240,0.18), transparent 18%)`,
          }}
        />
        <div className="absolute inset-0 opacity-45">
          <div className="hero-grid h-full w-full" />
        </div>
        <MovingRoute />

        <div className="relative z-10 mx-auto flex min-h-[92svh] w-full max-w-[1560px] flex-col px-4 py-4 md:px-6 lg:px-8">
          <nav className="flex items-center justify-between border-b border-white/18 pb-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-md bg-[#fffaf0] text-ink shadow-crisp">
                <Sparkles size={19} />
              </div>
              <div>
                <p className="font-display text-2xl font-black">ASTRA Estate</p>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f1b24a]">Mumbai Deal Room</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/workspace"
                className="inline-flex items-center gap-2 rounded-md bg-coral px-3 py-2 text-sm font-black text-white shadow-crisp transition hover:-translate-y-0.5 sm:px-4"
              >
                <span className="hidden sm:inline">Open workspace</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/broker"
                aria-label="Broker portal"
                className="inline-flex items-center gap-2 rounded-md border border-white/22 bg-white/10 px-3 py-2 text-sm font-black text-[#fffaf0] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/18"
              >
                <BriefcaseBusiness size={16} />
                <span className="hidden lg:inline">Broker portal</span>
              </Link>
              <Link
                href="/manager"
                aria-label="Manager portal"
                className="inline-flex items-center gap-2 rounded-md border border-white/22 bg-white/10 px-3 py-2 text-sm font-black text-[#fffaf0] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/18"
              >
                <Building2 size={16} />
                <span className="hidden lg:inline">Manager portal</span>
              </Link>
            </div>
          </nav>

          <div className="grid flex-1 content-center gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="max-w-5xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-white/18 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] backdrop-blur">
                <SatelliteDish size={15} className="text-[#f1b24a]" />
                Live broker operating system
              </div>
              <h1 className="font-display text-5xl font-black leading-[0.95] md:text-7xl lg:text-8xl">
                Move every Mumbai property deal from first ping to signed counter.
              </h1>
              <p className="mt-6 max-w-3xl text-lg font-semibold leading-8 text-white/72">
                ASTRA Estate is a multi-agent command floor for brokers and buyers: ranked search, market
                intelligence, finance, tours, document review, channel automation, and negotiation.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/workspace"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-coral px-5 py-3 text-sm font-black text-white shadow-crisp transition hover:-translate-y-0.5"
                >
                  Launch command desk
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/workspace/?tab=map"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-white/22 bg-white/10 px-5 py-3 text-sm font-black text-[#fffaf0] backdrop-blur transition hover:bg-white/18"
                >
                  Track Mumbai map
                  <Map size={16} />
                </Link>
              </div>
            </div>

            <SignalBoard activeId={activeId} setActiveId={setActiveId} />
          </div>

          <div className="mb-[-1px] grid gap-3 border-t border-white/18 pt-4 sm:grid-cols-4">
            {signalStats.map(([value, label]) => (
              <div key={label} className="rounded-lg border border-white/14 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="font-display text-3xl font-black">{value}</p>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/48">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ticker-strip border-y border-ink/15 bg-[#fffaf0] py-3">
        <div className="ticker-track flex min-w-max gap-3 text-sm font-black uppercase tracking-[0.14em] text-ink/62">
          {[...movingTape, ...movingTape].map((item, index) => (
            <span key={`${item}-${index}`} className="inline-flex items-center gap-3">
              <RadioTower size={15} className="text-coral" />
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1560px] gap-5 px-4 py-8 md:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <DealPulse active={active} />
        <WorkflowGrid />
      </section>

      <section className="mx-auto grid w-full max-w-[1560px] gap-5 px-4 pb-10 md:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <MarketMotion />
        <AgentOrbit />
      </section>
    </main>
  );
}

function SignalBoard({
  activeId,
  setActiveId,
}: {
  activeId: string;
  setActiveId: (id: string) => void;
}) {
  return (
    <div className="self-end rounded-lg border border-white/18 bg-ink/58 p-4 shadow-soft backdrop-blur">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#f1b24a]">Mandate selector</p>
          <h2 className="font-display text-3xl font-black leading-none text-[#fffaf0]">Live Mumbai signals</h2>
        </div>
        <ShieldCheck className="text-[#f1b24a]" size={26} />
      </div>
      <div className="grid gap-3">
        {DEMO_PROPERTIES.map((property, index) => {
          const active = property.id === activeId;
          return (
            <button
              key={property.id}
              onClick={() => setActiveId(property.id)}
              className={`group rounded-md border p-3 text-left transition ${
                active ? "border-coral bg-coral text-white shadow-crisp" : "border-white/14 bg-white/9 text-white/76 hover:border-[#f1b24a] hover:bg-white/14"
              }`}
            >
              <span className="flex items-start justify-between gap-3">
                <span>
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] opacity-70">Signal {String(index + 1).padStart(2, "0")}</span>
                  <span className="mt-1 block font-black">{property.locality}</span>
                  <span className="mt-1 block text-xs font-semibold opacity-70">{property.bedrooms}BHK - {formatCr(property.price)}</span>
                </span>
                <span className={`h-3 w-3 rounded-full ${active ? "bg-white" : "bg-[#f1b24a]"} signal-pulse`} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MovingRoute() {
  const points = [
    { label: "Bandra", x: "73%", y: "32%" },
    { label: "Andheri", x: "82%", y: "44%" },
    { label: "Powai", x: "70%", y: "58%" },
    { label: "Worli", x: "86%", y: "70%" },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 hidden lg:block">
      <div className="route-line" />
      <div className="route-train">
        <Route size={16} />
      </div>
      {points.map((point, index) => (
        <div
          key={point.label}
          className="absolute"
          style={{ left: point.x, top: point.y, animationDelay: `${index * 180}ms` }}
        >
          <span className="signal-ring" />
          <span className="relative rounded-md bg-[#fffaf0] px-2 py-1 text-xs font-black text-ink shadow-crisp">
            {point.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function DealPulse({ active }: { active: (typeof DEMO_PROPERTIES)[number] }) {
  return (
    <section className="glass rounded-lg p-5 shadow-soft">
      <p className="section-kicker">Active deal pulse</p>
      <h2 className="mt-2 font-display text-4xl font-black leading-none text-ink">{active.title}</h2>
      <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-ink/62">{active.description}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricTile icon={CircleDollarSign} label="Mandate value" value={formatCr(active.price)} />
        <MetricTile icon={ClipboardCheck} label="Availability" value={active.availability} />
        <MetricTile icon={TrendingUp} label="Redevelopment score" value={`${Math.round(active.redevelopment_score || 0)}/100`} />
        <MetricTile icon={IndianRupee} label="EMI estimate" value={formatInr(active.monthly_emi_estimate)} />
      </div>
    </section>
  );
}

function WorkflowGrid() {
  return (
    <section className="grid gap-3 sm:grid-cols-2">
      {workflows.map((workflow, index) => {
        const Icon = workflow.icon;
        return (
          <Link
            key={workflow.title}
            href={workflow.href}
            className="workflow-card group rounded-lg border border-ink/15 bg-[#fffaf0]/88 p-4 shadow-sm transition hover:-translate-y-1 hover:border-coral hover:bg-white"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <span className="mb-5 flex items-center justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-md bg-ink text-[#fffaf0] transition group-hover:bg-coral">
                <Icon size={19} />
              </span>
              <span className="text-xs font-black uppercase tracking-[0.14em] text-ink/35">0{index + 1}</span>
            </span>
            <span className="block font-display text-2xl font-black leading-none text-ink">{workflow.title}</span>
            <span className="mt-2 block text-sm font-semibold leading-6 text-ink/58">{workflow.copy}</span>
          </Link>
        );
      })}
    </section>
  );
}

function MarketMotion() {
  const markets = Object.entries(DEMO_MARKET_INSIGHTS.redevelopment.top_micro_markets);
  const max = Math.max(...markets.map(([, value]) => value));

  return (
    <section className="glass overflow-hidden rounded-lg p-5 shadow-soft">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="section-kicker">Redevelopment sweep</p>
          <h2 className="mt-2 font-display text-4xl font-black leading-none text-ink">Signals moving across micro-markets</h2>
        </div>
        <p className="rounded-md bg-ink px-3 py-2 text-sm font-black text-[#fffaf0]">
          {DEMO_MARKET_INSIGHTS.redevelopment.development_agreements_signed_total} DAs
        </p>
      </div>
      <div className="space-y-4">
        {markets.map(([market, value], index) => (
          <div key={market} className="market-row">
            <div className="mb-2 flex items-center justify-between text-sm font-black">
              <span>{market}</span>
              <span>{value}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-ink/10">
              <div
                className="market-bar h-full rounded-full bg-coral"
                style={{ width: `${Math.max(18, (value / max) * 100)}%`, animationDelay: `${index * 120}ms` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AgentOrbit() {
  const agents = ["Search", "Market", "Finance", "Tour", "Docs", "Calls"];

  return (
    <section className="ink-panel relative min-h-[420px] overflow-hidden rounded-lg border border-ink/15 p-5 shadow-soft">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#f1b24a]">Agent choreography</p>
      <h2 className="mt-2 max-w-md font-display text-4xl font-black leading-none text-[#fffaf0]">
        Specialist agents rotate around one active property context.
      </h2>
      <div className="absolute bottom-8 right-8 h-64 w-64 rounded-full border border-white/16">
        <div className="agent-core absolute left-1/2 top-1/2 grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#fffaf0] text-center text-xs font-black uppercase tracking-[0.12em] text-ink shadow-crisp">
          Deal context
        </div>
        {agents.map((agent, index) => (
          <div key={agent} className="agent-orbit" style={{ animationDelay: `${index * -2}s` }}>
            <span>{agent}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CircleDollarSign;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-ink/12 bg-white/62 p-4">
      <div className="mb-3 flex items-center justify-between">
        <Icon size={18} className="text-coral" />
        <span className="h-2 w-2 rounded-full bg-peacock signal-pulse" />
      </div>
      <p className="text-xs font-black uppercase tracking-[0.13em] text-ink/40">{label}</p>
      <p className="mt-1 text-lg font-black leading-tight text-ink">{value}</p>
    </div>
  );
}
