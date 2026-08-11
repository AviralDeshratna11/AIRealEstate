"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowUpRight, Building2, Radar, ShieldAlert, TrainFront, TrendingUp } from "lucide-react";
import { HORIZON_LABEL, getPropertyRadarCard, scoreTone, type PropertyRadarCard } from "@/lib/radar";
import { FutureScoreGauge, RadarDisclaimer, SignalBadge } from "./primitives";
import { EvidencePanel } from "./evidence";

type Persona = "investor" | "family" | "broker" | "manager";

export function FutureRadarCard({
  propertyId,
  localityName,
  role = "public",
}: {
  propertyId: string;
  localityName?: string;
  role?: string;
}) {
  const [card, setCard] = useState<PropertyRadarCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [persona, setPersona] = useState<Persona>(
    role === "broker" ? "broker" : role === "manager" || role === "seller" ? "manager" : "investor",
  );

  useEffect(() => {
    let on = true;
    getPropertyRadarCard(propertyId, localityName)
      .then((c) => { if (on) setCard(c); })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, [propertyId, localityName]);

  if (loading) {
    return <div className="radar-card animate-pulse p-6 text-[13px] text-ink/40">Loading Future Value Radar…</div>;
  }
  if (!card) return null;

  const tone = scoreTone(card.future_score);
  const investor = card.investor_view as Record<string, number>;
  const family = card.family_view as Record<string, number>;

  return (
    <section className="radar-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-ink/10 bg-ink px-5 py-3 text-ivory">
        <span className="flex items-center gap-2">
          <Radar size={16} className="text-goldsoft" />
          <span className="text-[12px] font-bold uppercase tracking-[0.18em] text-goldsoft">Future Value Radar</span>
        </span>
        {card.locality_slug ? (
          <Link href={`/radar/localities/${card.locality_slug}`} className="inline-flex items-center gap-1 text-[12px] font-semibold text-ivory/80 hover:text-ivory">
            {card.locality_name} locality <ArrowUpRight size={13} />
          </Link>
        ) : null}
      </div>

      <div className="grid gap-5 p-5 md:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center gap-2">
          <FutureScoreGauge value={card.future_score} confidence={card.confidence_score} />
          <SignalBadge signal={card.signal} small />
        </div>

        <div>
          <p className="text-[14px] leading-relaxed text-ink/75">{card.summary}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Mini icon={<TrainFront size={14} />} label="Nearest catalyst" value={card.nearest_catalyst ?? "—"} sub={card.nearest_catalyst_distance_km ? `~${card.nearest_catalyst_distance_km} km` : undefined} />
            <Mini icon={<TrendingUp size={14} />} label="Connectivity" value={card.connectivity_uplift ?? "—"} />
            <Mini icon={<Building2 size={14} />} label="Redevelopment" value={card.redevelopment_momentum ?? "—"} />
          </div>
          {card.major_risks.length ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <ShieldAlert size={14} className="text-red-600" />
              {card.major_risks.slice(0, 4).map((r) => (
                <span key={r} className="rounded-xl border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">{r}</span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Persona-specific framing */}
      <div className="border-t border-ink/10 px-5 pb-5 pt-4">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {(["investor", "family", "broker", "manager"] as Persona[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPersona(p)}
              className={clsx(
                "rounded-xl px-3 py-1 text-[12px] font-semibold capitalize transition",
                persona === p ? "bg-ink text-ivory" : "border border-ink/15 text-ink/65 hover:bg-ink/5",
              )}
            >
              {p}
            </button>
          ))}
        </div>

        {persona === "investor" ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Upside" value={investor.upside_score} />
            <Stat label="Rental demand" value={investor.rental_demand} />
            <Stat label="Redevelopment" value={investor.redevelopment} />
            <Stat label="Execution risk" value={investor.execution_risk} risk />
          </div>
        ) : null}
        {persona === "family" ? (
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Livability" value={family.livability} />
            <Stat label="Commute" value={family.commute} />
            <Stat label="Disruption risk" value={family.disruption_risk} risk />
          </div>
        ) : null}
        {persona === "broker" ? (
          <ul className="space-y-1.5 text-[13px] text-ink/75">
            {card.broker_pitch.map((p, i) => <li key={i} className="flex gap-2"><span className="text-gold">→</span>{p}</li>)}
          </ul>
        ) : null}
        {persona === "manager" ? (
          <ul className="space-y-1.5 text-[13px] text-ink/75">
            {card.manager_positioning.map((p, i) => <li key={i} className="flex gap-2"><span className="text-gold">→</span>{p}</li>)}
          </ul>
        ) : null}
      </div>

      {card.timeline.length ? (
        <div className="border-t border-ink/10 px-5 pb-5 pt-4">
          <h4 className="mb-2 text-[12px] font-bold uppercase tracking-[0.14em] text-ink/60">Impact timeline</h4>
          <ul className="space-y-2">
            {card.timeline.map((t, i) => (
              <li key={i} className="flex items-start gap-3 text-[13px]">
                <span className="mt-0.5 w-20 shrink-0 text-[11px] font-bold uppercase tracking-[0.1em] text-gold">{HORIZON_LABEL[t.horizon]}</span>
                <span className="text-ink/70"><span className="font-semibold text-ink">{t.title}.</span> {t.effect}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {card.evidence.length ? (
        <div className="border-t border-ink/10 p-5">
          <EvidencePanel claims={card.evidence} title="Sources behind this card" />
        </div>
      ) : null}

      <div className="px-5 pb-5">
        <RadarDisclaimer />
      </div>

      <div aria-hidden className="hidden" style={{ color: tone }} />
    </section>
  );
}

function Mini({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-ink/[0.02] p-2.5">
      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink/45">{icon}{label}</span>
      <span className="mt-0.5 block text-[13px] font-semibold text-ink">{value}</span>
      {sub ? <span className="text-[11px] text-ink/50">{sub}</span> : null}
    </div>
  );
}

function Stat({ label, value, risk }: { label: string; value?: number; risk?: boolean }) {
  const v = typeof value === "number" ? value : 0;
  return (
    <div className="rounded-xl bg-ink/[0.03] py-2 text-center">
      <span className="block text-lg font-bold tabular-nums" style={{ color: risk ? "#d6532c" : scoreTone(v) }}>{Math.round(v)}</span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink/50">{label}</span>
    </div>
  );
}
