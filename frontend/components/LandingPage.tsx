"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  FileText,
  GanttChartSquare,
  IndianRupee,
  Map as MapIcon,
  MessageCircle,
  Radar,
  TrendingUp,
} from "lucide-react";
import { DEMO_MARKET_INSIGHTS, DEMO_PROPERTIES } from "@/lib/demo";
import { formatCr, formatInr } from "@/lib/api";

type Property = (typeof DEMO_PROPERTIES)[number];

const navLinks = [
  { label: "Workspace", href: "/workspace" },
  { label: "Radar", href: "/radar" },
  { label: "Sales OS", href: "/crm" },
  { label: "Market", href: "/workspace/?tab=market" },
  { label: "Brokers", href: "/broker" },
  { label: "Managers", href: "/manager" },
];

const heroStats = [
  { value: "10", label: "Specialist agents" },
  { value: "08", label: "Connected workflows" },
  { value: "910", label: "Redevelopment signals" },
];

const workflows = [
  { title: "Search", href: "/workspace/?tab=search", icon: Building2, copy: "Natural-language buyer intent becomes a ranked Mumbai shortlist." },
  { title: "Market", href: "/workspace/?tab=market", icon: TrendingUp, copy: "Inventory, liquidity, and redevelopment signals shape the position." },
  { title: "Map", href: "/workspace/?tab=map", icon: MapIcon, copy: "Locality pins keep every mandate anchored to its true context." },
  { title: "Redevelopment Radar", href: "/radar", icon: Radar, copy: "Evidence-backed Future Scores reveal where Mumbai is going next — infra, redevelopment, zoning." },
  { title: "Finance", href: "/workspace/?tab=finance", icon: IndianRupee, copy: "EMI, down payment, and construction estimates stay legible." },
  { title: "Tours", href: "/workspace/?tab=tour", icon: CalendarClock, copy: "AI viewing routes turn shortlist energy into scheduled site visits." },
  { title: "Channels", href: "/workspace/?tab=channels", icon: MessageCircle, copy: "WhatsApp, call triage, slot lookup, and booking handoff in one lane." },
  { title: "Documents", href: "/workspace/?tab=documents", icon: FileText, copy: "Extraction and negotiation logic quietly protect the transaction." },
  { title: "Agents", href: "/workspace/?tab=agents", icon: Bot, copy: "Ten specialists route the desk without ever losing the thread." },
  { title: "Sales OS", href: "/crm", icon: GanttChartSquare, copy: "CRM, ERP, pipeline, leads, commissions, and reports stay one click away." },
  { title: "Broker Portal", href: "/broker", icon: BriefcaseBusiness, copy: "Partner tie-ups, buyer attribution, PropertyPool visits, and commission trails." },
  { title: "Manager Portal", href: "/manager", icon: Building2, copy: "Listing controls, approvals, audit logs, and seller-side automation." },
];

export function LandingPage() {
  const [activeId, setActiveId] = useState<string>(DEMO_PROPERTIES[1].id);
  const active = useMemo(
    () => DEMO_PROPERTIES.find((p) => p.id === activeId) ?? DEMO_PROPERTIES[0],
    [activeId]
  );
  const heroProperty = DEMO_PROPERTIES[3]; // Worli — the house signature

  return (
    <main className="min-h-screen bg-[#ffffff] font-sans text-ink antialiased selection:bg-ink selection:text-[#ffffff]">
      <SiteHeader />
      <Hero property={heroProperty} />
      <Residences active={active} activeId={activeId} setActiveId={setActiveId} />
      <Desk />
      <MarketIntelligence />
      <ClosingInvitation />
      <SiteFooter />
    </main>
  );
}

/* ----------------------------------------------------------------- */

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-[#ffffff]/85 backdrop-blur-md">
      <div className="mx-auto flex h-20 w-full max-w-[1240px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-ink/25 lx-display text-lg text-ink transition-colors group-hover:border-[#2563eb]">
            A
          </span>
          <span className="leading-none">
            <span className="lx-display text-[19px] tracking-tight text-ink">
              Astra <span className="italic text-[#2563eb]">Estate</span>
            </span>
            <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.32em] text-ink/45">
              Mumbai deal desk
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="lx-link text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/workspace"
          className="group inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ffffff] transition-colors hover:bg-[#1f2937]"
        >
          Enter workspace
          <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </header>
  );
}

/* ----------------------------------------------------------------- */

function Hero({ property }: { property: Property }) {
  return (
    <section className="relative overflow-hidden">
      <div className="lx-grain" />
      <div className="mx-auto grid w-full max-w-[1240px] items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
        <div>
          <div className="lx-rise flex items-center gap-3" style={{ animationDelay: "60ms" }}>
            <span className="h-px w-10 bg-[#2563eb]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#2563eb]">
              Multi-agent estate desk
            </span>
          </div>

          <h1
            className="lx-rise lx-display mt-7 text-[clamp(2.8rem,6vw,5.2rem)] font-light leading-[0.98] tracking-[-0.01em] text-ink"
            style={{ animationDelay: "140ms" }}
          >
            A <span className="italic text-[#2563eb]">quieter</span> way to move Mumbai property.
          </h1>

          <p
            className="lx-rise mt-7 max-w-xl text-[17px] leading-8 text-ink/65"
            style={{ animationDelay: "230ms" }}
          >
            Ranked search, market intelligence, finance, tours, document review and
            negotiation — ten specialist agents working in concert around a single
            mandate, from first enquiry to a signed counter.
          </p>

          <div className="lx-rise mt-9 flex flex-col gap-4 sm:flex-row sm:items-center" style={{ animationDelay: "320ms" }}>
            <Link
              href="/workspace"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-7 py-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#ffffff] transition-colors hover:bg-[#1f2937]"
            >
              Launch the desk
              <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              href="/workspace/?tab=map"
              className="lx-link inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-ink/70 transition-colors hover:text-ink"
            >
              Survey the Mumbai map
            </Link>
            <Link
              href="/crm"
              className="lx-link inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-ink/70 transition-colors hover:text-ink"
            >
              Open Sales OS
            </Link>
          </div>

          <dl className="lx-rise mt-14 flex flex-wrap gap-x-12 gap-y-6 border-t border-ink/12 pt-8" style={{ animationDelay: "410ms" }}>
            {heroStats.map((stat) => (
              <div key={stat.label}>
                <dt className="lx-display text-4xl font-light text-ink">{stat.value}</dt>
                <dd className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/45">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lx-rise relative" style={{ animationDelay: "260ms" }}>
          <div className="pointer-events-none absolute -inset-3 hidden rounded-xl border border-[#2563eb]/40 md:block" />
          <figure className="relative aspect-[4/5] overflow-hidden rounded-xl shadow-[0_50px_90px_-30px_rgba(17,24,39,0.45)]">
            <Image
              src={property.image_url || DEMO_PROPERTIES[0].image_url || ""}
              alt={property.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 560px"
              className="lx-ken object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/82 via-[#0f172a]/12 to-transparent" />
            <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 text-[#ffffff]">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#60a5fa]">
                  Signature residence
                </p>
                <p className="lx-display mt-2 text-2xl leading-tight">{property.locality}</p>
                <p className="mt-1 text-sm text-[#ffffff]/70">
                  {property.bedrooms} BHK · {property.micro_market}
                </p>
              </div>
              <p className="lx-display whitespace-nowrap text-2xl text-[#ffffff]">
                {formatCr(property.price)}
              </p>
            </figcaption>
            <span className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full border border-[#ffffff]/30 bg-[#0f172a]/35 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#ffffff] backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[#60a5fa]" /> Live mandate
            </span>
          </figure>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- */

function Residences({
  active,
  activeId,
  setActiveId,
}: {
  active: Property;
  activeId: string;
  setActiveId: (id: string) => void;
}) {
  const metrics = [
    { label: "Mandate value", value: formatCr(active.price) },
    { label: "Per sq ft", value: `${formatInr(active.price_per_sqft)}` },
    { label: "Configuration", value: `${active.bedrooms} BHK · ${active.area_sqft} sq ft` },
    { label: "Monthly EMI", value: formatInr(active.monthly_emi_estimate) },
    { label: "Redevelopment", value: `${Math.round(active.redevelopment_score || 0)} / 100` },
    { label: "Possession", value: active.possession },
  ];

  return (
    <section className="border-t border-ink/10">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-24 sm:px-8">
        <Reveal>
          <SectionHeading kicker="Selected residences" title="Four mandates, fully briefed." />
        </Reveal>

        <div className="mt-14 grid gap-14 lg:grid-cols-2 lg:items-start">
          <Reveal className="relative">
            <figure className="relative aspect-[5/6] overflow-hidden rounded-xl shadow-[0_40px_80px_-30px_rgba(17,24,39,0.4)]">
              <Image
                key={active.id}
                src={active.image_url || ""}
                alt={active.title}
                fill
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/55 to-transparent" />
              <figcaption className="absolute bottom-0 left-0 p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#60a5fa]">
                  {active.locality} · {active.status}
                </p>
                <p className="lx-display mt-2 max-w-sm text-2xl leading-tight text-[#ffffff]">
                  {active.title}
                </p>
              </figcaption>
            </figure>

            <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-ink/12 bg-ink/12 sm:grid-cols-4">
              {DEMO_PROPERTIES.map((property, index) => {
                const isActive = property.id === activeId;
                return (
                  <button
                    key={property.id}
                    type="button"
                    onClick={() => setActiveId(property.id)}
                    className={`relative px-4 py-4 text-left transition-colors ${
                      isActive ? "bg-ink text-[#ffffff]" : "bg-[#ffffff] text-ink/70 hover:bg-[#f3f4f6]"
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-[0.22em] opacity-60">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="lx-display mt-1.5 block text-base leading-none">
                      {property.locality}
                    </span>
                    <span className="mt-1.5 block text-[11px] font-medium opacity-65">
                      {formatCr(property.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#2563eb]">
              {active.builder} · RERA {active.rera_id}
            </p>
            <h3 className="lx-display mt-3 text-3xl font-light leading-tight text-ink sm:text-4xl">
              {active.title}
            </h3>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-ink/65">{active.description}</p>

            <dl className="mt-9 grid grid-cols-2 gap-y-8 border-t border-ink/12 pt-8">
              {metrics.map((metric) => (
                <div key={metric.label}>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink/40">
                    {metric.label}
                  </dt>
                  <dd className="lx-display mt-2 text-xl font-light text-ink">{metric.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 flex flex-wrap gap-2">
              {active.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-ink/15 px-3 py-1.5 text-[11px] font-medium text-ink/60"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link
                href={`/properties/${active.id}/`}
                className="group inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#ffffff] transition-colors hover:bg-[#1f2937]"
              >
                View intelligence
                <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link
                href={`/properties/${active.id}/xr/`}
                className="lx-link inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-ink/70 transition-colors hover:text-ink"
              >
                Open XR tour
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- */

function Desk() {
  return (
    <section className="border-t border-ink/10">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-24 sm:px-8">
        <Reveal>
          <SectionHeading
            kicker="The desk"
            title="Eight workflows, one continuous thread."
            note="Every lane below opens the live workspace — already aware of the mandate you are working."
          />
        </Reveal>

        <Reveal>
          <div className="mt-14 grid border-b border-ink/12 sm:grid-cols-2">
            {workflows.map((workflow, index) => {
              const Icon = workflow.icon;
              return (
                <Link
                  key={workflow.title}
                  href={workflow.href}
                  className="group relative flex flex-col gap-5 border-t border-ink/12 px-2 py-9 transition-colors hover:bg-[#f3f4f6]/60 sm:px-7 sm:odd:border-r sm:odd:border-ink/12"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-xl border border-ink/15 text-ink/70 transition-colors group-hover:border-[#2563eb] group-hover:text-[#2563eb]">
                      <Icon size={18} strokeWidth={1.6} />
                    </span>
                    <span className="lx-display text-2xl font-light text-ink/25 transition-colors group-hover:text-[#2563eb]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div>
                    <h3 className="lx-display flex items-center gap-2 text-2xl font-light text-ink">
                      {workflow.title}
                      <ArrowUpRight
                        size={18}
                        className="translate-y-0.5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
                      />
                    </h3>
                    <p className="mt-2 max-w-md text-[14px] leading-6 text-ink/55">{workflow.copy}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- */

function MarketIntelligence() {
  const redevelopment = DEMO_MARKET_INSIGHTS.redevelopment;
  const markets = Object.entries(redevelopment.top_micro_markets).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...markets.map(([, value]) => value));

  const figures = [
    { value: redevelopment.development_agreements_signed_total.toLocaleString("en-IN"), label: "Agreements signed" },
    { value: `${redevelopment.yoy_growth_2024_2025_pct}%`, label: "YoY growth" },
    { value: redevelopment.expected_housing_units.toLocaleString("en-IN"), label: "Expected units" },
    { value: redevelopment.land_unlocked_acres.toLocaleString("en-IN"), label: "Acres unlocked" },
  ];

  return (
    <section className="border-t border-ink/10 bg-[#f3f4f6]/45">
      <div className="mx-auto grid w-full max-w-[1240px] gap-14 px-5 py-24 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <Reveal>
          <SectionHeading
            kicker="Market intelligence"
            title="Redevelopment, read in motion."
            note={`Mumbai baseline · ${redevelopment.period}`}
          />
          <dl className="mt-12 grid grid-cols-2 gap-y-9">
            {figures.map((figure) => (
              <div key={figure.label}>
                <dt className="lx-display text-4xl font-light text-ink">{figure.value}</dt>
                <dd className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/45">
                  {figure.label}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal delay={120}>
          <MarketBars markets={markets} max={max} />
        </Reveal>
      </div>
    </section>
  );
}

function MarketBars({ markets, max }: { markets: [string, number][]; max: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="rounded-xl border border-ink/12 bg-[#ffffff] p-8 shadow-[0_30px_70px_-40px_rgba(17,24,39,0.4)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ink/45">
        Top micro-markets · development agreements
      </p>
      <div className="mt-9 space-y-7">
        {markets.map(([market, value], index) => (
          <div key={market}>
            <div className="mb-3 flex items-baseline justify-between">
              <span className="lx-display text-xl font-light text-ink">{market}</span>
              <span className="lx-display text-xl font-light text-ink/55">{value}</span>
            </div>
            <div className="h-[3px] w-full overflow-hidden rounded-full bg-ink/10">
              <div
                className="h-full rounded-full bg-[#2563eb] transition-[width] duration-[1100ms] ease-out"
                style={{
                  width: visible ? `${Math.max(14, (value / max) * 100)}%` : "0%",
                  transitionDelay: `${index * 120}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- */

function ClosingInvitation() {
  return (
    <section className="relative overflow-hidden bg-[#0f172a] text-[#ffffff]">
      <div className="lx-grain opacity-[0.06]" />
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(200,163,90,0.28), transparent 70%)" }}
      />
      <div className="relative mx-auto flex w-full max-w-[1240px] flex-col items-start gap-12 px-5 py-28 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <Reveal>
            <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#60a5fa]">
              Open the desk
            </span>
            <h2 className="lx-display mt-6 text-[clamp(2.4rem,5vw,4.2rem)] font-light leading-[1.02]">
              Ready to move your next <span className="italic text-[#60a5fa]">Mumbai</span> mandate?
            </h2>
            <p className="mt-6 max-w-xl text-[16px] leading-8 text-[#ffffff]/65">
              Step into a command floor where search, finance, tours, documents and
              negotiation already speak to one another.
            </p>
          </Reveal>
        </div>
        <Reveal delay={120} className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/workspace"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#ffffff] px-8 py-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-ink transition-transform hover:-translate-y-0.5"
          >
            Enter workspace
            <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <Link
            href="/broker"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#ffffff]/25 px-8 py-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#ffffff] transition-colors hover:bg-[#ffffff]/10"
          >
            Broker portal
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- */

function SiteFooter() {
  return (
    <footer className="bg-[#0f172a] text-[#ffffff]/60">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col items-start justify-between gap-6 border-t border-[#ffffff]/10 px-5 py-10 sm:px-8 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#ffffff]/25 lx-display text-base text-[#ffffff]">
            A
          </span>
          <span className="lx-display text-base text-[#ffffff]">
            Astra <span className="italic text-[#60a5fa]">Estate</span>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
          <Link href="/workspace" className="lx-link transition-colors hover:text-[#ffffff]">Workspace</Link>
          <Link href="/broker" className="lx-link transition-colors hover:text-[#ffffff]">Brokers</Link>
          <Link href="/manager" className="lx-link transition-colors hover:text-[#ffffff]">Managers</Link>
        </div>
        <p className="text-[11px] uppercase tracking-[0.18em]">Mumbai · multi-agent estate desk</p>
      </div>
    </footer>
  );
}

/* ----------------------------------------------------------------- */

function SectionHeading({ kicker, title, note }: { kicker: string; title: string; note?: string }) {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3">
        <span className="h-px w-10 bg-[#2563eb]" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#2563eb]">{kicker}</span>
      </div>
      <h2 className="lx-display mt-5 text-[clamp(2rem,4vw,3.2rem)] font-light leading-[1.04] text-ink">
        {title}
      </h2>
      {note ? <p className="mt-4 text-[14px] leading-7 text-ink/55">{note}</p> : null}
    </div>
  );
}

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`lx-reveal ${shown ? "is-in" : ""} ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
