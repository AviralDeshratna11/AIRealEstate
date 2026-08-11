"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { BadgeCheck, Bell, Check, ShieldQuestion } from "lucide-react";
import {
  CLAIM_META,
  RADAR_DISCLAIMER,
  SIGNAL_META,
  SOURCE_META,
  STATUS_META,
  addToWatchlist,
  confidenceLabel,
  scoreTone,
  type ClaimStatus,
  type LocalitySignal,
  type ProjectStatus,
  type SourceType,
  type WatchlistItem,
} from "@/lib/radar";

export function RadarKicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-px w-10 bg-gold" />
      <span className="radar-kicker">{children}</span>
    </span>
  );
}

export function SignalBadge({ signal, small }: { signal: LocalitySignal; small?: boolean }) {
  const meta = SIGNAL_META[signal];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-xl border font-semibold uppercase tracking-[0.12em]",
        small ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
        meta.chip,
      )}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={clsx("inline-flex items-center rounded-xl border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em]", meta.tone)}>
      {meta.label}
    </span>
  );
}

export function SourceReliabilityBadge({ sourceType, reliability }: { sourceType: SourceType; reliability?: number }) {
  const meta = SOURCE_META[sourceType];
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-xl border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]", meta.tone)}>
      <BadgeCheck size={12} />
      {meta.label}
      {typeof reliability === "number" ? <span className="opacity-70">· {Math.round(reliability * 100)}%</span> : null}
    </span>
  );
}

export function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  const meta = CLAIM_META[status];
  return (
    <span className={clsx("inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.1em]", meta.tone)}>
      {status === "verified" ? <Check size={12} /> : <ShieldQuestion size={12} />}
      {meta.label}
    </span>
  );
}

export function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const tone = value >= 0.7 ? "text-emerald-700" : value >= 0.5 ? "text-amber-700" : "text-orange-700";
  return (
    <span className={clsx("text-[11px] font-bold uppercase tracking-[0.1em]", tone)}>
      {confidenceLabel(value)} · {pct}%
    </span>
  );
}

export function ScoreBar({ value, label, tone, suffix }: { value: number; label?: string; tone?: string; suffix?: string }) {
  const color = tone ?? scoreTone(value);
  return (
    <div>
      {label ? (
        <div className="mb-1 flex items-center justify-between text-[12px]">
          <span className="font-medium text-ink/75">{label}</span>
          <span className="font-bold tabular-nums" style={{ color }}>{Math.round(value)}{suffix ?? ""}</span>
        </div>
      ) : null}
      <div className="radar-bar">
        <span style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
      </div>
    </div>
  );
}

export function FutureScoreGauge({ value, size = 132, label = "Future Score", confidence }: { value: number; size?: number; label?: string; confidence?: number }) {
  const tone = scoreTone(value);
  const inner = size - 22;
  return (
    <div className="flex flex-col items-center">
      <div className="radar-gauge grid place-items-center" style={{ width: size, height: size, ["--val" as string]: value, ["--tone" as string]: tone }}>
        <div className="grid place-items-center rounded-full bg-ivory" style={{ width: inner, height: inner }}>
          <span className="lx-display text-4xl font-light leading-none" style={{ color: tone }}>{Math.round(value)}</span>
          <span className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-ink/55">/ 100</span>
        </div>
      </div>
      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-ink/60">{label}</p>
      {typeof confidence === "number" ? <p className="mt-0.5"><ConfidenceBadge value={confidence} /></p> : null}
    </div>
  );
}

export function RadarDisclaimer({ className }: { className?: string }) {
  return (
    <p className={clsx("rounded-xl border border-ink/12 bg-ink/[0.03] px-3 py-2 text-[11px] leading-relaxed text-ink/55", className)}>
      <span className="font-bold uppercase tracking-[0.12em] text-ink/65">Decision support</span> — {RADAR_DISCLAIMER}
    </p>
  );
}

export function WatchlistButton({
  entityType,
  entityId,
  entityName,
  className,
}: {
  entityType: WatchlistItem["entity_type"];
  entityId: string;
  entityName?: string;
  className?: string;
}) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const list = JSON.parse(window.localStorage.getItem("astra-radar-watchlist") || "[]") as WatchlistItem[];
      setSaved(list.some((x) => x.entity_type === entityType && x.entity_id === entityId));
    } catch {
      /* ignore */
    }
  }, [entityType, entityId]);

  async function onClick() {
    setBusy(true);
    try {
      await addToWatchlist({ entity_type: entityType, entity_id: entityId, entity_name: entityName });
      setSaved(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12px] font-semibold transition disabled:opacity-60",
        saved ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-ink/20 bg-ivory text-ink hover:bg-ink hover:text-ivory",
        className,
      )}
    >
      {saved ? <Check size={14} /> : <Bell size={14} />}
      {saved ? "Watching" : "Watch"}
    </button>
  );
}
