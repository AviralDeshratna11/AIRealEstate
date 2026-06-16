"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Bell, Database, FileText, Play, RefreshCw } from "lucide-react";
import {
  PROJECT_TYPE_LABEL,
  getInfrastructureCorridors,
  getLocalityReport,
  getRadarAlerts,
  getRadarAuditLog,
  getRadarLocalities,
  getRadarMap,
  getRadarProjects,
  getRadarWatchlist,
  getRedevelopmentZones,
  runRadarIngestion,
  subscribeAlert,
  type AuditEvent,
  type IngestionJob,
  type LocalityReport,
  type ProjectStatus,
  type ProjectType,
  type RadarAlert,
  type RadarLocality,
  type RadarMapResponse,
  type RadarProject,
  type RadarRedevelopmentZone,
  type RadarZone,
  type WatchlistItem,
} from "@/lib/radar";
import { RadarShell } from "./RadarShell";
import { ProjectStatusBadge, RadarDisclaimer } from "./primitives";
import { LocalityScoreCard, ProjectCard, RedevelopmentZoneCard } from "./cards";
import { RadarMap } from "./RadarMap";
import { EvidencePanel } from "./evidence";

const ZONES: RadarZone[] = ["South Mumbai", "Central Mumbai", "Western Suburbs", "Eastern Suburbs", "Thane", "Navi Mumbai", "MMR Growth Belt"];

// --------------------------------------------------------------------------- //
export function LocalitiesListView() {
  const [list, setList] = useState<RadarLocality[]>([]);
  const [zone, setZone] = useState<RadarZone | "all">("all");
  const [sort, setSort] = useState<"future" | "investment" | "redevelopment" | "risk">("future");

  useEffect(() => { getRadarLocalities().then(setList); }, []);

  const filtered = useMemo(() => {
    let out = zone === "all" ? list : list.filter((l) => l.zone === zone);
    out = [...out].sort((a, b) => {
      if (sort === "future") return b.scores.future_score - a.scores.future_score;
      if (sort === "investment") return b.scores.investment_score - a.scores.investment_score;
      if (sort === "redevelopment") return b.scores.redevelopment_score - a.scores.redevelopment_score;
      return b.scores.execution_risk_score - a.scores.execution_risk_score;
    });
    return out;
  }, [list, zone, sort]);

  return (
    <RadarShell active="/radar/localities" title="Localities" subtitle="Every tracked Mumbai/MMR locality with its explainable Future Score and risk profile.">
      <div className="radar-card mb-6 flex flex-wrap items-center gap-3 p-4">
        <Filter label="Zone" value={zone} onChange={(v) => setZone(v as RadarZone | "all")} options={[["all", "All zones"], ...ZONES.map((z) => [z, z] as [string, string])]} />
        <Filter label="Sort by" value={sort} onChange={(v) => setSort(v as typeof sort)} options={[["future", "Future Score"], ["investment", "Investment"], ["redevelopment", "Redevelopment"], ["risk", "Execution risk"]]} />
        <span className="ml-auto text-[12px] text-ink/50">{filtered.length} localities</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((l) => <LocalityScoreCard key={l.id} locality={l} />)}
      </div>
      <RadarDisclaimer className="mt-8" />
    </RadarShell>
  );
}

// --------------------------------------------------------------------------- //
export function ProjectsListView() {
  const [list, setList] = useState<RadarProject[]>([]);
  const [type, setType] = useState<ProjectType | "all">("all");
  const [status, setStatus] = useState<ProjectStatus | "all">("all");

  useEffect(() => { getRadarProjects().then(setList); }, []);

  const filtered = list
    .filter((p) => type === "all" || p.project_type === type)
    .filter((p) => status === "all" || p.status === status);

  const types = Array.from(new Set(list.map((p) => p.project_type)));
  const statuses = Array.from(new Set(list.map((p) => p.status)));

  return (
    <RadarShell active="/radar/projects" title="Government & infrastructure projects" subtitle="Metro, rail, road, coastal, airport, new-town and redevelopment projects — each with status, source and locality impact.">
      <div className="radar-card mb-6 flex flex-wrap items-center gap-3 p-4">
        <Filter label="Type" value={type} onChange={(v) => setType(v as ProjectType | "all")} options={[["all", "All types"], ...types.map((t) => [t, PROJECT_TYPE_LABEL[t]] as [string, string])]} />
        <Filter label="Status" value={status} onChange={(v) => setStatus(v as ProjectStatus | "all")} options={[["all", "All statuses"], ...statuses.map((s) => [s, s.replace(/_/g, " ")] as [string, string])]} />
        <span className="ml-auto text-[12px] text-ink/50">{filtered.length} projects</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => <ProjectCard key={p.id} project={p} />)}
      </div>
      <RadarDisclaimer className="mt-8" />
    </RadarShell>
  );
}

// --------------------------------------------------------------------------- //
export function InfrastructureView() {
  const [list, setList] = useState<RadarProject[]>([]);
  useEffect(() => { getInfrastructureCorridors().then(setList); }, []);
  return (
    <RadarShell active="/radar/infrastructure" title="Infrastructure corridors" subtitle="Transit, road, rail, coastal and airport projects reshaping commute, catchment and connectivity across MMR.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((p) => <ProjectCard key={p.id} project={p} />)}
      </div>
      <RadarDisclaimer className="mt-8" />
    </RadarShell>
  );
}

// --------------------------------------------------------------------------- //
export function RedevelopmentView() {
  const [zones, setZones] = useState<RadarRedevelopmentZone[]>([]);
  useEffect(() => { getRedevelopmentZones().then(setZones); }, []);
  return (
    <RadarShell active="/radar/redevelopment" title="Redevelopment zones" subtitle="MHADA, SRA, BDD chawl, cessed-building, cluster and old-society redevelopment — opportunity weighed against execution and oversupply risk.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {zones.map((z) => <RedevelopmentZoneCard key={z.id} zone={z} />)}
      </div>
      <RadarDisclaimer className="mt-8" />
    </RadarShell>
  );
}

// --------------------------------------------------------------------------- //
export function RadarMapPageView() {
  const [data, setData] = useState<RadarMapResponse | null>(null);
  useEffect(() => { getRadarMap().then(setData); }, []);
  return (
    <RadarShell active="/radar/map" wide title="Mumbai growth radar map" subtitle="Localities colour-coded by signal and sized by Future Score. Toggle infrastructure, redevelopment and demand/risk layers.">
      {data ? <RadarMap data={data} /> : <div className="radar-card p-8 text-ink/50">Loading map…</div>}
      <RadarDisclaimer className="mt-6" />
    </RadarShell>
  );
}

// --------------------------------------------------------------------------- //
export function WatchlistView() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  useEffect(() => { getRadarWatchlist().then(setItems); }, []);
  return (
    <RadarShell active="/radar/watchlist" title="Watchlist" subtitle="Localities, projects and redevelopment zones you are tracking. Add items from any locality or project page.">
      {items.length === 0 ? (
        <div className="radar-card p-8 text-center text-ink/55">
          <p className="text-[15px]">Nothing watched yet.</p>
          <Link href="/radar/localities" className="mt-2 inline-block text-gold underline">Browse localities to start watching →</Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <Link
              key={it.id}
              href={it.entity_type === "project" ? `/radar/projects/${it.entity_id}` : `/radar/localities/${it.entity_id}`}
              className="radar-card flex items-center justify-between gap-2 p-4 transition hover:-translate-y-0.5"
            >
              <span>
                <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-ink/45">{it.entity_type}</span>
                <span className="block text-[15px] font-semibold text-ink">{it.entity_name ?? it.entity_id}</span>
                <span className="block text-[12px] text-ink/50">{it.alert_type.replace(/_/g, " ")}</span>
              </span>
              <Bell size={16} className="text-gold" />
            </Link>
          ))}
        </div>
      )}
      <RadarDisclaimer className="mt-8" />
    </RadarShell>
  );
}

// --------------------------------------------------------------------------- //
export function AlertsView() {
  const [alerts, setAlerts] = useState<RadarAlert[]>([]);
  useEffect(() => { getRadarAlerts().then(setAlerts); }, []);
  return (
    <RadarShell active="/radar/alerts" title="Radar alerts" subtitle="Project status changes, new redevelopment signals, demand spikes and risk warnings across watched entities.">
      <div className="space-y-3">
        {alerts.map((a) => (
          <div key={a.id} className="radar-card flex items-start gap-3 p-4">
            <span className={clsx("mt-1 h-3 w-3 shrink-0 rounded-full", a.priority === "high" ? "bg-red-500" : a.priority === "medium" ? "bg-amber-500" : "bg-stone-400")} />
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[15px] font-semibold text-ink">{a.title}</h3>
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/40">{a.alert_type.replace(/_/g, " ")}{a.created_at ? ` · ${a.created_at}` : ""}</span>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-ink/65">{a.message}</p>
              <div className="mt-2 flex gap-3 text-[12px]">
                {a.locality_id ? <Link href={`/radar/localities/${a.locality_id}`} className="font-semibold text-gold hover:underline">View locality</Link> : null}
                {a.project_id ? <Link href={`/radar/projects/${a.project_id}`} className="font-semibold text-gold hover:underline">View project</Link> : null}
              </div>
            </div>
            {a.status === "unread" ? <span className="rounded-[3px] bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ivory">New</span> : null}
          </div>
        ))}
      </div>
      <RadarDisclaimer className="mt-8" />
    </RadarShell>
  );
}

// --------------------------------------------------------------------------- //
export function ReportsView() {
  const [list, setList] = useState<RadarLocality[]>([]);
  const [slug, setSlug] = useState<string>("");
  const [report, setReport] = useState<LocalityReport | null>(null);

  useEffect(() => {
    getRadarLocalities().then((l) => { setList(l); if (l[0]) setSlug(l[0].slug); });
  }, []);
  useEffect(() => { if (slug) getLocalityReport(slug).then(setReport); }, [slug]);

  return (
    <RadarShell active="/radar/reports" title="Locality reports" subtitle="Generate an evidence-backed future-intelligence report for any locality — shareable with buyers, investors and brokers.">
      <div className="radar-card mb-6 flex flex-wrap items-center gap-3 p-4">
        <Filter label="Locality" value={slug} onChange={setSlug} options={list.map((l) => [l.slug, l.name] as [string, string])} />
        {report ? (
          <button type="button" onClick={() => typeof window !== "undefined" && window.print()} className="ml-auto inline-flex items-center gap-1.5 rounded-[3px] border border-ink/20 px-3 py-1.5 text-[12px] font-semibold text-ink hover:bg-ink/5">
            <FileText size={13} /> Print / PDF
          </button>
        ) : null}
      </div>

      {report ? (
        <article className="radar-card p-6">
          <p className="radar-kicker">{report.generated_at}</p>
          <h2 className="lx-display mt-1 text-3xl font-light text-ink">{report.title}</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink/75">{report.summary}</p>
          <div className="mt-5 space-y-4">
            {report.sections.map((sec, i) => (
              <div key={i}>
                <h3 className="text-[13px] font-bold uppercase tracking-[0.12em] text-gold">{String(sec.heading ?? "")}</h3>
                <p className="mt-1 text-[14px] leading-relaxed text-ink/75">{String(sec.body ?? "")}</p>
              </div>
            ))}
          </div>
          {report.evidence.length ? <div className="mt-6"><EvidencePanel claims={report.evidence} title="Evidence" /></div> : null}
          <p className="mt-5 rounded-[3px] border border-ink/12 bg-ink/[0.03] p-3 text-[12px] italic text-ink/55">{report.disclaimer}</p>
        </article>
      ) : <div className="radar-card p-8 text-ink/50">Select a locality…</div>}
    </RadarShell>
  );
}

// --------------------------------------------------------------------------- //
export function AdminView() {
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [localities, setLocalities] = useState<RadarLocality[]>([]);
  const [subSlug, setSubSlug] = useState("");
  const [subMsg, setSubMsg] = useState("");

  useEffect(() => {
    getRadarAuditLog().then(setAudit);
    getRadarLocalities().then((l) => { setLocalities(l); if (l[0]) setSubSlug(l[0].slug); });
  }, []);

  async function runIngest() {
    setBusy(true);
    try {
      setJobs(await runRadarIngestion());
      setAudit(await getRadarAuditLog());
    } finally {
      setBusy(false);
    }
  }

  async function subscribe() {
    const a = await subscribeAlert({ locality_slug: subSlug });
    setSubMsg(`Subscribed: ${a.title}`);
  }

  return (
    <RadarShell active="/radar/admin" title="Radar admin & ingestion" subtitle="Run source ingestion, subscribe to alerts and review the audit trail. Every material change is logged.">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="radar-card p-5">
          <div className="mb-2 flex items-center gap-2">
            <Database size={16} className="text-gold" />
            <h3 className="lx-display text-xl font-light text-ink">Source ingestion</h3>
          </div>
          <p className="text-[13px] text-ink/60">Pull the latest official project records (MMRDA, BMC, MHADA, CIDCO, MRVC, RERA), re-verify sources and re-score affected localities.</p>
          <button type="button" onClick={runIngest} disabled={busy} className="mt-3 inline-flex items-center gap-1.5 rounded-[3px] bg-ink px-4 py-2 text-[13px] font-semibold text-ivory hover:bg-ink/85 disabled:opacity-60">
            {busy ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />} {busy ? "Ingesting…" : "Run ingestion"}
          </button>
          {jobs.length ? (
            <ul className="mt-4 space-y-2">
              {jobs.map((j) => (
                <li key={j.id} className="rounded-[3px] border border-ink/10 bg-ink/[0.02] p-3 text-[13px]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink">{j.source_name}</span>
                    <ProjectStatusBadge status={(j.status === "completed" ? "operational" : "under_construction") as ProjectStatus} />
                  </div>
                  <span className="text-[12px] text-ink/55">Found {j.records_found} · created {j.records_created} · updated {j.records_updated}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="radar-card p-5">
          <div className="mb-2 flex items-center gap-2">
            <Bell size={16} className="text-gold" />
            <h3 className="lx-display text-xl font-light text-ink">Subscribe to alerts</h3>
          </div>
          <Filter label="Locality" value={subSlug} onChange={setSubSlug} options={localities.map((l) => [l.slug, l.name] as [string, string])} />
          <button type="button" onClick={subscribe} className="mt-3 inline-flex items-center gap-1.5 rounded-[3px] border border-ink/20 px-4 py-2 text-[13px] font-semibold text-ink hover:bg-ink/5">
            Subscribe
          </button>
          {subMsg ? <p className="mt-2 text-[13px] text-emerald-700">{subMsg}</p> : null}
        </div>
      </div>

      <h2 className="lx-display mb-3 mt-8 text-2xl font-light text-ink">Audit log</h2>
      <div className="radar-card p-5">
        <ul className="divide-y divide-ink/8">
          {audit.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[13px]">
              <span>
                <span className="font-semibold text-ink">{e.action.replace(/_/g, " ")}</span>
                {e.entity_id ? <span className="text-ink/55"> · {e.entity_type}/{e.entity_id}</span> : null}
                {e.detail ? <span className="block text-[12px] text-ink/55">{e.detail}</span> : null}
              </span>
              <span className="text-[11px] uppercase tracking-[0.12em] text-ink/40">{e.actor}{e.created_at ? ` · ${e.created_at}` : ""}</span>
            </li>
          ))}
        </ul>
      </div>
    </RadarShell>
  );
}

// --------------------------------------------------------------------------- //
function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: Array<[string, string]> }) {
  return (
    <label className="flex items-center gap-2 text-[12px]">
      <span className="font-bold uppercase tracking-[0.12em] text-ink/45">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-[3px] border border-ink/15 bg-ivory px-2 py-1.5 text-[13px] text-ink outline-none focus:border-gold">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
