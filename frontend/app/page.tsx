import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Building2,
  CalendarClock,
  FileText,
  IndianRupee,
  Map,
  MessagesSquare,
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
    copy: "Rank Mumbai inventory from natural-language buyer requirements.",
  },
  {
    title: "Market",
    href: "/workspace/?tab=market",
    icon: TrendingUp,
    copy: "Track inventory, redevelopment activity, and liquidity signals.",
  },
  {
    title: "Map",
    href: "/workspace/?tab=map",
    icon: Map,
    copy: "Inspect real locality pins with selected property context.",
  },
  {
    title: "Finance",
    href: "/workspace/?tab=finance",
    icon: IndianRupee,
    copy: "Estimate EMI, affordability, and construction material ranges.",
  },
  {
    title: "Tours",
    href: "/workspace/?tab=tour",
    icon: CalendarClock,
    copy: "Generate guided viewing routes and availability workflows.",
  },
  {
    title: "Channels",
    href: "/workspace/?tab=channels",
    icon: MessagesSquare,
    copy: "Test WhatsApp qualification, call triage, booking slots, and viewing handoff.",
  },
  {
    title: "Docs & Deals",
    href: "/workspace/?tab=documents",
    icon: FileText,
    copy: "Extract contingencies and optimize counter-offer strategy.",
  },
  {
    title: "Agents",
    href: "/workspace/?tab=agents",
    icon: Bot,
    copy: "Operate the assistant swarm across client and broker tasks.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="mx-auto grid min-h-screen w-full max-w-[1500px] gap-8 px-4 py-6 md:px-6 lg:grid-cols-[1fr_520px] lg:px-8">
        <div className="flex flex-col justify-between gap-10">
          <nav className="flex items-center justify-between border-b border-slate-200 pb-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white">
                <Sparkles size={19} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-950">ASTRA Estate</p>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-estate-700">Mumbai OS</p>
              </div>
            </div>
            <Link href="/workspace" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-black text-white">
              Open workspace
            </Link>
          </nav>

          <div className="max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-estate-700">Multi-agent real-estate command center</p>
            <h1 className="mt-4 text-5xl font-black leading-[0.98] tracking-tight text-slate-950 md:text-7xl">
              Sell, search, finance, tour, and negotiate Mumbai property from one professional workspace.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              ASTRA connects property discovery, market intelligence, document review, finance estimates, lead handling, and an AI assistant into one focused operating layer for brokers and buyers.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/workspace" className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-black text-white">
                Launch workspace
                <ArrowRight size={16} />
              </Link>
              <Link href="/workspace/?tab=agents" className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-black text-slate-950 ring-1 ring-slate-200">
                View agents
                <Bot size={16} />
              </Link>
            </div>
          </div>

          <div className="grid gap-3 border-t border-slate-200 pt-5 sm:grid-cols-3">
            <Metric label="Workflow tabs" value="8" />
            <Metric label="Agent roles" value="10" />
            <Metric label="Market" value="Mumbai" />
          </div>
        </div>

        <aside className="flex flex-col gap-4 lg:py-16">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-estate-700">Connected workflows</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Start anywhere, return home anytime.</h2>
              </div>
              <ShieldCheck className="text-estate-700" size={24} />
            </div>
            <div className="grid gap-3">
              {workflows.map((workflow) => {
                const Icon = workflow.icon;
                return (
                  <Link
                    key={workflow.title}
                    href={workflow.href}
                    className="group flex items-start gap-3 rounded-md border border-slate-200 p-4 transition hover:border-estate-500 hover:bg-estate-50"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-700 group-hover:bg-white group-hover:text-estate-700">
                      <Icon size={18} />
                    </span>
                    <span>
                      <span className="font-black text-slate-950">{workflow.title}</span>
                      <span className="mt-1 block text-sm leading-5 text-slate-500">{workflow.copy}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-estate-700">Demo inventory loaded</p>
            <div className="mt-4 grid gap-3">
              {DEMO_PROPERTIES.slice(0, 3).map((property) => (
                <Link
                  key={property.id}
                  href="/workspace/?tab=search"
                  className="flex items-center justify-between gap-4 rounded-md border border-slate-200 p-3 transition hover:border-estate-500 hover:bg-estate-50"
                >
                  <span>
                    <span className="block font-black text-slate-950">{property.title}</span>
                    <span className="text-sm text-slate-500">{property.locality} - {property.bedrooms}BHK - {property.availability}</span>
                  </span>
                  <span className="shrink-0 text-sm font-black text-slate-950">{formatCr(property.price)}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </section>
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
