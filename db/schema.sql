-- Olhar dos Três Picos — conceptual schema (PostgreSQL / Supabase)
--
-- This describes the data model the mock providers are standing in for.
-- It is NOT applied to any database yet — no Supabase project has been
-- provisioned for this phase, and every read in the app currently comes
-- from providers/*/mock-*-provider.ts instead of SQL. Treat this file as
-- the target shape for whoever wires up the real providers later.
--
-- Left out on purpose for the same reason: RLS policies, roles, and
-- triggers. Add those when this is actually applied to a project, scoped
-- to whatever auth model /admin ends up using.

create extension if not exists "pgcrypto";

-- Named peaks / observation points. camera_presets can point at one of
-- these so a preset carries real-world meaning, not just PTZ coordinates.
create table mountains (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  elevation_m integer,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

-- Physical camera devices. One row per PTZ unit — today that's a single
-- camera at Mascarin, but the shape allows more later.
create table cameras (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  location_description text,
  resolution text,
  optical_zoom_x numeric,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- PTZ presets belonging to a camera, optionally tied to a mountain.
create table camera_presets (
  id uuid primary key default gen_random_uuid(),
  camera_id uuid not null references cameras(id) on delete cascade,
  mountain_id uuid references mountains(id) on delete set null,
  slug text not null,
  name text not null,
  description text,
  pan numeric,
  tilt numeric,
  zoom numeric,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (camera_id, slug)
);

-- Observed readings from the weather station. Append-only time series —
-- never a forecast value, see forecast_readings for that.
create table weather_readings (
  id bigint generated always as identity primary key,
  observed_at timestamptz not null,
  temperature_c numeric not null,
  humidity_pct numeric,
  wind_speed_kmh numeric,
  wind_direction text,
  pressure_hpa numeric,
  rain_mm_per_hour numeric,
  visibility_km numeric,
  solar_radiation_wm2 numeric,
  source text not null default 'station',
  created_at timestamptz not null default now()
);
create index weather_readings_observed_at_idx on weather_readings (observed_at desc);

-- Forecast points, hourly or daily horizon, always distinct from observed
-- readings so the UI never conflates the two.
create table forecast_readings (
  id bigint generated always as identity primary key,
  forecast_for timestamptz not null,
  horizon text not null check (horizon in ('hourly', 'daily')),
  temperature_min_c numeric,
  temperature_max_c numeric,
  temperature_c numeric,
  rain_chance_pct numeric,
  wind_speed_kmh numeric,
  cloud_cover_pct numeric,
  condition text,
  source text not null default 'mock',
  generated_at timestamptz not null default now()
);
create index forecast_readings_forecast_for_idx on forecast_readings (forecast_for);

-- Notable weather events / threshold breaches surfaced to viewers or admins.
create table weather_alerts (
  id uuid primary key default gen_random_uuid(),
  severity text not null check (severity in ('info', 'warning', 'critical')),
  title text not null,
  description text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

-- Infrastructure health snapshots — camera, station, internet, server,
-- solar, battery. One row per check, so status over time is queryable.
create table system_status (
  id bigint generated always as identity primary key,
  component text not null,
  status text not null,
  detail text,
  checked_at timestamptz not null default now()
);
create index system_status_component_checked_at_idx on system_status (component, checked_at desc);

-- Generated timelapse sequences for a camera.
create table timelapses (
  id uuid primary key default gen_random_uuid(),
  camera_id uuid not null references cameras(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  frame_count integer,
  video_url text,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'ready', 'failed')),
  created_at timestamptz not null default now()
);

-- Free-form key/value app configuration (update interval, alert
-- thresholds, feature flags) — deliberately schemaless per key.
create table settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
