"use client";

import { ArrowUpRight, FileText } from "lucide-react";
import type { LocalityScores, RadarClaim } from "@/lib/radar";
import { scoreTone } from "@/lib/radar";
import { ClaimStatusBadge, ScoreBar, SourceReliabilityBadge } from "./primitives";

export function EvidencePanel({ claims, title = "Evidence & claim ledger" }: { claims: RadarClaim[]; title?: string }) {
  return (
    <div className="radar-card p-5">
      <div className="mb-1 flex items-center gap-2">
        <FileText size={16} className="text-gold" />
        <h3 className="lx-display text-xl font-light text-ink">{title}</h3>
      </div>
      <p className="mb-4 text-[12px] text-ink/50">
        Every projected impact is tied to a source and a verification status. Claims are only marked <span className="font-semibold text-emerald-700">verified</span> when an official source confirms them.
      </p>
      {claims.length === 0 ? (
        <p className="text-[13px] italic text-ink/45">No claims recorded yet for this entity.</p>
      ) : (
        <ul className="divide-y divide-ink/8">
          {claims.map((c) => (
            <li key={c.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <ClaimStatusBadge status={c.status} />
                <SourceReliabilityBadge sourceType={c.source_type} reliability={c.reliability_score} />
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink/80">{c.claim_text}</p>
              {c.evidence_snippet ? <p className="mt-1 border-l-2 border-ink/10 pl-2 text-[12px] italic text-ink/55">“{c.evidence_snippet}”</p> : null}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink/45">
                {c.source_name ? <span>{c.source_name}</span> : null}
                {c.source_date ? <span>· {c.source_date}</span> : null}
                {c.last_checked_at ? <span>· checked {c.last_checked_at}</span> : null}
                {c.source_url ? (
                  <a href={c.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-semibold text-ink/65 hover:text-gold">
                    source <ArrowUpRight size={11} />
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ScoreBreakdownPanel({ scores }: { scores: LocalityScores }) {
  return (
    <div className="radar-card p-5">
      <h3 className="lx-display text-xl font-light text-ink">How the Future Score is built</h3>
      <p className="mb-4 text-[12px] text-ink/50">
        Transparent weighted model — opportunity sub-scores add up, risk sub-scores pull the headline down. No black box.
      </p>
      <div className="space-y-4">
        {scores.breakdown.map((b) => {
          const isRisk = b.weight < 0 || b.key.includes("risk");
          return (
            <div key={b.key}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-ink">
                  {b.label}
                  {b.weight ? <span className="ml-1 text-[11px] font-normal text-ink/40">({b.weight > 0 ? "+" : ""}{Math.round(b.weight * 100)}% weight)</span> : null}
                </span>
                <span className="text-[13px] font-bold tabular-nums" style={{ color: isRisk ? "#d6532c" : scoreTone(b.score) }}>{Math.round(b.score)}</span>
              </div>
              <div className="mt-1"><ScoreBar value={b.score} tone={isRisk ? "#d6532c" : scoreTone(b.score)} /></div>
              <p className="mt-1 text-[12px] leading-relaxed text-ink/55">{b.reason}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
