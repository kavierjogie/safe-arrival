-- Row Level Security + RPCs
--
-- ⚠ DEMO POLICIES. To let the hackathon demo run with only the anon key and
-- no login, the `demo_*` policies below give the anon role read/write access
-- to operational tables. That means anyone holding the anon key could read
-- verification codes and edit records. Before any real deployment, drop every
-- `demo_*` policy and apply supabase/policies.production.example.sql.

alter table public.hotels enable row level security;
alter table public.profiles enable row level security;
alter table public.drivers enable row level security;
alter table public.journeys enable row level security;
alter table public.journey_updates enable row level security;
alter table public.incidents enable row level security;
alter table public.incident_notes enable row level security;
alter table public.scam_reports enable row level security;
alter table public.notifications enable row level security;

-- Profiles: users can read their own profile only.
create policy profiles_self_read on public.profiles for select to authenticated using (id = auth.uid());

-- Reference data
create policy demo_hotels_read on public.hotels for select to anon, authenticated using (true);
create policy demo_drivers_read on public.drivers for select to anon, authenticated using (true);
create policy demo_drivers_update on public.drivers for update to anon, authenticated using (true) with check (true);

-- Operational tables (demo access)
create policy demo_journeys_read on public.journeys for select to anon, authenticated using (true);
create policy demo_journeys_insert on public.journeys for insert to anon, authenticated with check (true);
create policy demo_journeys_update on public.journeys for update to anon, authenticated using (true) with check (true);

create policy demo_updates_read on public.journey_updates for select to anon, authenticated using (true);
create policy demo_updates_insert on public.journey_updates for insert to anon, authenticated with check (true);

create policy demo_incidents_read on public.incidents for select to anon, authenticated using (true);
create policy demo_incidents_insert on public.incidents for insert to anon, authenticated with check (true);
create policy demo_incidents_update on public.incidents for update to anon, authenticated using (true) with check (true);

create policy demo_notes_read on public.incident_notes for select to anon, authenticated using (true);
create policy demo_notes_insert on public.incident_notes for insert to anon, authenticated with check (true);

-- Scam reports: anyone may submit (anonymous); reading is demo-open.
create policy scam_reports_insert on public.scam_reports for insert to anon, authenticated
  with check (anonymous and verification_status = 'unverified');
create policy demo_scam_reports_read on public.scam_reports for select to anon, authenticated using (true);

create policy demo_notifications_read on public.notifications for select to anon, authenticated using (true);
create policy demo_notifications_insert on public.notifications for insert to anon, authenticated with check (true);
create policy demo_notifications_update on public.notifications for update to anon, authenticated using (true) with check (true);

-- Public tracking: the ONLY way a tracking link reads a journey in production.
-- Returns safe fields only: no phone number, verification code or incident text.
create or replace function public.get_shared_journey(p_token text)
returns table (
  id uuid, journey_reference text, tourist_name text, destination text, destination_area text,
  destination_lat double precision, destination_lng double precision, journey_status text, safety_status text,
  estimated_arrival timestamptz, actual_arrival timestamptz, started_at timestamptz, route_progress numeric,
  estimated_duration_min numeric, created_at timestamptz, updated_at timestamptz,
  driver_name text, vehicle text, registration_number text
)
language sql stable security definer set search_path = public as $$
  select j.id, j.journey_reference,
         coalesce(j.tourist_name, 'Guest ' || right(j.journey_reference, 3)),
         j.destination, j.destination_area, j.destination_lat, j.destination_lng,
         j.journey_status, j.safety_status, j.estimated_arrival, j.actual_arrival, j.started_at,
         j.route_progress, j.estimated_duration_min, j.created_at, j.updated_at,
         d.full_name, concat_ws(' ', d.vehicle_colour, d.vehicle_make, d.vehicle_model), d.registration_number
  from public.journeys j
  left join public.drivers d on d.id = j.driver_id
  where j.share_token = p_token and j.share_enabled
  limit 1
$$;
revoke all on function public.get_shared_journey(text) from public;
grant execute on function public.get_shared_journey(text) to anon, authenticated;
