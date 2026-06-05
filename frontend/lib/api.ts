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
export const DEFAULT_WHATSAPP_NUMBER = "+918209979629";

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

export type WhatsAppWebhookResult = {
  reply: string;
  lead: LeadQualification;
  provider: string;
};

export type WhatsAppSendResult = {
  provider: string;
  sent: boolean;
  to: string;
  from_number?: string | null;
  sid?: string | null;
  status?: string | null;
  message: string;
  dry_run: boolean;
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

export type VoiceGuideResult = {
  response_type: string;
  spoken_text: string;
  display_text: string;
  navigation_target?: string | null;
  camera_position?: Record<string, number> | null;
  camera_look_at?: Record<string, number> | null;
  room_id?: string | null;
  hotspot_id?: string | null;
  highlight_hotspots?: string[];
  suggested_actions?: string[];
  confidence_score?: number;
  requires_handoff?: boolean;
  handoff_agent?: string | null;
  safety_notes?: string[];
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
  unit_number?: string | null;
  building_name?: string | null;
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

export async function sendWhatsAppWebhook(input: {
  message: string;
  phone?: string;
  preferred_locality?: string;
}): Promise<WhatsAppWebhookResult> {
  try {
    const res = await fetch(`${API_URL}/api/whatsapp/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Body: input.message,
        From: input.phone || DEFAULT_WHATSAPP_NUMBER,
        preferred_locality: input.preferred_locality,
      }),
    });
    if (!res.ok) throw new Error("WhatsApp webhook failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo WhatsApp webhook reply.", error);
    const lead = await qualifyWhatsAppLead({
      message: input.message,
      phone: input.phone,
      preferred_locality: input.preferred_locality,
    });
    return { reply: lead.suggested_reply, lead, provider: "frontend-demo" };
  }
}

export async function sendWhatsAppMessage(input: {
  to?: string;
  message: string;
  dry_run?: boolean;
}): Promise<WhatsAppSendResult> {
  const to = input.to || DEFAULT_WHATSAPP_NUMBER;
  try {
    const res = await fetch(`${API_URL}/api/whatsapp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to,
        message: input.message,
        dry_run: input.dry_run ?? false,
      }),
    });
    if (!res.ok) throw new Error("WhatsApp send failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo WhatsApp send result.", error);
    return {
      provider: "frontend-demo",
      sent: false,
      to: to.startsWith("whatsapp:") ? to : `whatsapp:${to}`,
      from_number: null,
      sid: null,
      status: "failed",
      message: `${input.message} | send_error: WhatsApp send could not be completed`,
      dry_run: input.dry_run ?? false,
    };
  }
}

export async function runVoiceGuide(input: {
  message: string;
  propertyId?: string;
}): Promise<VoiceGuideResult> {
  const propertyId = input.propertyId || DEMO_PROPERTIES[0].id;
  try {
    const res = await fetch(`${API_URL}/api/properties/${propertyId}/xr/guide/voice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: input.message,
        transcript: input.message,
        role: "public",
        query_mode: "voice",
      }),
    });
    if (!res.ok) throw new Error("Voice guide failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo voice guide.", error);
    return {
      response_type: "answer",
      spoken_text: "I can guide you through the property, answer finance and legal questions, or jump to a room.",
      display_text: "Demo voice guide is active.",
      suggested_actions: ["Show living room", "Explain EMI", "Check legal readiness"],
      confidence_score: 0.72,
      requires_handoff: false,
      handoff_agent: "Property Page Agent",
      safety_notes: ["Demo fallback used because the backend voice route was unavailable."],
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

export type PropertyIntelligenceDetail = {
  id: string;
  slug: string;
  role: "public" | "buyer" | "broker" | "manager" | "admin";
  listing: ManagerListing;
  media: Array<Record<string, unknown>>;
  media_warning?: string | null;
  documents: Record<string, unknown>;
  badges: Array<{ label: string; status: "positive" | "warning" | "missing"; detail: string }>;
  actions: string[];
  facts: Array<{ label: string; value: string }>;
  amenities: Record<string, string[]>;
  area: {
    carpet_area_sqft?: number;
    builtup_area_sqft?: number;
    super_builtup_area_sqft?: number | null;
    room_wise_verified: boolean;
    message?: string | null;
    rooms: Array<{ room_name: string; area_sqft: number; verified_status: string }>;
    area_efficiency_score: number;
    layout_quality_score: number;
    privacy_score: number;
    work_from_home_suitability: number;
    senior_citizen_suitability: number;
    family_suitability: number;
    room_flow_explanation: string;
  };
  vastu: Record<string, unknown>;
  environment: Record<string, unknown>;
  price_breakdown: Record<string, unknown>;
  finance: Record<string, unknown>;
  market_intelligence: Record<string, unknown>;
  tour_route: { route_name?: string; waypoints?: Array<{ label: string; focus: string }>; broker_script?: string; objection_handling?: string[]; next_action?: string };
  similar_properties: ManagerListing[];
  visit_feedback: Record<string, unknown>;
  ai_summary: {
    confidence_score: number;
    why_consider: string;
    best_for: string[];
    strengths: string[];
    concerns: string[];
    buyer_questions: string[];
    broker_talking_points: string[];
    manager_suggestions: string[];
    final_recommendation: string;
  };
  broker_propertypool: Record<string, unknown>;
  map: { latitude: number; longitude: number; locality: string; nearby: Array<Record<string, unknown>>; fallback_label?: string };
  agent_routes: string[];
};

export type PropertyAIAnswer = {
  route: string;
  answer: string;
  agent: string;
  confidence_score: number;
  data?: Record<string, unknown>;
};

export async function getPropertyIntelligence(propertyId: string, role: PropertyIntelligenceDetail["role"] = "public"): Promise<PropertyIntelligenceDetail> {
  try {
    const res = await fetch(`${API_URL}/api/properties/${propertyId}/detail?role=${role}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Property intelligence failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo property intelligence.", error);
    const listing = DEMO_MANAGER_LISTINGS.find((item) => item.id === propertyId || item.slug === propertyId || item.id.replace("seller-", "") === propertyId) || DEMO_MANAGER_LISTINGS[0];
    const price = listing.asking_price || 0;
    const carpet = listing.carpet_area_sqft || listing.builtup_area_sqft || 1000;
    return {
      id: listing.id,
      slug: listing.slug,
      role,
      listing,
      media: listing.hero_image_url ? [{ media_url: listing.hero_image_url, thumbnail_url: listing.hero_image_url, room_name: "Living Area", room_area_sqft: 295, caption: "Morning light, open view", is_hero: true }] : [],
      media_warning: listing.hero_image_url ? null : "Media pending from manager.",
      documents: { rera_number: listing.rera_number, rera_status: listing.rera_number ? "verified" : "RERA not verified", legal_risk_score: listing.legal_risk_score, uploaded_documents: listing.documents || [], missing_documents: listing.missing_fields || ["Title report"], ai_legal_summary: "Legal verification incomplete. Professional legal review recommended." },
      badges: [
        { label: "RERA verified", status: listing.rera_number ? "positive" : "missing", detail: listing.rera_number || "RERA not verified" },
        { label: "Documents available", status: (listing.documents || []).length ? "positive" : "missing", detail: (listing.documents || []).length ? "Documents uploaded" : "Documents pending" },
        { label: "Broker tie-up", status: "positive", detail: "Broker tie-up available" },
        { label: "PropertyPool", status: "positive", detail: "PropertyPool eligible" },
      ],
      actions: role === "broker" ? ["Request Tie-Up", "Add Buyer", "Create PropertyPool", "Share Pitch", "Book Visit", "Generate Buyer Match", "View Commission Terms"] : role === "manager" ? ["Edit Listing", "Run AI Review", "Publish/Unpublish", "Generate Listing Copy", "View Leads", "View Broker Requests"] : ["Talk to an Expert", "Schedule a Visit", "WhatsApp Assistant", "Shortlist", "Compare", "Ask AI", "Get EMI Estimate", "Make Offer"],
      facts: [
        { label: "Bedrooms", value: `${listing.bedrooms || "-"} Bed` },
        { label: "Bathrooms", value: `${listing.bathrooms || "-"} Bath` },
        { label: "Carpet area", value: `${carpet} sq ft usable` },
        { label: "Floor", value: "3rd of 13" },
        { label: "Parking", value: `${listing.parking_count || 0} covered` },
        { label: "Possession", value: listing.possession_status || "Needs manager confirmation" },
      ],
      amenities: { Building: ["Lift", "Security", "Parking"], Apartment: ["Natural light", "Cross ventilation"], Lifestyle: ["Garden"], Location: ["Metro nearby", "Retail nearby"] },
      area: { carpet_area_sqft: carpet, builtup_area_sqft: listing.builtup_area_sqft || carpet, room_wise_verified: false, message: "Room-wise area not verified.", rooms: [{ room_name: "Living room", area_sqft: Math.round(carpet * 0.23), verified_status: "estimated" }, { room_name: "Kitchen", area_sqft: Math.round(carpet * 0.09), verified_status: "estimated" }, { room_name: "Master bedroom", area_sqft: Math.round(carpet * 0.15), verified_status: "estimated" }], area_efficiency_score: 82, layout_quality_score: 78, privacy_score: 76, work_from_home_suitability: 80, senior_citizen_suitability: 72, family_suitability: 84, room_flow_explanation: "Room flow is estimated from listing facts and should be verified during the site visit." },
      vastu: { available: false, message: "Vastu information not provided." },
      environment: { window_direction: "Needs manager confirmation", morning_light_estimate: "Medium to good, site verification needed", cross_ventilation_score: 72, road_noise_risk: "Moderate", view_quality: "Media analysis pending" },
      price_breakdown: { asking_price: price, price_per_sqft: listing.price_per_sqft, recommended_price: listing.recommended_price, fair_value_estimate: listing.recommended_price, fast_sale_price: listing.fast_sale_price, optimistic_price: listing.optimistic_price, negotiation_buffer: Math.round(price * 0.03), stamp_duty_estimate: Math.round(price * 0.06), registration_estimate: 30000, total_acquisition_estimate: Math.round(price * 1.061), locality_comparison: "Fair", price_confidence_score: 78 },
      finance: { property_price: price, down_payment: Math.round(price * 0.2), loan_amount: Math.round(price * 0.8), monthly_emi: Math.round(price * 0.8 * 0.0085), emi_per_lakh: 850, affordability_score: 74, warnings: ["Consider increasing down payment to reduce EMI."] },
      market_intelligence: { locality: listing.locality, locality_demand_score: listing.lead_quality_score, market_heat_score: listing.market_heat_score, price_bucket: price >= 100000000 ? "Above INR 10 Cr" : price >= 50000000 ? "INR 5-10 Cr" : "Below INR 5 Cr", redevelopment_activity: listing.redevelopment_score, investment_score: 76, family_buyer_score: 82, nri_buyer_score: 70, ai_explanation: `${listing.locality} has useful Mumbai demand and redevelopment signals, subject to document readiness and exact building quality.` },
      tour_route: { route_name: `${listing.locality} guided visit`, waypoints: [{ label: "Building approach", focus: "Road access, security, drop-off" }, { label: "Living room", focus: "Light, ventilation, layout" }, { label: "Documents and close", focus: "EMI, RERA, offer readiness" }] },
      similar_properties: DEMO_MANAGER_LISTINGS.filter((item) => item.id !== listing.id).slice(0, 4),
      visit_feedback: { visit_count: 6, buyer_interest_level: "Warm to hot", common_positives: ["Usable area", "Connectivity"], common_concerns: ["Documents", "Peak-hour noise"], most_asked_questions: ["Is price negotiable?", "Are documents available?"] },
      ai_summary: { confidence_score: listing.rera_number ? 82 : 68, why_consider: `${listing.title} is worth considering for buyers focused on ${listing.locality}.`, best_for: ["Family buyer", "NRI buyer", "Investor"], strengths: ["Locality context", "Finance estimate", "Broker workflow"], concerns: listing.missing_fields || ["Needs manager confirmation"], buyer_questions: ["Can I review documents?", "How much negotiation room exists?"], broker_talking_points: ["Use verified claims only", "Lead with EMI and visit checklist"], manager_suggestions: ["Upload floor plan and room-wise media"], final_recommendation: "Proceed to site visit and legal review before offer." },
      broker_propertypool: { join_propertypool_available: true, tieup_status: "open", propertypool_eligibility: true },
      map: { latitude: listing.latitude, longitude: listing.longitude, locality: listing.locality, nearby: [{ type: "Metro", name: "Mock fallback - configure POI API" }], fallback_label: "External POI APIs are not configured; locality POIs are mock fallback." },
      agent_routes: ["Property Page Agent", "Finance Agent", "Legal Agent", "Market Intelligence Agent", "Tour Guide Agent", "Broker Tie-Up Agent", "PropertyPool Agent"],
    };
  }
}

export async function askPropertyAI(propertyId: string, message: string, role: PropertyIntelligenceDetail["role"] = "public"): Promise<PropertyAIAnswer> {
  try {
    const res = await fetch(`${API_URL}/api/properties/${propertyId}/ask-ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, role }),
    });
    if (!res.ok) throw new Error("Property AI failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo property AI.", error);
    return { route: "property_page_agent", agent: "Property Page Agent", confidence_score: 70, answer: "This property needs a site visit and document review before any offer. I can help with EMI, legal checks, negotiation, or broker PropertyPool planning." };
  }
}

export async function runPropertyAction(propertyId: string, action: string, payload: Record<string, unknown> = {}) {
  const endpoint: Record<string, string> = {
    schedule_visit: "schedule-visit",
    shortlist: "shortlist",
    compare: "compare",
    request_documents: "request-documents",
    generate_negotiation: "generate-negotiation",
    broker_request_tieup: "broker/request-tieup",
    broker_create_propertypool: "broker/create-propertypool",
  };
  try {
    const res = await fetch(`${API_URL}/api/properties/${propertyId}/${endpoint[action] || action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Property action failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo property action.", error);
    return { id: `${action}-${Date.now().toString(36)}`, listing_id: propertyId, action, status: "created", message: `${action.replace(/_/g, " ")} recorded locally.` };
  }
}

export type XRVector = { x: number; y: number; z: number };

export type XRAsset = {
  id: string;
  listing_id: string;
  asset_type: "ksplat" | "splat" | "ply" | "glb" | "video_fallback";
  asset_url?: string | null;
  thumbnail_url?: string | null;
  file_size_mb?: number | null;
  version?: string | null;
  processing_status: "pending" | "processing" | "ready" | "failed";
  coordinate_system?: string | null;
  scale_factor: number;
  origin_json: XRVector;
  metadata_json: Record<string, unknown>;
};

export type XRHotspot = {
  hotspot_id: string;
  id: string;
  listing_id: string;
  room_name: string;
  label: string;
  description: string;
  position_json: XRVector;
  camera_position_json: XRVector;
  camera_look_at_json: XRVector;
  hotspot_type: string;
  priority: number;
  narration: string;
  buyer_relevance_tags: string[];
  broker_talking_points: string[];
  manager_notes: string;
};

export type XRRoute = {
  id: string;
  listing_id: string;
  route_name: string;
  route_type: string;
  ordered_hotspot_ids: string[];
  route_script: string;
  estimated_duration_minutes: number;
};

export type XRPayload = {
  property: {
    id: string;
    requested_id: string;
    title: string;
    locality: string;
    price?: number | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    hero_image_url?: string | null;
  };
  xr_asset?: XRAsset | null;
  assets: XRAsset[];
  hotspots: XRHotspot[];
  routes: XRRoute[];
  tour_script: Record<string, unknown>;
  viewer_config: Record<string, unknown>;
  permissions: Record<string, boolean>;
  analytics: Record<string, unknown>;
  role: PropertyIntelligenceDetail["role"];
};

export type XRGuideResponse = {
  response_type: string;
  spoken_text: string;
  display_text: string;
  navigation_target?: string | null;
  camera_position?: XRVector | null;
  camera_look_at?: XRVector | null;
  room_id?: string | null;
  hotspot_id?: string | null;
  highlight_hotspots: string[];
  suggested_actions: string[];
  confidence_score: number;
  requires_handoff: boolean;
  handoff_agent?: string | null;
  safety_notes: string[];
};

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 3500) {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

function demoXRHotspots(listingId: string): XRHotspot[] {
  const now = new Date().toISOString();
  const stops: Array<[string, string, string, string, XRVector, XRVector, XRVector, string, string[]]> = [
    ["Building approach", "Building entrance", "Check road access, entry security, drop-off, and visitor movement.", "entry", { x: -4, y: 1.4, z: -3 }, { x: -6, y: 1.7, z: -6 }, { x: -2, y: 1.3, z: -2 }, "family", ["family", "broker"]],
    ["Lobby", "Lobby and lift", "Assess maintenance, lift count, accessibility, and society upkeep.", "common_area", { x: -2, y: 1.3, z: -1 }, { x: -3, y: 1.65, z: -3 }, { x: 0, y: 1.2, z: 0 }, "senior", ["senior", "family"]],
    ["Living room", "Living room", "Review seating flow, daylight, ventilation, and family usability.", "room", { x: 0, y: 1.4, z: 0 }, { x: 0, y: 1.65, z: 4 }, { x: 0, y: 1.2, z: 0 }, "family", ["family", "first_time_buyer"]],
    ["Balcony", "Balcony / view", "Verify privacy, road noise, open view, and morning or evening light.", "view", { x: 3, y: 1.4, z: 1 }, { x: 4, y: 1.65, z: 3 }, { x: 2, y: 1.2, z: 0 }, "nri", ["nri", "family"]],
    ["Kitchen", "Kitchen", "Check utility flow, storage, ventilation, platform condition, and appliance placement.", "room", { x: -2, y: 1.4, z: 2 }, { x: -3.5, y: 1.65, z: 3 }, { x: -1, y: 1.1, z: 1 }, "family", ["family", "first_time_buyer"]],
    ["Master bedroom", "Master bedroom", "Review privacy, wardrobe wall, work setup, AC placement, and noise leakage.", "room", { x: 2.5, y: 1.4, z: -2 }, { x: 4, y: 1.65, z: -3 }, { x: 1, y: 1.2, z: -1 }, "family", ["family", "nri"]],
    ["Bathroom", "Bathrooms", "Inspect plumbing pressure, ventilation, fittings, drainage slope, and seepage risk.", "inspection", { x: -3, y: 1.3, z: -2 }, { x: -4, y: 1.6, z: -2.5 }, { x: -2, y: 1.1, z: -1 }, "inspection", ["first_time_buyer", "legal"]],
    ["Parking", "Parking and amenities", "Confirm parking allocation, access ramp, visitor rules, and amenity quality.", "amenity", { x: 4, y: 1.4, z: -4 }, { x: 6, y: 1.7, z: -5 }, { x: 3, y: 1.1, z: -3 }, "broker", ["broker", "family"]],
    ["Legal", "Legal/document context", "Ask about RERA, title report, NOC, occupancy certificate, and document gaps.", "legal", { x: -4, y: 1.8, z: 3 }, { x: -5, y: 1.7, z: 4 }, { x: -2, y: 1.2, z: 2 }, "legal", ["nri", "first_time_buyer"]],
    ["Finance", "Finance context", "Ask EMI, down payment, total cash needed, or affordability questions here.", "finance", { x: 4, y: 1.8, z: 3 }, { x: 5, y: 1.7, z: 4 }, { x: 2, y: 1.2, z: 2 }, "finance", ["first_time_buyer", "investor"]],
  ];

  return stops.map(([roomName, label, description, type, position, cameraPosition, cameraLookAt, tag, tags], index) => ({
    hotspot_id: `xr-hotspot-${index + 1}`,
    id: `xr-hotspot-${index + 1}`,
    listing_id: listingId,
    room_name: roomName,
    hotspot_type: type,
    label,
    description,
    position_json: position,
    camera_position_json: cameraPosition,
    camera_look_at_json: cameraLookAt,
    narration: `${label}. ${description} Unknowns should be verified during a physical site visit.`,
    buyer_relevance_tags: tags,
    broker_talking_points: ["Use verified claims only.", "Point out layout, light, EMI context, and document status without overclaiming."],
    manager_notes: `Confirm ${tag} metadata, room label, caption, sunlight direction, and splat alignment.`,
    priority: index + 1,
    created_at: now,
    updated_at: now,
  }));
}

function demoXRPayload(propertyId: string, role: PropertyIntelligenceDetail["role"] = "public"): XRPayload {
  const listing = DEMO_MANAGER_LISTINGS.find((item) => item.id === propertyId || item.slug === propertyId || item.id.replace("seller-", "") === propertyId) || DEMO_MANAGER_LISTINGS[0];
  const listingId = listing.id;
  const hotspots = demoXRHotspots(listingId);
  const asset: XRAsset = {
    id: `xr-asset-${listingId}`,
    listing_id: listingId,
    asset_type: "ksplat",
    asset_url: "/splats/demo-property.ksplat",
    thumbnail_url: listing.hero_image_url,
    file_size_mb: 184,
    version: "static-demo-1",
    processing_status: "ready",
    coordinate_system: "threejs_y_up",
    scale_factor: 1,
    origin_json: { x: 0, y: 0, z: 0 },
    metadata_json: { source: "github pages static fallback", loader: "adaptive_three_pointcloud_fallback" },
  };
  return {
    property: {
      id: listingId,
      requested_id: propertyId,
      title: listing.title,
      locality: listing.locality,
      price: listing.asking_price,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      hero_image_url: listing.hero_image_url,
    },
    xr_asset: asset,
    assets: [asset],
    hotspots,
    routes: [
      {
        id: `xr-route-default-${listingId}`,
        listing_id: listingId,
        route_name: "Default buyer route",
        route_type: "default",
        ordered_hotspot_ids: hotspots.map((item) => item.hotspot_id),
        route_script: "Move through verified visual evidence, call out unknowns, and close with the next best action.",
        estimated_duration_minutes: 8,
      },
      {
        id: `xr-route-broker-${listingId}`,
        listing_id: listingId,
        route_name: "Broker PropertyPool presentation",
        route_type: "broker_propertypool",
        ordered_hotspot_ids: hotspots.map((item) => item.hotspot_id),
        route_script: "Use verified talking points and invite buyers only where tie-up permissions allow it.",
        estimated_duration_minutes: 6,
      },
    ],
    tour_script: {
      title: `AI Virtual Property Guide script for ${listing.title}`,
      opening: `Welcome to the immersive tour of ${listing.title}. I will guide you through layout, light, comfort, documents, finance, and locality context.`,
      closing: "This XR tour helps shortlist, but final decision should include a physical visit and professional document review.",
      broker_script: "Keep claims verified, protect attribution, and invite buyers to a PropertyPool visit only when tie-up permissions allow it.",
    },
    viewer_config: {
      webxr_enabled: true,
      desktop_controls: "orbit_walk",
      mobile_controls: "touch_orbit",
      comfort_mode: true,
      fallback_mode: "static_github_pages",
      mock_voice_available: true,
    },
    permissions: {
      can_view_public_xr: true,
      can_ask_ai: true,
      can_use_voice: true,
      can_schedule_visit: true,
      can_shortlist: true,
      can_compare: true,
      can_create_propertypool: role === "broker",
      can_view_broker_talking_points: role === "broker",
      can_trigger_xr_processing: role === "manager" || role === "admin",
      can_view_manager_analytics: role === "manager" || role === "admin",
    },
    analytics: {
      total_xr_views: 0,
      average_tour_duration_minutes: 0,
      most_visited_rooms: ["Living room", "Kitchen", "Master bedroom"],
      most_asked_questions: ["What is the EMI?", "Is this legally safe?", "How is the sunlight?"],
      buyer_interest_score: 78,
      visit_conversion_rate: 0.32,
    },
    role,
  };
}

function localXRGuideResponse(propertyId: string, input: Record<string, unknown>): XRGuideResponse {
  const payload = demoXRPayload(propertyId, String(input.role || "public") as PropertyIntelligenceDetail["role"]);
  const query = String(input.query || "").toLowerCase();
  const hotspot = payload.hotspots.find((item) => query.includes(item.room_name.toLowerCase()) || query.includes(item.label.toLowerCase())) ||
    (query.includes("kitchen") ? payload.hotspots.find((item) => item.room_name === "Kitchen") : null) ||
    (query.includes("bedroom") ? payload.hotspots.find((item) => item.room_name === "Master bedroom") : null) ||
    (query.includes("legal") ? payload.hotspots.find((item) => item.hotspot_type === "legal") : null) ||
    (query.includes("emi") || query.includes("finance") ? payload.hotspots.find((item) => item.hotspot_type === "finance") : null) ||
    payload.hotspots[0];

  const isNavigation = query.includes("show") || query.includes("go") || query.includes("tour") || query.includes("kitchen") || query.includes("bedroom");
  return {
    response_type: isNavigation ? "navigate" : query.includes("legal") ? "legal_summary" : query.includes("emi") ? "finance_estimate" : "answer",
    spoken_text: `${hotspot.label}. ${hotspot.description} This hosted demo is using static XR intelligence because the live backend is not connected from GitHub Pages.`,
    display_text: `${hotspot.label}: ${hotspot.description} Backend fallback is active on GitHub Pages.`,
    navigation_target: hotspot.label,
    camera_position: hotspot.camera_position_json,
    camera_look_at: hotspot.camera_look_at_json,
    room_id: hotspot.room_name,
    hotspot_id: hotspot.hotspot_id,
    highlight_hotspots: [hotspot.hotspot_id],
    suggested_actions: ["Schedule physical visit", "Ask legal", "Get EMI estimate"],
    confidence_score: 0.72,
    requires_handoff: false,
    handoff_agent: query.includes("legal") ? "Legal Due Diligence Agent" : query.includes("emi") ? "Finance Agent" : "XR Virtual Guide Agent",
    safety_notes: ["Static hosted fallback. Verify legal, sunlight, noise, and room measurements before decision."],
  };
}

export async function getPropertyXR(propertyId: string, role: PropertyIntelligenceDetail["role"] = "public"): Promise<XRPayload> {
  try {
    const res = await fetchWithTimeout(`${API_URL}/api/properties/${propertyId}/xr?role=${role}`, { cache: "no-store" });
    if (!res.ok) throw new Error("XR payload failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo XR payload because the backend is unavailable.", error);
    return demoXRPayload(propertyId, role);
  }
}

export async function createXRSession(propertyId: string, input: Record<string, unknown>) {
  try {
    const res = await fetchWithTimeout(`${API_URL}/api/properties/${propertyId}/xr/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("XR session failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo XR session.", error);
    const payload = demoXRPayload(propertyId, String(input.role || "public") as PropertyIntelligenceDetail["role"]);
    const first = payload.hotspots[0];
    return {
      session_id: `static-xr-${Date.now().toString(36)}`,
      initial_route: payload.routes[0],
      greeting: payload.tour_script.opening,
      starting_camera_position: first.camera_position_json,
      starting_camera_look_at: first.camera_look_at_json,
      current_hotspot_id: first.hotspot_id,
    };
  }
}

export async function askXRGuide(propertyId: string, input: Record<string, unknown>): Promise<XRGuideResponse> {
  try {
    const res = await fetchWithTimeout(`${API_URL}/api/properties/${propertyId}/xr/guide/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("XR guide failed");
    return res.json();
  } catch (error) {
    console.warn("Using demo XR guide response.", error);
    return localXRGuideResponse(propertyId, input);
  }
}

export async function navigateXRGuide(propertyId: string, input: Record<string, unknown>) {
  try {
    const res = await fetchWithTimeout(`${API_URL}/api/properties/${propertyId}/xr/guide/navigate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("XR navigation failed");
    return res.json();
  } catch {
    return { saved: false, fallback: true };
  }
}

export async function saveXRFeedback(propertyId: string, sessionId: string, input: Record<string, unknown>) {
  try {
    const res = await fetchWithTimeout(`${API_URL}/api/properties/${propertyId}/xr/session/${sessionId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("XR feedback failed");
    return res.json();
  } catch {
    return { saved: false, fallback: true, next_action_recommendation: "Feedback captured locally for this hosted demo. Schedule a physical visit for verified inspection." };
  }
}

export type CRMSummaryCard = { label: string; value: string; detail?: string | null; tone?: string };
export type CRMPipelineStage = { id: string; stage_name: string; display_order: number; default_probability: number; color: string; opportunity_count: number; total_value: number; weighted_value: number; average_age_days: number; stale_count: number };
export type CRMLead = { id: string; full_name: string; phone: string; email?: string | null; source: string; buyer_type: string; budget_min?: number | null; budget_max?: number | null; preferred_localities: string[]; property_type_preference?: string; bhk_preference?: string | null; buying_timeline?: string | null; loan_required: boolean; down_payment_available?: number | null; family_size?: number | null; purpose?: string | null; assigned_user_id?: string | null; broker_id?: string | null; manager_id?: string | null; lead_score: number; qualification_status: string; duplicate_status: string; status: string; last_contacted_at?: string | null; next_follow_up_at?: string | null; notes?: string | null; created_at: string };
export type CRMOpportunity = { id: string; lead_id?: string | null; contact_id?: string | null; property_id?: string | null; broker_id?: string | null; title: string; buyer_name: string; property_name?: string | null; locality?: string | null; stage: string; opportunity_value: number; expected_commission: number; probability: number; weighted_value: number; source: string; assigned_agent_name?: string | null; next_activity?: string | null; expected_close_date?: string | null; lead_score: number; broker_attribution?: string | null; last_interaction?: string | null; warning_badges: string[] };
export type CRMActivity = { id: string; lead_id?: string | null; opportunity_id?: string | null; activity_type: string; title: string; description?: string | null; due_at?: string | null; status: string; priority: string; created_by_agent: boolean; completed_at?: string | null; outcome?: string | null; created_at: string };
export type CRMContact = { id: string; full_name: string; phone?: string | null; email?: string | null; contact_type: string; source?: string | null; tags: string[]; notes?: string | null; created_at: string };
export type CRMAccount = { id: string; account_name: string; account_type: string; company_name?: string | null; phone?: string | null; email?: string | null; notes?: string | null; created_at: string };
export type CRMCampaign = { id: string; campaign_name: string; campaign_type: string; target_segment: string; property_id?: string | null; message_template: string; status: string; sent_count: number; reply_count: number; visit_count: number; offer_count: number; revenue_pipeline: number; created_at: string };
export type CRMProposal = { id: string; proposal_type: string; title: string; content_json: Record<string, unknown>; status: string; version: number; created_at: string };
export type CRMCommission = { id: string; opportunity_id?: string | null; broker_id?: string | null; agent_id?: string | null; deal_value: number; commission_percentage: number; expected_commission: number; approved_commission?: number | null; payout_status: string; dispute_status: string; created_at: string };
export type CRMAudit = { id: string; actor_type: string; actor_id?: string | null; action: string; entity_type: string; entity_id?: string | null; details_json: Record<string, unknown>; created_at: string };
export type CRMNextBestAction = { id: string; title: string; reason: string; recommended_action: string; entity_type: string; entity_id?: string | null; priority: string; agent_name: string };
export type CRMDashboard = { summary_cards: CRMSummaryCard[]; pipeline_stages: CRMPipelineStage[]; priority_inbox: CRMNextBestAction[]; activity_feed: CRMAudit[]; hot_leads: CRMLead[]; open_opportunities: CRMOpportunity[]; reports: Record<string, unknown> };
export type CRMPipelinePayload = { stages: CRMPipelineStage[]; opportunities: CRMOpportunity[] };

const CRM_STAGE_NAMES = ["New Lead", "Qualified", "Property Matched", "Visit Scheduled", "Visit Completed", "Offer Discussed", "Negotiation", "Documents Shared", "Agreement Drafting", "Closed Won", "Closed Lost"];

const DEMO_CRM_LEADS: CRMLead[] = [
  { id: "crm-lead-demo-1", full_name: "Rahul Mehta", phone: "+91 90000 02001", source: "WhatsApp", buyer_type: "family buyer", budget_min: 30000000, budget_max: 42000000, preferred_localities: ["Chembur", "Ghatkopar"], property_type_preference: "apartment", bhk_preference: "3 BHK", buying_timeline: "ready", loan_required: true, family_size: 4, assigned_user_id: "agent-demo-1", manager_id: "manager-demo-1", lead_score: 91, qualification_status: "hot", duplicate_status: "unique", status: "open", last_contacted_at: new Date().toISOString(), next_follow_up_at: new Date(Date.now() + 3600000).toISOString(), notes: "Visited Chembur 3BHK and asked EMI twice.", created_at: new Date().toISOString() },
  { id: "crm-lead-demo-2", full_name: "Priya Nair", phone: "+91 90000 02002", source: "PropertyPool", buyer_type: "NRI buyer", budget_min: 47000000, budget_max: 66000000, preferred_localities: ["Bandra", "Worli"], property_type_preference: "apartment", bhk_preference: "2.5-3 BHK", buying_timeline: "30 days", loan_required: false, assigned_user_id: "agent-demo-1", broker_id: "broker-demo-1", manager_id: "manager-demo-1", lead_score: 94, qualification_status: "hot", duplicate_status: "unique", status: "open", next_follow_up_at: new Date(Date.now() + 7200000).toISOString(), notes: "Needs revised offer near INR 4.85 Cr.", created_at: new Date().toISOString() },
  { id: "crm-lead-demo-3", full_name: "Kabir Merchant", phone: "+91 90000 02003", source: "XR tour", buyer_type: "investor", budget_min: 24000000, budget_max: 31500000, preferred_localities: ["Powai", "Andheri"], property_type_preference: "apartment", bhk_preference: "2-3 BHK", buying_timeline: "30-60 days", loan_required: true, assigned_user_id: "agent-demo-2", manager_id: "manager-demo-1", lead_score: 86, qualification_status: "hot", duplicate_status: "unique", status: "open", next_follow_up_at: new Date(Date.now() + 86400000).toISOString(), notes: "Completed XR tour and asked for site visit.", created_at: new Date().toISOString() },
  { id: "crm-lead-demo-4", full_name: "Ananya Rao", phone: "+91 90000 02004", source: "Broker referral", buyer_type: "first-time buyer", budget_min: 14000000, budget_max: 20800000, preferred_localities: ["Borivali", "Malad"], property_type_preference: "apartment", bhk_preference: "2 BHK", buying_timeline: "90 days", loan_required: true, assigned_user_id: "agent-demo-2", broker_id: "broker-demo-1", manager_id: "manager-demo-1", lead_score: 76, qualification_status: "qualified", duplicate_status: "unique", status: "open", next_follow_up_at: new Date(Date.now() - 3600000).toISOString(), notes: "Send EMI sheet and cheaper alternatives.", created_at: new Date().toISOString() },
];

const DEMO_CRM_OPPORTUNITIES: CRMOpportunity[] = [
  { id: "crm-opp-demo-1", lead_id: "crm-lead-demo-1", property_id: "mumbai-chembur-1", title: "Rahul Mehta - Chembur Garden-View 3BHK", buyer_name: "Rahul Mehta", property_name: "Chembur Garden-View 3BHK", locality: "Chembur", stage: "Visit Completed", opportunity_value: 42000000, expected_commission: 840000, probability: 48, weighted_value: 20160000, source: "WhatsApp", assigned_agent_name: "Asha Kulkarni", next_activity: "Call after Chembur visit", lead_score: 91, broker_attribution: null, last_interaction: new Date().toISOString(), warning_badges: ["Hot lead", "XR engaged"] },
  { id: "crm-opp-demo-2", lead_id: "crm-lead-demo-2", property_id: "mumbai-bandra-1", broker_id: "broker-demo-1", title: "Priya Nair - Bandra West Sea-Breeze", buyer_name: "Priya Nair", property_name: "Bandra West Sea-Breeze 2.5BHK", locality: "Bandra", stage: "Negotiation", opportunity_value: 66000000, expected_commission: 1320000, probability: 72, weighted_value: 47520000, source: "PropertyPool", assigned_agent_name: "Asha Kulkarni", next_activity: "Send revised offer", lead_score: 94, broker_attribution: "protected", last_interaction: new Date().toISOString(), warning_badges: ["Hot lead", "Offer ready", "Broker attributed", "PropertyPool source"] },
  { id: "crm-opp-demo-3", lead_id: "crm-lead-demo-3", property_id: "mumbai-powai-1", title: "Kabir Merchant - Powai Lakeview Smart 3BHK", buyer_name: "Kabir Merchant", property_name: "Powai Lakeview Smart 3BHK", locality: "Powai", stage: "Visit Scheduled", opportunity_value: 31500000, expected_commission: 630000, probability: 40, weighted_value: 12600000, source: "XR tour", assigned_agent_name: "Rohan Shah", next_activity: "Confirm Saturday visit", lead_score: 86, last_interaction: new Date().toISOString(), warning_badges: ["Visit booked", "XR engaged"] },
  { id: "crm-opp-demo-4", lead_id: "crm-lead-demo-4", property_id: "mumbai-malad-1", broker_id: "broker-demo-1", title: "Ananya Rao - Malad West Growth-Corridor", buyer_name: "Ananya Rao", property_name: "Malad West Growth-Corridor 2BHK", locality: "Malad", stage: "Property Matched", opportunity_value: 20800000, expected_commission: 416000, probability: 28, weighted_value: 5824000, source: "Broker referral", assigned_agent_name: "Rohan Shah", next_activity: "Follow-up overdue", lead_score: 76, broker_attribution: "protected", last_interaction: new Date(Date.now() - 5 * 86400000).toISOString(), warning_badges: ["Broker attributed", "Follow-up overdue"] },
  { id: "crm-opp-demo-5", lead_id: "crm-lead-demo-5", property_id: "mumbai-worli-1", title: "Nisha Iyer - Worli Sea-Link Luxury", buyer_name: "Nisha Iyer", property_name: "Worli Sea-Link Luxury 4BHK", locality: "Worli", stage: "Offer Discussed", opportunity_value: 185000000, expected_commission: 3700000, probability: 64, weighted_value: 118400000, source: "Vapi call", assigned_agent_name: "Asha Kulkarni", next_activity: "Prepare negotiation brief", lead_score: 89, last_interaction: new Date().toISOString(), warning_badges: ["Hot lead", "Legal risk", "Finance risk"] },
];

function demoCRMStages(): CRMPipelineStage[] {
  return CRM_STAGE_NAMES.map((name, index) => {
    const opps = DEMO_CRM_OPPORTUNITIES.filter((item) => item.stage === name);
    return {
      id: name.toLowerCase().replace(/\s+/g, "_"),
      stage_name: name,
      display_order: index + 1,
      default_probability: [5, 18, 28, 38, 48, 58, 68, 78, 88, 100, 0][index],
      color: ["#64748b", "#0f766e", "#059669", "#2563eb", "#7c3aed", "#b45309", "#ea580c", "#0891b2", "#16a34a", "#15803d", "#dc2626"][index],
      opportunity_count: opps.length,
      total_value: opps.reduce((sum, item) => sum + item.opportunity_value, 0),
      weighted_value: opps.reduce((sum, item) => sum + item.weighted_value, 0),
      average_age_days: 3 + index,
      stale_count: opps.filter((item) => item.warning_badges.includes("Follow-up overdue")).length,
    };
  });
}

function demoCRMDashboard(): CRMDashboard {
  const pipelineValue = DEMO_CRM_OPPORTUNITIES.reduce((sum, item) => sum + item.opportunity_value, 0);
  const weighted = DEMO_CRM_OPPORTUNITIES.reduce((sum, item) => sum + item.weighted_value, 0);
  return {
    summary_cards: [
      ["Total leads", "124", "Unified inbox", "slate"],
      ["New leads today", "7", "WhatsApp + XR", "emerald"],
      ["Hot leads", "18", "Score above 80", "emerald"],
      ["Open opportunities", String(DEMO_CRM_OPPORTUNITIES.length), "Active deals", "slate"],
      ["Pipeline value", formatCr(pipelineValue), "Open pipeline", "gold"],
      ["Expected revenue", formatCr(weighted), "Weighted", "gold"],
      ["Expected commission", formatCr(DEMO_CRM_OPPORTUNITIES.reduce((sum, item) => sum + item.expected_commission, 0)), "Broker + agent", "amber"],
      ["Site visits this week", "18", "11 AI booked", "emerald"],
      ["Offers active", "6", "3 approvals", "amber"],
      ["Closings expected", "4", "June 2026", "emerald"],
      ["Stale leads", "9", "Need nurture", "amber"],
      ["Follow-ups due", "14", "SLA watch", "amber"],
      ["AI tasks completed", "128", "This week", "slate"],
      ["Avg response time", "8m", "WhatsApp/call", "emerald"],
      ["Conversion rate", "31%", "Visit to offer", "gold"],
    ].map(([label, value, detail, tone]) => ({ label, value, detail, tone })),
    pipeline_stages: demoCRMStages(),
    priority_inbox: [
      { id: "nba-1", title: "Call Rahul", reason: "Visited Chembur 3BHK yesterday and asked EMI twice.", recommended_action: "Call and send EMI estimate.", entity_type: "lead", entity_id: "crm-lead-demo-1", priority: "high", agent_name: "Lead Scoring Agent" },
      { id: "nba-2", title: "Send revised offer to Priya", reason: "Negotiation likely to close at INR 4.85 Cr.", recommended_action: "Generate counter summary.", entity_type: "opportunity", entity_id: "crm-opp-demo-2", priority: "high", agent_name: "Proposal and Offer Agent" },
      { id: "nba-3", title: "Invite Andheri buyers", reason: "8 buyers match Saturday PropertyPool.", recommended_action: "Launch WhatsApp campaign.", entity_type: "campaign", entity_id: "crm-campaign-demo-1", priority: "medium", agent_name: "Activity Automation Agent" },
      { id: "nba-4", title: "Confirm broker Aman attribution", reason: "3 leads pending attribution confirmation.", recommended_action: "Review audit timestamps.", entity_type: "broker", entity_id: "broker-demo-1", priority: "medium", agent_name: "Commission Agent" },
      { id: "nba-5", title: "Upload missing OC", reason: "Bandra legal summary is blocked.", recommended_action: "Create legal executive task.", entity_type: "document", priority: "high", agent_name: "CRM Hygiene Agent" },
    ],
    activity_feed: ["New WhatsApp lead created", "Call summary saved", "Site visit booked", "PropertyPool RSVP received", "Buyer shortlisted property", "Broker tie-up approved", "Offer generated", "Commission forecast updated", "AI scored lead as hot", "Legal agent flagged document risk"].map((action, index) => ({ id: `crm-audit-demo-${index}`, actor_type: index % 2 ? "user" : "agent", actor_id: "crm-agent", action: action.toLowerCase().replace(/\s+/g, "_"), entity_type: "crm", details_json: { summary: action }, created_at: new Date(Date.now() - index * 3600000).toISOString() })),
    hot_leads: DEMO_CRM_LEADS.filter((lead) => lead.lead_score >= 80),
    open_opportunities: DEMO_CRM_OPPORTUNITIES,
    reports: { sales_forecast: { pipeline_value: pipelineValue, weighted_forecast: weighted }, lead_sources: { WhatsApp: 42, "Vapi call": 17, "XR tour": 13, PropertyPool: 19, "Broker referral": 23, Campaign: 10 } },
  };
}

async function crmFetch<T>(path: string, fallback: T, init: RequestInit = {}): Promise<T> {
  try {
    const res = await fetchWithTimeout(`${API_URL}${path}`, { cache: "no-store", ...init });
    if (!res.ok) throw new Error(`CRM request failed: ${path}`);
    return res.json();
  } catch (error) {
    console.warn(`Using demo CRM fallback for ${path}.`, error);
    return fallback;
  }
}

async function voiceFetch(path: string, init: RequestInit = {}): Promise<VoiceCallResult> {
  try {
    const res = await fetchWithTimeout(`${API_URL}${path}`, { cache: "no-store", ...init }, 15000);
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(detail || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown request error";
    return {
      call_status: "failed",
      call_id: null,
      provider: "elevenlabs",
      reason: `Voice backend request failed at ${API_URL}${path}: ${message}. Start the FastAPI backend, confirm NEXT_PUBLIC_API_URL, and retry.`,
      scheduled_or_started: null,
      mode: "unknown",
    };
  }
}

export async function getCRMDashboard(): Promise<CRMDashboard> {
  return crmFetch("/api/crm/dashboard", demoCRMDashboard());
}

export async function getCRMPipeline(): Promise<CRMPipelinePayload> {
  return crmFetch("/api/crm/pipeline", { stages: demoCRMStages(), opportunities: DEMO_CRM_OPPORTUNITIES });
}

export async function getCRMLeads(): Promise<CRMLead[]> {
  return crmFetch("/api/crm/leads", DEMO_CRM_LEADS);
}

export async function getCRMOpportunities(): Promise<CRMOpportunity[]> {
  return crmFetch("/api/crm/opportunities", DEMO_CRM_OPPORTUNITIES);
}

export async function getCRMActivities(): Promise<CRMActivity[]> {
  const demo = DEMO_CRM_OPPORTUNITIES.map((opp, index) => ({ id: `crm-act-demo-${index}`, lead_id: opp.lead_id, opportunity_id: opp.id, activity_type: index % 2 ? "WhatsApp" : "Call", title: opp.next_activity || "Follow up", description: "AI generated next activity", due_at: new Date(Date.now() + (index - 1) * 3600000).toISOString(), status: index === 3 ? "overdue" : "open", priority: index < 2 ? "high" : "medium", created_by_agent: true, created_at: new Date().toISOString() }));
  return crmFetch("/api/crm/activities", demo);
}

export async function getCRMContacts(): Promise<CRMContact[]> {
  return crmFetch("/api/crm/contacts", DEMO_CRM_LEADS.map((lead) => ({ id: `contact-${lead.id}`, full_name: lead.full_name, phone: lead.phone, contact_type: "buyer", source: lead.source, tags: [lead.qualification_status], notes: lead.notes, created_at: lead.created_at })));
}

export async function getCRMAccounts(): Promise<CRMAccount[]> {
  return crmFetch("/api/crm/accounts", [{ id: "account-demo-1", account_name: "Shah Homes Network", account_type: "broker agency", company_name: "Shah Homes Network", phone: "+91 90000 01001", notes: "Broker partner account with PropertyPool rights.", created_at: new Date().toISOString() }]);
}

export async function getCRMCampaigns(): Promise<CRMCampaign[]> {
  return crmFetch("/api/crm/campaigns", [{ id: "crm-campaign-demo-1", campaign_name: "Andheri Saturday PropertyPool", campaign_type: "WhatsApp", target_segment: "Andheri/Powai hot buyers", property_id: "mumbai-property-demo-3", message_template: "Verified group visit invite with EMI and route checklist.", status: "active", sent_count: 84, reply_count: 29, visit_count: 11, offer_count: 3, revenue_pipeline: 94500000, created_at: new Date().toISOString() }]);
}

export async function getCRMCommissions(): Promise<CRMCommission[]> {
  return crmFetch("/api/crm/commissions", DEMO_CRM_OPPORTUNITIES.map((opp) => ({ id: `commission-${opp.id}`, opportunity_id: opp.id, broker_id: opp.broker_id, agent_id: "agent-demo-1", deal_value: opp.opportunity_value, commission_percentage: 2, expected_commission: opp.expected_commission, payout_status: "pending", dispute_status: "none", created_at: new Date().toISOString() })));
}

export async function getCRMReports(): Promise<Record<string, unknown>> {
  return crmFetch("/api/crm/reports/sales", demoCRMDashboard().reports);
}

export async function runCRMAutomation(input: Record<string, unknown> = {}) {
  return crmFetch("/api/crm/automation/run", { dashboard: demoCRMDashboard(), automation_state: { messages: ["CRM automation demo fallback completed."] } }, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
}

export type VoiceCallResult = {
  call_status: string;
  call_id?: string | null;
  provider: "elevenlabs";
  reason: string;
  crm_task_id?: string | null;
  scheduled_or_started?: string | null;
  mode: "mock" | "live" | "unknown";
  payload_preview?: Record<string, unknown>;
};

export type VoiceAnalytics = {
  calls_today: number;
  calls_this_week: number;
  estimated_credits_used: number;
  remaining_call_budget: number;
  conversion_from_calls: number;
  visits_booked_from_calls: number;
  mode: "mock" | "live";
};

export type VoiceCallRecord = {
  id: string;
  provider: "elevenlabs";
  mode: "mock" | "live";
  property_id?: string | null;
  buyer_id?: string | null;
  lead_id?: string | null;
  status: string;
  transcript?: string | null;
  summary_json: Record<string, unknown>;
  outcome?: string | null;
  intent_score: number;
  next_action?: string | null;
  created_at: string;
};

export async function triggerElevenLabsInterestCall(input: {
  buyer_id?: string;
  lead_id?: string;
  buyer_name?: string;
  buyer_phone?: string;
  property_id: string;
  interest_source: string;
  consent_confirmed: boolean;
  preferred_language?: "English" | "Hindi" | "Hinglish";
  trigger_reason?: string;
  call_goal?: "property_detail" | "visit_scheduling" | "xr_follow_up" | "propertypool_invite" | "offer_follow_up" | "stale_lead_reactivation";
  force_call?: boolean;
  broker_id?: string;
  crm_opportunity_id?: string;
  metadata?: Record<string, unknown>;
}): Promise<VoiceCallResult> {
  return voiceFetch("/api/voice/elevenlabs/trigger-interest-call", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ preferred_language: "Hinglish", call_goal: "property_detail", ...input }),
  });
}

export async function callCRMLeadWithElevenLabs(leadId: string, input: Record<string, unknown>): Promise<VoiceCallResult> {
  return crmFetch(`/api/crm/leads/${leadId}/call`, { call_status: "mock_completed", call_id: `voice-lead-${Date.now().toString(36)}`, provider: "elevenlabs", reason: "Mock CRM lead call completed.", mode: "mock" }, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
}

export async function callBrokerBuyerWithElevenLabs(buyerId: string, input: Record<string, unknown>): Promise<VoiceCallResult> {
  return crmFetch(`/api/broker/buyers/${buyerId}/call`, { call_status: "mock_completed", call_id: `voice-broker-${Date.now().toString(36)}`, provider: "elevenlabs", reason: "Mock broker-attributed call completed.", mode: "mock" }, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
}

export async function getVoiceAnalytics(): Promise<VoiceAnalytics> {
  return crmFetch("/api/voice/elevenlabs/analytics", { calls_today: 0, calls_this_week: 0, estimated_credits_used: 0, remaining_call_budget: 10, conversion_from_calls: 0, visits_booked_from_calls: 0, mode: "mock" });
}

export async function getVoiceCall(callId: string): Promise<VoiceCallRecord | null> {
  return crmFetch(`/api/voice/calls/${callId}`, null);
}
