import { DEMO_MARKET_INSIGHTS, DEMO_PROPERTIES, searchDemoProperties } from "@/lib/demo";
import {
  DEMO_MANAGER_AUDIT_LOG,
  DEMO_MANAGER_AUTOMATION_RULES,
  DEMO_MANAGER_DASHBOARD,
  DEMO_MANAGER_LEADS,
  DEMO_MANAGER_LISTINGS,
  DEMO_MANAGER_MARKET,
  DEMO_MANAGER_TASKS,
  MANAGER_DEMO_LISTING_IDS,
} from "@/lib/manager-demo";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type MaterialEstimate = {
  cement_bags?: [number, number];
  steel_kg?: [number, number];
  bricks_nos?: [number, number];
  sand_cft?: [number, number];
  aggregate_cft?: [number, number];
  construction_months?: [number, number];
};

export type Property = {
  id: string;
  title: string;
  address: string;
  city: string;
  locality: string;
  micro_market?: string;
  property_type?: string;
  transaction_type?: string;
  price: number;
  price_per_sqft?: number;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  carpet_area_sqft?: number;
  built_up_area_sqft?: number;
  latitude: number;
  longitude: number;
  status: "available" | "reserved" | "sold";
  availability: string;
  possession?: string;
  builder?: string;
  description: string;
  amenities: string[];
  tags: string[];
  image_url?: string;
  splat_url?: string;
  rera_id?: string;
  score?: number;
  inventory_months?: number;
  cost_bucket?: string;
  redevelopment_score?: number;
  redevelopment_das_signed?: number;
  construction_cost_low?: number;
  construction_cost_high?: number;
  material_estimate?: MaterialEstimate;
  emi_20y_per_lakh?: number;
  monthly_emi_estimate?: number;
  expected_rent_yield?: number;
  walkability_score?: number;
  commute_score?: number;
  risk_flags?: string[];
};

export type MarketInsights = {
  city: string;
  inventory_by_price_bucket: Array<{ cost_range: string; annual_sales_units: number; unsold_units: number; months_inventory: number }>;
  redevelopment: {
    development_agreements_signed_total: number;
    period: string;
    yoy_growth_2024_2025_pct: number;
    top_micro_markets: Record<string, number>;
    expected_housing_units: number;
    land_unlocked_acres: number;
  };
  construction_cost_guide: Record<string, unknown>;
  home_loan_reference: Record<string, unknown>;
  recommendations: string[];
};

export type LeadQualification = {
  lead_score: number;
  intent: string;
  recommended_agent: string;
  suggested_reply: string;
  extracted_requirements: Record<string, unknown>;
};

export type AgentRunResult = {
  route: string;
  answer: string;
  data?: {
    properties?: Property[];
    [key: string]: unknown;
  };
};

export type FinanceEstimate = {
  property_price: number | null;
  loan_amount: number | null;
  monthly_emi: number | null;
  emi_per_lakh: number;
  annual_rate_pct: number;
  tenure_years: number;
  construction_cost_range?: { min?: number | null; max?: number | null } | null;
  material_estimate?: MaterialEstimate | null;
  notes?: string[];
};

export type TourWaypoint = {
  label: string;
  focus: string;
};

export type TourGuideResult = {
  property_id: string | null;
  route_name: string;
  narration: string;
  waypoints: TourWaypoint[];
  next_action: string;
};

export type BookingResponse = {
  booking?: {
    id?: string;
    status?: string;
    start?: string;
    title?: string;
    demo?: boolean;
  };
};

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
    next_visit?: string | null;
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

export type BrokerProfile = {
  id: string;
  full_name: string;
  agency_name?: string | null;
  phone: string;
  email: string;
  whatsapp_number?: string | null;
  rera_agent_id?: string | null;
  operating_localities: string[];
  years_experience: number;
  property_categories: string[];
  buyer_network_size: number;
  average_monthly_visits: number;
  preferred_commission_structure?: string | null;
  languages_spoken: string[];
  specialization: string[];
  verification_status: "pending" | "verified" | "needs_review" | "rejected";
  trust_score: number;
  missing_document_tasks?: string[];
};

export type BrokerProperty = {
  id: string;
  manager_id: string;
  title: string;
  locality: string;
  address: string;
  latitude: number;
  longitude: number;
  price?: number | null;
  carpet_area_sqft?: number | null;
  bedrooms?: number | null;
  property_type: string;
  image_url?: string | null;
  commission_estimate: number;
  commission_range: string;
  tieup_status: string;
  map_color: string;
  allowed_marketing_status: string;
  buyer_match_score: number;
  buyer_demand_score: number;
  market_heat_score: number;
  legal_risk_score: number;
  redevelopment_score: number;
  visit_availability: string;
  propertypool_status: string;
  propertypool_eligible: boolean;
  sharing_rights: string[];
  rera_number?: string | null;
  description?: string | null;
  shareable_pitch?: string;
  tour_route?: { route_name?: string; waypoints?: Array<{ label: string; focus: string }> };
};

export type BrokerTieup = {
  id: string;
  broker_id: string;
  manager_id: string;
  listing_id: string;
  property_title: string;
  manager_name: string;
  status: string;
  requested_commission: number;
  approved_commission?: number | null;
  requested_validity_days: number;
  approved_validity_days?: number | null;
  requested_exclusivity: boolean;
  approved_exclusivity: boolean;
  requested_propertypool_rights: boolean;
  approved_propertypool_rights: boolean;
  intended_buyer_segment: string;
  expected_buyer_count: number;
  marketing_channels: string[];
  broker_message?: string | null;
  manager_response?: string | null;
  ai_recommendation_json: Record<string, unknown>;
  approved_terms_json: Record<string, unknown>;
  expires_at?: string | null;
  created_at: string;
};

export type BrokerBuyer = {
  id: string;
  broker_id: string;
  full_name: string;
  phone: string;
  email?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  preferred_localities: string[];
  property_type_preference?: string | null;
  bhk_preference?: string | null;
  purchase_purpose?: string | null;
  buying_timeline?: string | null;
  loan_required: boolean;
  family_size?: number | null;
  lead_temperature: "cold" | "warm" | "hot" | "ready_to_offer";
  communication_channel: string;
  assigned_properties: string[];
  follow_up_status: string;
  qualification_score: number;
  notes?: string | null;
  created_at: string;
};

export type PropertyPoolEvent = {
  id: string;
  listing_id: string;
  broker_id: string;
  manager_id: string;
  tieup_id?: string | null;
  event_title: string;
  event_type: string;
  status: string;
  scheduled_start: string;
  scheduled_end?: string | null;
  max_buyers: number;
  meeting_point: string;
  buyer_segment: string;
  route_json: { route_name?: string; waypoints?: Array<{ label: string; focus: string }> };
  tour_script: string;
  invite_message: string;
  reminder_schedule_json: Record<string, unknown>;
  manager_approval_status: string;
  registered_buyers: number;
  attended_buyers: number;
  offer_pipeline: number;
  created_at: string;
};

export type BrokerCommission = {
  id: string;
  broker_id: string;
  buyer_id?: string | null;
  listing_id: string;
  tieup_id?: string | null;
  deal_status: string;
  property_value: number;
  commission_percentage: number;
  expected_commission: number;
  approved_commission?: number | null;
  payout_status: string;
  dispute_status: string;
  created_at: string;
};

export type BrokerDashboard = {
  broker: BrokerProfile;
  summary_cards: Array<{ label: string; value: string; detail?: string | null; tone?: string }>;
  map_pins: Array<{
    id: string;
    title: string;
    locality: string;
    latitude: number;
    longitude: number;
    price?: number | null;
    color: string;
    commission_range: string;
    tieup_status: string;
    visit_availability: string;
    buyer_demand_score: number;
    legal_risk_score: number;
    market_heat_score: number;
  }>;
  available_properties: BrokerProperty[];
  tieup_feed: BrokerTieup[];
  propertypool_events: PropertyPoolEvent[];
  buyers: BrokerBuyer[];
  commissions: BrokerCommission[];
  activity_feed: Array<{ id: string; created_at: string; actor_name: string; action: string; details: string; tone?: string }>;
  next_best_actions: Array<{ id: string; agent_name: string; task_type: string; status: string; priority: string; output_json?: Record<string, unknown> }>;
  attribution_alerts: Array<Record<string, unknown>>;
};

const DEMO_BROKER_PROFILE: BrokerProfile = {
  id: "broker-demo-1",
  full_name: "Aarav Shah",
  agency_name: "Shah Homes Network",
  phone: "+91 90000 01001",
  email: "aarav@shahhomes.example",
  whatsapp_number: "+91 90000 01001",
  rera_agent_id: "A51800004567",
  operating_localities: ["Andheri", "Bandra", "Chembur", "Powai", "Borivali"],
  years_experience: 9,
  property_categories: ["resale", "luxury", "redevelopment"],
  buyer_network_size: 240,
  average_monthly_visits: 22,
  preferred_commission_structure: "2% success fee with protected attribution",
  languages_spoken: ["English", "Hindi", "Marathi", "Gujarati"],
  specialization: ["luxury", "redevelopment", "resale", "NRI"],
  verification_status: "verified",
  trust_score: 88,
  missing_document_tasks: [],
};

function demoBrokerProperties(): BrokerProperty[] {
  return DEMO_MANAGER_LISTINGS.slice(0, 6).map((listing, index) => {
    const pct = index % 2 === 0 ? 2.2 : 1.8;
    const approved = index === 1;
    return {
      id: listing.id,
      manager_id: listing.manager_id,
      title: listing.title,
      locality: listing.locality,
      address: listing.address,
      latitude: listing.latitude,
      longitude: listing.longitude,
      price: listing.asking_price,
      carpet_area_sqft: listing.carpet_area_sqft,
      bedrooms: listing.bedrooms,
      property_type: listing.property_type,
      image_url: listing.hero_image_url,
      commission_estimate: Math.round((listing.asking_price || 0) * pct / 100),
      commission_range: `${pct.toFixed(1)}% - ${(pct + 0.4).toFixed(1)}%`,
      tieup_status: approved ? "active" : index === 2 ? "under_review" : "open",
      map_color: approved ? "blue" : index === 2 ? "yellow" : pct >= 2 ? "purple" : "green",
      allowed_marketing_status: approved ? "approved channels active" : "request tie-up to share",
      buyer_match_score: 91 - index * 4,
      buyer_demand_score: 86 - index * 3,
      market_heat_score: listing.market_heat_score,
      legal_risk_score: listing.legal_risk_score,
      redevelopment_score: listing.redevelopment_score,
      visit_availability: listing.availability_date || "This week",
      propertypool_status: approved ? "available" : "eligible after tie-up",
      propertypool_eligible: true,
      sharing_rights: approved ? ["WhatsApp", "Calls", "Existing buyer database"] : [],
      rera_number: listing.rera_number,
      description: listing.description_short,
    };
  });
}

const DEMO_BROKER_BUYERS: BrokerBuyer[] = [
  { id: "buyer-demo-1", broker_id: "broker-demo-1", full_name: "Rahul Mehta", phone: "+91 90000 02001", email: "rahul@example.com", budget_min: 16000000, budget_max: 24000000, preferred_localities: ["Andheri", "Powai"], property_type_preference: "apartment", bhk_preference: "2 BHK", purchase_purpose: "family buyers", buying_timeline: "30-60 days", loan_required: true, family_size: 4, lead_temperature: "hot", communication_channel: "WhatsApp", assigned_properties: [], follow_up_status: "due today", qualification_score: 88, created_at: new Date().toISOString() },
  { id: "buyer-demo-2", broker_id: "broker-demo-1", full_name: "Nisha Iyer", phone: "+91 90000 02002", email: "nisha@example.com", budget_min: 45000000, budget_max: 75000000, preferred_localities: ["Bandra", "Worli"], property_type_preference: "apartment", bhk_preference: "3 BHK", purchase_purpose: "NRI buyers", buying_timeline: "ready", loan_required: false, family_size: 3, lead_temperature: "ready_to_offer", communication_channel: "WhatsApp", assigned_properties: [], follow_up_status: "send offer note", qualification_score: 94, created_at: new Date().toISOString() },
  { id: "buyer-demo-3", broker_id: "broker-demo-1", full_name: "Kabir Merchant", phone: "+91 90000 02003", email: "kabir@example.com", budget_min: 22000000, budget_max: 34000000, preferred_localities: ["Chembur", "Ghatkopar"], property_type_preference: "apartment", bhk_preference: "2-3 BHK", purchase_purpose: "investor", buying_timeline: "90 days", loan_required: true, family_size: 2, lead_temperature: "warm", communication_channel: "Calls", assigned_properties: [], follow_up_status: "match alternatives", qualification_score: 79, created_at: new Date().toISOString() },
];

function demoBrokerDashboard(): BrokerDashboard {
  const properties = demoBrokerProperties();
  const tieups: BrokerTieup[] = [{
    id: "tieup-demo-1",
    broker_id: "broker-demo-1",
    manager_id: "manager-demo-1",
    listing_id: properties[1]?.id || "seller-demo",
    property_title: properties[1]?.title || "Bandra Premium Home",
    manager_name: "Patel Panel Realty",
    status: "active",
    requested_commission: 2,
    approved_commission: 2,
    requested_validity_days: 45,
    approved_validity_days: 60,
    requested_exclusivity: false,
    approved_exclusivity: false,
    requested_propertypool_rights: true,
    approved_propertypool_rights: true,
    intended_buyer_segment: "NRI buyers",
    expected_buyer_count: 5,
    marketing_channels: ["WhatsApp", "Calls", "Existing buyer database"],
    broker_message: "I have qualified NRI buyers for Bandra and Worli.",
    manager_response: "Approved for verified claims only.",
    ai_recommendation_json: { fit_score: 92, risk_level: "low" },
    approved_terms_json: { attribution_expiry_days: 90 },
    expires_at: new Date(Date.now() + 60 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
  }];
  const event: PropertyPoolEvent = {
    id: "pool-demo-1",
    listing_id: properties[1]?.id || "seller-demo",
    broker_id: "broker-demo-1",
    manager_id: "manager-demo-1",
    tieup_id: "tieup-demo-1",
    event_title: "Bandra verified group visit",
    event_type: "broker-led group visit",
    status: "scheduled",
    scheduled_start: new Date(Date.now() + 2 * 86400000).toISOString(),
    scheduled_end: new Date(Date.now() + 2 * 86400000 + 90 * 60000).toISOString(),
    max_buyers: 8,
    meeting_point: "Main gate security desk",
    buyer_segment: "NRI buyers",
    route_json: { route_name: "Bandra PropertyPool mobile route", waypoints: [{ label: "Building approach", focus: "Road access, drop-off, security" }, { label: "Living room", focus: "Light, ventilation, layout" }, { label: "Closing discussion", focus: "EMI, documents, offer window" }] },
    tour_script: "Open with Bandra positioning, explain verified facts, summarize RERA/document status, then close with next steps.",
    invite_message: "Hi, I found a verified Bandra home matching your budget. Group visit is this Saturday at 5 PM. Should I reserve your slot?",
    reminder_schedule_json: { t_minus_24h: "WhatsApp reminder", post_visit: "Feedback" },
    manager_approval_status: "approved",
    registered_buyers: 4,
    attended_buyers: 0,
    offer_pipeline: 1,
    created_at: new Date().toISOString(),
  };
  const commissions: BrokerCommission[] = [{ id: "commission-demo-1", broker_id: "broker-demo-1", listing_id: tieups[0].listing_id, tieup_id: tieups[0].id, deal_status: "pipeline", property_value: properties[1]?.price || 0, commission_percentage: 2, expected_commission: Math.round((properties[1]?.price || 0) * 0.02), payout_status: "pending", dispute_status: "none", created_at: new Date().toISOString() }];
  return {
    broker: DEMO_BROKER_PROFILE,
    summary_cards: [
      { label: "Approved tie-ups", value: "1", detail: "Manager-approved inventory", tone: "emerald" },
      { label: "Pending requests", value: "1", detail: "Awaiting manager action", tone: "amber" },
      { label: "Available properties", value: String(properties.length), detail: "Mumbai inventory", tone: "slate" },
      { label: "Active buyers", value: String(DEMO_BROKER_BUYERS.length), detail: "Broker network", tone: "emerald" },
      { label: "PropertyPool events", value: "1", detail: "Group visits", tone: "gold" },
      { label: "Hot leads", value: "2", detail: "Ready for action", tone: "emerald" },
      { label: "Expected pipeline", value: `INR ${(commissions[0].expected_commission / 100000).toFixed(1)}L`, detail: "Commission forecast", tone: "gold" },
      { label: "AI tasks completed", value: "12", detail: "Automation actions", tone: "slate" },
    ],
    map_pins: properties.map((item) => ({ id: item.id, title: item.title, locality: item.locality, latitude: item.latitude, longitude: item.longitude, price: item.price, color: item.map_color, commission_range: item.commission_range, tieup_status: item.tieup_status, visit_availability: item.visit_availability, buyer_demand_score: item.buyer_demand_score, legal_risk_score: item.legal_risk_score, market_heat_score: item.market_heat_score })),
    available_properties: properties,
    tieup_feed: tieups,
    propertypool_events: [event],
    buyers: DEMO_BROKER_BUYERS,
    commissions,
    activity_feed: [
      { id: "feed-1", created_at: new Date().toISOString(), actor_name: "Tie-Up Agent", action: "inventory_match", details: "Found 7 properties matching your buyer network.", tone: "emerald" },
      { id: "feed-2", created_at: new Date().toISOString(), actor_name: "PropertyPool Agent", action: "group_visit_recommended", details: "Recommends creating a Saturday 5 PM group visit.", tone: "gold" },
      { id: "feed-3", created_at: new Date().toISOString(), actor_name: "Follow-Up Agent", action: "reminders", details: "Prepared reminders for 12 interested buyers.", tone: "slate" },
    ],
    next_best_actions: [
      { id: "task-1", agent_name: "Broker Growth Agent", task_type: "propertypool", status: "open", priority: "high", output_json: { title: "Create Andheri/Powai PropertyPool this weekend" } },
      { id: "task-2", agent_name: "Lead Attribution Agent", task_type: "protection", status: "open", priority: "high", output_json: { title: "Protect 3 buyer-property introductions before WhatsApp sharing" } },
    ],
    attribution_alerts: [],
  };
}

export async function getProperties(): Promise<Property[]> {
  try {
    const res = await fetch(`${API_URL}/api/properties`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load properties");
    return res.json();
  } catch (error) {
    console.warn("Using demo properties because the backend is unavailable.", error);
    return DEMO_PROPERTIES;
  }
}

export async function searchProperties(query: string): Promise<{ properties: Property[]; sql_preview: string; explanation: string }> {
  try {
    const res = await fetch(`${API_URL}/api/properties/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit: 8 }),
    });
    if (!res.ok) throw new Error("Search failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo property search because the backend is unavailable.", error);
    return {
      properties: searchDemoProperties(query),
      sql_preview: "demo_in_memory_search",
      explanation: "Demo search matched local sample Mumbai listings. Live API calls resume automatically when the backend is reachable.",
    };
  }
}

export async function runAgent(message: string, channel: "web" | "whatsapp" | "call" | "tour" | "broker" = "web"): Promise<AgentRunResult> {
  try {
    const res = await fetch(`${API_URL}/api/agents/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, channel }),
    });
    if (!res.ok) throw new Error("Agent failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo agent response because the backend is unavailable.", error);
    return {
      route: "demo_search_agent",
      answer: "Demo mode is active. I ranked sample Mumbai listings locally; live agent routing resumes when the backend and LLM keys are configured.",
      data: { properties: searchDemoProperties(message), sql_preview: "demo_agent_memory", intent: "demo" },
    };
  }
}

export async function getMarketInsights(): Promise<MarketInsights> {
  try {
    const res = await fetch(`${API_URL}/api/market/mumbai/insights`, { cache: "no-store" });
    if (!res.ok) throw new Error("Market insights failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo market insights because the backend is unavailable.", error);
    return DEMO_MARKET_INSIGHTS;
  }
}

export async function estimateFinance(input: {
  property_id?: string;
  price?: number;
  built_up_area_sqft?: number;
  down_payment_pct?: number;
  annual_rate_pct?: number;
  tenure_years?: number;
  construction_quality?: string;
}): Promise<FinanceEstimate> {
  try {
    const res = await fetch(`${API_URL}/api/finance/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Finance estimate failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo finance estimate because the backend is unavailable.", error);
    const property = DEMO_PROPERTIES.find((item) => item.id === input.property_id) || DEMO_PROPERTIES[0];
    const price = input.price || property.price;
    const area = input.built_up_area_sqft || property.built_up_area_sqft || property.area_sqft;
    const emiPerLakh = 836;
    const loanAmount = price * (1 - (input.down_payment_pct ?? 20) / 100);
    return {
      property_price: price,
      loan_amount: loanAmount,
      monthly_emi: (loanAmount / 100000) * emiPerLakh,
      emi_per_lakh: emiPerLakh,
      annual_rate_pct: input.annual_rate_pct || 8,
      tenure_years: input.tenure_years || 20,
      construction_cost_range: { min: area * 2250, max: area * 3000 },
      material_estimate: {
        cement_bags: [Math.round(area * 0.4), Math.round(area * 0.5)],
        steel_kg: [Math.round(area * 3.5), Math.round(area * 4.5)],
      },
      notes: ["Demo estimate. Live finance logic resumes when the backend is reachable."],
    };
  }
}

export async function guideTour(property_id?: string, query = "Give me a guided tour"): Promise<TourGuideResult> {
  try {
    const res = await fetch(`${API_URL}/api/tour/guide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ property_id, query, mode: "map" }),
    });
    if (!res.ok) throw new Error("Tour guide failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo tour because the backend is unavailable.", error);
    const property = DEMO_PROPERTIES.find((item) => item.id === property_id) || DEMO_PROPERTIES[0];
    return {
      property_id: property.id,
      route_name: `${property.locality} buyer viewing route`,
      narration: `Demo route for ${property.title}: start with access and building arrival, inspect light and ventilation, review amenities, then close with locality commute and negotiation notes.`,
      waypoints: [
        { label: "Arrival", focus: property.address },
        { label: "Apartment walkthrough", focus: `${property.bedrooms}BHK, ${property.area_sqft} sq ft` },
        { label: "Locality check", focus: `${property.locality} commute, walkability, and nearby services` },
      ],
      next_action: "Book a live viewing slot when the backend calendar integration is configured.",
    };
  }
}

export async function qualifyWhatsAppLead(input: {
  name?: string;
  phone?: string;
  message: string;
  budget?: number;
  preferred_locality?: string;
}): Promise<LeadQualification> {
  try {
    const res = await fetch(`${API_URL}/api/whatsapp/qualify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "whatsapp", ...input }),
    });
    if (!res.ok) throw new Error("WhatsApp qualification failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo WhatsApp lead qualification.", error);
    const locality = input.preferred_locality || "Powai";
    return {
      lead_score: 86,
      intent: "site_visit",
      recommended_agent: "mumbai_search_agent",
      suggested_reply: `Thanks${input.name ? ` ${input.name}` : ""}! I can shortlist Mumbai homes around ${locality}, share EMI estimates, and offer viewing slots today or tomorrow.`,
      extracted_requirements: { locality, channel: "whatsapp", demo: true },
    };
  }
}

export async function getBookingSlots(days = 7): Promise<Array<{ time: string; available?: boolean }>> {
  try {
    const res = await fetch(`${API_URL}/api/bookings/slots?days=${days}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Booking slots failed");
    const data = await res.json();
    return data.slots || [];
  } catch (error) {
    console.warn("Using demo booking slots.", error);
    const now = new Date();
    return Array.from({ length: 5 }, (_, index) => {
      const slot = new Date(now);
      slot.setDate(now.getDate() + index + 1);
      slot.setHours(11 + index, index % 2 ? 30 : 0, 0, 0);
      return { time: slot.toISOString(), available: true };
    });
  }
}

export async function createBooking(input: {
  name: string;
  email: string;
  start_time: string;
  property_title: string;
}): Promise<BookingResponse> {
  try {
    const res = await fetch(`${API_URL}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Booking failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo booking confirmation.", error);
    return {
      booking: {
        id: "demo-booking",
        status: "accepted",
        start: input.start_time,
        title: `Viewing: ${input.property_title}`,
        demo: true,
      },
    };
  }
}

export async function simulateCallAgent(message: string): Promise<AgentRunResult> {
  return runAgent(message, "call");
}

export type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function askAssistant(input: {
  message: string;
  context?: string;
  history?: AssistantMessage[];
}): Promise<{ answer: string; provider: string; model?: string | null; configured: boolean }> {
  try {
    const res = await fetch(`${API_URL}/api/assistant/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context: "workspace", history: [], ...input }),
    });
    if (!res.ok) throw new Error("Assistant failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo assistant because the backend is unavailable.", error);
    return {
      answer: "Demo assistant mode is active. I can still guide you around Search, Market, Map, Finance, Tours, Docs & Deals, and Agents. Start the FastAPI backend and add GEMINI_API_KEY for live LLM answers.",
      provider: "frontend-demo",
      model: null,
      configured: false,
    };
  }
}

export function formatInr(value?: number | null) {
  if (value === undefined || value === null) return "-";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export function formatCr(value?: number | null) {
  if (value === undefined || value === null) return "-";
  return `INR ${(value / 10_000_000).toFixed(value >= 100_000_000 ? 1 : 2)} Cr`;
}

export async function getManagerDashboard(): Promise<ManagerDashboard> {
  try {
    const res = await fetch(`${API_URL}/api/manager/dashboard`, { cache: "no-store" });
    if (!res.ok) throw new Error("Manager dashboard failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo manager dashboard.", error);
    return DEMO_MANAGER_DASHBOARD as ManagerDashboard;
  }
}

export async function getManagerListings(): Promise<ManagerListing[]> {
  try {
    const res = await fetch(`${API_URL}/api/manager/listings`, { cache: "no-store" });
    if (!res.ok) throw new Error("Manager listings failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo manager listings.", error);
    return DEMO_MANAGER_LISTINGS as ManagerListing[];
  }
}

export async function getManagerListing(listingId: string): Promise<ManagerListing> {
  try {
    const res = await fetch(`${API_URL}/api/manager/listings/${listingId}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Manager listing failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo manager listing.", error);
    return (DEMO_MANAGER_LISTINGS.find((item) => item.id === listingId) || DEMO_MANAGER_LISTINGS[0]) as ManagerListing;
  }
}

export async function createManagerListing(input: {
  manager_id?: string;
  title: string;
  property_type?: string;
  transaction_type?: string;
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
  owner_name?: string | null;
  owner_phone?: string | null;
  owner_email?: string | null;
  notes?: string | null;
}): Promise<ManagerListing> {
  try {
    const res = await fetch(`${API_URL}/api/manager/listings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Create manager listing failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo create manager listing.", error);
    const created: ManagerListing = {
      id: `seller-${Date.now().toString(36)}`,
      manager_id: input.manager_id || "manager-demo-1",
      title: input.title,
      slug: input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      status: "draft",
      property_type: input.property_type || "apartment",
      transaction_type: input.transaction_type || "sale",
      locality: input.locality,
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
      carpet_area_sqft: input.carpet_area_sqft,
      builtup_area_sqft: input.builtup_area_sqft,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      parking_count: input.parking_count,
      furnishing_status: input.furnishing_status,
      possession_status: input.possession_status,
      availability_date: input.availability_date,
      rera_number: input.rera_number,
      asking_price: input.asking_price,
      recommended_price: input.asking_price ? Math.round(input.asking_price * 0.97) : null,
      fast_sale_price: input.asking_price ? Math.round(input.asking_price * 0.94) : null,
      optimistic_price: input.asking_price ? Math.round(input.asking_price * 1.05) : null,
      min_acceptable_price: input.asking_price ? Math.round(input.asking_price * 0.92) : null,
      price_per_sqft: input.asking_price && input.carpet_area_sqft ? Math.round(input.asking_price / input.carpet_area_sqft) : null,
      market_heat_score: 60,
      legal_risk_score: input.rera_number ? 18 : 42,
      readiness_score: 44,
      lead_quality_score: 0,
      redevelopment_score: 50,
      description_short: input.notes || "Seller-created draft",
      description_long: input.notes || "Seller-created draft",
      seo_title: input.title,
      public_visibility: false,
      hero_image_url: null,
      lead_count: 0,
      pending_tasks: 1,
      next_visit: null,
      updated_at: new Date().toISOString(),
      owner_name: input.owner_name,
      owner_phone: input.owner_phone,
      owner_email: input.owner_email,
      documents: [],
      media: [],
      leads: [],
      site_visits: [],
      audit_log: [],
      automation_rules: [],
      market_comparables: [],
      pricing: null,
      listing_copy: null,
      readiness_breakdown: {},
      missing_fields: ["Title report", "RERA / legal identifier"],
      legal_notes: ["Awaiting document intake"],
      public_preview_url: `/manager/listings/seller-${Date.now().toString(36)}`,
      map_preview: { latitude: input.latitude, longitude: input.longitude, locality: input.locality },
    };
    return created;
  }
}

export async function runManagerListingAgents(listingId: string, input?: { manager_id?: string; user_request?: string; auto_publish?: boolean; current_task?: string }) {
  try {
    const res = await fetch(`${API_URL}/api/manager/listings/${listingId}/agent-run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manager_id: input?.manager_id || "manager-demo-1", user_request: input?.user_request || "Run seller automation", auto_publish: input?.auto_publish || false, current_task: input?.current_task || "seller_automation" }),
    });
    if (!res.ok) throw new Error("Manager agent run failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo manager automation response.", error);
    const listing = DEMO_MANAGER_LISTINGS.find((item) => item.id === listingId) || DEMO_MANAGER_LISTINGS[0];
    return { listing, automation_state: { published: false, readiness_score: listing.readiness_score, next_action: "Needs review" } };
  }
}

export async function publishManagerListing(listingId: string) {
  try {
    const res = await fetch(`${API_URL}/api/manager/listings/${listingId}/publish`, { method: "POST" });
    if (!res.ok) throw new Error("Publish listing failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo publish response.", error);
    const listing = DEMO_MANAGER_LISTINGS.find((item) => item.id === listingId) || DEMO_MANAGER_LISTINGS[0];
    return { published: true, missing_items: [], listing, audit_log: DEMO_MANAGER_AUDIT_LOG.slice(0, 6) };
  }
}

export async function uploadManagerDocuments(listingId: string, files: File[], document_type = "mixed") {
  try {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    form.append("document_type", document_type);
    const res = await fetch(`${API_URL}/api/manager/listings/${listingId}/documents`, { method: "POST", body: form });
    if (!res.ok) throw new Error("Manager document upload failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo manager document upload.", error);
    return { listing_id: listingId, documents: files.map((file) => ({ file_name: file.name, document_type, extraction_status: "extracted" })), audit_log: DEMO_MANAGER_AUDIT_LOG.slice(0, 2) };
  }
}

export async function uploadManagerMedia(listingId: string, files: File[], media_type = "image") {
  try {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    form.append("media_type", media_type);
    const res = await fetch(`${API_URL}/api/manager/listings/${listingId}/media`, { method: "POST", body: form });
    if (!res.ok) throw new Error("Manager media upload failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo manager media upload.", error);
    return { listing_id: listingId, media: files.map((file, index) => ({ file_name: file.name, media_type, is_hero: index === 0 })), audit_log: DEMO_MANAGER_AUDIT_LOG.slice(0, 2) };
  }
}

export async function getManagerLeads(): Promise<ManagerLead[]> {
  try {
    const res = await fetch(`${API_URL}/api/manager/leads`, { cache: "no-store" });
    if (!res.ok) throw new Error("Manager leads failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo manager leads.", error);
    return DEMO_MANAGER_LEADS;
  }
}

export async function getManagerLead(leadId: string): Promise<ManagerLead> {
  try {
    const res = await fetch(`${API_URL}/api/manager/leads/${leadId}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Manager lead failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo manager lead.", error);
    return DEMO_MANAGER_LEADS.find((lead) => lead.id === leadId) || DEMO_MANAGER_LEADS[0];
  }
}

export async function getManagerTasks(): Promise<ManagerTask[]> {
  try {
    const res = await fetch(`${API_URL}/api/manager/tasks`, { cache: "no-store" });
    if (!res.ok) throw new Error("Manager tasks failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo manager tasks.", error);
    return DEMO_MANAGER_TASKS;
  }
}

export async function runManagerAutomation(input: { listing_id: string; manager_id?: string; auto_publish?: boolean; current_task?: string }) {
  try {
    const res = await fetch(`${API_URL}/api/manager/automation/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manager_id: input.manager_id || "manager-demo-1", listing_id: input.listing_id, auto_publish: input.auto_publish || false, current_task: input.current_task || "seller_automation" }),
    });
    if (!res.ok) throw new Error("Manager automation failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo manager automation run.", error);
    return { listing: DEMO_MANAGER_LISTINGS[0], automation_state: { published: false, readiness_score: 74, next_action: "Needs review" } };
  }
}

export async function getManagerMarket() {
  try {
    const res = await fetch(`${API_URL}/api/manager/market/mumbai`, { cache: "no-store" });
    if (!res.ok) throw new Error("Manager market failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo manager market.", error);
    return DEMO_MANAGER_MARKET;
  }
}

export async function getManagerAuditLog() {
  try {
    const res = await fetch(`${API_URL}/api/manager/audit-log`, { cache: "no-store" });
    if (!res.ok) throw new Error("Manager audit log failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo manager audit log.", error);
    return DEMO_MANAGER_AUDIT_LOG;
  }
}

export async function getManagerAutomationRules(): Promise<ManagerAutomationRule[]> {
  try {
    const dashboard = await getManagerDashboard();
    const firstListing = dashboard.listings[0];
    return (firstListing?.automation_rules as ManagerAutomationRule[] | undefined) || DEMO_MANAGER_AUTOMATION_RULES;
  } catch {
    return DEMO_MANAGER_AUTOMATION_RULES;
  }
}

export async function getBrokerDashboard(): Promise<BrokerDashboard> {
  try {
    const res = await fetch(`${API_URL}/api/broker/dashboard`, { cache: "no-store" });
    if (!res.ok) throw new Error("Broker dashboard failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo broker dashboard.", error);
    return demoBrokerDashboard();
  }
}

export async function getBrokerProperties(): Promise<BrokerProperty[]> {
  try {
    const res = await fetch(`${API_URL}/api/broker/properties`, { cache: "no-store" });
    if (!res.ok) throw new Error("Broker properties failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo broker properties.", error);
    return demoBrokerProperties();
  }
}

export async function getBrokerProperty(propertyId: string): Promise<BrokerProperty> {
  try {
    const res = await fetch(`${API_URL}/api/broker/properties/${propertyId}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Broker property failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo broker property.", error);
    return demoBrokerProperties().find((item) => item.id === propertyId) || demoBrokerProperties()[0];
  }
}

export async function getBrokerProfile(): Promise<BrokerProfile> {
  try {
    const res = await fetch(`${API_URL}/api/broker/profile`, { cache: "no-store" });
    if (!res.ok) throw new Error("Broker profile failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo broker profile.", error);
    return DEMO_BROKER_PROFILE;
  }
}

export async function saveBrokerProfile(input: Partial<BrokerProfile>): Promise<BrokerProfile> {
  try {
    const res = await fetch(`${API_URL}/api/broker/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...DEMO_BROKER_PROFILE, ...input }),
    });
    if (!res.ok) throw new Error("Broker profile save failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo broker profile save.", error);
    return { ...DEMO_BROKER_PROFILE, ...input };
  }
}

export async function requestBrokerTieup(input: {
  listing_id: string;
  intended_buyer_segment?: string;
  expected_buyer_count?: number;
  marketing_channels?: string[];
  requested_commission?: number;
  requested_validity_days?: number;
  requested_propertypool_rights?: boolean;
  requested_exclusivity?: boolean;
  broker_message?: string;
}): Promise<BrokerTieup> {
  try {
    const res = await fetch(`${API_URL}/api/broker/tieups/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ broker_id: "broker-demo-1", intended_buyer_segment: "family buyers", expected_buyer_count: 4, marketing_channels: ["WhatsApp", "Calls"], requested_commission: 2, requested_validity_days: 45, requested_propertypool_rights: true, requested_exclusivity: false, ...input }),
    });
    if (!res.ok) throw new Error("Tie-up request failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo tie-up request.", error);
    const property = demoBrokerProperties().find((item) => item.id === input.listing_id) || demoBrokerProperties()[0];
    return {
      id: `tieup-${Date.now().toString(36)}`,
      broker_id: "broker-demo-1",
      manager_id: property.manager_id,
      listing_id: property.id,
      property_title: property.title,
      manager_name: "Patel Panel Realty",
      status: "under_review",
      requested_commission: input.requested_commission || 2,
      requested_validity_days: input.requested_validity_days || 45,
      requested_exclusivity: Boolean(input.requested_exclusivity),
      approved_exclusivity: false,
      requested_propertypool_rights: input.requested_propertypool_rights ?? true,
      approved_propertypool_rights: false,
      intended_buyer_segment: input.intended_buyer_segment || "family buyers",
      expected_buyer_count: input.expected_buyer_count || 4,
      marketing_channels: input.marketing_channels || ["WhatsApp", "Calls"],
      broker_message: input.broker_message,
      ai_recommendation_json: { fit_score: property.buyer_match_score, risk_level: property.legal_risk_score < 35 ? "low" : "medium" },
      approved_terms_json: {},
      created_at: new Date().toISOString(),
    };
  }
}

export async function createBrokerBuyer(input: Partial<BrokerBuyer> & { full_name: string; phone: string }): Promise<BrokerBuyer> {
  try {
    const res = await fetch(`${API_URL}/api/broker/buyers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ broker_id: "broker-demo-1", preferred_localities: [], loan_required: true, lead_temperature: "warm", communication_channel: "WhatsApp", ...input }),
    });
    if (!res.ok) throw new Error("Create broker buyer failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo buyer create.", error);
    return {
      id: `buyer-${Date.now().toString(36)}`,
      broker_id: "broker-demo-1",
      full_name: input.full_name,
      phone: input.phone,
      email: input.email,
      budget_min: input.budget_min,
      budget_max: input.budget_max,
      preferred_localities: input.preferred_localities || [],
      property_type_preference: input.property_type_preference || "apartment",
      bhk_preference: input.bhk_preference || "2 BHK",
      purchase_purpose: input.purchase_purpose || "family buyers",
      buying_timeline: input.buying_timeline || "60 days",
      loan_required: input.loan_required ?? true,
      family_size: input.family_size,
      lead_temperature: input.lead_temperature || "warm",
      communication_channel: input.communication_channel || "WhatsApp",
      assigned_properties: [],
      follow_up_status: "new",
      qualification_score: 76,
      notes: input.notes,
      created_at: new Date().toISOString(),
    };
  }
}

export async function createPropertyPool(input: {
  listing_id: string;
  tieup_id?: string | null;
  event_title?: string;
  scheduled_start?: string;
  max_buyers?: number;
  buyer_segment?: string;
  meeting_point?: string;
}): Promise<PropertyPoolEvent> {
  try {
    const res = await fetch(`${API_URL}/api/broker/propertypool`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ broker_id: "broker-demo-1", event_type: "broker-led group visit", scheduled_start: new Date(Date.now() + 2 * 86400000).toISOString(), duration_minutes: 90, max_buyers: 8, buyer_segment: "family buyers", ...input }),
    });
    if (!res.ok) throw new Error("Create PropertyPool failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo PropertyPool create.", error);
    return demoBrokerDashboard().propertypool_events[0];
  }
}

export async function runBrokerAutomation(input?: { listing_id?: string; create_propertypool?: boolean }) {
  try {
    const res = await fetch(`${API_URL}/api/broker/automation/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ broker_id: "broker-demo-1", user_request: "Run Broker Growth Automation", ...input }),
    });
    if (!res.ok) throw new Error("Broker automation failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo broker automation.", error);
    return { automation_state: { messages: ["Demo broker growth automation completed."], next_action: "Review tie-up and PropertyPool recommendations" }, dashboard: demoBrokerDashboard() };
  }
}

export async function getManagerTieupRequests(): Promise<BrokerTieup[]> {
  try {
    const res = await fetch(`${API_URL}/api/manager/tieup-requests`, { cache: "no-store" });
    if (!res.ok) throw new Error("Manager tie-up requests failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo manager tie-up requests.", error);
    return demoBrokerDashboard().tieup_feed;
  }
}

export async function decideManagerTieup(requestId: string, action: "approve" | "reject" | "update-terms", input?: Partial<BrokerTieup>): Promise<BrokerTieup> {
  try {
    const res = await fetch(`${API_URL}/api/manager/tieup-requests/${requestId}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        manager_response: input?.manager_response || (action === "approve" ? "Approved with verified-claims policy." : "Please revise buyer segment and terms."),
        approved_commission: input?.approved_commission || input?.requested_commission || 2,
        approved_validity_days: input?.approved_validity_days || input?.requested_validity_days || 60,
        approved_propertypool_rights: input?.approved_propertypool_rights ?? true,
        approved_exclusivity: input?.approved_exclusivity ?? false,
        allowed_marketing_channels: input?.marketing_channels || ["WhatsApp", "Calls", "Existing buyer database"],
      }),
    });
    if (!res.ok) throw new Error("Manager tie-up decision failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo manager tie-up decision.", error);
    const tieup = demoBrokerDashboard().tieup_feed.find((item) => item.id === requestId) || demoBrokerDashboard().tieup_feed[0];
    return { ...tieup, status: action === "approve" ? "approved" : action === "reject" ? "rejected" : "terms_updated" };
  }
}

export { MANAGER_DEMO_LISTING_IDS };
