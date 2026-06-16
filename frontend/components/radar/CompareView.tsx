"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Trophy } from "lucide-react";
import {
  compareLocalities,
  getRadarLocalities,
  scoreTone,
  type CompareResponse,
  type RadarLocality,
} from "@/lib/radar";
import { RadarShell } from "./RadarShell";
import { RadarDisclaimer, SignalBadge } from "./primitives";

const ROWS: Array<[keyof RadarLocality["scores"], string, boolean?]> = [
  ["future_score", "Future Score"],
  ["investment_score", "Investment"],
  ["redevelopment_score", "Redevelopment"],
  ["self_use_score", "Self-use"],
  ["connectivity_score", "Connectivity"],
  ["livability_score", "Livability"],
  ["rental_demand_score", "Rental demand"],
  ["execution_risk_score", "Execution risk", true],
  ["disruption_risk_score", "Disruption risk", true],
  ["oversupply_risk_score", "Oversupply risk", true],
  ["affordability_risk_score", "Affordability ceiling", true],
];

export function CompareView() {
  const [all, setAll] = useState<RadarLocality[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getRadarLocalities().then((list) => {
      setAll(list);
      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const withSlug = params?.get("with");
      const seed = withSlug && list.some((l) => l.slug === withSlug) ? [withSlug] : list.slice(0, 2).map((l) => l.slug);
      const initial = withSlug ? [withSlug, ...list.filter((l) => l.slug !== withSlug).slice(0, 1).map((l) => l.slug)] : seed;
      setPicked(initial);
    });
  }, []);

  useEffect(() => {
    if (picked.length >= 2) {
      setBusy(true);
      compareLocalities(picked).then(setResult).finally(() => setBusy(false));
    } else {
      setResult(null);
    }
  }, [picked]);

  function toggle(slug: string) {
    setPicked((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= 4) return prev;
      return [...prev, slug];
    });
  }

  const cols = result?.localities ?? [];

  return (
    <RadarShell active="/radar/compare" title="Compare localities" subtitle="Pick 2–4 Mumbai/MMR localities to compare future scores, risk profiles and persona suitability side by side.">
      <div className="radar-card mb-6 p-4">
        <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.14em] text-ink/55">Select localities ({picked.length}/4)</p>
        <div className="flex flex-wrap gap-1.5">
          {all.map((l) => (
            <button
              key={l.slug}
              type="button"
              onClick={() => toggle(l.slug)}
              className={clsx(
                "rounded-[3px] border px-2.5 py-1 text-[12px] font-semibold transition",
                picked.includes(l.slug) ? "border-ink bg-ink text-ivory" : "border-ink/15 text-ink/65 hover:bg-ink/5",
              )}
            >
              {l.name}
            </button>
          ))}
        </div>
      </div>

      {busy && !result ? <div className="radar-card p-8 text-ink/50">Comparing…</div> : null}

      {result && cols.length >= 2 ? (
        <>
          <div className="radar-card overflow-x-auto p-0">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-ink/12">
                  <th className="p-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-ink/45">Metric</th>
                  {cols.map((l) => (
                    <th key={l.slug} className="p-3 text-left">
                      <span className="lx-display text-lg font-light text-ink">{l.name}</span>
                      <span className="mt-1 block"><SignalBadge signal={l.signal} small /></span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map(([key, label, isRisk]) => {
                  const vals = cols.map((l) => l.scores[key] as number);
                  const best = isRisk ? Math.min(...vals) : Math.max(...vals);
                  return (
                    <tr key={key} className="border-b border-ink/8">
                      <td className="p-3 font-medium text-ink/70">{label}{isRisk ? " ↓" : ""}</td>
                      {cols.map((l) => {
                        const v = l.scores[key] as number;
                        const isBest = Math.round(v) === Math.round(best);
                        return (
                          <td key={l.slug} className="p-3">
                            <span className={clsx("inline-flex items-center gap-1.5 font-bold tabular-nums", isBest && "rounded-[3px] bg-emerald-50 px-2 py-0.5")} style={{ color: isRisk ? "#d6532c" : scoreTone(v) }}>
                              {Math.round(v)}{isBest ? <Trophy size={12} className="text-emerald-600" /> : null}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                <tr>
                  <td className="p-3 font-medium text-ink/70">Price ₹/sqft</td>
                  {cols.map((l) => <td key={l.slug} className="p-3 text-ink/70">{l.price_psf ? `₹${(l.price_psf / 1000).toFixed(1)}k` : "—"}</td>)}
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="lx-display mb-3 mt-8 text-2xl font-light text-ink">Verdicts</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {result.verdicts.map((v) => {
              const winner = cols.find((l) => l.slug === v.winner_slug);
              return (
                <div key={v.label} className="radar-card p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/45">{v.label}</p>
                  <p className="lx-display text-xl font-light text-ink">{winner?.name ?? v.winner_slug}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink/60">{v.reason}</p>
                </div>
              );
            })}
          </div>

          {result.narrative ? (
            <div className="radar-card mt-6 border-l-4 border-gold p-5">
              <p className="text-[15px] leading-relaxed text-ink/80">{result.narrative}</p>
            </div>
          ) : null}
        </>
      ) : null}

      <RadarDisclaimer className="mt-8" />
    </RadarShell>
  );
}
