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
