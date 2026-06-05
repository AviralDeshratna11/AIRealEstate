import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  FileText,
  GanttChartSquare,
  IndianRupee,
  Map,
  MessagesSquare,
  RadioTower,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { DEMO_PROPERTIES } from "@/lib/demo";
import { formatCr } from "@/lib/api";

const workflows = [
  {
    title: "Search",
    href: "/workspace/?tab=search",
    icon: Building2,
    copy: "Buyer intent to ranked inventory.",
  },
  {
    title: "Market",
    href: "/workspace/?tab=market",
    icon: TrendingUp,
    copy: "Inventory, liquidity, redevelopment.",
  },
  {
    title: "Map",
    href: "/workspace/?tab=map",
    icon: Map,
    copy: "Locality pins with live focus.",
  },
  {
    title: "Finance",
    href: "/workspace/?tab=finance",
    icon: IndianRupee,
    copy: "EMI and construction material ranges.",
  },
  {
    title: "Tours",
    href: "/workspace/?tab=tour",
    icon: CalendarClock,
    copy: "Viewing routes and availability.",
  },
  {
    title: "Channels",
    href: "/workspace/?tab=channels",
    icon: MessagesSquare,
    copy: "WhatsApp, calls, slots, booking.",
  },
  {
    title: "Docs & Deals",
    href: "/workspace/?tab=documents",
    icon: FileText,
    copy: "Contingencies and counter-offers.",
  },
  {
    title: "Agents",
    href: "/workspace/?tab=agents",
    icon: Bot,
    copy: "Ten agents under one operator.",
  },
  {
    title: "Sales OS",
    href: "/crm",
    icon: GanttChartSquare,
    copy: "CRM, pipeline, leads, and revenue.",
  },
];

export default function HomePage() {
  const heroProperty = DEMO_PROPERTIES[1];

  return (
    <main className="min-h-screen overflow-hidden text-ink">
      <section className="mx-auto grid min-h-[92vh] w-full max-w-[1560px] gap-6 px-4 py-4 md:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
        <div className="flex min-h-[680px] flex-col rounded-lg border border-ink/15 bg-[#fffaf0]/82 p-4 shadow-soft backdrop-blur md:p-6">
          <nav className="flex items-center justify-between border-b border-ink/15 pb-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-md bg-ink text-[#fffaf0] shadow-crisp">
                <Sparkles size={19} />
              </div>
              <div>
                <p className="font-display text-xl font-black text-ink">ASTRA Estate</p>
                <p className="section-kicker">Mumbai Deal Room</p>
              </div>
            </div>
            <Link
              href="/workspace"
              className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-black text-[#fffaf0] shadow-crisp transition hover:-translate-y-0.5"
            >
              Open workspace
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/broker"
              className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-800 transition hover:-translate-y-0.5"
            >
              <BriefcaseBusiness size={16} />
              Broker portal
            </Link>
            <Link
              href="/manager"
              className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-800 transition hover:-translate-y-0.5"
            >
              <Building2 size={16} />
              Manager portal
            </Link>
            <Link
              href="/crm"
              className="inline-flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-black text-orange-900 transition hover:-translate-y-0.5"
            >
              <GanttChartSquare size={16} />
              Sales OS
            </Link>
          </nav>

          <div className="grid flex-1 content-center gap-8 py-10 lg:grid-cols-[1fr_220px]">
            <div className="lift-in max-w-4xl">
              <p className="section-kicker">Broker OS for high-stakes Mumbai inventory</p>
              <h1 className="mt-4 font-display text-5xl font-black leading-[0.98] text-ink md:text-7xl">
                A command floor for search, finance, tours, deals, and agent routing.
              </h1>
              <p className="mt-6 max-w-3xl text-lg font-medium leading-8 text-ink/68">
                ASTRA turns a fragmented broker workflow into one dense operating surface for qualified leads,
                market signals, property context, and transaction automation.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/workspace"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-coral px-5 py-3 text-sm font-black text-white shadow-crisp transition hover:-translate-y-0.5"
                >
                  Launch desk
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/workspace/?tab=agents"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-ink/20 bg-[#fffaf0] px-5 py-3 text-sm font-black text-ink transition hover:border-ink hover:bg-white"
                >
                  Inspect agents
                  <Bot size={16} />
                </Link>
                <Link
                  href="/crm"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-black text-orange-900 transition hover:border-orange-300 hover:bg-white"
                >
                  Open Sales OS
                  <GanttChartSquare size={16} />
                </Link>
              </div>
            </div>

            <div className="hidden self-center lg:block">
              <div className="ticker-tape rounded-lg border border-ink/15 p-3">
                {["Powai", "Bandra", "Andheri", "Worli"].map((item, index) => (
                  <div key={item} className="mapline py-3 pl-5">
                    <p className="font-black text-ink">{item}</p>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink/48">Signal 0{index + 1}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 border-t border-ink/15 pt-4 sm:grid-cols-3">
            <Metric label="Workflow tabs" value="9" />
            <Metric label="Agent roles" value="10" />
            <Metric label="Launch market" value="Mumbai" />
          </div>
        </div>

        <aside className="grid min-h-[680px] gap-4 lg:grid-rows-[1fr_auto]">
          <div className="relative overflow-hidden rounded-lg border border-ink/15 bg-ink text-[#fffaf0] shadow-soft">
            <Image
              src={heroProperty.image_url || DEMO_PROPERTIES[0].image_url || ""}
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 48vw, 100vw"
              className="object-cover opacity-68 mix-blend-luminosity"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(25,23,19,0.1),rgba(25,23,19,0.88))]" />
            <div className="relative flex h-full min-h-[500px] flex-col justify-between p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="rounded-md border border-white/20 bg-white/10 px-3 py-2 backdrop-blur">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">Live board</p>
                  <p className="mt-1 font-display text-3xl font-black">{formatCr(heroProperty.price)}</p>
                </div>
                <ShieldCheck className="text-[#f1b24a]" size={28} />
              </div>

              <div>
                <p className="section-kicker text-[#f1b24a]">Featured mandate</p>
                <h2 className="mt-3 max-w-xl font-display text-4xl font-black leading-none text-[#fffaf0] md:text-5xl">
                  {heroProperty.title}
                </h2>
                <p className="mt-4 max-w-lg text-sm font-semibold leading-6 text-white/72">
                  {heroProperty.locality} - {heroProperty.bedrooms}BHK - {heroProperty.availability}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {workflows.map((workflow) => {
              const Icon = workflow.icon;
              return (
                <Link
                  key={workflow.title}
                  href={workflow.href}
                  className="group rounded-lg border border-ink/15 bg-[#fffaf0]/88 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-coral hover:bg-white"
                >
                  <span className="mb-4 flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-md bg-ink text-[#fffaf0] transition group-hover:bg-coral">
                      <Icon size={18} />
                    </span>
                    <RadioTower size={16} className="text-ink/35 group-hover:text-coral" />
                  </span>
                  <span className="block font-black text-ink">{workflow.title}</span>
                  <span className="mt-1 block text-sm leading-5 text-ink/58">{workflow.copy}</span>
                </Link>
              );
            })}
          </div>
        </aside>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/15 bg-white/60 px-4 py-3">
      <p className="font-display text-3xl font-black text-ink">{value}</p>
      <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/45">{label}</p>
    </div>
  );
}
