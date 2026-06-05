create extension if not exists vector;
create extension if not exists pgcrypto;

create table if not exists properties (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  address text not null,
  city text not null default 'Mumbai',
  locality text not null,
  micro_market text,
  property_type text not null default 'apartment',
  transaction_type text not null default 'buy',
  price numeric not null,
  price_per_sqft numeric,
  bedrooms int not null,
  bathrooms int not null,
  area_sqft int not null,
  carpet_area_sqft int,
  built_up_area_sqft int,
  latitude double precision not null,
  longitude double precision not null,
  status text not null default 'available' check (status in ('available','reserved','sold')),
  availability text not null default 'Viewing slots available this week',
  possession text,
  builder text,
  description text not null,
  amenities text[] not null default '{}',
  tags text[] not null default '{}',
  image_url text,
  splat_url text,
  rera_id text,
  inventory_months int,
  cost_bucket text,
  redevelopment_score numeric,
  redevelopment_das_signed int,
  construction_cost_low numeric,
  construction_cost_high numeric,
  material_estimate jsonb,
  emi_20y_per_lakh numeric,
  monthly_emi_estimate numeric,
  expected_rent_yield numeric,
  walkability_score numeric,
  commute_score numeric,
  risk_flags text[] not null default '{}',
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists properties_city_idx on properties (lower(city));
create index if not exists properties_locality_idx on properties (lower(locality));
create index if not exists properties_micro_market_idx on properties (lower(micro_market));
create index if not exists properties_status_idx on properties (status);
create index if not exists properties_price_idx on properties (price);
create index if not exists properties_geo_idx on properties (latitude, longitude);
create index if not exists properties_redev_idx on properties (redevelopment_score desc);
create index if not exists properties_inventory_idx on properties (inventory_months asc);
create index if not exists properties_embedding_idx on properties using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create table if not exists leads (
  id text primary key default gen_random_uuid()::text,
  name text,
  phone text,
  email text,
  channel text not null default 'web',
  intent text,
  budget numeric,
  preferred_locality text,
  lead_score int default 0,
  transcript jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists viewings (
  id text primary key default gen_random_uuid()::text,
  property_id text references properties(id) on delete set null,
  lead_id text references leads(id) on delete set null,
  calcom_booking_id text,
  start_time timestamptz,
  end_time timestamptz,
  channel text not null default 'web',
  status text not null default 'requested',
  created_at timestamptz not null default now()
);

create table if not exists communication_events (
  id text primary key default gen_random_uuid()::text,
  lead_id text references leads(id) on delete set null,
  channel text not null,
  direction text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists document_events (
  id text primary key default gen_random_uuid()::text,
  property_id text references properties(id) on delete set null,
  document_type text not null,
  extraction jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists tour_sessions (
  id text primary key default gen_random_uuid()::text,
  property_id text references properties(id) on delete set null,
  mode text not null default 'map',
  waypoints jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists negotiation_sessions (
  id text primary key default gen_random_uuid()::text,
  property_id text references properties(id) on delete set null,
  role text not null,
  target_price numeric not null,
  opponent_offer numeric not null,
  counter_offer numeric not null,
  created_at timestamptz not null default now()
);

create table if not exists agent_audit_events (
  id text primary key default gen_random_uuid()::text,
  session_id text,
  route text not null,
  state_delta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists manager_profiles (
  id text primary key default gen_random_uuid()::text,
  user_id text,
  full_name text not null,
  company_name text not null,
  phone text,
  email text,
  role text not null default 'manager',
  rera_agent_id text,
  operating_localities text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists seller_listings (
  id text primary key default gen_random_uuid()::text,
  manager_id text references manager_profiles(id) on delete cascade,
  title text not null,
  slug text not null,
  status text not null default 'draft',
  property_type text not null,
  transaction_type text not null,
  locality text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  carpet_area_sqft int,
  builtup_area_sqft int,
  bedrooms int,
  bathrooms int,
  parking_count int,
  furnishing_status text,
  possession_status text,
  availability_date text,
  rera_number text,
  asking_price numeric,
  recommended_price numeric,
  fast_sale_price numeric,
  optimistic_price numeric,
  min_acceptable_price numeric,
  price_per_sqft numeric,
  market_heat_score numeric default 0,
  legal_risk_score numeric default 0,
  readiness_score numeric default 0,
  lead_quality_score numeric default 0,
  redevelopment_score numeric default 0,
  description_short text,
  description_long text,
  seo_title text,
  public_visibility boolean not null default false,
  owner_name text,
  owner_phone text,
  owner_email text,
  hero_image_url text,
  map_payload jsonb not null default '{}'::jsonb,
  pricing_json jsonb not null default '{}'::jsonb,
  copy_json jsonb not null default '{}'::jsonb,
  readiness_json jsonb not null default '{}'::jsonb,
  legal_notes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

alter table seller_listings add column if not exists unit_number text;
alter table seller_listings add column if not exists building_name text;
alter table seller_listings add column if not exists super_builtup_area_sqft int;
alter table seller_listings add column if not exists floor_number int;
alter table seller_listings add column if not exists total_floors int;

create table if not exists listing_documents (
  id text primary key default gen_random_uuid()::text,
  listing_id text references seller_listings(id) on delete cascade,
  document_type text not null,
  file_url text,
  file_name text,
  extraction_status text not null default 'pending',
  extracted_json jsonb not null default '{}'::jsonb,
  confidence_score numeric default 0,
  red_flags text[] not null default '{}',
  missing_items text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists listing_media (
  id text primary key default gen_random_uuid()::text,
  listing_id text references seller_listings(id) on delete cascade,
  media_type text not null,
  room_type text,
  file_url text,
  thumbnail_url text,
  caption text,
  alt_text text,
  is_hero boolean not null default false,
  quality_score numeric default 0,
  created_at timestamptz not null default now()
);

alter table listing_media add column if not exists room_area_sqft numeric;
alter table listing_media add column if not exists room_name text;
alter table listing_media add column if not exists display_order int default 0;
alter table listing_media add column if not exists media_url text;

create table if not exists listing_leads (
  id text primary key default gen_random_uuid()::text,
  listing_id text references seller_listings(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  source text not null,
  budget_min numeric,
  budget_max numeric,
  preferred_visit_time text,
  buyer_profile text,
  intent_score numeric default 0,
  qualification_score numeric default 0,
  status text not null default 'new',
  last_agent_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists site_visits (
  id text primary key default gen_random_uuid()::text,
  listing_id text references seller_listings(id) on delete cascade,
  lead_id text references listing_leads(id) on delete set null,
  cal_booking_id text,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  status text not null default 'requested',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists listing_agent_tasks (
  id text primary key default gen_random_uuid()::text,
  listing_id text references seller_listings(id) on delete cascade,
  agent_name text not null,
  task_type text not null,
  status text not null default 'open',
  priority text not null default 'medium',
  input_json jsonb not null default '{}'::jsonb,
  output_json jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists listing_audit_logs (
  id text primary key default gen_random_uuid()::text,
  listing_id text references seller_listings(id) on delete cascade,
  actor_type text not null,
  actor_name text not null,
  action text not null,
  details_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists market_comparables (
  id text primary key default gen_random_uuid()::text,
  locality text not null,
  property_type text not null,
  price numeric not null,
  price_per_sqft numeric not null,
  carpet_area_sqft int,
  bedrooms int,
  transaction_date text,
  source text not null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists listing_embeddings (
  id text primary key default gen_random_uuid()::text,
  listing_id text references seller_listings(id) on delete cascade,
  embedding vector(1536),
  content text not null,
  content_type text not null,
  created_at timestamptz not null default now()
);

create table if not exists broker_profiles (
  id text primary key default gen_random_uuid()::text,
  user_id text,
  full_name text not null,
  agency_name text,
  phone text not null,
  email text not null,
  whatsapp_number text,
  rera_agent_id text,
  operating_localities text[] not null default '{}',
  years_experience int not null default 0,
  property_categories text[] not null default '{}',
  buyer_network_size int not null default 0,
  average_monthly_visits int not null default 0,
  preferred_commission_structure text,
  languages_spoken text[] not null default '{}',
  specialization text[] not null default '{}',
  verification_status text not null default 'pending',
  trust_score numeric not null default 0,
  profile_photo_url text,
  business_card_url text,
  kyc_document_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists broker_tieup_requests (
  id text primary key default gen_random_uuid()::text,
  broker_id text,
  manager_id text,
  listing_id text,
  status text not null default 'requested',
  requested_commission numeric,
  approved_commission numeric,
  requested_validity_days int,
  approved_validity_days int,
  requested_exclusivity boolean not null default false,
  approved_exclusivity boolean not null default false,
  requested_propertypool_rights boolean not null default false,
  approved_propertypool_rights boolean not null default false,
  intended_buyer_segment text,
  expected_buyer_count int,
  marketing_channels text[] not null default '{}',
  broker_message text,
  manager_response text,
  ai_recommendation_json jsonb not null default '{}'::jsonb,
  approved_terms_json jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists broker_property_access (
  id text primary key default gen_random_uuid()::text,
  broker_id text,
  listing_id text,
  tieup_id text,
  access_status text,
  can_share_whatsapp boolean not null default false,
  can_create_propertypool boolean not null default false,
  can_book_visits boolean not null default false,
  can_view_documents boolean not null default false,
  can_view_manager_contact boolean not null default false,
  commission_rule_json jsonb not null default '{}'::jsonb,
  attribution_expiry_days int not null default 90,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists broker_buyers (
  id text primary key default gen_random_uuid()::text,
  broker_id text,
  full_name text not null,
  phone text not null,
  email text,
  budget_min numeric,
  budget_max numeric,
  preferred_localities text[] not null default '{}',
  property_type_preference text,
  bhk_preference text,
  purchase_purpose text,
  buying_timeline text,
  loan_required boolean not null default true,
  family_size int,
  lead_temperature text not null default 'warm',
  communication_channel text not null default 'WhatsApp',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists broker_lead_attributions (
  id text primary key default gen_random_uuid()::text,
  broker_id text,
  buyer_id text,
  listing_id text,
  tieup_id text,
  attribution_status text,
  first_introduced_at timestamptz,
  last_interaction_at timestamptz,
  expiry_at timestamptz,
  source text,
  duplicate_conflict boolean not null default false,
  conflict_details_json jsonb not null default '{}'::jsonb,
  commission_eligible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists propertypool_events (
  id text primary key default gen_random_uuid()::text,
  listing_id text,
  broker_id text,
  manager_id text,
  tieup_id text,
  event_title text,
  event_type text,
  status text,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  max_buyers int,
  meeting_point text,
  buyer_segment text,
  route_json jsonb not null default '{}'::jsonb,
  tour_script text,
  invite_message text,
  reminder_schedule_json jsonb not null default '{}'::jsonb,
  manager_approval_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists propertypool_registrations (
  id text primary key default gen_random_uuid()::text,
  event_id text,
  buyer_id text,
  broker_id text,
  rsvp_status text,
  checkin_status text,
  checkin_time timestamptz,
  feedback_json jsonb not null default '{}'::jsonb,
  interest_level text,
  next_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists broker_commissions (
  id text primary key default gen_random_uuid()::text,
  broker_id text,
  buyer_id text,
  listing_id text,
  tieup_id text,
  deal_status text,
  property_value numeric,
  commission_percentage numeric,
  expected_commission numeric,
  approved_commission numeric,
  payout_status text,
  dispute_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists broker_agent_tasks (
  id text primary key default gen_random_uuid()::text,
  broker_id text,
  listing_id text,
  buyer_id text,
  propertypool_event_id text,
  agent_name text,
  task_type text,
  status text,
  priority text,
  input_json jsonb not null default '{}'::jsonb,
  output_json jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists broker_audit_logs (
  id text primary key default gen_random_uuid()::text,
  broker_id text,
  listing_id text,
  buyer_id text,
  action text,
  actor_type text,
  actor_name text,
  details_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists property_visit_feedback (
  id text primary key default gen_random_uuid()::text,
  listing_id text references seller_listings(id) on delete cascade,
  buyer_id text,
  broker_id text,
  visit_id text,
  feedback_json jsonb not null default '{}'::jsonb,
  interest_level text,
  public_summary_allowed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists property_faqs (
  id text primary key default gen_random_uuid()::text,
  listing_id text references seller_listings(id) on delete cascade,
  question text not null,
  answer text not null,
  source text not null default 'ai_suggestion',
  verified_status text not null default 'needs_manager_confirmation',
  created_at timestamptz not null default now()
);

create table if not exists property_area_breakdowns (
  id text primary key default gen_random_uuid()::text,
  listing_id text references seller_listings(id) on delete cascade,
  room_name text not null,
  area_sqft numeric,
  notes text,
  verified_status text not null default 'unverified',
  created_at timestamptz not null default now()
);

create table if not exists listing_xr_assets (
  id text primary key default gen_random_uuid()::text,
  listing_id text references seller_listings(id) on delete cascade,
  asset_type text not null check (asset_type in ('ksplat','splat','ply','glb','video_fallback')),
  asset_url text,
  thumbnail_url text,
  file_size_mb numeric,
  version text,
  processing_status text not null default 'pending' check (processing_status in ('pending','processing','ready','failed')),
  coordinate_system text,
  scale_factor numeric not null default 1,
  origin_json jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists listing_xr_hotspots (
  id text primary key default gen_random_uuid()::text,
  listing_id text references seller_listings(id) on delete cascade,
  room_name text,
  hotspot_type text,
  label text not null,
  description text,
  position_json jsonb not null default '{}'::jsonb,
  camera_position_json jsonb not null default '{}'::jsonb,
  camera_look_at_json jsonb not null default '{}'::jsonb,
  narration text,
  buyer_relevance_tags text[] not null default '{}',
  broker_talking_points text[] not null default '{}',
  manager_notes text,
  linked_media_id text,
  linked_document_id text,
  priority int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists listing_xr_routes (
  id text primary key default gen_random_uuid()::text,
  listing_id text references seller_listings(id) on delete cascade,
  route_name text not null,
  route_type text not null check (route_type in ('default','family_buyer','investor','nri','broker_propertypool','manager_preview')),
  ordered_hotspot_ids text[] not null default '{}',
  route_script text,
  estimated_duration_minutes numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists xr_tour_sessions (
  id text primary key default gen_random_uuid()::text,
  listing_id text references seller_listings(id) on delete cascade,
  user_id text,
  role text not null default 'public',
  buyer_id text,
  broker_id text,
  manager_id text,
  started_at timestamptz,
  ended_at timestamptz,
  session_status text not null default 'active',
  current_hotspot_id text,
  transcript_json jsonb not null default '[]'::jsonb,
  events_json jsonb not null default '[]'::jsonb,
  feedback_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists xr_voice_interactions (
  id text primary key default gen_random_uuid()::text,
  session_id text,
  listing_id text references seller_listings(id) on delete cascade,
  user_id text,
  role text not null default 'public',
  transcript text,
  agent_response_json jsonb not null default '{}'::jsonb,
  spoken_text text,
  response_type text,
  created_at timestamptz not null default now()
);

create table if not exists xr_navigation_events (
  id text primary key default gen_random_uuid()::text,
  session_id text,
  listing_id text references seller_listings(id) on delete cascade,
  event_type text,
  from_hotspot_id text,
  to_hotspot_id text,
  camera_position_json jsonb not null default '{}'::jsonb,
  timestamp timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists crm_leads (
  id text primary key default gen_random_uuid()::text,
  organization_id text,
  full_name text not null,
  phone text,
  email text,
  source text,
  source_detail text,
  buyer_type text,
  budget_min numeric,
  budget_max numeric,
  preferred_localities text[] not null default '{}',
  property_type_preference text,
  bhk_preference text,
  buying_timeline text,
  loan_required boolean not null default true,
  down_payment_available numeric,
  family_size int,
  purpose text,
  assigned_user_id text,
  broker_id text,
  manager_id text,
  lead_score numeric default 0,
  qualification_status text,
  duplicate_status text,
  status text,
  last_contacted_at timestamptz,
  next_follow_up_at timestamptz,
  notes text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_leads_org_idx on crm_leads (organization_id);
create index if not exists crm_leads_source_idx on crm_leads (source);
create index if not exists crm_leads_score_idx on crm_leads (lead_score desc);

create table if not exists crm_contacts (
  id text primary key default gen_random_uuid()::text,
  organization_id text,
  full_name text not null,
  phone text,
  email text,
  contact_type text,
  linked_buyer_id text,
  linked_broker_id text,
  linked_manager_id text,
  source text,
  tags text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists crm_accounts (
  id text primary key default gen_random_uuid()::text,
  organization_id text,
  account_name text not null,
  account_type text,
  company_name text,
  primary_contact_id text,
  phone text,
  email text,
  address text,
  gst_number text,
  rera_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists crm_opportunities (
  id text primary key default gen_random_uuid()::text,
  organization_id text,
  lead_id text,
  contact_id text,
  buyer_id text,
  property_id text,
  broker_id text,
  manager_id text,
  title text not null,
  stage text,
  opportunity_value numeric,
  expected_commission numeric,
  probability numeric,
  weighted_value numeric,
  source text,
  assigned_user_id text,
  next_activity_id text,
  expected_close_date timestamptz,
  lost_reason text,
  won_at timestamptz,
  lost_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_opportunities_org_idx on crm_opportunities (organization_id);
create index if not exists crm_opportunities_stage_idx on crm_opportunities (stage);
create index if not exists crm_opportunities_value_idx on crm_opportunities (opportunity_value desc);

create table if not exists crm_pipeline_stages (
  id text primary key default gen_random_uuid()::text,
  organization_id text,
  stage_name text not null,
  display_order int,
  default_probability numeric,
  color text,
  is_closed_won boolean not null default false,
  is_closed_lost boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists crm_activities (
  id text primary key default gen_random_uuid()::text,
  organization_id text,
  lead_id text,
  opportunity_id text,
  contact_id text,
  property_id text,
  assigned_user_id text,
  activity_type text,
  title text,
  description text,
  due_at timestamptz,
  status text,
  priority text,
  created_by_agent boolean not null default false,
  completed_at timestamptz,
  outcome text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_activities_due_idx on crm_activities (due_at);
create index if not exists crm_activities_status_idx on crm_activities (status);

create table if not exists crm_interactions (
  id text primary key default gen_random_uuid()::text,
  organization_id text,
  lead_id text,
  opportunity_id text,
  contact_id text,
  property_id text,
  channel text,
  direction text,
  summary text,
  transcript text,
  sentiment text,
  intent_score numeric,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists crm_proposals (
  id text primary key default gen_random_uuid()::text,
  organization_id text,
  opportunity_id text,
  property_id text,
  buyer_id text,
  proposal_type text,
  title text,
  content_json jsonb not null default '{}'::jsonb,
  pdf_url text,
  status text,
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists crm_commissions (
  id text primary key default gen_random_uuid()::text,
  organization_id text,
  opportunity_id text,
  broker_id text,
  agent_id text,
  manager_id text,
  property_id text,
  deal_value numeric,
  commission_percentage numeric,
  expected_commission numeric,
  approved_commission numeric,
  payout_status text,
  dispute_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists crm_campaigns (
  id text primary key default gen_random_uuid()::text,
  organization_id text,
  campaign_name text,
  campaign_type text,
  target_segment text,
  property_id text,
  message_template text,
  status text,
  sent_count int not null default 0,
  reply_count int not null default 0,
  visit_count int not null default 0,
  offer_count int not null default 0,
  revenue_pipeline numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists crm_audit_logs (
  id text primary key default gen_random_uuid()::text,
  organization_id text,
  actor_type text,
  actor_id text,
  action text,
  entity_type text,
  entity_id text,
  details_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists crm_audit_logs_entity_idx on crm_audit_logs (entity_type, entity_id);

create table if not exists voice_call_configs (
  id text primary key default gen_random_uuid()::text,
  provider text not null default 'elevenlabs',
  mode text not null default 'mock',
  elevenlabs_agent_id text,
  elevenlabs_phone_number_id text,
  max_calls_per_day int not null default 10,
  max_call_seconds int not null default 240,
  allowed_start_hour int not null default 10,
  allowed_end_hour int not null default 19,
  cooldown_hours int not null default 24,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists voice_call_records (
  id text primary key default gen_random_uuid()::text,
  provider text not null default 'elevenlabs',
  mode text not null default 'mock',
  buyer_id text,
  lead_id text,
  property_id text,
  broker_id text,
  manager_id text,
  crm_opportunity_id text,
  trigger_source text,
  trigger_reason text,
  call_goal text,
  to_number text,
  provider_call_id text,
  provider_conversation_id text,
  status text,
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds int not null default 0,
  transcript text,
  summary_json jsonb not null default '{}'::jsonb,
  outcome text,
  intent_score numeric,
  next_action text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists voice_call_records_buyer_idx on voice_call_records (buyer_id);
create index if not exists voice_call_records_property_idx on voice_call_records (property_id);
create index if not exists voice_call_records_status_idx on voice_call_records (status);

create table if not exists voice_call_consent (
  id text primary key default gen_random_uuid()::text,
  buyer_id text,
  phone text not null,
  consent_status text,
  consent_source text,
  consent_timestamp timestamptz,
  opt_out boolean not null default false,
  opt_out_reason text,
  last_called_at timestamptz,
  calls_last_7_days int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists voice_call_consent_phone_idx on voice_call_consent (phone);

create table if not exists voice_call_events (
  id text primary key default gen_random_uuid()::text,
  call_id text,
  event_type text,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists voice_agent_tool_calls (
  id text primary key default gen_random_uuid()::text,
  call_id text,
  tool_name text,
  input_json jsonb not null default '{}'::jsonb,
  output_json jsonb not null default '{}'::jsonb,
  status text,
  error_message text,
  created_at timestamptz not null default now()
);
