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
