"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Bell, Building2, Map as MapIcon, TrendingUp } from "lucide-react";
import { getRadarDashboard, type RadarDashboard } from "@/lib/radar";
import { RadarShell } from "./RadarShell";
import { RadarDisclaimer } from "./primitives";
import { LocalityScoreCard, ProjectCard } from "./cards";

const TONE_BG: Record<string, string> = {
  ink: "bg-ink text-ivory",
  emerald: "bg-emerald-600 text-white",
  purple: "bg-purple-600 text-white",
  coral: "bg-[#d6532c] text-white",
};

export function RadarDashboardView() {
  const [data, setData] = useState<RadarDashboard | null>(null);

  useEffect(() => {
    getRadarDashboard().then(setData).catch(() => setData(null));
  }, []);

  return (
    <RadarShell
      active="/radar"
      title="Where Mumbai is going next"
      subtitle="Evidence-backed future-locality intelligence: government infrastructure, redevelopment schemes, zoning and live ASTRA demand — distilled into explainable, risk-adjusted Future Scores."
    >
      <div className="radar-scan mb-7 grid gap-3 rounded-xl sm:grid-cols-2 lg:grid-cols-4">
        {(data?.stats ?? []).map((s) => (
          <div key={s.label} className={`rounded-xl p-5 ${TONE_BG[s.tone] ?? "radar-card"}`}>
            <span className="lx-display block text-4xl font-light leading-none">{s.value}</span>
            <span className="mt-2 block text-[12px] font-semibold uppercase tracking-[0.14em] opacity-80">{s.label}</span>
            {s.detail ? <span className="mt-0.5 block text-[12px] opacity-70">{s.detail}</span> : null}
          </div>
        ))}
      </div>

      <div className="mb-7 flex flex-wrap gap-2">
        <QuickLink href="/radar/map" icon={<MapIcon size={15} />} label="Open the live map" />
        <QuickLink href="/radar/compare" icon={<TrendingUp size={15} />} label="Compare localities" />
        <QuickLink href="/radar/projects" icon={<Building2 size={15} />} label="Browse projects" />
        <QuickLink href="/radar/alerts" icon={<Bell size={15} />} label="Alerts feed" />
      </div>

      <Section title="Top future-growth localities" href="/radar/localities" linkLabel="All localities">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {(data?.top_growth ?? []).map((l) => <LocalityScoreCard key={l.id} locality={l} />)}
        </div>
      </Section>

      <Section title="Redevelopment momentum" href="/radar/redevelopment" linkLabel="Redevelopment">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {(data?.top_redevelopment ?? []).map((l) => <LocalityScoreCard key={l.id} locality={l} />)}
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Active infrastructure projects" href="/radar/infrastructure" linkLabel="Infrastructure">
          <div className="space-y-3">
            {(data?.active_projects ?? []).map((p) => <ProjectCard key={p.id} project={p} compact />)}
          </div>
        </Section>

        <Section title="Watch — elevated risk" href="/radar/localities" linkLabel="Localities">
          <div className="space-y-3">
            {(data?.watch_risk ?? []).map((l) => (
              <Link key={l.id} href={`/radar/localities/${l.slug}`} className="radar-card flex items-center justify-between gap-3 p-3 transition hover:-translate-y-0.5">
                <span>
                  <span className="block text-[14px] font-semibold text-ink">{l.name}</span>
                  <span className="block text-[12px] text-ink/55">Exec risk {Math.round(l.scores.execution_risk_score)} · Oversupply {Math.round(l.scores.oversupply_risk_score)}</span>
                </span>
                <ArrowUpRight size={15} className="text-ink/40" />
              </Link>
            ))}
          </div>
        </Section>
      </div>

      <Section title="Recent alerts" href="/radar/alerts" linkLabel="All alerts">
        <div className="space-y-2">
          {(data?.recent_alerts ?? []).map((a) => (
            <div key={a.id} className="radar-card flex items-start gap-3 p-3">
              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${a.priority === "high" ? "bg-red-500" : a.priority === "medium" ? "bg-amber-500" : "bg-stone-400"}`} />
              <span>
                <span className="block text-[14px] font-semibold text-ink">{a.title}</span>
                <span className="block text-[12px] text-ink/60">{a.message}</span>
              </span>
            </div>
          ))}
        </div>
      </Section>

      <RadarDisclaimer className="mt-8" />
    </RadarShell>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 rounded-xl border border-ink/15 bg-ivory px-3 py-2 text-[13px] font-semibold text-ink transition hover:bg-ink hover:text-ivory">
      {icon}{label}
    </Link>
  );
}

function Section({ title, href, linkLabel, children }: { title: string; href?: string; linkLabel?: string; children: React.ReactNode }) {
  return (
    <section className="mb-9">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="lx-display text-2xl font-light text-ink">{title}</h2>
        {href ? <Link href={href} className="inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink/55 hover:text-gold">{linkLabel} <ArrowUpRight size={13} /></Link> : null}
      </div>
      {children}
    </section>
  );
}
