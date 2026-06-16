// Mumbai Redevelopment Radar — bundled demo dataset (offline fallback).
//
// Used only when /api/radar/* is unreachable. Numbers are illustrative but
// internally consistent: the Future Score is derived from the sub-scores below,
// so explanations always reconcile with the headline number.

import type {
  AnalyzeLocalityResponse,
  CompareResponse,
  CompareVerdict,
  LocalityDetail,
  LocalityReport,
  LocalityScores,
  LocalitySignal,
  PropertyRadarCard,
  RadarAlert,
  RadarDashboard,
  RadarLocality,
  RadarProject,
  RadarRedevelopmentZone,
  RadarZone,
  ScoreBreakdown,
  TimelineMilestone,
  AuditEvent,
} from "@/lib/radar";

const TODAY = "2026-06-17";

// --------------------------------------------------------------------------- //
// Transparent scoring — mirrors backend weights
// --------------------------------------------------------------------------- //
type Raw = {
  infra: number; redev: number; conn: number; gov: number;
  livability: number; employment: number; rental: number; market: number;
  execRisk: number; disruptRisk: number; affordRisk: number; oversupplyRisk: number;
};

const WEIGHTS: Record<string, number> = {
  infra: 0.2, redev: 0.2, conn: 0.15, gov: 0.15, market: 0.1, livability: 0.1, employment: 0.05,
};

function computeScores(r: Raw): LocalityScores {
  const base =
    r.infra * WEIGHTS.infra +
    r.redev * WEIGHTS.redev +
    r.conn * WEIGHTS.conn +
    r.gov * WEIGHTS.gov +
    r.market * WEIGHTS.market +
    r.livability * WEIGHTS.livability +
    r.employment * WEIGHTS.employment;

  // Risk adjustments pull the headline down (spec §16).
  const supplyAdj = (r.oversupplyRisk / 100) * 12;
  const execAdj = (r.execRisk / 100) * 16;
  const affordAdj = (r.affordRisk / 100) * 12;
  const future = Math.max(0, Math.min(100, Math.round(base - supplyAdj - execAdj - affordAdj)));

  const investment = Math.round(
    Math.max(0, Math.min(100, 0.35 * r.infra + 0.3 * r.redev + 0.2 * r.conn + 0.15 * r.market - 0.2 * r.execRisk - 0.1 * r.oversupplyRisk)),
  );
  const selfUse = Math.round(
    Math.max(0, Math.min(100, 0.4 * r.livability + 0.3 * r.conn + 0.2 * r.infra - 0.25 * r.disruptRisk)),
  );
  const avgRisk = (r.execRisk + r.disruptRisk + r.affordRisk + r.oversupplyRisk) / 4;
  const confidence = Math.max(0.35, Math.min(0.92, (r.gov / 100) * 0.7 + 0.25 - (avgRisk / 100) * 0.15));

  const breakdown: ScoreBreakdown[] = [
    { key: "infrastructure", label: "Infrastructure Catalyst", score: r.infra, weight: 0.2, confidence,
      reason: "Driven by proximity to metro / road / rail / coastal projects and the share that is funded or under construction rather than only proposed.",
      inputs: [], last_updated: TODAY },
    { key: "redevelopment", label: "Redevelopment Momentum", score: r.redev, weight: 0.2, confidence,
      reason: "Reflects ageing building stock, MHADA/SRA/cluster schemes and recent developer activity. High momentum is opportunity, but execution risk is scored separately.",
      inputs: [], last_updated: TODAY },
    { key: "connectivity", label: "Connectivity Uplift", score: r.conn, weight: 0.15, confidence,
      reason: "Expected travel-time and catchment improvement from confirmed transit, weighted down for projects still only proposed.",
      inputs: [], last_updated: TODAY },
    { key: "government_confidence", label: "Government Plan Confidence", score: r.gov, weight: 0.15, confidence,
      reason: "How much of the pipeline is backed by official notifications, sanctioned budgets and active tenders versus press speculation.",
      inputs: [], last_updated: TODAY },
    { key: "market_demand", label: "Market Demand Signal", score: r.market, weight: 0.1, confidence,
      reason: "Blends registrations, price trend and ASTRA buyer/search/site-visit demand for the locality.",
      inputs: [], last_updated: TODAY },
    { key: "livability", label: "Livability Improvement", score: r.livability, weight: 0.1, confidence,
      reason: "Public realm, open space, social infrastructure and reduced congestion potential.",
      inputs: [], last_updated: TODAY },
    { key: "employment", label: "Employment / Commercial Growth", score: r.employment, weight: 0.05, confidence,
      reason: "Proximity to business districts, new commercial hubs and airport-linked job creation.",
      inputs: [], last_updated: TODAY },
    { key: "execution_risk", label: "Execution Risk (−)", score: r.execRisk, weight: -0.16, confidence,
      reason: "Large infra and redevelopment projects routinely slip on approvals, eligibility disputes and funding. Higher = larger downward adjustment.",
      inputs: [], last_updated: TODAY },
    { key: "disruption_risk", label: "Disruption Risk (−)", score: r.disruptRisk, weight: 0, confidence,
      reason: "Construction-phase congestion, dust and noise that temporarily hurt livability.",
      inputs: [], last_updated: TODAY },
    { key: "affordability_risk", label: "Affordability Ceiling (−)", score: r.affordRisk, weight: -0.12, confidence,
      reason: "Where prices are already premium, upside is more defensive than explosive.",
      inputs: [], last_updated: TODAY },
    { key: "oversupply_risk", label: "Oversupply Risk (−)", score: r.oversupplyRisk, weight: -0.12, confidence,
      reason: "Redevelopment free-sale inventory and new launches can pressure prices and rents.",
      inputs: [], last_updated: TODAY },
  ];

  return {
    future_score: future,
    confidence_score: Math.round(confidence * 100) / 100,
    infrastructure_score: r.infra,
    redevelopment_score: r.redev,
    connectivity_score: r.conn,
    government_confidence_score: r.gov,
    livability_score: r.livability,
    employment_score: r.employment,
    rental_demand_score: r.rental,
    investment_score: investment,
    market_demand_score: r.market,
    execution_risk_score: r.execRisk,
    disruption_risk_score: r.disruptRisk,
    affordability_risk_score: r.affordRisk,
    oversupply_risk_score: r.oversupplyRisk,
    self_use_score: selfUse,
    breakdown,
  };
}

// --------------------------------------------------------------------------- //
// Locality seed
// --------------------------------------------------------------------------- //
type LSeed = {
  slug: string; name: string; zone: RadarZone; lat: number; lng: number;
  signal: LocalitySignal; price_psf: number; trend: number; yield: number;
  summary: string; catalysts: string[]; risks: string[]; raw: Raw;
};

const L: LSeed[] = [
  {
    slug: "bandra", name: "Bandra", zone: "Western Suburbs", lat: 19.0607, lng: 72.8296, signal: "premium",
    price_psf: 46000, trend: 4.2, yield: 2.6,
    summary: "Bandra sits inside the broader BKC influence zone with strong social infrastructure and coastal-road catchment. Prices are already premium, so upside may be more defensive than explosive.",
    catalysts: ["Coastal Road + Bandra-Worli connectivity", "BKC commercial pull", "Cessed-building redevelopment"],
    risks: ["Affordability ceiling", "Limited new supply", "Construction-phase congestion"],
    raw: { infra: 72, redev: 66, conn: 78, gov: 74, livability: 82, employment: 80, rental: 70, market: 76, execRisk: 42, disruptRisk: 48, affordRisk: 86, oversupplyRisk: 30 },
  },
  {
    slug: "andheri", name: "Andheri", zone: "Western Suburbs", lat: 19.1197, lng: 72.8468, signal: "connectivity",
    price_psf: 28500, trend: 6.1, yield: 3.1,
    summary: "Andheri is a multi-line transit junction (Metro 2A/7 + suburban + airport) with active slum and society redevelopment. Strong connectivity, but micro-market quality varies sharply street to street.",
    catalysts: ["Metro interchange density", "Airport proximity", "Juhu Galli & MHADA redevelopment"],
    risks: ["Uneven micro-markets", "Construction disruption", "Execution delays on redevelopment"],
    raw: { infra: 80, redev: 74, conn: 84, gov: 72, livability: 64, employment: 78, rental: 76, market: 80, execRisk: 50, disruptRisk: 60, affordRisk: 58, oversupplyRisk: 46 },
  },
  {
    slug: "borivali", name: "Borivali", zone: "Western Suburbs", lat: 19.2307, lng: 72.8567, signal: "growth",
    price_psf: 23500, trend: 7.4, yield: 3.4,
    summary: "Borivali pairs incoming Metro and the Borivali-Thane tunnel with deep society redevelopment and more space per rupee than Bandra. Long-term urban-upgrade potential with medium execution timelines.",
    catalysts: ["Metro extension + Borivali-Thane tunnel", "Society redevelopment wave", "National Park green premium"],
    risks: ["Medium execution timelines", "Temporary congestion", "Supply from redevelopment"],
    raw: { infra: 78, redev: 80, conn: 74, gov: 70, livability: 74, employment: 58, rental: 70, market: 78, execRisk: 48, disruptRisk: 52, affordRisk: 46, oversupplyRisk: 50 },
  },
  {
    slug: "chembur", name: "Chembur", zone: "Eastern Suburbs", lat: 19.0522, lng: 72.9005, signal: "connectivity",
    price_psf: 25500, trend: 6.8, yield: 3.2,
    summary: "Chembur is likely to benefit from east-west connectivity (Metro, Monorail, SCLR, Eastern Freeway), BKC/South Mumbai proximity and older building redevelopment. Traffic congestion and project delays remain key risks.",
    catalysts: ["Metro + Eastern Freeway access", "BKC & South Mumbai proximity", "Old building redevelopment"],
    risks: ["Traffic congestion", "Execution delays", "Industrial legacy pockets"],
    raw: { infra: 76, redev: 72, conn: 80, gov: 70, livability: 68, employment: 66, rental: 72, market: 74, execRisk: 46, disruptRisk: 54, affordRisk: 52, oversupplyRisk: 44 },
  },
  {
    slug: "powai", name: "Powai", zone: "Eastern Suburbs", lat: 19.1176, lng: 72.906, signal: "premium",
    price_psf: 27000, trend: 4.6, yield: 2.9,
    summary: "Powai is an established lake-side tech and education hub. Future upside leans on lake public-realm proposals and incremental connectivity rather than a single large catalyst.",
    catalysts: ["IT/education employment base", "Powai lake public-realm proposals", "Planned road connectors"],
    risks: ["Single-access congestion", "Premium pricing", "Proposal-stage public realm"],
    raw: { infra: 64, redev: 54, conn: 62, gov: 60, livability: 84, employment: 82, rental: 74, market: 70, execRisk: 40, disruptRisk: 40, affordRisk: 72, oversupplyRisk: 36 },
  },
  {
    slug: "ghatkopar", name: "Ghatkopar", zone: "Eastern Suburbs", lat: 19.086, lng: 72.908, signal: "redevelopment",
    price_psf: 24000, trend: 6.2, yield: 3.3,
    summary: "Ghatkopar is a mature Metro interchange with intense society and chawl redevelopment. High redevelopment momentum brings both supply unlock and execution/oversupply risk.",
    catalysts: ["Metro 1 interchange + Line 4", "Dense society redevelopment", "Central-east job access"],
    risks: ["Oversupply from redevelopment", "Eligibility disputes", "Congestion"],
    raw: { infra: 72, redev: 84, conn: 76, gov: 68, livability: 66, employment: 64, rental: 72, market: 76, execRisk: 52, disruptRisk: 56, affordRisk: 50, oversupplyRisk: 58 },
  },
  {
    slug: "worli", name: "Worli", zone: "South Mumbai", lat: 18.9982, lng: 72.8175, signal: "growth",
    price_psf: 52000, trend: 5.1, yield: 2.4,
    summary: "Worli is the prime beneficiary of the Coastal Road and Sea Link, alongside the landmark BDD Chawl redevelopment. A genuine confirmed-catalyst story, but at the top of the price band.",
    catalysts: ["Coastal Road + Sea Link", "BDD Chawl redevelopment", "Sea-facing premium"],
    risks: ["Very high prices", "Long redevelopment timelines", "Construction disruption"],
    raw: { infra: 84, redev: 78, conn: 82, gov: 80, livability: 78, employment: 76, rental: 64, market: 74, execRisk: 44, disruptRisk: 58, affordRisk: 90, oversupplyRisk: 38 },
  },
  {
    slug: "dadar", name: "Dadar", zone: "Central Mumbai", lat: 19.0186, lng: 72.8442, signal: "connectivity",
    price_psf: 39000, trend: 3.8, yield: 2.7,
    summary: "Dadar is Mumbai's most central rail node with cessed-building redevelopment potential. Central location is the durable asset; large-scale transformation is constrained by dense fabric.",
    catalysts: ["Central rail interchange", "Cessed-building redevelopment", "Equidistant to SoBo & suburbs"],
    risks: ["Dense, constrained plots", "Affordability", "Slow cessed redevelopment"],
    raw: { infra: 62, redev: 70, conn: 80, gov: 66, livability: 70, employment: 68, rental: 66, market: 70, execRisk: 50, disruptRisk: 46, affordRisk: 74, oversupplyRisk: 34 },
  },
  {
    slug: "lower-parel", name: "Lower Parel", zone: "Central Mumbai", lat: 18.9977, lng: 72.8302, signal: "premium",
    price_psf: 44000, trend: 3.2, yield: 2.5,
    summary: "Lower Parel completed its mill-land-to-commercial transformation a cycle ago. It is now a mature CBD; future gains hinge on connectivity relief rather than new land unlock.",
    catalysts: ["Established CBD employment", "Coastal Road relief", "Premium residential towers"],
    risks: ["Severe peak congestion", "Premium pricing", "Limited fresh catalysts"],
    raw: { infra: 60, redev: 50, conn: 68, gov: 62, livability: 64, employment: 84, rental: 70, market: 66, execRisk: 38, disruptRisk: 44, affordRisk: 80, oversupplyRisk: 40 },
  },
  {
    slug: "thane", name: "Thane", zone: "Thane", lat: 19.2183, lng: 72.9781, signal: "growth",
    price_psf: 18500, trend: 8.2, yield: 3.6,
    summary: "Thane combines its own internal Metro, the Borivali-Thane tunnel and large lake-side redevelopment with relative affordability — one of MMR's strongest risk-adjusted growth stories.",
    catalysts: ["Thane internal Metro + tunnel", "Lake-side public realm", "Affordable vs island city"],
    risks: ["Execution timelines", "Pocket-level oversupply", "Peak congestion"],
    raw: { infra: 80, redev: 72, conn: 78, gov: 72, livability: 74, employment: 64, rental: 74, market: 80, execRisk: 48, disruptRisk: 50, affordRisk: 40, oversupplyRisk: 52 },
  },
  {
    slug: "kalyan", name: "Kalyan", zone: "MMR Growth Belt", lat: 19.2437, lng: 73.1355, signal: "speculative",
    price_psf: 11500, trend: 9.1, yield: 3.9,
    summary: "Kalyan anchors the Metro Line 5 and Kalyan growth-centre plans with very affordable entry. Upside is real but earlier-stage and more dependent on execution than core-suburb localities.",
    catalysts: ["Metro Line 5 corridor", "Kalyan growth-centre / ring road", "Affordable entry + high yield"],
    risks: ["Early-stage execution risk", "Infra-lag vs population", "Speculative launches"],
    raw: { infra: 70, redev: 52, conn: 70, gov: 64, livability: 56, employment: 50, rental: 76, market: 72, execRisk: 60, disruptRisk: 52, affordRisk: 28, oversupplyRisk: 60 },
  },
  {
    slug: "panvel", name: "Panvel", zone: "Navi Mumbai", lat: 18.9894, lng: 73.1175, signal: "growth",
    price_psf: 12500, trend: 10.4, yield: 3.7,
    summary: "Panvel is the convergence point of the Navi Mumbai airport, Atal Setu and the Mumbai-Pune corridor. Strong confirmed mega-infrastructure, balanced by speculative launch activity.",
    catalysts: ["Navi Mumbai airport gateway", "Atal Setu + expressway links", "CIDCO-planned growth"],
    risks: ["Speculative launches", "Infra-population lag", "Execution sequencing"],
    raw: { infra: 86, redev: 48, conn: 80, gov: 76, livability: 62, employment: 70, rental: 72, market: 78, execRisk: 50, disruptRisk: 50, affordRisk: 30, oversupplyRisk: 58 },
  },
  {
    slug: "ulwe", name: "Ulwe", zone: "Navi Mumbai", lat: 18.9787, lng: 73.0169, signal: "speculative",
    price_psf: 11000, trend: 12.6, yield: 3.5,
    summary: "Ulwe is the closest residential node to the Navi Mumbai airport, plugged into Atal Setu and the Ulwe Coastal Road. High potential but among the most execution- and timing-sensitive plays on the Radar.",
    catalysts: ["Airport-adjacent node", "Atal Setu + Ulwe Coastal Road", "CIDCO node planning"],
    risks: ["High execution sensitivity", "Liquidity risk", "Heavy speculative inventory"],
    raw: { infra: 84, redev: 40, conn: 78, gov: 72, livability: 58, employment: 60, rental: 66, market: 74, execRisk: 58, disruptRisk: 54, affordRisk: 26, oversupplyRisk: 66 },
  },
  {
    slug: "kharghar", name: "Kharghar", zone: "Navi Mumbai", lat: 19.0476, lng: 73.0699, signal: "growth",
    price_psf: 14500, trend: 8.9, yield: 3.4,
    summary: "Kharghar offers planned open layouts, education and golf-course green premium plus airport and Metro catchment. A more matured, livable Navi Mumbai growth node with moderate risk.",
    catalysts: ["Navi Mumbai Metro + airport catchment", "Planned green layouts", "Education & golf premium"],
    risks: ["Internal connectivity gaps", "Launch oversupply", "Timing of airport ramp-up"],
    raw: { infra: 80, redev: 46, conn: 74, gov: 74, livability: 76, employment: 62, rental: 70, market: 76, execRisk: 46, disruptRisk: 44, affordRisk: 34, oversupplyRisk: 50 },
  },
  {
    slug: "navi-mumbai", name: "Navi Mumbai", zone: "Navi Mumbai", lat: 19.033, lng: 73.0297, signal: "growth",
    price_psf: 15500, trend: 9.6, yield: 3.5,
    summary: "Navi Mumbai as a whole is being re-rated by the airport, Atal Setu and the proposed Mumbai 3.0 / KSC New Town. Among the strongest macro growth narratives in MMR, with node-level execution variance.",
    catalysts: ["Navi Mumbai airport + Atal Setu", "Mumbai 3.0 / KSC New Town", "CIDCO master planning"],
    risks: ["Node-level execution variance", "Speculative belts", "Long mega-project timelines"],
    raw: { infra: 86, redev: 50, conn: 82, gov: 78, livability: 70, employment: 72, rental: 72, market: 80, execRisk: 48, disruptRisk: 46, affordRisk: 32, oversupplyRisk: 54 },
  },
];

export const DEMO_RADAR_LOCALITIES: RadarLocality[] = L.map((s) => ({
  id: s.slug,
  slug: s.slug,
  name: s.name,
  zone: s.zone,
  city: "Mumbai",
  latitude: s.lat,
  longitude: s.lng,
  boundary_geojson: null,
  signal: s.signal,
  summary: s.summary,
  headline_catalysts: s.catalysts,
  headline_risks: s.risks,
  price_psf: s.price_psf,
  price_trend_pct: s.trend,
  rental_yield_pct: s.yield,
  scores: computeScores(s.raw),
  last_scored_at: TODAY,
}));

const bySlug = (slug: string) =>
  DEMO_RADAR_LOCALITIES.find((l) => l.slug === slug) ?? DEMO_RADAR_LOCALITIES[0];

// --------------------------------------------------------------------------- //
// Project seed
// --------------------------------------------------------------------------- //
type PSeed = Partial<RadarProject> & Pick<RadarProject, "id" | "name" | "project_type" | "authority" | "status">;

function mkProject(p: PSeed): RadarProject {
  return {
    slug: p.id,
    description: "",
    budget_amount: null,
    start_date: null,
    expected_completion_date: null,
    actual_completion_date: null,
    source_url: null,
    source_type: "official",
    source_date: TODAY,
    reliability_score: 0.78,
    confidence_score: 0.74,
    last_verified_at: TODAY,
    stale: false,
    geometry_geojson: null,
    affected_localities: [],
    impact_categories: [],
    impact_summary: "",
    risk_summary: "",
    impacts: [],
    claims: [],
    ...p,
  };
}

export const DEMO_RADAR_PROJECTS: RadarProject[] = [
  mkProject({
    id: "metro-2b", name: "Metro Line 2B (DN Nagar–Mandale)", project_type: "metro", authority: "MMRDA",
    status: "under_construction", budget_amount: 10986, expected_completion_date: "2027",
    source_url: "https://mmrda.maharashtra.gov.in/metro-line-2b", description: "23.6 km east-west corridor linking the western suburbs to BKC, Kurla and Mankhurd.",
    affected_localities: ["bandra", "andheri", "chembur"], impact_categories: ["connectivity", "employment"],
    impact_summary: "Adds an east-west spine connecting western suburbs to BKC and the eastern seaboard.",
    risk_summary: "Construction-phase road disruption and partial-section opening before full commissioning.",
    impacts: [
      { project_id: "metro-2b", locality_id: "bandra", impact_type: "connectivity", impact_score: 72, time_horizon: "1-3y", distance_km: 0.8, explanation: "Improves BKC and east-suburb access from Bandra without using the Western Express Highway.", positive_factors: ["BKC access", "reduced car dependence"], negative_factors: ["station-area construction"], confidence_score: 0.74 },
      { project_id: "metro-2b", locality_id: "chembur", impact_type: "connectivity", impact_score: 68, time_horizon: "1-3y", distance_km: 1.1, explanation: "Strengthens Chembur's east-west links toward BKC and the western suburbs.", positive_factors: ["BKC access"], negative_factors: ["congestion during build"], confidence_score: 0.72 },
    ],
  }),
  mkProject({
    id: "metro-4", name: "Metro Line 4 & 4A (Wadala–Kasarvadavali)", project_type: "metro", authority: "MMRDA",
    status: "under_construction", budget_amount: 15498, expected_completion_date: "2026",
    source_url: "https://mmrda.maharashtra.gov.in/metro-line-4", description: "35 km corridor linking Wadala, Ghatkopar, Mulund and Thane along the LBS/eastern axis.",
    affected_localities: ["ghatkopar", "thane"], impact_categories: ["connectivity", "employment"],
    impact_summary: "Connects the central-eastern suburbs to Thane, relieving the LBS and Eastern Express corridors.",
    risk_summary: "Phased opening; full Thane benefit depends on later sections.",
    impacts: [
      { project_id: "metro-4", locality_id: "ghatkopar", impact_type: "connectivity", impact_score: 74, time_horizon: "0-1y", distance_km: 0.5, explanation: "Interchange with Metro 1 deepens Ghatkopar's hub status.", positive_factors: ["interchange", "job access"], negative_factors: ["congestion"], confidence_score: 0.78 },
      { project_id: "metro-4", locality_id: "thane", impact_type: "connectivity", impact_score: 76, time_horizon: "1-3y", distance_km: 1.4, explanation: "Direct rail-independent link from Thane to the eastern suburbs.", positive_factors: ["new spine"], negative_factors: ["phasing"], confidence_score: 0.74 },
    ],
  }),
  mkProject({
    id: "metro-5", name: "Metro Line 5 (Thane–Bhiwandi–Kalyan)", project_type: "metro", authority: "MMRDA",
    status: "under_construction", budget_amount: 8417, expected_completion_date: "2027",
    source_url: "https://mmrda.maharashtra.gov.in/metro-line-5", description: "24.9 km corridor opening up the Thane–Bhiwandi–Kalyan growth belt.",
    affected_localities: ["thane", "kalyan"], impact_categories: ["connectivity", "employment"],
    impact_summary: "Could materially lift the Kalyan-Bhiwandi corridor's commuter catchment and rental demand.",
    risk_summary: "Corridor spans developing areas; infrastructure may lag population growth.",
    impacts: [
      { project_id: "metro-5", locality_id: "kalyan", impact_type: "connectivity", impact_score: 70, time_horizon: "1-3y", distance_km: 0.9, explanation: "Brings Kalyan into a faster Thane-bound transit network.", positive_factors: ["commuter catchment", "rental demand"], negative_factors: ["execution risk"], confidence_score: 0.66 },
    ],
  }),
  mkProject({
    id: "metro-6", name: "Metro Line 6 (Swami Samarth Nagar–Vikhroli)", project_type: "metro", authority: "MMRDA",
    status: "under_construction", budget_amount: 6716, expected_completion_date: "2026",
    source_url: "https://mmrda.maharashtra.gov.in/metro-line-6", description: "15.3 km east-west connector linking the western and eastern suburbs via Powai-Kanjurmarg.",
    affected_localities: ["powai", "andheri"], impact_categories: ["connectivity"],
    impact_summary: "Gives Powai a long-missing rail-grade east-west connection.",
    risk_summary: "Single corridor; benefit concentrated near stations.",
    impacts: [
      { project_id: "metro-6", locality_id: "powai", impact_type: "connectivity", impact_score: 66, time_horizon: "1-3y", distance_km: 0.7, explanation: "Reduces Powai's single-access congestion with an east-west metro link.", positive_factors: ["new connectivity"], negative_factors: ["station spacing"], confidence_score: 0.7 },
    ],
  }),
  mkProject({
    id: "metro-7a", name: "Metro Line 7A (Andheri–CSMIA Airport)", project_type: "metro", authority: "MMRDA",
    status: "under_construction", budget_amount: 6300, expected_completion_date: "2026",
    source_url: "https://mmrda.maharashtra.gov.in/metro-line-7a", description: "Underground airport link extending Line 7 from Andheri to the domestic and T2 terminals.",
    affected_localities: ["andheri"], impact_categories: ["connectivity", "employment"],
    impact_summary: "Direct metro-to-airport access strengthens Andheri's interchange premium.",
    risk_summary: "Tunnelling complexity near the airport.",
    impacts: [
      { project_id: "metro-7a", locality_id: "andheri", impact_type: "connectivity", impact_score: 72, time_horizon: "0-1y", distance_km: 0.6, explanation: "Airport-linked metro deepens Andheri's connectivity advantage.", positive_factors: ["airport link"], negative_factors: ["tunnelling delays"], confidence_score: 0.72 },
    ],
  }),
  mkProject({
    id: "metro-9", name: "Metro Line 9 (Dahisar E–Mira Bhayandar)", project_type: "metro", authority: "MMRDA",
    status: "under_construction", budget_amount: 6607, expected_completion_date: "2026",
    source_url: "https://mmrda.maharashtra.gov.in/metro-line-9", description: "Northward extension of Line 7 into the Mira-Bhayandar growth belt.",
    affected_localities: ["borivali"], impact_categories: ["connectivity"],
    impact_summary: "Extends the western metro spine north past Borivali into Mira-Bhayandar.",
    risk_summary: "Benefit to Borivali is catchment-edge rather than core.",
    impacts: [
      { project_id: "metro-9", locality_id: "borivali", impact_type: "connectivity", impact_score: 62, time_horizon: "1-3y", distance_km: 1.6, explanation: "Improves northern connectivity adjacent to Borivali.", positive_factors: ["network extension"], negative_factors: ["edge of catchment"], confidence_score: 0.66 },
    ],
  }),
  mkProject({
    id: "coastal-road", name: "Mumbai Coastal Road — public realm", project_type: "coastal", authority: "BMC",
    status: "partially_operational", budget_amount: 13983, expected_completion_date: "2026",
    source_url: "https://portal.mcgm.gov.in/coastal-road", description: "Coastal freeway plus reclaimed open space, promenade and parks from Marine Drive to the Sea Link.",
    affected_localities: ["worli", "bandra", "lower-parel"], impact_categories: ["connectivity", "livability", "public_realm"],
    impact_summary: "Cuts south-bound travel time and unlocks a large new waterfront public realm.",
    risk_summary: "Reclaimed open-space access and maintenance certainty are not yet fully proven.",
    impacts: [
      { project_id: "coastal-road", locality_id: "worli", impact_type: "connectivity", impact_score: 82, time_horizon: "0-1y", distance_km: 0.4, explanation: "Worli is the primary beneficiary of both travel-time and waterfront public realm.", positive_factors: ["travel time", "promenade"], negative_factors: ["construction phase"], confidence_score: 0.8 },
    ],
  }),
  mkProject({
    id: "atal-setu", name: "Atal Setu (MTHL) influence zone", project_type: "bridge", authority: "MMRDA",
    status: "operational", budget_amount: 17843, actual_completion_date: "2024",
    source_url: "https://mmrda.maharashtra.gov.in/mthl", description: "21.8 km Mumbai Trans Harbour Link connecting Sewri to Chirle, anchoring the Navi Mumbai seaboard.",
    affected_localities: ["panvel", "ulwe", "navi-mumbai"], impact_categories: ["connectivity", "employment"],
    impact_summary: "Collapses travel time to the Navi Mumbai seaboard and the upcoming airport.",
    risk_summary: "Land-value gains are partly priced in; some belts are speculative.",
    impacts: [
      { project_id: "atal-setu", locality_id: "ulwe", impact_type: "connectivity", impact_score: 80, time_horizon: "0-1y", distance_km: 2.0, explanation: "Ulwe sits in the direct landing catchment of Atal Setu.", positive_factors: ["mainland link", "airport synergy"], negative_factors: ["speculative pricing"], confidence_score: 0.78 },
      { project_id: "atal-setu", locality_id: "panvel", impact_type: "connectivity", impact_score: 78, time_horizon: "0-1y", distance_km: 4.0, explanation: "Strengthens Panvel as the converging gateway node.", positive_factors: ["gateway node"], negative_factors: ["launch oversupply"], confidence_score: 0.76 },
    ],
  }),
  mkProject({
    id: "mumbai-3-0", name: "KSC New Town / Mumbai 3.0", project_type: "new_town", authority: "MMRDA",
    status: "proposed", budget_amount: null, expected_completion_date: "2035+",
    source_url: "https://mmrda.maharashtra.gov.in/third-mumbai", source_date: "2025-11-01", description: "Proposed third Mumbai growth city across the Atal Setu influence region, anchored by the new airport.",
    affected_localities: ["navi-mumbai", "panvel", "ulwe"], impact_categories: ["employment", "new_town", "zoning"],
    impact_summary: "Could create a large new employment and housing region over a 10+ year horizon.",
    risk_summary: "Largely at planning stage; long-horizon, dependent on notification and land pooling.",
    confidence_score: 0.5, reliability_score: 0.6,
    impacts: [
      { project_id: "mumbai-3-0", locality_id: "navi-mumbai", impact_type: "employment", impact_score: 60, time_horizon: "5-10y", explanation: "Long-horizon employment and housing demand if the new town is notified and built.", positive_factors: ["job creation", "land pooling"], negative_factors: ["planning stage", "long timeline"], confidence_score: 0.5 },
    ],
  }),
  mkProject({
    id: "kharbav-business-park", name: "Kharbav Integrated Business Park", project_type: "business_park", authority: "MMRDA",
    status: "proposed", source_url: "https://mmrda.maharashtra.gov.in/", source_date: "2025-09-01", description: "Proposed integrated business park in the Bhiwandi-Kalyan belt to seed employment along Metro 5.",
    affected_localities: ["kalyan", "thane"], impact_categories: ["employment", "commercial_hub"],
    impact_summary: "Could anchor jobs near the Kalyan growth corridor if realised.",
    risk_summary: "Proposal stage; employment generation unproven.", confidence_score: 0.45, reliability_score: 0.55,
    impacts: [
      { project_id: "kharbav-business-park", locality_id: "kalyan", impact_type: "employment", impact_score: 52, time_horizon: "5-10y", explanation: "Potential local employment anchor for the Kalyan belt.", positive_factors: ["job anchor"], negative_factors: ["proposal stage"], confidence_score: 0.45 },
    ],
  }),
  mkProject({
    id: "bdd-chawl", name: "BDD Chawl Redevelopment (Worli/Naigaon/NM Joshi)", project_type: "redevelopment", authority: "MHADA",
    status: "under_construction", budget_amount: null, expected_completion_date: "2028",
    source_url: "https://mhada.gov.in/en/bdd-chawl", description: "One of India's largest redevelopment schemes, rehousing BDD chawl residents in new towers.",
    affected_localities: ["worli", "dadar"], impact_categories: ["redevelopment", "livability"],
    impact_summary: "Unlocks significant central-Mumbai supply and upgrades the public fabric around Worli.",
    risk_summary: "Long timelines, eligibility processes and phased delivery.",
    impacts: [
      { project_id: "bdd-chawl", locality_id: "worli", impact_type: "redevelopment", impact_score: 70, time_horizon: "3-5y", distance_km: 0.6, explanation: "Reshapes the Worli mid-market and adds free-sale inventory.", positive_factors: ["urban upgrade", "supply unlock"], negative_factors: ["timeline", "disruption"], confidence_score: 0.66 },
    ],
  }),
  mkProject({
    id: "juhu-galli", name: "Juhu Galli Slum Redevelopment (Andheri West)", project_type: "slum_redevelopment", authority: "SRA",
    status: "approved", source_url: "https://sra.gov.in/", source_date: "2025-08-01", description: "SRA-led redevelopment of the Juhu Galli cluster in Andheri West.",
    affected_localities: ["andheri"], impact_categories: ["redevelopment", "livability"],
    impact_summary: "Could improve the Andheri West micro-fabric and add free-sale stock.",
    risk_summary: "SRA schemes commonly face eligibility and execution delays.", confidence_score: 0.58,
    impacts: [
      { project_id: "juhu-galli", locality_id: "andheri", impact_type: "redevelopment", impact_score: 60, time_horizon: "3-5y", distance_km: 1.0, explanation: "Local micro-market upgrade and added supply in Andheri West.", positive_factors: ["micro-market upgrade"], negative_factors: ["eligibility disputes"], confidence_score: 0.58 },
    ],
  }),
  mkProject({
    id: "dharavi", name: "Dharavi Redevelopment Project", project_type: "slum_redevelopment", authority: "DRP/SRA",
    status: "tendering", budget_amount: null, expected_completion_date: "2035+",
    source_url: "https://dharaviredevelopment.com/", source_date: "2026-02-01", description: "Mega redevelopment of Dharavi into a planned mixed-use district adjacent to BKC.",
    affected_localities: ["dadar", "bandra"], impact_categories: ["redevelopment", "employment", "zoning"],
    impact_summary: "Could transform a central node beside BKC over a long horizon.",
    risk_summary: "Highly complex, politically sensitive, long-dated; treat impact as long-term and uncertain.", confidence_score: 0.5,
    impacts: [
      { project_id: "dharavi", locality_id: "dadar", impact_type: "redevelopment", impact_score: 55, time_horizon: "5-10y", distance_km: 1.5, explanation: "Long-horizon re-rating potential for adjacent central nodes.", positive_factors: ["central transformation"], negative_factors: ["complexity", "long timeline"], confidence_score: 0.5 },
    ],
  }),
  mkProject({
    id: "navi-mumbai-airport", name: "Navi Mumbai International Airport — influence zone", project_type: "airport", authority: "CIDCO",
    status: "partially_operational", budget_amount: 19650, expected_completion_date: "2026",
    source_url: "https://cidco.maharashtra.gov.in/Navi-Mumbai-Airport", description: "Greenfield international airport anchoring the Navi Mumbai seaboard's growth.",
    affected_localities: ["ulwe", "panvel", "kharghar", "navi-mumbai"], impact_categories: ["employment", "connectivity"],
    impact_summary: "A confirmed mega-catalyst re-rating the entire Navi Mumbai seaboard.",
    risk_summary: "Phase ramp-up and surrounding road readiness affect timing.",
    impacts: [
      { project_id: "navi-mumbai-airport", locality_id: "ulwe", impact_type: "employment", impact_score: 82, time_horizon: "0-1y", distance_km: 3.0, explanation: "Ulwe is among the closest residential nodes to the airport.", positive_factors: ["airport jobs", "demand"], negative_factors: ["speculative pricing"], confidence_score: 0.8 },
      { project_id: "navi-mumbai-airport", locality_id: "kharghar", impact_type: "employment", impact_score: 70, time_horizon: "1-3y", distance_km: 8.0, explanation: "Kharghar gains from airport-linked services demand.", positive_factors: ["services demand"], negative_factors: ["distance"], confidence_score: 0.74 },
    ],
  }),
  mkProject({
    id: "ulwe-coastal-road", name: "Ulwe Coastal Road", project_type: "coastal", authority: "CIDCO",
    status: "under_construction", source_url: "https://cidco.maharashtra.gov.in/", expected_completion_date: "2027",
    description: "Coastal connector improving Ulwe's links to Atal Setu and the airport.",
    affected_localities: ["ulwe"], impact_categories: ["connectivity"],
    impact_summary: "Improves Ulwe's internal and mainland connectivity.",
    risk_summary: "Benefit conditional on airport and Atal Setu ramp-up.",
    impacts: [
      { project_id: "ulwe-coastal-road", locality_id: "ulwe", impact_type: "connectivity", impact_score: 68, time_horizon: "1-3y", distance_km: 0.5, explanation: "Better links to Atal Setu and airport access roads.", positive_factors: ["access"], negative_factors: ["sequencing"], confidence_score: 0.66 },
    ],
  }),
  mkProject({
    id: "mutp-3a", name: "MUTP 3A — suburban rail upgrade", project_type: "rail", authority: "MRVC",
    status: "under_construction", budget_amount: 33690, expected_completion_date: "2028",
    source_url: "https://mrvc.indianrailways.gov.in/", description: "Suburban rail capacity programme: new rakes, AC services, CBTC and corridor upgrades.",
    affected_localities: ["borivali", "kalyan", "dadar"], impact_categories: ["connectivity"],
    impact_summary: "Raises suburban rail capacity and reliability across the western and central corridors.",
    risk_summary: "Network-wide programme; locality benefit is diffuse.",
    impacts: [
      { project_id: "mutp-3a", locality_id: "borivali", impact_type: "connectivity", impact_score: 60, time_horizon: "3-5y", explanation: "Capacity relief on the western corridor benefits Borivali commuters.", positive_factors: ["capacity"], negative_factors: ["diffuse benefit"], confidence_score: 0.64 },
    ],
  }),
];

const projectById = (id: string) =>
  DEMO_RADAR_PROJECTS.find((p) => p.id === id || p.slug === id);

// --------------------------------------------------------------------------- //
// Redevelopment zones
// --------------------------------------------------------------------------- //
export const DEMO_RADAR_ZONES: RadarRedevelopmentZone[] = [
  { id: "z-bdd-worli", name: "BDD Chawl Cluster — Worli", slug: "bdd-worli", locality_id: "worli", locality_name: "Worli", zone_type: "bdd", authority: "MHADA", status: "under_construction", area_acres: 92, estimated_units: 15000, developer_name: "L&T / MHADA", scheme_type: "BDD redevelopment", source_url: "https://mhada.gov.in/en/bdd-chawl", source_type: "official", opportunity_score: 78, risk_score: 56, confidence_score: 0.66, notes: "Landmark central-Mumbai cluster; large free-sale component over a multi-phase horizon." },
  { id: "z-dharavi", name: "Dharavi Redevelopment", slug: "dharavi-zone", locality_id: "dadar", locality_name: "Dadar/Mahim", zone_type: "slum_cluster", authority: "DRP/SRA", status: "tendering", area_acres: 600, estimated_units: 60000, developer_name: "Navbharat/Adani-led SPV", scheme_type: "Integrated slum redevelopment", source_url: "https://dharaviredevelopment.com/", source_type: "official", opportunity_score: 70, risk_score: 72, confidence_score: 0.5, notes: "Very large, complex and long-dated; high opportunity matched by high execution and policy risk." },
  { id: "z-juhu-galli", name: "Juhu Galli Cluster — Andheri West", slug: "juhu-galli-zone", locality_id: "andheri", locality_name: "Andheri West", zone_type: "sra", authority: "SRA", status: "approved", area_acres: 24, estimated_units: 4200, scheme_type: "SRA redevelopment", source_url: "https://sra.gov.in/", source_type: "official", opportunity_score: 64, risk_score: 58, confidence_score: 0.58, notes: "Local micro-market upgrade with typical SRA eligibility/execution risk." },
  { id: "z-mhada-goregaon", name: "MHADA Layout Redevelopment — Goregaon/Borivali belt", slug: "mhada-layout", locality_id: "borivali", locality_name: "Borivali", zone_type: "mhada", authority: "MHADA", status: "proposed", area_acres: 48, estimated_units: 6800, scheme_type: "MHADA layout cluster", source_url: "https://mhada.gov.in/", source_type: "official", opportunity_score: 66, risk_score: 50, confidence_score: 0.56, notes: "Higher FSI cluster potential; depends on layout-level consent." },
  { id: "z-cessed-island", name: "Cessed Building Cluster — Island City", slug: "cessed-island", locality_id: "dadar", locality_name: "Dadar/Girgaon", zone_type: "cessed_building", authority: "MHADA", status: "proposed", area_acres: 30, estimated_units: 3500, scheme_type: "Cessed building redevelopment (DCPR 33(7))", source_url: "https://mhada.gov.in/", source_type: "official", opportunity_score: 60, risk_score: 62, confidence_score: 0.52, notes: "Constrained plots and tenant consent slow cessed redevelopment despite central location." },
  { id: "z-old-society-chembur", name: "Old Society Cluster — Chembur", slug: "old-society-chembur", locality_id: "chembur", locality_name: "Chembur", zone_type: "old_society", authority: "Private/DCPR 2034", status: "proposed", area_acres: 40, estimated_units: 5200, scheme_type: "Cluster (DCPR 2034)", source_url: "https://portal.mcgm.gov.in/", source_type: "official", opportunity_score: 62, risk_score: 48, confidence_score: 0.55, notes: "Self-redevelopment and cluster potential among ageing suburban societies." },
];

// --------------------------------------------------------------------------- //
// Alerts / audit
// --------------------------------------------------------------------------- //
export const DEMO_RADAR_ALERTS: RadarAlert[] = [
  { id: "a1", alert_type: "project_update", locality_id: "kalyan", project_id: "metro-5", title: "Metro Line 5 update affects Kalyan-Bhiwandi corridor", message: "MMRDA reported progress on the Thane–Bhiwandi–Kalyan section. Connectivity uplift for Kalyan may advance into the 1–3 year horizon.", priority: "high", status: "unread", created_at: TODAY },
  { id: "a2", alert_type: "redevelopment_signal", locality_id: "andheri", title: "New redevelopment signal detected near Andheri West", message: "An SRA scheme around Juhu Galli moved to approved status. Redevelopment momentum for Andheri West increased.", priority: "medium", status: "unread", created_at: "2026-06-15" },
  { id: "a3", alert_type: "demand_spike", locality_id: "borivali", title: "Buyer demand up 38% for Borivali redevelopment listings", message: "ASTRA CRM search and shortlist demand for Borivali rose sharply this week. Consider an investor campaign.", priority: "medium", status: "unread", created_at: "2026-06-14" },
  { id: "a4", alert_type: "risk_warning", locality_id: "ulwe", title: "Execution risk elevated for Ulwe", message: "Speculative launch inventory increased. Oversupply and liquidity risk warrant a cautious, risk-adjusted view.", priority: "high", status: "read", created_at: "2026-06-12", read_at: "2026-06-13" },
];

export const DEMO_RADAR_AUDIT: AuditEvent[] = [
  { id: "e1", actor: "GovernmentProjectIngestion", action: "project_verified", entity_type: "project", entity_id: "atal-setu", detail: "Status confirmed operational from CIDCO/MMRDA source.", created_at: TODAY },
  { id: "e2", actor: "LocalityScoring", action: "score_recomputed", entity_type: "locality", entity_id: "thane", detail: "Future Score updated after Metro 5 progress.", created_at: TODAY },
  { id: "e3", actor: "EvidenceVerification", action: "claim_downgraded", entity_type: "project", entity_id: "mumbai-3-0", detail: "Claim marked 'likely' — proposal stage, no notification yet.", created_at: "2026-06-15" },
];

// --------------------------------------------------------------------------- //
// Builders
// --------------------------------------------------------------------------- //
function localityClaims(loc: RadarLocality, projects: RadarProject[]) {
  return projects.slice(0, 3).map((p) => ({
    id: `claim-${loc.slug}-${p.id}`,
    claim_text: `${p.name} (${p.authority}) is expected to affect ${loc.name}: ${p.impact_summary}`,
    claim_type: "impact",
    entity_type: "locality" as const,
    entity_id: loc.slug,
    locality_id: loc.slug,
    project_id: p.id,
    source_url: p.source_url,
    source_name: p.authority,
    source_type: p.source_type,
    source_date: p.source_date,
    extracted_at: TODAY,
    status: (p.source_url && p.source_type === "official"
      ? (p.status === "proposed" ? "likely" : "verified")
      : "unverified") as RadarClaim["status"],
    confidence_score: p.confidence_score,
    reliability_score: p.reliability_score,
    evidence_snippet: p.impact_summary,
    last_checked_at: TODAY,
  }));
}

type RadarClaim = LocalityDetail["claims"][number];

function timelineFor(projects: RadarProject[], loc: RadarLocality): TimelineMilestone[] {
  const milestones: TimelineMilestone[] = [];
  for (const p of projects) {
    const imp = p.impacts.find((x) => x.locality_id === loc.slug) ?? p.impacts[0];
    milestones.push({
      horizon: imp?.time_horizon ?? "3-5y",
      project_id: p.id,
      title: p.name,
      effect: imp?.explanation ?? p.impact_summary,
      uncertainty: p.confidence_score >= 0.72 ? "low" : p.confidence_score >= 0.55 ? "medium" : "high",
      micro_markets: loc.headline_catalysts.slice(0, 2),
    });
  }
  const order: Record<string, number> = { "0-1y": 0, "1-3y": 1, "3-5y": 2, "5-10y": 3 };
  return milestones.sort((a, b) => order[a.horizon] - order[b.horizon]);
}

function opportunitiesFor(loc: RadarLocality) {
  const s = loc.scores;
  return [
    { persona: "family", headline: `Self-use score ${s.self_use_score}`, detail: `${loc.name} scores well on livability and connectivity; weigh construction-phase disruption (${s.disruption_risk_score}/100).` },
    { persona: "investor", headline: `Investment score ${s.investment_score}`, detail: `Infrastructure and redevelopment momentum support a ${s.investment_score >= 65 ? "constructive" : "selective"} risk-adjusted view over a 3–7 year horizon.` },
    { persona: "rental", headline: `Rental demand ${s.rental_demand_score}`, detail: `Transit catchment and employment access underpin rental demand around ${loc.name}.` },
    { persona: "redevelopment", headline: `Redevelopment ${s.redevelopment_score}`, detail: `Ageing stock and active schemes create redevelopment conversation potential — verify society/scheme eligibility.` },
    { persona: "broker", headline: "Pitch angle", detail: `Lead with confirmed catalysts (${loc.headline_catalysts[0]}); qualify timelines honestly to protect trust.` },
    { persona: "nri", headline: "NRI angle", detail: `${loc.name} offers ${loc.signal === "premium" ? "defensive, brand-led" : "growth-oriented"} exposure; emphasise evidence-backed catalysts and exit liquidity.` },
  ];
}

function risksFor(loc: RadarLocality) {
  const s = loc.scores;
  const out = [] as LocalityDetail["risks"];
  if (s.execution_risk_score >= 45) out.push({ kind: "delay", severity: s.execution_risk_score >= 55 ? "high" : "medium", detail: "Infrastructure/redevelopment projects here carry real timeline slippage risk.", confidence: 0.7 });
  if (s.disruption_risk_score >= 45) out.push({ kind: "disruption", severity: s.disruption_risk_score >= 55 ? "high" : "medium", detail: "Construction-phase congestion, dust and noise may temporarily reduce livability.", confidence: 0.68 });
  if (s.oversupply_risk_score >= 50) out.push({ kind: "oversupply", severity: s.oversupply_risk_score >= 58 ? "high" : "medium", detail: "Redevelopment free-sale stock and launches could pressure prices and rents.", confidence: 0.62 });
  if (s.affordability_risk_score >= 65) out.push({ kind: "affordability", severity: "high", detail: "Prices are already premium, so upside may be more defensive than explosive.", confidence: 0.72 });
  out.push({ kind: "legal", severity: "medium", detail: "Redevelopment eligibility, approvals and policy changes can alter outcomes — request a legal check.", confidence: 0.6 });
  return out;
}

function actionsFor(loc: RadarLocality) {
  return [
    { role: "buyer", label: "Shortlist nearby properties", detail: `See ASTRA listings in ${loc.name}`, href: `/workspace/?q=${encodeURIComponent(loc.name)}` },
    { role: "buyer", label: "Set price-drop alert", detail: `Watch ${loc.name} for new listings and updates`, href: `/radar/alerts` },
    { role: "broker", label: "Generate investor pitch", detail: `Future-growth pitch for ${loc.name}`, href: `/broker` },
    { role: "broker", label: "Create PropertyPool", detail: `Pool buyers around ${loc.name} catalysts`, href: `/broker/propertypool` },
    { role: "manager", label: "Reposition listing narrative", detail: `Add evidence-backed ${loc.name} future highlights`, href: `/manager/listings` },
    { role: "crm", label: "Create locality campaign", detail: `Target buyers interested in ${loc.name}`, href: `/crm/campaigns` },
  ];
}

export function buildDemoLocalityDetail(slug: string): LocalityDetail {
  const loc = bySlug(slug);
  const projects = DEMO_RADAR_PROJECTS.filter((p) => p.affected_localities.includes(loc.slug));
  return {
    locality: loc,
    timeline: timelineFor(projects, loc),
    projects,
    redevelopment_zones: DEMO_RADAR_ZONES.filter((z) => z.locality_id === loc.slug),
    opportunities: opportunitiesFor(loc),
    risks: risksFor(loc),
    actions: actionsFor(loc),
    claims: localityClaims(loc, projects),
    related_property_ids: [],
  };
}

export function buildDemoMap() {
  const localities = DEMO_RADAR_LOCALITIES.map((l) => ({
    id: l.id, slug: l.slug, name: l.name, zone: l.zone, latitude: l.latitude, longitude: l.longitude,
    signal: l.signal, future_score: l.scores.future_score, boundary_geojson: null,
    top_catalysts: l.headline_catalysts.slice(0, 3), top_risks: l.headline_risks.slice(0, 3),
  }));
  return {
    center: [19.076, 72.8777] as [number, number],
    zoom: 11,
    localities,
    layers: [
      { key: "localities", label: "Localities (Future Score)", kind: "localities" as const, color: "#0f9d6b", features: [] },
      { key: "projects", label: "Infrastructure projects", kind: "projects" as const, color: "#2563eb",
        features: DEMO_RADAR_PROJECTS.map((p) => ({ id: p.id, name: p.name, type: p.project_type, status: p.status, localities: p.affected_localities })) },
      { key: "zones", label: "Redevelopment zones", kind: "zones" as const, color: "#7c3aed",
        features: DEMO_RADAR_ZONES.map((z) => ({ id: z.id, name: z.name, locality: z.locality_id, type: z.zone_type })) },
      { key: "demand", label: "ASTRA buyer demand", kind: "heatmap" as const, color: "#a8813c", features: [] },
      { key: "risk", label: "Execution risk", kind: "heatmap" as const, color: "#d6532c", features: [] },
    ],
  };
}

export function buildDemoCompare(slugs: string[]): CompareResponse {
  const localities = slugs.map(bySlug);
  const pick = (fn: (l: RadarLocality) => number): string => {
    let best = localities[0];
    for (const l of localities) if (fn(l) > fn(best)) best = l;
    return best.slug;
  };
  const verdicts: CompareVerdict[] = [
    { label: "Best for family / self-use", winner_slug: pick((l) => l.scores.self_use_score), reason: "Highest livability + connectivity, net of disruption." },
    { label: "Best for investment", winner_slug: pick((l) => l.scores.investment_score), reason: "Strongest infrastructure + redevelopment momentum, risk-adjusted." },
    { label: "Best for redevelopment", winner_slug: pick((l) => l.scores.redevelopment_score), reason: "Most active redevelopment momentum." },
    { label: "Best for rental yield", winner_slug: pick((l) => l.scores.rental_demand_score), reason: "Strongest rental demand signal." },
    { label: "Lowest risk", winner_slug: pick((l) => 100 - (l.scores.execution_risk_score + l.scores.oversupply_risk_score) / 2), reason: "Lowest combined execution + oversupply risk." },
    { label: "Most speculative", winner_slug: pick((l) => (l.scores.execution_risk_score + l.scores.oversupply_risk_score) / 2), reason: "Highest combined execution + oversupply risk — most timing-sensitive." },
    { label: "Best 3-year horizon", winner_slug: pick((l) => l.scores.connectivity_score + l.scores.market_demand_score), reason: "Near-term connectivity + demand favour this locality." },
    { label: "Best 7-year horizon", winner_slug: pick((l) => l.scores.future_score), reason: "Highest overall Future Score over a longer horizon." },
  ];
  const nameOf = (s: string) => bySlug(s).name;
  return {
    localities,
    verdicts,
    narrative: `Across ${localities.map((l) => l.name).join(", ")}, ${nameOf(verdicts[1].winner_slug)} leads on risk-adjusted investment while ${nameOf(verdicts[0].winner_slug)} is the stronger self-use choice. Treat all figures as decision support — verify catalysts and timelines against official sources.`,
  };
}

export function buildDemoReport(slug: string): LocalityReport {
  const d = buildDemoLocalityDetail(slug);
  const loc = d.locality;
  return {
    locality_slug: slug,
    title: `${loc.name} — Locality Future Intelligence Report`,
    generated_at: TODAY,
    summary: loc.summary,
    sections: [
      { heading: "Future Score", body: `${loc.scores.future_score}/100 (confidence ${(loc.scores.confidence_score * 100).toFixed(0)}%). Investment ${loc.scores.investment_score}, self-use ${loc.scores.self_use_score}, redevelopment ${loc.scores.redevelopment_score}.` },
      { heading: "Catalysts", body: loc.headline_catalysts.join("; ") },
      { heading: "Risks", body: loc.headline_risks.join("; ") },
      { heading: "Project pipeline", body: d.projects.map((p) => `${p.name} — ${p.status} (${p.authority})`).join("; ") },
    ],
    evidence: d.claims,
    disclaimer: "Decision support, not investment advice or a guarantee of price appreciation. Verify with official sources.",
  };
}

export function buildDemoPropertyCard(propertyId: string, localityName?: string): PropertyRadarCard {
  const loc =
    (localityName && DEMO_RADAR_LOCALITIES.find((l) => l.name.toLowerCase() === localityName.toLowerCase())) ||
    bySlug("powai");
  const d = buildDemoLocalityDetail(loc.slug);
  const topProject = d.projects[0];
  const s = loc.scores;
  return {
    property_id: propertyId,
    locality_slug: loc.slug,
    locality_name: loc.name,
    future_score: s.future_score,
    confidence_score: s.confidence_score,
    signal: loc.signal,
    nearest_catalyst: topProject?.name ?? null,
    nearest_catalyst_distance_km: topProject?.impacts.find((i) => i.locality_id === loc.slug)?.distance_km ?? null,
    connectivity_uplift: `Connectivity score ${s.connectivity_score}/100`,
    redevelopment_momentum: `Redevelopment momentum ${s.redevelopment_score}/100`,
    livability_improvement: `Livability ${s.livability_score}/100`,
    major_risks: loc.headline_risks,
    timeline: d.timeline.slice(0, 4),
    summary: `This ${loc.name} property sits in a locality scoring ${s.future_score}/100 on the Future Score. ${loc.summary}`,
    investor_view: { upside_score: s.investment_score, rental_demand: s.rental_demand_score, redevelopment: s.redevelopment_score, execution_risk: s.execution_risk_score },
    family_view: { livability: s.livability_score, commute: s.connectivity_score, disruption_risk: s.disruption_risk_score },
    broker_pitch: [
      `Lead with the confirmed catalyst: ${loc.headline_catalysts[0]}.`,
      `Position for ${s.investment_score >= 65 ? "investors seeking 3–7 year upside" : "end-users valuing connectivity"}.`,
      "Qualify timelines honestly — say 'may benefit', never 'guaranteed'.",
    ],
    manager_positioning: [
      `Add an evidence-backed Future Radar section citing ${topProject?.authority ?? "official"} sources.`,
      `Mention ${loc.headline_catalysts.slice(0, 2).join(" and ")} — link to the project pages.`,
      "Avoid unsupported appreciation claims; include the disclaimer.",
    ],
    similar_property_ids: [],
    evidence: d.claims,
  };
}

export function demoAnalyzeLocality(slug: string, role: string, query?: string): AnalyzeLocalityResponse {
  const d = buildDemoLocalityDetail(slug);
  const loc = d.locality;
  const s = loc.scores;
  return {
    locality_slug: slug,
    role,
    answer: `${loc.name} scores ${s.future_score}/100 on the Future Score (${(s.confidence_score * 100).toFixed(0)}% confidence). ${loc.summary}${query ? ` Regarding "${query}": the strongest evidence-backed catalyst is ${loc.headline_catalysts[0]}.` : ""}`,
    confidence_score: s.confidence_score,
    recommendation: s.investment_score >= 65
      ? `For a ${role}, ${loc.name} offers a constructive risk-adjusted profile — but verify project timelines and treat this as decision support, not a guarantee.`
      : `For a ${role}, ${loc.name} warrants a selective approach: weigh the catalysts against execution and oversupply risk.`,
    opportunities: d.opportunities,
    risks: d.risks,
    actions: d.actions.filter((a) => a.role === role || role === "buyer"),
    evidence: d.claims,
    audit_events: ["RadarOrchestrator routed to LocalityScoring", "EvidenceVerification confirmed sources on official claims"],
  };
}

// --------------------------------------------------------------------------- //
// Dashboard
// --------------------------------------------------------------------------- //
const byFuture = [...DEMO_RADAR_LOCALITIES].sort((a, b) => b.scores.future_score - a.scores.future_score);
const byRedev = [...DEMO_RADAR_LOCALITIES].sort((a, b) => b.scores.redevelopment_score - a.scores.redevelopment_score);
const byRisk = [...DEMO_RADAR_LOCALITIES].sort(
  (a, b) => b.scores.execution_risk_score + b.scores.oversupply_risk_score - (a.scores.execution_risk_score + a.scores.oversupply_risk_score),
);

export const DEMO_RADAR_DASHBOARD: RadarDashboard = {
  stats: [
    { label: "Localities tracked", value: String(DEMO_RADAR_LOCALITIES.length), detail: "Mumbai + MMR", tone: "ink" },
    { label: "Projects monitored", value: String(DEMO_RADAR_PROJECTS.length), detail: "Metro, road, rail, coastal, redevelopment", tone: "emerald" },
    { label: "Redevelopment zones", value: String(DEMO_RADAR_ZONES.length), detail: "MHADA / SRA / BDD / cluster", tone: "purple" },
    { label: "Open alerts", value: String(DEMO_RADAR_ALERTS.filter((a) => a.status === "unread").length), detail: "Across watched entities", tone: "coral" },
  ],
  top_growth: byFuture.slice(0, 5),
  top_redevelopment: byRedev.slice(0, 5),
  watch_risk: byRisk.slice(0, 5),
  active_projects: DEMO_RADAR_PROJECTS.filter((p) => p.status === "under_construction" || p.status === "partially_operational").slice(0, 6),
  recent_alerts: DEMO_RADAR_ALERTS.slice(0, 4),
  last_updated: TODAY,
};

export { projectById, bySlug as localityBySlug };
