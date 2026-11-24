-- Cape Town Safe Arrival — core schema
-- Run in order via the Supabase SQL editor or `supabase db push`.

create table if not exists public.hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  contact_email text,
  contact_phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'tourist' check (role in ('tourist', 'hotel', 'operations', 'admin')),
  hotel_id uuid references public.hotels (id) on delete set null, -- for hotel staff
  created_at timestamptz not null default now()
);

create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  driver_reference text not null unique,
  full_name text not null,
  vehicle_make text not null,
  vehicle_model text not null,
  vehicle_colour text not null,
  registration_number text not null unique,
  verification_status text not null default 'pending' check (verification_status in ('verified', 'pending', 'suspended', 'rejected')),
  permit_status text not null default 'pending' check (permit_status in ('valid', 'pending', 'expired', 'suspended')),
  id_check_status text not null default 'pending' check (id_check_status in ('passed', 'pending', 'failed')),
  registration_check_status text not null default 'pending' check (registration_check_status in ('passed', 'pending', 'failed')),
  rating numeric(2, 1) check (rating between 0 and 5),
  verified_at timestamptz,
  is_demo boolean not null default true,
  created_at timestamptz not null default now()
);
-- Note: no identity documents are stored. Production would store only the
-- outcome of checks done by an accredited verification provider.

create table if not exists public.journeys (
  id uuid primary key default gen_random_uuid(),
  journey_reference text not null unique,
  tourist_name text check (char_length(tourist_name) <= 40),
  tourist_phone text, -- never exposed publicly
  hotel_id uuid references public.hotels (id) on delete set null,
  destination text not null check (char_length(destination) between 2 and 300),
  destination_area text not null default 'cbd',
  destination_lat double precision,
  destination_lng double precision,
  driver_id uuid references public.drivers (id) on delete set null,
  verification_code text check (verification_code ~ '^[0-9]{4}$'),
  estimated_fare numeric(10, 2),
  fare_min numeric(10, 2),
  fare_max numeric(10, 2),
  fare_currency text not null default 'ZAR',
  estimated_distance_km numeric(6, 1),
  estimated_duration_min numeric(6, 1),
  estimated_arrival timestamptz,
  actual_arrival timestamptz,
  journey_status text not null default 'awaiting_transport' check (journey_status in (
    'awaiting_transport', 'driver_assigned', 'driver_confirmed', 'picked_up', 'on_route',
    'arrived', 'safety_check_pending', 'completed', 'incident_reported')),
  safety_status text not null default 'pending' check (safety_status in ('pending', 'on_track', 'check_pending', 'safe', 'alert', 'incident')),
  share_token text not null unique default ('trk_' || replace(gen_random_uuid()::text, '-', '')),
  share_enabled boolean not null default false,
  share_target text check (share_target in ('hotel', 'contact')),
  pickup_location text,
  route_progress numeric(4, 3) not null default 0 check (route_progress between 0 and 1),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists journeys_status_idx on public.journeys (journey_status);
create index if not exists journeys_hotel_idx on public.journeys (hotel_id) where share_enabled;
create index if not exists journeys_driver_idx on public.journeys (driver_id);

create table if not exists public.journey_updates (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journeys (id) on delete cascade,
  status text not null,
  latitude double precision,
  longitude double precision,
  description text,
  created_at timestamptz not null default now()
);
create index if not exists journey_updates_journey_idx on public.journey_updates (journey_id, created_at desc);

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  case_reference text not null unique,
  journey_id uuid references public.journeys (id) on delete set null,
  category text not null check (category in ('driver_impersonation', 'vehicle_mismatch', 'overcharging', 'unsafe_route',
    'harassment', 'lost_tourist', 'driver_not_found', 'theft', 'other')),
  severity text not null default 'medium' check (severity in ('critical', 'high', 'medium', 'low')),
  description text not null default '' check (char_length(description) <= 1000),
  incident_status text not null default 'new' check (incident_status in ('new', 'acknowledged', 'investigating', 'resolved', 'closed')),
  hotel_notified boolean not null default false,
  tourist_reference text,
  resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists incidents_status_idx on public.incidents (incident_status, created_at desc);
create index if not exists incidents_journey_idx on public.incidents (journey_id);

create table if not exists public.incident_notes (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  note text not null check (char_length(note) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists incident_notes_incident_idx on public.incident_notes (incident_id);

create table if not exists public.scam_reports (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('airport_overcharging', 'fake_ridehailing', 'fake_tour_operator', 'accommodation_scam',
    'atm_scam', 'card_fraud', 'fake_guide', 'taxi_impersonation', 'distraction_theft')),
  location text not null check (char_length(location) between 2 and 120),
  description text not null check (char_length(description) between 10 and 1000),
  severity text not null default 'medium' check (severity in ('critical', 'high', 'medium', 'low')),
  verification_status text not null default 'unverified' check (verification_status in ('unverified', 'under_review', 'pattern_confirmed')),
  anonymous boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists scam_reports_created_idx on public.scam_reports (created_at desc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_type text not null check (recipient_type in ('hotel', 'operations', 'tourist')),
  recipient_id uuid, -- hotel id when recipient_type = 'hotel'
  journey_id uuid references public.journeys (id) on delete set null,
  title text not null,
  message text not null,
  notification_type text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_recipient_idx on public.notifications (recipient_type, recipient_id, created_at desc);

-- updated_at maintenance
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists journeys_touch on public.journeys;
create trigger journeys_touch before update on public.journeys for each row execute function public.touch_updated_at();
drop trigger if exists incidents_touch on public.incidents;
create trigger incidents_touch before update on public.incidents for each row execute function public.touch_updated_at();

-- Realtime
alter publication supabase_realtime add table public.journeys, public.journey_updates, public.incidents,
  public.incident_notes, public.drivers, public.scam_reports, public.notifications, public.hotels;
