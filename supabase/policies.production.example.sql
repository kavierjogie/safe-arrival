-- EXAMPLE production RLS — NOT a migration. Apply after dropping demo policies:
--   select format('drop policy %I on %I.%I;', policyname, schemaname, tablename)
--   from pg_policies where policyname like 'demo_%';  -- run the output
--   drop function public.reset_demo();
--
-- Model:
--   • Tourists never touch the database directly. The WhatsApp Business webhook
--     (server-side, service_role key) creates and updates their journeys.
--   • Hotel staff (profiles.role = 'hotel') see only journeys shared with their hotel.
--   • Operations/admin staff manage journeys, incidents and drivers.
--   • Public tracking links go through get_shared_journey() only.

create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;
create or replace function public.my_hotel() returns uuid
language sql stable security definer set search_path = public as $$
  select hotel_id from public.profiles where id = auth.uid()
$$;

create policy hotels_read on public.hotels for select to authenticated using (true);

create policy drivers_staff_read on public.drivers for select to authenticated using (public.my_role() in ('hotel', 'operations', 'admin'));
create policy drivers_ops_write on public.drivers for update to authenticated using (public.my_role() in ('operations', 'admin')) with check (true);

create policy journeys_hotel_read on public.journeys for select to authenticated
  using (public.my_role() = 'hotel' and share_enabled and hotel_id = public.my_hotel());
create policy journeys_ops_all on public.journeys for all to authenticated
  using (public.my_role() in ('operations', 'admin')) with check (public.my_role() in ('operations', 'admin'));
-- Hide sensitive columns from hotel staff: expose a view without
-- tourist_phone, and reveal verification_code via an audited RPC instead.
revoke select (tourist_phone) on public.journeys from authenticated;

create policy updates_staff_read on public.journey_updates for select to authenticated
  using (exists (select 1 from public.journeys j where j.id = journey_id));  -- inherits journeys RLS

create policy incidents_ops_all on public.incidents for all to authenticated
  using (public.my_role() in ('operations', 'admin')) with check (public.my_role() in ('operations', 'admin'));
create policy incidents_hotel_read on public.incidents for select to authenticated
  using (public.my_role() = 'hotel' and hotel_notified and exists (
    select 1 from public.journeys j where j.id = journey_id and j.hotel_id = public.my_hotel()));

create policy notes_ops_all on public.incident_notes for all to authenticated
  using (public.my_role() in ('operations', 'admin')) with check (author_id = auth.uid());

-- Scam reports: anonymous submission stays open; only staff read raw reports.
create policy scam_reports_staff_read on public.scam_reports for select to authenticated using (public.my_role() in ('operations', 'admin'));
create policy scam_reports_ops_update on public.scam_reports for update to authenticated using (public.my_role() in ('operations', 'admin')) with check (true);

create policy notifications_hotel on public.notifications for select to authenticated
  using ((recipient_type = 'hotel' and recipient_id = public.my_hotel()) or (recipient_type = 'operations' and public.my_role() in ('operations', 'admin')));
create policy notifications_mark_read on public.notifications for update to authenticated
  using ((recipient_type = 'hotel' and recipient_id = public.my_hotel()) or public.my_role() in ('operations', 'admin')) with check (true);
