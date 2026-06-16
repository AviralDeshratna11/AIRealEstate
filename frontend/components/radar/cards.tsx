"use client";

import Link from "next/link";
import clsx from "clsx";
import { AlertTriangle, ArrowUpRight, Building2, CalendarClock, IndianRupee, MapPin, TrendingUp } from "lucide-react";
import {
  HORIZON_LABEL,
  PROJECT_TYPE_LABEL,
  scoreTone,
  type LocalityDetail,
  type OpportunityNote,
  type RadarLocality,
  type RadarProject,
  type RadarRedevelopmentZone,
  type RiskNote,
  type TimelineMilestone,
} from "@/lib/radar";
import { ConfidenceBadge, ProjectStatusBadge, ScoreBar, SignalBadge, SourceReliabilityBadge } from "./primitives";

// --------------------------------------------------------------------------- //
export function LocalityScoreCard({ locality }: { locality: RadarLocality }) {
  const s = locality.scores;
  const tone = scoreTone(s.future_score);
  return (
    <Link
      href={`/radar/localities/${locality.slug}`}
      className="radar-card group block p-5 transition hover:-translate-y-0.5 hover:shadow-lx"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink/45">{locality.zone}</p>
          <h3 className="lx-display text-2xl font-light leading-none text-ink">{locality.name}</h3>
        </div>
        <div className="text-right">
          <span className="lx-display text-3xl font-light leading-none" style={{ color: tone }}>{Math.round(s.future_score)}</span>
          <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-ink/45">Future</span>
        </div>
      </div>
      <div className="mt-3"><SignalBadge signal={locality.signal} small /></div>
      <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-ink/65">{locality.summary}</p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          ["Invest", s.investment_score],
          ["Redev", s.redevelopment_score],
          ["Self-use", s.self_use_score],
        ].map(([label, val]) => (
          <div key={label as string} className="rounded-[3px] bg-ink/[0.03] py-1.5">
            <span className="block text-sm font-bold tabular-nums" style={{ color: scoreTone(val as number) }}>{Math.round(val as number)}</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink/45">{label as string}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between text-[12px] text-ink/55">
        <span className="inline-flex items-center gap-1">
          <IndianRupee size={12} />
          {locality.price_psf ? `₹${(locality.price_psf / 1000).toFixed(1)}k/sqft` : "—"}
        </span>
        {typeof locality.price_trend_pct === "number" ? (
          <span className="inline-flex items-center gap-1 text-emerald-700">
            <TrendingUp size={12} /> {locality.price_trend_pct > 0 ? "+" : ""}{locality.price_trend_pct}% yoy
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1 font-semibold text-ink/70 group-hover:text-gold">
          Open <ArrowUpRight size={13} />
        </span>
      </div>
    </Link>
  );
}

// --------------------------------------------------------------------------- //
export function ProjectCard({ project, compact }: { project: RadarProject; compact?: boolean }) {
  return (
    <Link href={`/radar/projects/${project.id}`} className="radar-card group block p-5 transition hover:-translate-y-0.5 hover:shadow-lx">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-[3px] bg-ink/5 text-ink/70"><Building2 size={15} /></span>
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink/45">{PROJECT_TYPE_LABEL[project.project_type]} · {project.authority}</span>
        </div>
        <ProjectStatusBadge status={project.status} />
      </div>
      <h3 className="lx-display mt-2 text-xl font-light leading-tight text-ink">{project.name}</h3>
      {!compact ? <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink/65">{project.description || project.impact_summary}</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <SourceReliabilityBadge sourceType={project.source_type} reliability={project.reliability_score} />
        {project.stale ? (
          <span className="inline-flex items-center gap-1 rounded-[3px] border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-red-700">
            <AlertTriangle size={11} /> Stale
          </span>
        ) : null}
        {project.expected_completion_date ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-ink/55"><CalendarClock size={12} /> ETA {project.expected_completion_date}</span>
        ) : null}
        {project.budget_amount ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-ink/55"><IndianRupee size={12} /> ₹{project.budget_amount.toLocaleString("en-IN")} cr</span>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {project.affected_localities.slice(0, 4).map((slug) => (
          <span key={slug} className="inline-flex items-center gap-1 rounded-[3px] bg-ink/[0.04] px-2 py-0.5 text-[11px] capitalize text-ink/65">
            <MapPin size={10} /> {slug.replace(/-/g, " ")}
          </span>
        ))}
      </div>
    </Link>
  );
}

// --------------------------------------------------------------------------- //
export function RedevelopmentZoneCard({ zone }: { zone: RadarRedevelopmentZone }) {
  return (
    <div className="radar-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-purple-700">{zone.zone_type.replace(/_/g, " ")}</p>
          <h3 className="lx-display text-xl font-light leading-tight text-ink">{zone.name}</h3>
          <p className="mt-0.5 text-[12px] text-ink/55">{zone.authority}{zone.locality_name ? ` · ${zone.locality_name}` : ""}</p>
        </div>
        <ProjectStatusBadge status={zone.status} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <ScoreBar value={zone.opportunity_score} label="Opportunity" tone="#7c3aed" />
        <ScoreBar value={zone.risk_score} label="Risk" tone="#d6532c" />
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-[12px] text-ink/55">
        {zone.area_acres ? <span>{zone.area_acres} acres</span> : null}
        {zone.estimated_units ? <span>~{zone.estimated_units.toLocaleString("en-IN")} units</span> : null}
        {zone.developer_name ? <span>{zone.developer_name}</span> : null}
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-ink/65">{zone.notes}</p>
      <div className="mt-3 flex items-center justify-between">
        <SourceReliabilityBadge sourceType={zone.source_type} reliability={zone.confidence_score} />
        {zone.source_url ? (
          <a href={zone.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink/70 hover:text-gold">
            Source <ArrowUpRight size={12} />
          </a>
        ) : null}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------- //
const HORIZON_ORDER: TimelineMilestone["horizon"][] = ["0-1y", "1-3y", "3-5y", "5-10y"];

export function ProjectImpactTimeline({ timeline }: { timeline: TimelineMilestone[] }) {
  const buckets = HORIZON_ORDER.map((h) => ({ horizon: h, items: timeline.filter((t) => t.horizon === h) }));
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {buckets.map((b) => (
        <div key={b.horizon} className="radar-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-gold" />
            <h4 className="text-[12px] font-bold uppercase tracking-[0.14em] text-ink/70">{HORIZON_LABEL[b.horizon]}</h4>
          </div>
          {b.items.length === 0 ? (
            <p className="text-[12px] italic text-ink/40">No tracked milestones.</p>
          ) : (
            <ul className="space-y-3">
              {b.items.map((it, i) => (
                <li key={`${it.project_id ?? "x"}-${i}`} className="border-l-2 border-ink/10 pl-3">
                  <p className="text-[13px] font-semibold text-ink">{it.title}</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-ink/60">{it.effect}</p>
                  <span
                    className={clsx(
                      "mt-1 inline-block text-[10px] font-bold uppercase tracking-[0.1em]",
                      it.uncertainty === "low" ? "text-emerald-700" : it.uncertainty === "medium" ? "text-amber-700" : "text-orange-700",
                    )}
                  >
                    {it.uncertainty} uncertainty
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

// --------------------------------------------------------------------------- //
export function RiskOpportunityMatrix({ opportunities, risks }: { opportunities: OpportunityNote[]; risks: RiskNote[] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="radar-card p-5">
        <h3 className="lx-display text-xl font-light text-ink">Opportunity</h3>
        <p className="text-[12px] text-ink/50">Who this locality may suit, and why.</p>
        <ul className="mt-3 space-y-3">
          {opportunities.map((o) => (
            <li key={o.persona} className="rounded-[3px] border border-emerald-100 bg-emerald-50/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800">{o.persona}</span>
                <span className="text-[12px] font-semibold text-emerald-700">{o.headline}</span>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-ink/70">{o.detail}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="radar-card p-5">
        <h3 className="lx-display text-xl font-light text-ink">Risk</h3>
        <p className="text-[12px] text-ink/50">What could delay, dilute or disrupt the thesis.</p>
        <ul className="mt-3 space-y-3">
          {risks.map((r, i) => (
            <li key={`${r.kind}-${i}`} className="rounded-[3px] border border-red-100 bg-red-50/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-red-800">{r.kind}</span>
                <span
                  className={clsx(
                    "text-[11px] font-bold uppercase tracking-[0.1em]",
                    r.severity === "high" ? "text-red-700" : r.severity === "medium" ? "text-orange-700" : "text-amber-700",
                  )}
                >
                  {r.severity} severity
                </span>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-ink/70">{r.detail}</p>
              <div className="mt-1"><ConfidenceBadge value={r.confidence} /></div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------- //
export function ActionList({ actions, role }: { actions: LocalityDetail["actions"]; role?: string }) {
  const filtered = role ? actions.filter((a) => a.role === role) : actions;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {filtered.map((a, i) => {
        const inner = (
          <span className="flex items-center justify-between gap-2">
            <span>
              <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-ink/45">{a.role}</span>
              <span className="block text-[14px] font-semibold text-ink">{a.label}</span>
              <span className="block text-[12px] text-ink/55">{a.detail}</span>
            </span>
            <ArrowUpRight size={15} className="shrink-0 text-ink/40 group-hover:text-gold" />
          </span>
        );
        return a.href ? (
          <Link key={`${a.label}-${i}`} href={a.href} className="radar-card group block p-3 transition hover:-translate-y-0.5">{inner}</Link>
        ) : (
          <div key={`${a.label}-${i}`} className="radar-card group block p-3">{inner}</div>
        );
      })}
    </div>
  );
}
