import { DEMO_MARKET_INSIGHTS, DEMO_PROPERTIES, searchDemoProperties } from "@/lib/demo";

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
