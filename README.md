# Cape Town Safe Arrival

**Land safely. Ride confidently. Arrive connected.**

A WhatsApp-first tourist safety and airport-transport verification prototype, built for a hackathon. Tourists arriving at Cape Town International Airport get a fare estimate, a verified driver with a one-time code, a hotel-connected journey, and a safe-arrival check. If something goes wrong, an incident is created and appears on the hotel and operations dashboards.

> **Prototype notice.** The WhatsApp chat is simulated in the browser. Drivers, guests, incidents and scam reports are fictional. Fares are illustrative, not live quotes. Map positions are simulated, not GPS. Hotel names are used for illustration only and imply no partnership.

---

## Problem

Visitors landing in Cape Town often don't know who to trust or what transport to take. They face driver impersonation, overcharging, confusing pickup points, unexpected route changes, and no easy way to keep their accommodation informed or get help.

## Solution

Safe Arrival is a **safety, verification and coordination layer**. It doesn't own a fleet or compete with ride-hailing apps.

1. The tourist scans an airport QR code that opens a WhatsApp chat (no app download needed).
2. They enter their accommodation and see a transparent fare estimate.
3. They get a verified driver: name, vehicle, registration and a 4-digit verification code.
4. They share the trip with their hotel or a trusted contact using a private tracking link.
5. The journey is tracked stage by stage, ending with a safe-arrival confirmation.
6. If they report a problem, a case reference is generated and the dashboards are alerted.

## Features

| Area | Route | Highlights |
|---|---|---|
| Landing | `/` | Value proposition, features, how-it-works timeline |
| Tourist simulator | `/demo` | WhatsApp-style chat, typing indicators, quick replies, fare breakdown, driver card and code, sharing, trip simulation, safe-arrival and incident flows, checklist, emergency panel |
| Public tracking | `/journey/:token` | Safe fields only, stage progress, simulated map, emergency button |
| Hotel dashboard | `/hotel` | Per-hotel view, guest journeys table, live notifications and toasts, journey drawer, masked verification code |
| Operations | `/operations` | KPIs, active journeys map, severity-filtered alerts, monitoring table, charts, activity feed |
| Incidents | `/operations/incidents` | Search and filter, status and priority changes, resolution, internal notes |
| Drivers | `/operations/drivers` | Simulated verification steps, approve, suspend or mark pending (with confirmation) |
| Scam insights | `/operations/scams` | Category, trend and location breakdowns, public "Tourist safety insights", anonymous reporting |
| Privacy | `/privacy` | Plain-language data handling |
| Admin login | `/admin/login` | Supabase Auth sign-in (only when enabled) |

**Presenter bar** (on every page): switch between the Tourist, Hotel and Operations views, open the guided 3-minute script (with scene progress), or **Reset Demo**.

## Tech stack

React 19 · JavaScript · Vite · Tailwind CSS v4 · React Router · Lucide · Supabase (Postgres, Realtime, RLS, Auth) · Leaflet + OpenStreetMap · Recharts · Sonner · qrcode.react · date-fns · Vercel

## Architecture

```
src/
  context/DemoContext.jsx   single source of truth: tables + chat state, actions,
                            Supabase load/realtime, localStorage + cross-tab sync,
                            simulated trip progress
  hooks/useTouristChat.js   scripted conversation engine (steps → quick replies)
  services/*.js             Supabase queries only (journey, incident, driver, scam, hotel)
  data/*.js                 seed data (also used to generate the SQL seed)
  lib/fareEstimator.js      demo fare and route engine
  lib/journeyUtils.js       statuses, labels, ETA, route interpolation, derived alerts
  components/               layout, chat, journey, driver, safety, common UI
  pages/                    one file per route
supabase/
  migrations/               schema → RLS and RPCs → seed and reset functions
  policies.production.example.sql
scripts/generate-seed.mjs   regenerates the seed migration from src/data
```

Every interface reads the same state. A status change in the tourist chat updates the hotel and operations views straight away:

- **Demo Mode:** React state persisted to `localStorage`. Other open tabs update through the `storage` event, so you can put the tourist and hotel views side by side.
- **Supabase Mode:** writes go to Postgres. Changes reach every browser through Supabase Realtime.

The connection indicator shows **Live connection**, **Demo mode** or **Offline · demo data**.

## Database schema

`hotels`, `profiles` (role: tourist, hotel, operations or admin), `drivers`, `journeys`, `journey_updates`, `incidents`, `incident_notes`, `scam_reports`, `notifications`. The schema includes foreign keys, CHECK constraints on every status column, unique references and tokens, indexes on hot filters, and `updated_at` triggers. See `supabase/migrations/20261123000001_schema.sql`.

Extra columns beyond the brief: `journeys.verification_code`, `route_progress`, `destination_area`, `fare_min/max`, `estimated_duration_min`, `share_target`; `drivers.id_check_status`, `registration_check_status`; `incidents.resolution`; `notifications.journey_id`.

## Local setup

```bash
npm install
npm run dev          # http://localhost:5173 — runs in Demo Mode out of the box
npm run build        # production build to dist/
```

## Environment variables

Copy `.env.example` to `.env.local`:

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Project URL. Leave blank for Demo Mode. |
| `VITE_SUPABASE_ANON_KEY` | Anon (public) key only. **Never** the service-role key. |
| `VITE_REQUIRE_ADMIN_AUTH` | `true` to require a Supabase Auth login for `/hotel` and `/operations/*`. |

## Supabase configuration

1. Create a project at supabase.com.
2. Run the three files in `supabase/migrations/` in order, using the SQL editor or `supabase db push`. They create the schema, the RLS policies, the `get_shared_journey` RPC, the seed data, and `reset_demo()`.
3. Add the URL and anon key to `.env.local` (and to Vercel).
4. Optional: create staff users in Auth, add a matching row to `profiles` with a role, and set `VITE_REQUIRE_ADMIN_AUTH=true`.

The seed migration is generated from the same data the frontend uses. After editing `src/data/*`, run `npm run seed:generate`.

All three migrations and the production policy example were tested against PostgreSQL 16, with Supabase's `auth` schema and roles stubbed.

## Vercel deployment

1. Push the repo to GitHub, then in Vercel choose **Add New → Project** and import it. Vercel detects Vite: the build command is `npm run build` and the output folder is `dist`.
2. Add the environment variables, if you're using Supabase.
3. Deploy. `vercel.json` rewrites all paths to `index.html`, so deep links like `/journey/…` work.

## Demo mode

With no environment variables, the app loads realistic seed data: 8 drivers, 10 journeys, 5 hotels, 9 incidents, 15 scam reports and 10 notifications. Every interaction works locally, and a **Demo mode** badge is always visible. If Supabase is configured but can't be reached, the app falls back to demo data and shows **Offline**. Real and mock data are never mixed silently.

## 3-minute demo walkthrough

1. **Tourist lands:** open `/demo` and tap **Start WhatsApp Conversation**.
2. **Destination:** tap *Enter accommodation*, then *The Rockefeller Hotel*. The fare is R280–R350 (estimate R310), with a breakdown.
3. **Verified driver:** tap *Request verified driver*. Thabo Mokoena, White Toyota Corolla, CA 123-456, plus the code. Then tap *Confirm driver details*.
4. **Hotel notified:** tap *Share with hotel* (journey CPT-2026-00421). Open **Hotel** in the presenter bar: the guest appears with notifications.
5. **Monitoring:** tap ▶ *Driver confirmed*, then *Pickup completed*, then *On route* (the vehicle moves on the map), then *Arrived*.
6. **Safe arrival:** tap *Yes, I arrived safely*. The hotel shows Completed / Safe arrival confirmed.

**Incident flow:** Reset Demo, run through to the trip stage, then tap *I need help* and pick a category. A dynamic case number (e.g. CPT-4793) appears in Operations › Incidents, and the hotel shows a safety alert.

## Security

What's implemented:

- Only the anon key is used in the frontend. No secrets are hardcoded.
- RLS is enabled on every table.
- Public tracking uses random share tokens and a `security definer` RPC that returns only safe fields. It never returns phone numbers, verification codes or incident text.
- Hotel and operations views mask the verification code behind a confirmed "reveal".
- No driver documents are stored, only simulated check outcomes.
- Inputs are validated client-side (length limits, required fields) and by database CHECK constraints.
- Optional Supabase Auth gate for the dashboards.

**Before production, you must:**

1. **Drop every `demo_*` policy and `reset_demo()`.** They give the anon role read and write access so the demo works without logins. Anyone with the anon key could read verification codes. Then apply `supabase/policies.production.example.sql`, which is role-based: hotel staff see only journeys shared with their hotel, and operations staff manage everything.
2. Move tourist writes behind the WhatsApp webhook (a server-side function using the service-role key), so tourists never write to tables directly.
3. Turn on `VITE_REQUIRE_ADMIN_AUTH`, add MFA for staff, and audit-log code reveals and incident changes.
4. Add rate limiting and abuse protection to public inserts (scam reports, incidents).
5. Complete a POPIA assessment covering lawful basis, retention, and data-subject rights.

## Future integrations (not implemented — simulated today)

- WhatsApp Business Cloud API (real conversations; QR codes become `wa.me` links)
- Official transport provider APIs (bookings and live fares)
- Hotel PMS, email and SMS notification integrations
- Verified driver registration partnerships, plus identity verification services
- Real-time GPS from consented driver devices
- Emergency-service and tourism/law-enforcement incident reporting
- Live fare estimates

## Screenshots

_Add screenshots of `/demo`, `/hotel` and `/operations` here before submission._
