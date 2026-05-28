import { DEMO_PROPERTIES } from "@/lib/demo";

export type ManagerListingStatus =
  | "draft"
  | "data_extraction"
  | "needs_review"
  | "ready_to_publish"
  | "published"
  | "leads_active"
  | "offer_stage"
  | "negotiation"
  | "closed"
  | "archived";

export type ManagerListing = {
  id: string;
  manager_id: string;
  title: string;
  slug: string;
  status: ManagerListingStatus;
  property_type: string;
  transaction_type: string;
  locality: string;
  address: string;
  latitude: number;
  longitude: number;
  carpet_area_sqft?: number | null;
  builtup_area_sqft?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  parking_count?: number | null;
  furnishing_status?: string | null;
  possession_status?: string | null;
  availability_date?: string | null;
  rera_number?: string | null;
  asking_price?: number | null;
  recommended_price?: number | null;
  fast_sale_price?: number | null;
  optimistic_price?: number | null;
  min_acceptable_price?: number | null;
  price_per_sqft?: number | null;
  market_heat_score: number;
  legal_risk_score: number;
  readiness_score: number;
  lead_quality_score: number;
  redevelopment_score: number;
  description_short?: string | null;
  description_long?: string | null;
  seo_title?: string | null;
  public_visibility: boolean;
  hero_image_url?: string | null;
  lead_count: number;
  pending_tasks: number;
  next_visit?: string | null;
  updated_at?: string | null;
  owner_name?: string | null;
  owner_phone?: string | null;
  owner_email?: string | null;
  documents?: Array<Record<string, unknown>>;
  media?: Array<Record<string, unknown>>;
  leads?: Array<Record<string, unknown>>;
  site_visits?: Array<Record<string, unknown>>;
  audit_log?: Array<Record<string, unknown>>;
  automation_rules?: Array<Record<string, unknown>>;
  market_comparables?: Array<Record<string, unknown>>;
  pricing?: Record<string, unknown> | null;
  listing_copy?: Record<string, unknown> | null;
  readiness_breakdown?: Record<string, unknown>;
  missing_fields?: string[];
  legal_notes?: string[];
  public_preview_url?: string | null;
  map_preview?: Record<string, unknown>;
};

export type ManagerDashboard = {
  manager: {
    id: string;
    full_name: string;
    company_name: string;
    operating_localities: string[];
  };
  summary_cards: Array<{ label: string; value: string; detail?: string | null; tone?: string }>;
  map_pins: Array<{
    id: string;
    title: string;
    locality: string;
    address?: string | null;
    status: ManagerListingStatus;
    color: string;
    latitude: number;
    longitude: number;
    price?: number | null;
    market_heat_score: number;
    legal_risk_score: number;
    lead_count: number;
    readiness_score: number;
  }>;
  pipeline_columns: Array<{ id: string; label: string; listing_ids: string[]; count: number }>;
  activity_feed: Array<{ id: string; created_at: string; actor_type: string; actor_name: string; action: string; details: string; tone: string }>;
  urgent_tasks: Array<{ id: string; title: string; description: string; priority: string; status: string; action_label: string; listing_id?: string | null }>;
  listings: ManagerListing[];
  market_highlights: Record<string, unknown>;
};

export type ManagerLead = {
  id: string;
  listing_id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  source: string;
  budget_min?: number | null;
  budget_max?: number | null;
  preferred_visit_time?: string | null;
  buyer_profile?: string | null;
  intent_score: number;
  qualification_score: number;
  status: string;
  last_agent_summary?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type ManagerTask = {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  action_label: string;
  listing_id?: string | null;
};

export type ManagerAutomationRule = {
  id: string;
  name: string;
  enabled: boolean;
  last_run?: string | null;
  next_run?: string | null;
  agent_name: string;
  logs: string[];
  failure_state?: string | null;
};

const MANAGER_ID = "manager-demo-1";
const statuses: ManagerListingStatus[] = ["draft", "needs_review", "ready_to_publish", "published", "leads_active", "offer_stage"];

export const DEMO_MANAGER_PROFILE = {
  id: MANAGER_ID,
  full_name: "Patel Panel Manager",
  company_name: "Patel Panel Realty",
  operating_localities: ["Bandra", "Andheri", "Borivali", "Malad", "Ghatkopar", "Powai", "Worli", "Chembur", "Dadar", "Lower Parel", "Thane", "Navi Mumbai"],
};

export const DEMO_MANAGER_LISTINGS: ManagerListing[] = DEMO_PROPERTIES.slice(0, 6).map((property, index) => {
  const asking = property.price;
  const carpet = property.carpet_area_sqft || property.area_sqft;
  const status = statuses[index % statuses.length];
  return {
    id: `seller-${property.id}`,
    manager_id: MANAGER_ID,
    title: property.title,
    slug: property.id,
    status,
    property_type: property.property_type || "apartment",
    transaction_type: "sale",
    locality: property.locality,
    address: property.address,
    latitude: property.latitude,
    longitude: property.longitude,
    carpet_area_sqft: carpet,
    builtup_area_sqft: property.built_up_area_sqft || carpet,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    parking_count: property.bedrooms >= 3 ? 2 : 1,
    furnishing_status: index % 2 === 0 ? "furnished" : "semi-furnished",
    possession_status: property.possession || "Ready to move",
    availability_date: property.availability,
    rera_number: property.rera_id,
    asking_price: asking,
    recommended_price: Math.round(asking * 0.97),
    fast_sale_price: Math.round(asking * 0.94),
    optimistic_price: Math.round(asking * 1.05),
    min_acceptable_price: Math.round(asking * 0.92),
    price_per_sqft: Math.round(asking / Math.max(carpet, 1)),
    market_heat_score: property.walkability_score || 68,
    legal_risk_score: property.rera_id ? 18 : 48,
    readiness_score: 72 + (property.image_url ? 6 : 0) + (property.rera_id ? 6 : 0),
    lead_quality_score: 54 + index * 6,
    redevelopment_score: property.redevelopment_score || 55 + index * 3,
    description_short: property.description,
    description_long: `${property.description} This listing is managed through an AI-assisted seller workflow with document, media, pricing, and publishing automation.`,
    seo_title: `${property.title} | Mumbai Seller Listing`,
    public_visibility: index >= 2,
    hero_image_url: property.image_url,
    lead_count: 3 + index,
    pending_tasks: 2 - (index % 2),
    next_visit: property.availability,
    updated_at: new Date().toISOString(),
    owner_name: index % 2 === 0 ? "Patel Family" : "Builder Desk",
    owner_phone: "+91 90000 00001",
    owner_email: "seller@example.com",
    documents: index < 2 ? [] : [{ document_type: "sale_deed", extraction_status: "extracted" }],
    media: property.image_url ? [{ media_type: "image", room_type: "living_room", is_hero: true, quality_score: 88 }] : [],
    leads: [
      {
        id: `lead-${index}`,
        name: index % 2 === 0 ? "Rahul Shah" : "Mina Mehta",
        phone: "+91 98765 43210",
        email: index % 2 === 0 ? "rahul@example.com" : "mina@example.com",
        source: index % 2 === 0 ? "whatsapp" : "call",
        budget_min: asking * 0.85,
        budget_max: asking * 1.05,
        preferred_visit_time: "Saturday 4 PM",
        buyer_profile: index % 2 === 0 ? "family" : "investor",
        intent_score: 77 + index,
        qualification_score: 69 + index,
        status: index % 2 === 0 ? "qualified" : "hot",
        last_agent_summary: "Qualified by WhatsApp assistant and routed to viewing.",
        created_at: new Date().toISOString(),
      },
    ],
    site_visits: [
      {
        id: `visit-${index}`,
        listing_id: `seller-${property.id}`,
        scheduled_start: new Date(Date.now() + 86400000 * (index + 1)).toISOString(),
        scheduled_end: new Date(Date.now() + 86400000 * (index + 1) + 3600000).toISOString(),
        status: "scheduled",
        notes: "Auto-booked from manager portal demo",
        created_at: new Date().toISOString(),
      },
    ],
    audit_log: [
      {
        id: `audit-${index}`,
        actor_type: "agent",
        actor_name: "Document Due Diligence Agent",
        action: "document_extracted",
        details_json: { summary: `Extracted 12 clauses from ${property.title}` },
        created_at: new Date(Date.now() - 3600_000 * index).toISOString(),
      },
    ],
    automation_rules: [],
    market_comparables: [],
    pricing: {
      recommended_price: Math.round(asking * 0.97),
      minimum_acceptable_price: Math.round(asking * 0.92),
      optimistic_price: Math.round(asking * 1.05),
      fast_sale_price: Math.round(asking * 0.94),
      price_per_sqft: Math.round(asking / Math.max(carpet, 1)),
      rental_yield_estimate: property.expected_rent_yield || 2.8,
      buyer_affordability_segment: asking >= 100_000_000 ? "above ₹10 Cr" : asking >= 50_000_000 ? "₹5–10 Cr" : "below ₹5 Cr",
      negotiation_buffer: Math.round(asking * 0.05),
      market_heat_score: property.walkability_score || 68,
      redevelopment_upside_score: property.redevelopment_score || 55,
      confidence_score: 79,
      explanation: `Pricing blends Mumbai locality demand, inventory pressure, EMI sensitivity, and ${property.locality} comparables.`,
    },
    listing_copy: {
      seo_title: `${property.title} | Mumbai Seller Listing`,
      short_description: property.description,
      long_description: property.description,
      premium_description: `${property.title} is a premium Mumbai seller listing supported by AI pricing and document automation.`,
      whatsapp_message: `New listing: ${property.title} in ${property.locality}. Ask for docs, pricing, or a viewing slot.`,
      broker_pitch: `Broker-ready listing with pricing confidence and seller automation.`,
      investor_pitch: `Strong market signals and controlled negotiation bands.`,
      family_buyer_pitch: `Family-friendly Mumbai location with manager-approved details.`,
      nri_buyer_pitch: `NRI-ready seller pack with map and doc workflow.`,
      social_post: `Just listed in Mumbai: ${property.title}.`,
      bullet_points: [property.locality, `${property.bedrooms} BHK`, `${carpet} sq ft`],
      amenity_highlights: property.amenities.slice(0, 3),
      locality_highlights: [property.locality, property.micro_market || "Mumbai"],
      redevelopment_angle: property.redevelopment_score ? `${property.locality} redevelopment upside tracked` : null,
      compliance_highlights: ["No unsupported legal claims", "Manager confirmation for unverified items"],
      needs_confirmation: index === 0 ? ["Legal claim review"] : [],
    },
    readiness_breakdown: {
      data_completeness: 82,
      legal_completeness: property.rera_id ? 84 : 54,
      media_completeness: property.image_url ? 80 : 52,
      pricing_confidence: 79,
      market_positioning_confidence: 81,
      buyer_demand_score: 73,
      risk_level: property.rera_id ? "medium" : "elevated",
      listing_quality_score: 80,
    },
    missing_fields: index === 0 ? ["Title report", "Encumbrance certificate"] : [],
    legal_notes: property.rera_id ? ["RERA present"] : ["RERA confirmation pending"],
    public_preview_url: `/manager/listings/${`seller-${property.id}`}`,
    map_preview: { latitude: property.latitude, longitude: property.longitude, locality: property.locality },
  };
});

export const MANAGER_DEMO_LISTING_IDS = DEMO_MANAGER_LISTINGS.map((listing) => listing.id);

export const DEMO_MANAGER_LEADS: ManagerLead[] = DEMO_MANAGER_LISTINGS.flatMap((listing, index) => [
  {
    id: `lead-${index}-a`,
    listing_id: listing.id,
    name: index % 2 === 0 ? "Rahul Shah" : "Mina Mehta",
    phone: "+91 98765 43210",
    email: "buyer@example.com",
    source: index % 2 === 0 ? "whatsapp" : "call",
    budget_min: listing.asking_price ? listing.asking_price * 0.85 : null,
    budget_max: listing.asking_price ? listing.asking_price * 1.05 : null,
    preferred_visit_time: "Saturday 4 PM",
    buyer_profile: index % 2 === 0 ? "family" : "investor",
    intent_score: 82,
    qualification_score: 76,
    status: "qualified",
    last_agent_summary: "High-intent demo lead routed to viewing and negotiation.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]);

export const DEMO_MANAGER_TASKS: ManagerTask[] = [
  { id: "task-rera", title: "Missing RERA certificate", description: "Confirm the legal identifier before public publishing.", priority: "high", status: "open", action_label: "Review", listing_id: DEMO_MANAGER_LISTINGS[0]?.id },
  { id: "task-copy", title: "Approve AI-generated listing copy", description: "Review claim language and publish-ready content.", priority: "medium", status: "open", action_label: "Approve", listing_id: DEMO_MANAGER_LISTINGS[1]?.id },
  { id: "task-images", title: "Upload better living room images", description: "Add stronger hero visuals to lift conversion.", priority: "medium", status: "open", action_label: "Upload", listing_id: DEMO_MANAGER_LISTINGS[2]?.id },
  { id: "task-visit", title: "Confirm Saturday viewing", description: "Finalize the scheduled site visit with the buyer.", priority: "medium", status: "open", action_label: "Confirm", listing_id: DEMO_MANAGER_LISTINGS[3]?.id },
];

export const DEMO_MANAGER_AUDIT_LOG = DEMO_MANAGER_LISTINGS.flatMap((listing, index) => [
  {
    id: `audit-${index}-1`,
    created_at: new Date(Date.now() - 600000 * (index + 1)).toISOString(),
    actor_type: "agent",
    actor_name: "Document Due Diligence Agent",
    action: "document_extracted",
    details: `Document Agent extracted ${10 + index} clauses from Agreement.pdf`,
    tone: "emerald",
  },
  {
    id: `audit-${index}-2`,
    created_at: new Date(Date.now() - 400000 * (index + 1)).toISOString(),
    actor_type: "agent",
    actor_name: "Pricing Agent",
    action: "pricing_recommended",
    details: `Pricing Agent found comparables in ${listing.locality} and recommended a seller price`,
    tone: "amber",
  },
]);

export const DEMO_MANAGER_AUTOMATION_RULES: ManagerAutomationRule[] = [
  { id: "rule-1", name: "Auto respond to WhatsApp leads", enabled: true, last_run: new Date().toISOString(), next_run: "Every 5 minutes", agent_name: "Lead Qualification Agent", logs: ["Lead qualified and routed"], failure_state: null },
  { id: "rule-2", name: "Auto schedule visits", enabled: true, last_run: new Date().toISOString(), next_run: "Every 10 minutes", agent_name: "Calendar Scheduling Agent", logs: ["Booked viewing slot"], failure_state: null },
  { id: "rule-3", name: "Auto create Codex ingestion task", enabled: false, last_run: null, next_run: null, agent_name: "Codex Ops Agent", logs: ["Ready for raw video upload"], failure_state: null },
];

export const DEMO_MANAGER_MARKET = {
  city: "Mumbai",
  localities: DEMO_MANAGER_PROFILE.operating_localities,
  insights: {
    inventory_by_price_bucket: [
      { cost_range: "below ₹5 Cr", annual_sales_units: 1240, unsold_units: 2810, months_inventory: 13 },
      { cost_range: "₹5–10 Cr", annual_sales_units: 420, unsold_units: 870, months_inventory: 11 },
      { cost_range: "above ₹10 Cr", annual_sales_units: 88, unsold_units: 290, months_inventory: 9 },
    ],
    redevelopment: { development_agreements_signed_total: 742, period: "2024–2026", yoy_growth_2024_2025_pct: 14.2, top_micro_markets: { Bandra: 118, Borivali: 96, Ghatkopar: 74, Powai: 61 }, expected_housing_units: 18200, land_unlocked_acres: 44 },
    construction_cost_guide: { standard: [2800, 3400], premium: [4200, 5200] },
    home_loan_reference: { emi_per_lakh: 836, annual_rate_pct: 8.25, tenure_years: 20 },
    recommendations: ["Keep legal items visible before publish", "Use high-quality living room images", "Match price to inventory pressure and EMI sensitivity"],
  },
  comparables: DEMO_MANAGER_LISTINGS.map((listing) => ({
    id: listing.id,
    locality: listing.locality,
    property_type: listing.property_type,
    price: listing.asking_price,
    price_per_sqft: listing.price_per_sqft,
    carpet_area_sqft: listing.carpet_area_sqft,
    bedrooms: listing.bedrooms,
    transaction_date: "2026-04-15",
    source: "demo-db",
    metadata_json: { status: listing.status },
    created_at: new Date().toISOString(),
  })),
  cost_buckets: ["below ₹5 Cr", "₹5–10 Cr", "above ₹10 Cr"],
  buyer_suitability: { family: ["Borivali", "Chembur", "Powai"], investor: ["Andheri", "Malad", "Ghatkopar"], nri: ["Bandra", "Worli", "Lower Parel"] },
};

export const DEMO_MANAGER_DASHBOARD = {
  manager: DEMO_MANAGER_PROFILE,
  summary_cards: [
    { label: "Active listings", value: "4", detail: "Published and lead-active listings", tone: "emerald" },
    { label: "Draft listings", value: "2", detail: "Needs review before publishing", tone: "slate" },
    { label: "Leads this week", value: "18", detail: "Qualified WhatsApp, call, and web leads", tone: "gold" },
    { label: "Site visits", value: "6", detail: "Scheduled and requested", tone: "emerald" },
    { label: "Offers received", value: "3", detail: "Open negotiation flow", tone: "amber" },
    { label: "Avg response", value: "8 min", detail: "Assistant response time", tone: "slate" },
    { label: "Pipeline value", value: "₹18.6 Cr", detail: "Public visible value", tone: "emerald" },
    { label: "Needs attention", value: "2", detail: "Legal or media gaps", tone: "amber" },
    { label: "AI tasks done", value: "31", detail: "Autonomous actions logged", tone: "slate" },
    { label: "Legal alerts", value: "1", detail: "RERA / mismatch review", tone: "amber" },
  ],
  map_pins: DEMO_MANAGER_LISTINGS.map((listing) => ({
    id: listing.id,
    title: listing.title,
    locality: listing.locality,
    address: listing.address,
    status: listing.status,
    color: listing.status === "published" ? "green" : listing.status === "needs_review" ? "red" : listing.status === "offer_stage" ? "purple" : listing.status === "leads_active" ? "blue" : listing.status === "draft" ? "yellow" : "gray",
    latitude: listing.latitude,
    longitude: listing.longitude,
    price: listing.asking_price,
    market_heat_score: listing.market_heat_score,
    legal_risk_score: listing.legal_risk_score,
    lead_count: listing.lead_count,
    readiness_score: listing.readiness_score,
    next_visit: listing.next_visit,
  })),
  pipeline_columns: [
    { id: "draft", label: "Draft", listing_ids: DEMO_MANAGER_LISTINGS.filter((listing) => listing.status === "draft").map((listing) => listing.id), count: 1 },
    { id: "needs_review", label: "Needs Review", listing_ids: DEMO_MANAGER_LISTINGS.filter((listing) => listing.status === "needs_review").map((listing) => listing.id), count: 1 },
    { id: "ready_to_publish", label: "Ready to Publish", listing_ids: DEMO_MANAGER_LISTINGS.filter((listing) => listing.status === "ready_to_publish").map((listing) => listing.id), count: 1 },
    { id: "published", label: "Published", listing_ids: DEMO_MANAGER_LISTINGS.filter((listing) => listing.status === "published").map((listing) => listing.id), count: 1 },
    { id: "leads_active", label: "Leads Active", listing_ids: DEMO_MANAGER_LISTINGS.filter((listing) => listing.status === "leads_active").map((listing) => listing.id), count: 1 },
    { id: "offer_stage", label: "Offer Stage", listing_ids: DEMO_MANAGER_LISTINGS.filter((listing) => listing.status === "offer_stage").map((listing) => listing.id), count: 1 },
    { id: "negotiation", label: "Negotiation", listing_ids: [], count: 0 },
    { id: "closed", label: "Closed", listing_ids: [], count: 0 },
    { id: "archived", label: "Archived", listing_ids: [], count: 0 },
  ],
  activity_feed: DEMO_MANAGER_AUDIT_LOG.slice(0, 8),
  urgent_tasks: DEMO_MANAGER_TASKS,
  listings: DEMO_MANAGER_LISTINGS,
  market_highlights: DEMO_MANAGER_MARKET,
};
