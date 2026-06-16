// Mumbai Redevelopment Radar — frontend types + API client.
//
// Mirrors backend/app/radar_models.py. Every API call degrades gracefully to the
// bundled demo dataset (lib/radar-demo.ts) so /radar works with no backend.
//
// Safety contract (mirrors backend): the UI must never present guaranteed
// appreciation. Always surface status, confidence and source on Radar claims.

import { apiFetch } from "@/lib/api/client";
import {
  DEMO_RADAR_ALERTS,
  DEMO_RADAR_AUDIT,
  DEMO_RADAR_DASHBOARD,
  DEMO_RADAR_LOCALITIES,
  DEMO_RADAR_PROJECTS,
  DEMO_RADAR_ZONES,
  buildDemoCompare,
  buildDemoLocalityDetail,
  buildDemoMap,
  buildDemoPropertyCard,
  buildDemoReport,
  demoAnalyzeLocality,
} from "@/lib/radar-demo";

export const RADAR_DISCLAIMER =
  "Decision support, not investment advice or a guarantee. Project timelines and impacts depend on government approvals and execution risk. Verify with official sources.";

// --------------------------------------------------------------------------- //
// Enumerated unions
// --------------------------------------------------------------------------- //
export type RadarZone =
  | "South Mumbai"
  | "Central Mumbai"
  | "Western Suburbs"
  | "Eastern Suburbs"
  | "Thane"
  | "Navi Mumbai"
  | "MMR Growth Belt";

export type ProjectType =
  | "metro" | "rail" | "road" | "bridge" | "tunnel" | "coastal" | "airport"
  | "new_town" | "business_park" | "redevelopment" | "slum_redevelopment"
  | "mhada" | "sra" | "dp_road" | "public_realm" | "zoning" | "commercial_hub";

export type ProjectStatus =
  | "proposed" | "approved" | "tendering" | "under_construction"
  | "partially_operational" | "operational" | "delayed" | "stalled" | "cancelled";

export type ZoneType =
  | "cluster_redevelopment" | "sra" | "mhada" | "bdd" | "cessed_building"
  | "old_society" | "slum_cluster" | "industrial_conversion" | "government_layout";

export type SourceType = "official" | "news" | "internal" | "document" | "manual";

export type ClaimStatus = "verified" | "likely" | "unverified" | "disputed" | "outdated";

export type TimeHorizon = "0-1y" | "1-3y" | "3-5y" | "5-10y";

export type LocalitySignal =
  | "growth"        // emerald
  | "connectivity"  // blue
  | "redevelopment" // purple
  | "premium"       // gold
  | "speculative"   // orange
  | "risk"          // red
  | "insufficient"; // gray

// --------------------------------------------------------------------------- //
// Core entities
// --------------------------------------------------------------------------- //
export type ScoreInput = {
  label: string;
  value: number;
  weight?: number | null;
  source_type?: SourceType;
  reliability?: number;
  note?: string | null;
};

export type ScoreBreakdown = {
  key: string;
  label: string;
  score: number;
  weight: number;
  confidence: number;
  reason: string;
  inputs: ScoreInput[];
  last_updated?: string | null;
};

export type LocalityScores = {
  future_score: number;
  confidence_score: number;
  infrastructure_score: number;
  redevelopment_score: number;
  connectivity_score: number;
  government_confidence_score: number;
  livability_score: number;
  employment_score: number;
  rental_demand_score: number;
  investment_score: number;
  market_demand_score: number;
  execution_risk_score: number;
  disruption_risk_score: number;
  affordability_risk_score: number;
  oversupply_risk_score: number;
  self_use_score: number;
  breakdown: ScoreBreakdown[];
};

export type RadarClaim = {
  id: string;
  claim_text: string;
  claim_type: string;
  entity_type: "locality" | "project" | "property" | "zone";
  entity_id?: string | null;
  locality_id?: string | null;
  project_id?: string | null;
  property_id?: string | null;
  source_url?: string | null;
  source_name?: string | null;
  source_type: SourceType;
  source_date?: string | null;
  extracted_at?: string | null;
  status: ClaimStatus;
  confidence_score: number;
  reliability_score: number;
  evidence_snippet?: string | null;
  last_checked_at?: string | null;
};

export type ProjectLocalityImpact = {
  id?: string | null;
  project_id: string;
  locality_id: string;
  locality_name?: string | null;
  impact_type: string;
  impact_score: number;
  time_horizon: TimeHorizon;
  distance_km?: number | null;
  explanation: string;
  positive_factors: string[];
  negative_factors: string[];
  confidence_score: number;
};

export type RadarProject = {
  id: string;
  name: string;
  slug: string;
  project_type: ProjectType;
  authority: string;
  status: ProjectStatus;
  description: string;
  budget_amount?: number | null;
  start_date?: string | null;
  expected_completion_date?: string | null;
  actual_completion_date?: string | null;
  source_url?: string | null;
  source_type: SourceType;
  source_date?: string | null;
  reliability_score: number;
  confidence_score: number;
  last_verified_at?: string | null;
  stale: boolean;
  geometry_geojson?: Record<string, unknown> | null;
  affected_localities: string[];
  impact_categories: string[];
  impact_summary: string;
  risk_summary: string;
  impacts: ProjectLocalityImpact[];
  claims: RadarClaim[];
};

export type RadarRedevelopmentZone = {
  id: string;
  name: string;
  slug: string;
  locality_id?: string | null;
  locality_name?: string | null;
  zone_type: ZoneType;
  authority: string;
  status: ProjectStatus;
  area_acres?: number | null;
  estimated_units?: number | null;
  developer_name?: string | null;
  scheme_type?: string | null;
  source_url?: string | null;
  source_type: SourceType;
  geometry_geojson?: Record<string, unknown> | null;
  opportunity_score: number;
  risk_score: number;
  confidence_score: number;
  notes: string;
};

export type TimelineMilestone = {
  horizon: TimeHorizon;
  project_id?: string | null;
  title: string;
  effect: string;
  uncertainty: "low" | "medium" | "high";
  micro_markets: string[];
};

export type OpportunityNote = { persona: string; headline: string; detail: string };
export type RiskNote = { kind: string; severity: "low" | "medium" | "high"; detail: string; confidence: number };
export type SuggestedAction = { role: string; label: string; detail: string; href?: string | null };

export type RadarLocality = {
  id: string;
  slug: string;
  name: string;
  zone: RadarZone;
  city: string;
  latitude: number;
  longitude: number;
  boundary_geojson?: Record<string, unknown> | null;
  signal: LocalitySignal;
  summary: string;
  headline_catalysts: string[];
  headline_risks: string[];
  price_psf?: number | null;
  price_trend_pct?: number | null;
  rental_yield_pct?: number | null;
  scores: LocalityScores;
  last_scored_at?: string | null;
};

export type LocalityDetail = {
  locality: RadarLocality;
  timeline: TimelineMilestone[];
  projects: RadarProject[];
  redevelopment_zones: RadarRedevelopmentZone[];
  opportunities: OpportunityNote[];
  risks: RiskNote[];
  actions: SuggestedAction[];
  claims: RadarClaim[];
  related_property_ids: string[];
};

export type WatchlistItem = {
  id: string;
  user_id?: string | null;
  entity_type: "locality" | "project" | "property" | "zone";
  entity_id: string;
  entity_name?: string | null;
  alert_type: string;
  status: string;
  created_at?: string | null;
};

export type RadarAlert = {
  id: string;
  user_id?: string | null;
  locality_id?: string | null;
  project_id?: string | null;
  property_id?: string | null;
  alert_type: string;
  title: string;
  message: string;
  priority: "low" | "medium" | "high";
  status: "unread" | "read";
  created_at?: string | null;
  read_at?: string | null;
};

export type MapLocalityFeature = {
  id: string;
  slug: string;
  name: string;
  zone: RadarZone;
  latitude: number;
  longitude: number;
  signal: LocalitySignal;
  future_score: number;
  boundary_geojson?: Record<string, unknown> | null;
  top_catalysts: string[];
  top_risks: string[];
};

export type MapLayer = {
  key: string;
  label: string;
  kind: "localities" | "projects" | "zones" | "properties" | "heatmap";
  color: string;
  features: Array<Record<string, unknown>>;
};

export type RadarMapResponse = {
  center: [number, number];
  zoom: number;
  localities: MapLocalityFeature[];
  layers: MapLayer[];
};

export type DashboardStat = { label: string; value: string; detail?: string | null; tone: string };

export type RadarDashboard = {
  stats: DashboardStat[];
  top_growth: RadarLocality[];
  top_redevelopment: RadarLocality[];
  watch_risk: RadarLocality[];
  active_projects: RadarProject[];
  recent_alerts: RadarAlert[];
  last_updated?: string | null;
};

export type CompareVerdict = { label: string; winner_slug: string; reason: string };
export type CompareResponse = { localities: RadarLocality[]; verdicts: CompareVerdict[]; narrative: string };

export type AnalyzeLocalityResponse = {
  locality_slug: string;
  role: string;
  answer: string;
  confidence_score: number;
  recommendation: string;
  opportunities: OpportunityNote[];
  risks: RiskNote[];
  actions: SuggestedAction[];
  evidence: RadarClaim[];
  audit_events: string[];
};

export type LocalityReport = {
  locality_slug: string;
  title: string;
  generated_at?: string | null;
  summary: string;
  sections: Array<Record<string, unknown>>;
  evidence: RadarClaim[];
  disclaimer: string;
};

export type PropertyRadarCard = {
  property_id: string;
  locality_slug?: string | null;
  locality_name?: string | null;
  future_score: number;
  confidence_score: number;
  signal: LocalitySignal;
  nearest_catalyst?: string | null;
  nearest_catalyst_distance_km?: number | null;
  connectivity_uplift?: string | null;
  redevelopment_momentum?: string | null;
  livability_improvement?: string | null;
  major_risks: string[];
  timeline: TimelineMilestone[];
  summary: string;
  investor_view: Record<string, unknown>;
  family_view: Record<string, unknown>;
  broker_pitch: string[];
  manager_positioning: string[];
  similar_property_ids: string[];
  evidence: RadarClaim[];
};

export type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  detail?: string | null;
  created_at?: string | null;
};

export type IngestionJob = {
  id: string;
  source_name: string;
  source_url?: string | null;
  job_type: string;
  status: "queued" | "running" | "completed" | "failed";
  records_found: number;
  records_created: number;
  records_updated: number;
  error_message?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
};

// --------------------------------------------------------------------------- //
// Display helpers
// --------------------------------------------------------------------------- //
export const SIGNAL_META: Record<LocalitySignal, { label: string; color: string; ring: string; chip: string }> = {
  growth:        { label: "Confirmed growth",      color: "#0f9d6b", ring: "rgba(15,157,107,0.4)",  chip: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  connectivity:  { label: "Connectivity uplift",   color: "#2563eb", ring: "rgba(37,99,235,0.35)",  chip: "bg-blue-50 text-blue-700 border-blue-200" },
  redevelopment: { label: "Redevelopment momentum",color: "#7c3aed", ring: "rgba(124,58,237,0.35)", chip: "bg-purple-50 text-purple-700 border-purple-200" },
  premium:       { label: "Premiumization",        color: "#a8813c", ring: "rgba(168,129,60,0.4)",  chip: "bg-amber-50 text-amber-800 border-amber-200" },
  speculative:   { label: "Speculative upside",    color: "#ea7317", ring: "rgba(234,115,23,0.35)", chip: "bg-orange-50 text-orange-700 border-orange-200" },
  risk:          { label: "High execution risk",   color: "#d6532c", ring: "rgba(214,83,44,0.35)",  chip: "bg-red-50 text-red-700 border-red-200" },
  insufficient:  { label: "Insufficient data",     color: "#8a8170", ring: "rgba(138,129,112,0.3)", chip: "bg-stone-100 text-stone-600 border-stone-300" },
};

export const STATUS_META: Record<ProjectStatus, { label: string; tone: string }> = {
  proposed:               { label: "Proposed",                tone: "bg-stone-100 text-stone-600 border-stone-300" },
  approved:               { label: "Approved",                tone: "bg-blue-50 text-blue-700 border-blue-200" },
  tendering:              { label: "Tendering",               tone: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  under_construction:     { label: "Under construction",      tone: "bg-amber-50 text-amber-800 border-amber-200" },
  partially_operational:  { label: "Partially operational",   tone: "bg-teal-50 text-teal-700 border-teal-200" },
  operational:            { label: "Operational",             tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  delayed:                { label: "Delayed",                 tone: "bg-orange-50 text-orange-700 border-orange-200" },
  stalled:                { label: "Stalled",                 tone: "bg-red-50 text-red-700 border-red-200" },
  cancelled:              { label: "Cancelled",               tone: "bg-stone-200 text-stone-500 border-stone-300 line-through" },
};

export const SOURCE_META: Record<SourceType, { label: string; tone: string }> = {
  official: { label: "Official source", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  news:     { label: "News report",     tone: "bg-blue-50 text-blue-700 border-blue-200" },
  internal: { label: "ASTRA signal",    tone: "bg-purple-50 text-purple-700 border-purple-200" },
  document: { label: "Document",        tone: "bg-amber-50 text-amber-800 border-amber-200" },
  manual:   { label: "Manual entry",    tone: "bg-stone-100 text-stone-600 border-stone-300" },
};

export const CLAIM_META: Record<ClaimStatus, { label: string; tone: string }> = {
  verified:   { label: "Verified",   tone: "text-emerald-700" },
  likely:     { label: "Likely",     tone: "text-blue-700" },
  unverified: { label: "Unverified", tone: "text-stone-500" },
  disputed:   { label: "Disputed",   tone: "text-orange-700" },
  outdated:   { label: "Outdated",   tone: "text-red-700" },
};

export const HORIZON_LABEL: Record<TimeHorizon, string> = {
  "0-1y": "0–1 year",
  "1-3y": "1–3 years",
  "3-5y": "3–5 years",
  "5-10y": "5–10 years",
};

export function scoreTone(score: number): string {
  if (score >= 75) return "#0f9d6b";
  if (score >= 60) return "#a8813c";
  if (score >= 45) return "#ea7317";
  return "#d6532c";
}

export function confidenceLabel(c: number): string {
  if (c >= 0.8) return "High confidence";
  if (c >= 0.6) return "Moderate confidence";
  if (c >= 0.4) return "Low confidence";
  return "Speculative";
}

export const PROJECT_TYPE_LABEL: Record<ProjectType, string> = {
  metro: "Metro", rail: "Suburban rail", road: "Road", bridge: "Bridge", tunnel: "Tunnel",
  coastal: "Coastal road", airport: "Airport", new_town: "New town", business_park: "Business park",
  redevelopment: "Redevelopment", slum_redevelopment: "Slum redevelopment", mhada: "MHADA",
  sra: "SRA", dp_road: "DP road", public_realm: "Public realm", zoning: "Zoning", commercial_hub: "Commercial hub",
};

// --------------------------------------------------------------------------- //
// API client (with demo fallback)
// --------------------------------------------------------------------------- //
async function getPublic<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: "GET" }, { public: true });
}
async function postPublic<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) }, { public: true });
}

export async function getRadarDashboard(): Promise<RadarDashboard> {
  try {
    return await getPublic<RadarDashboard>("/api/radar/dashboard");
  } catch {
    return DEMO_RADAR_DASHBOARD;
  }
}

export async function getRadarLocalities(): Promise<RadarLocality[]> {
  try {
    return await getPublic<RadarLocality[]>("/api/radar/localities");
  } catch {
    return DEMO_RADAR_LOCALITIES;
  }
}

export async function getRadarLocality(slug: string): Promise<LocalityDetail> {
  try {
    return await getPublic<LocalityDetail>(`/api/radar/localities/${slug}`);
  } catch {
    return buildDemoLocalityDetail(slug);
  }
}

export async function getRadarScores(slug: string): Promise<LocalityScores> {
  try {
    return await getPublic<LocalityScores>(`/api/radar/scores/${slug}`);
  } catch {
    return buildDemoLocalityDetail(slug).locality.scores;
  }
}

export async function getRadarProjects(): Promise<RadarProject[]> {
  try {
    return await getPublic<RadarProject[]>("/api/radar/projects");
  } catch {
    return DEMO_RADAR_PROJECTS;
  }
}

export async function getRadarProject(id: string): Promise<RadarProject | null> {
  try {
    return await getPublic<RadarProject>(`/api/radar/projects/${id}`);
  } catch {
    return DEMO_RADAR_PROJECTS.find((p) => p.id === id || p.slug === id) ?? null;
  }
}

export async function getRadarMap(): Promise<RadarMapResponse> {
  try {
    return await getPublic<RadarMapResponse>("/api/radar/map");
  } catch {
    return buildDemoMap();
  }
}

export async function getRedevelopmentZones(): Promise<RadarRedevelopmentZone[]> {
  try {
    return await getPublic<RadarRedevelopmentZone[]>("/api/radar/redevelopment-zones");
  } catch {
    return DEMO_RADAR_ZONES;
  }
}

export async function getInfrastructureCorridors(): Promise<RadarProject[]> {
  try {
    return await getPublic<RadarProject[]>("/api/radar/infrastructure-corridors");
  } catch {
    const kinds: ProjectType[] = ["metro", "rail", "road", "bridge", "tunnel", "coastal", "airport"];
    return DEMO_RADAR_PROJECTS.filter((p) => kinds.includes(p.project_type));
  }
}

export async function compareLocalities(slugs: string[], timeHorizon?: TimeHorizon): Promise<CompareResponse> {
  try {
    return await postPublic<CompareResponse>("/api/radar/compare-localities", {
      locality_slugs: slugs,
      time_horizon: timeHorizon ?? null,
    });
  } catch {
    return buildDemoCompare(slugs);
  }
}

export async function analyzeLocality(input: {
  locality_slug: string;
  role?: string;
  investment_goal?: string;
  risk_tolerance?: string;
  time_horizon?: TimeHorizon;
  query?: string;
}): Promise<AnalyzeLocalityResponse> {
  try {
    return await postPublic<AnalyzeLocalityResponse>("/api/radar/analyze-locality", {
      role: "buyer",
      ...input,
    });
  } catch {
    return demoAnalyzeLocality(input.locality_slug, input.role ?? "buyer", input.query);
  }
}

export async function getLocalityReport(slug: string): Promise<LocalityReport> {
  try {
    return await getPublic<LocalityReport>(`/api/radar/reports/${slug}`);
  } catch {
    return buildDemoReport(slug);
  }
}

export async function getPropertyRadarCard(propertyId: string, localityName?: string): Promise<PropertyRadarCard> {
  try {
    const q = localityName ? `?locality=${encodeURIComponent(localityName)}` : "";
    return await getPublic<PropertyRadarCard>(`/api/radar/property/${propertyId}${q}`);
  } catch {
    return buildDemoPropertyCard(propertyId, localityName);
  }
}

export async function getRadarWatchlist(): Promise<WatchlistItem[]> {
  try {
    return await getPublic<WatchlistItem[]>("/api/radar/watchlist");
  } catch {
    return readLocalWatchlist();
  }
}

export async function addToWatchlist(input: {
  entity_type: WatchlistItem["entity_type"];
  entity_id: string;
  entity_name?: string;
  alert_type?: string;
}): Promise<WatchlistItem> {
  try {
    return await postPublic<WatchlistItem>("/api/radar/watchlist", input);
  } catch {
    return writeLocalWatchlist(input);
  }
}

export async function getRadarAlerts(): Promise<RadarAlert[]> {
  try {
    return await getPublic<RadarAlert[]>("/api/radar/alerts");
  } catch {
    return DEMO_RADAR_ALERTS;
  }
}

export async function subscribeAlert(input: { locality_slug?: string; project_id?: string; alert_type?: string }): Promise<RadarAlert> {
  try {
    return await postPublic<RadarAlert>("/api/radar/alerts", { alert_type: "any_update", ...input });
  } catch {
    return {
      id: `local-alert-${input.locality_slug ?? input.project_id ?? "x"}`,
      alert_type: input.alert_type ?? "any_update",
      title: "Alert subscription saved (offline)",
      message: "We will notify you here when this entity changes. Backend offline — saved locally.",
      priority: "low",
      status: "unread",
      locality_id: input.locality_slug ?? null,
      project_id: input.project_id ?? null,
    };
  }
}

export async function getRadarAuditLog(): Promise<AuditEvent[]> {
  try {
    return await getPublic<AuditEvent[]>("/api/radar/audit-log");
  } catch {
    return DEMO_RADAR_AUDIT;
  }
}

export async function runRadarIngestion(): Promise<IngestionJob[]> {
  try {
    return await postPublic<IngestionJob[]>("/api/radar/ingest/run", {});
  } catch {
    return [
      {
        id: "demo-job-1",
        source_name: "MMRDA project pages",
        job_type: "project",
        status: "completed",
        records_found: 16,
        records_created: 0,
        records_updated: 4,
        completed_at: "2026-06-17",
      },
    ];
  }
}

// --------------------------------------------------------------------------- //
// Local (browser) watchlist fallback when backend is offline
// --------------------------------------------------------------------------- //
const LS_KEY = "astra-radar-watchlist";

function readLocalWatchlist(): WatchlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(LS_KEY) || "[]") as WatchlistItem[];
  } catch {
    return [];
  }
}

function writeLocalWatchlist(input: { entity_type: WatchlistItem["entity_type"]; entity_id: string; entity_name?: string; alert_type?: string }): WatchlistItem {
  const item: WatchlistItem = {
    id: `${input.entity_type}-${input.entity_id}`,
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    entity_name: input.entity_name ?? input.entity_id,
    alert_type: input.alert_type ?? "any_update",
    status: "active",
    created_at: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    const list = readLocalWatchlist().filter((x) => x.id !== item.id);
    list.push(item);
    window.localStorage.setItem(LS_KEY, JSON.stringify(list));
  }
  return item;
}
