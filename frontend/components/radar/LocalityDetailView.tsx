"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowUpRight, FileText, IndianRupee, Send, Sparkles, TrendingUp } from "lucide-react";
import {
  analyzeLocality,
  getRadarLocality,
  scoreTone,
  type AnalyzeLocalityResponse,
  type LocalityDetail,
} from "@/lib/radar";
import { RadarShell } from "./RadarShell";
import { ConfidenceBadge, FutureScoreGauge, RadarDisclaimer, ScoreBar, SignalBadge, WatchlistButton } from "./primitives";
import { ActionList, ProjectCard, ProjectImpactTimeline, RedevelopmentZoneCard, RiskOpportunityMatrix } from "./cards";
import { EvidencePanel, ScoreBreakdownPanel } from "./evidence";

const SUB_SCORES: Array<[keyof LocalityDetail["locality"]["scores"], string]> = [
  ["infrastructure_score", "Infrastructure catalyst"],
  ["redevelopment_score", "Redevelopment momentum"],
  ["connectivity_score", "Connectivity uplift"],
  ["government_confidence_score", "Govt plan confidence"],
  ["livability_score", "Livability"],
  ["employment_score", "Employment growth"],
  ["rental_demand_score", "Rental demand"],
  ["market_demand_score", "Market demand"],
];

const RISK_SCORES: Array<[keyof LocalityDetail["locality"]["scores"], string]> = [
  ["execution_risk_score", "Execution risk"],
  ["disruption_risk_score", "Disruption risk"],
  ["affordability_risk_score", "Affordability ceiling"],
  ["oversupply_risk_score", "Oversupply risk"],
];

export function LocalityDetailView({ slug }: { slug: string }) {
  const [detail, setDetail] = useState<LocalityDetail | null>(null);
  const [role, setRole] = useState<"buyer" | "broker" | "manager" | "crm">("buyer");

  useEffect(() => {
    getRadarLocality(slug).then(setDetail).catch(() => setDetail(null));
  }, [slug]);

  if (!detail) {
    return <RadarShell active="/radar/localities"><div className="radar-card p-8 text-ink/50">Loading locality intelligence…</div></RadarShell>;
  }

  const { locality } = detail;
  const s = locality.scores;

  return (
    <RadarShell active="/radar/localities">
      {/* Header */}
      <div className="radar-card mb-6 grid gap-6 p-6 lg:grid-cols-[auto_1fr_auto]">
        <div className="flex flex-col items-center gap-2">
          <FutureScoreGauge value={s.future_score} confidence={s.confidence_score} />
        </div>
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-ink/45">{locality.zone}</p>
          <h1 className="lx-display text-4xl font-light leading-none text-ink md:text-5xl">{locality.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <SignalBadge signal={locality.signal} />
            <ConfidenceBadge value={s.confidence_score} />
          </div>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink/75">{locality.summary}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-[13px] text-ink/60">
            {locality.price_psf ? <span className="inline-flex items-center gap-1"><IndianRupee size={13} /> ₹{(locality.price_psf / 1000).toFixed(1)}k/sqft</span> : null}
            {typeof locality.price_trend_pct === "number" ? <span className="inline-flex items-center gap-1 text-emerald-700"><TrendingUp size={13} /> {locality.price_trend_pct}% yoy</span> : null}
            {typeof locality.rental_yield_pct === "number" ? <span>Rental yield ~{locality.rental_yield_pct}%</span> : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <WatchlistButton entityType="locality" entityId={locality.slug} entityName={locality.name} />
          <Link href={`/radar/reports/${locality.slug}`} className="inline-flex items-center gap-1 rounded-[3px] border border-ink/20 px-3 py-1.5 text-[12px] font-semibold text-ink hover:bg-ink/5">
            <FileText size={13} /> Report
          </Link>
          <Link href={`/radar/compare?with=${locality.slug}`} className="inline-flex items-center gap-1 rounded-[3px] border border-ink/20 px-3 py-1.5 text-[12px] font-semibold text-ink hover:bg-ink/5">
            Compare <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>

      {/* Persona scores quick row */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[["Investment", s.investment_score], ["Self-use", s.self_use_score], ["Redevelopment", s.redevelopment_score]].map(([label, val]) => (
          <div key={label as string} className="radar-card p-4 text-center">
            <span className="lx-display block text-3xl font-light" style={{ color: scoreTone(val as number) }}>{Math.round(val as number)}</span>
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/50">{label as string} score</span>
          </div>
        ))}
      </div>

      <AnalyzePanel slug={slug} role={role} setRole={setRole} />

      {/* Sub-scores */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="radar-card p-5">
          <h3 className="lx-display mb-3 text-xl font-light text-ink">Opportunity sub-scores</h3>
          <div className="space-y-3">
            {SUB_SCORES.map(([key, label]) => <ScoreBar key={key} value={s[key] as number} label={label} />)}
          </div>
        </div>
        <div className="radar-card p-5">
          <h3 className="lx-display mb-3 text-xl font-light text-ink">Risk sub-scores</h3>
          <p className="mb-3 text-[12px] text-ink/50">Higher = more risk. These pull the headline Future Score down.</p>
          <div className="space-y-3">
            {RISK_SCORES.map(([key, label]) => <ScoreBar key={key} value={s[key] as number} label={label} tone="#d6532c" />)}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <h2 className="lx-display mb-3 mt-9 text-2xl font-light text-ink">Project impact timeline</h2>
      <ProjectImpactTimeline timeline={detail.timeline} />

      {/* Opportunity / Risk */}
      <h2 className="lx-display mb-3 mt-9 text-2xl font-light text-ink">Opportunity & risk</h2>
      <RiskOpportunityMatrix opportunities={detail.opportunities} risks={detail.risks} />

      {/* Score model + evidence */}
      <div className="mt-9 grid gap-5 lg:grid-cols-2">
        <ScoreBreakdownPanel scores={s} />
        <EvidencePanel claims={detail.claims} />
      </div>

      {/* Projects */}
      {detail.projects.length ? (
        <>
          <h2 className="lx-display mb-3 mt-9 text-2xl font-light text-ink">Projects affecting {locality.name}</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {detail.projects.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        </>
      ) : null}

      {/* Redevelopment zones */}
      {detail.redevelopment_zones.length ? (
        <>
          <h2 className="lx-display mb-3 mt-9 text-2xl font-light text-ink">Redevelopment zones</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {detail.redevelopment_zones.map((z) => <RedevelopmentZoneCard key={z.id} zone={z} />)}
          </div>
        </>
      ) : null}

      {/* Actions */}
      <div className="mt-9">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="lx-display text-2xl font-light text-ink">Suggested actions</h2>
          <div className="flex gap-1.5">
            {(["buyer", "broker", "manager", "crm"] as const).map((r) => (
              <button key={r} type="button" onClick={() => setRole(r)} className={clsx("rounded-[3px] px-2.5 py-1 text-[12px] font-semibold capitalize", role === r ? "bg-ink text-ivory" : "border border-ink/15 text-ink/60 hover:bg-ink/5")}>{r}</button>
            ))}
          </div>
        </div>
        <ActionList actions={detail.actions} role={role} />
      </div>

      <RadarDisclaimer className="mt-8" />
    </RadarShell>
  );
}

function AnalyzePanel({ slug, role, setRole }: { slug: string; role: string; setRole: (r: "buyer" | "broker" | "manager" | "crm") => void }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AnalyzeLocalityResponse | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      setResult(await analyzeLocality({ locality_slug: slug, role, query: query || undefined }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="radar-card p-5">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles size={16} className="text-gold" />
        <h3 className="lx-display text-xl font-light text-ink">Ask the Radar about this locality</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1.5">
          {(["buyer", "broker", "manager", "crm"] as const).map((r) => (
            <button key={r} type="button" onClick={() => setRole(r)} className={clsx("rounded-[3px] px-2.5 py-1 text-[12px] font-semibold capitalize", role === r ? "bg-ink text-ivory" : "border border-ink/15 text-ink/60 hover:bg-ink/5")}>{r}</button>
          ))}
        </div>
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") run(); }}
          placeholder="e.g. Is this good for a 5-year investment? What government plans affect it?"
          className="flex-1 rounded-[3px] border border-ink/15 bg-ivory px-3 py-2 text-[14px] text-ink outline-none focus:border-gold"
        />
        <button type="button" onClick={run} disabled={busy} className="inline-flex items-center gap-1.5 rounded-[3px] bg-ink px-4 py-2 text-[13px] font-semibold text-ivory hover:bg-ink/85 disabled:opacity-60">
          <Send size={14} /> {busy ? "…" : "Ask"}
        </button>
      </div>
      {result ? (
        <div className="mt-3 rounded-[3px] border border-ink/10 bg-ink/[0.02] p-4">
          <p className="text-[14px] leading-relaxed text-ink/80">{result.answer}</p>
          <p className="mt-2 text-[13px] font-medium text-ink/70"><span className="font-bold">Recommendation:</span> {result.recommendation}</p>
          <div className="mt-2"><ConfidenceBadge value={result.confidence_score} /></div>
          {result.audit_events?.length ? (
            <p className="mt-2 text-[11px] text-ink/40">Agent trace: {result.audit_events.join(" · ")}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
