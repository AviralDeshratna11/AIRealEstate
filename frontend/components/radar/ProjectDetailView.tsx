"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarClock, IndianRupee, Landmark } from "lucide-react";
import { HORIZON_LABEL, PROJECT_TYPE_LABEL, getRadarProject, type RadarProject } from "@/lib/radar";
import { RadarShell } from "./RadarShell";
import { ProjectStatusBadge, RadarDisclaimer, ScoreBar, SourceReliabilityBadge, WatchlistButton } from "./primitives";
import { EvidencePanel } from "./evidence";

export function ProjectDetailView({ id }: { id: string }) {
  const [project, setProject] = useState<RadarProject | null | undefined>(undefined);

  useEffect(() => {
    getRadarProject(id).then(setProject).catch(() => setProject(null));
  }, [id]);

  if (project === undefined) {
    return <RadarShell active="/radar/projects"><div className="radar-card p-8 text-ink/50">Loading project…</div></RadarShell>;
  }
  if (project === null) {
    return (
      <RadarShell active="/radar/projects" title="Project not found">
        <Link href="/radar/projects" className="text-gold underline">Back to projects</Link>
      </RadarShell>
    );
  }

  return (
    <RadarShell active="/radar/projects">
      <div className="radar-card mb-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-ink/45">
              <Landmark size={14} /> {PROJECT_TYPE_LABEL[project.project_type]} · {project.authority}
            </p>
            <h1 className="lx-display mt-1 text-4xl font-light leading-tight text-ink">{project.name}</h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <ProjectStatusBadge status={project.status} />
            <WatchlistButton entityType="project" entityId={project.id} entityName={project.name} />
          </div>
        </div>

        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-ink/75">{project.description}</p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <SourceReliabilityBadge sourceType={project.source_type} reliability={project.reliability_score} />
          {project.stale ? <span className="rounded-xl border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.1em] text-red-700">Source may be stale</span> : null}
          {project.source_url ? (
            <a href={project.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink/70 hover:text-gold">
              Official source <ArrowUpRight size={12} />
            </a>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <Fact label="Budget" value={project.budget_amount ? `₹${project.budget_amount.toLocaleString("en-IN")} cr` : "—"} icon={<IndianRupee size={13} />} />
          <Fact label="Start" value={project.start_date ?? "—"} icon={<CalendarClock size={13} />} />
          <Fact label="Expected" value={project.expected_completion_date ?? "—"} icon={<CalendarClock size={13} />} />
          <Fact label="Last verified" value={project.last_verified_at ?? project.source_date ?? "—"} icon={<CalendarClock size={13} />} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="radar-card p-5">
          <h3 className="lx-display text-xl font-light text-ink">Property & locality impact</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-ink/65">{project.impact_summary}</p>
          {project.impact_categories.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {project.impact_categories.map((c) => <span key={c} className="rounded-xl bg-ink/[0.05] px-2 py-0.5 text-[11px] font-medium text-ink/65">{c}</span>)}
            </div>
          ) : null}
        </div>
        <div className="radar-card p-5">
          <h3 className="lx-display text-xl font-light text-ink">Risks</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-ink/65">{project.risk_summary || "No specific risks recorded."}</p>
        </div>
      </div>

      {project.impacts.length ? (
        <>
          <h2 className="lx-display mb-3 mt-9 text-2xl font-light text-ink">Affected localities</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {project.impacts.map((imp, i) => (
              <div key={`${imp.locality_id}-${i}`} className="radar-card p-5">
                <div className="flex items-center justify-between">
                  <Link href={`/radar/localities/${imp.locality_id}`} className="lx-display text-xl font-light text-ink hover:text-gold">{imp.locality_name ?? imp.locality_id}</Link>
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold">{HORIZON_LABEL[imp.time_horizon]}</span>
                </div>
                <div className="mt-2"><ScoreBar value={imp.impact_score} label={`${imp.impact_type} impact`} /></div>
                {imp.distance_km ? <p className="mt-1 text-[12px] text-ink/50">~{imp.distance_km} km away</p> : null}
                <p className="mt-2 text-[13px] leading-relaxed text-ink/70">{imp.explanation}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
                  <div>
                    <span className="font-bold uppercase tracking-[0.1em] text-emerald-700">+ Positive</span>
                    <ul className="mt-0.5 list-disc pl-4 text-ink/65">{imp.positive_factors.map((f) => <li key={f}>{f}</li>)}</ul>
                  </div>
                  <div>
                    <span className="font-bold uppercase tracking-[0.1em] text-red-700">− Negative</span>
                    <ul className="mt-0.5 list-disc pl-4 text-ink/65">{imp.negative_factors.map((f) => <li key={f}>{f}</li>)}</ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {project.claims.length ? <div className="mt-9"><EvidencePanel claims={project.claims} title="Related claims & sources" /></div> : null}

      <RadarDisclaimer className="mt-8" />
    </RadarShell>
  );
}

function Fact({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-ink/[0.02] p-3">
      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink/45">{icon}{label}</span>
      <span className="mt-0.5 block text-[14px] font-semibold text-ink">{value}</span>
    </div>
  );
}
