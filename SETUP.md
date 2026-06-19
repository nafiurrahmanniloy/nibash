# SETUP.md — bringing the stay platform up locally

Phase 0 foundations + the Phase 1 read-only marketplace surface are scaffolded. This is a
source tree only — no dependencies are installed and nothing has been run (it was scaffolded
offline). Follow these steps to make it live.

## Prerequisites
- Node 20 (`.nvmrc`) and pnpm 9+ (`corepack enable && corepack prepare pnpm@9.12.3 --activate`)
- A Supabase project (cloud or local via the Supabase CLI)

## 1. Install
```bash
pnpm install            # installs the whole workspace (web, mobile, shared)
```

## 2. Configure env
```bash
cp .env.example apps/web/.env.local      # fill in real values
cp apps/mobile/.env.example apps/mobile/.env
```
`apps/web/src/lib/env.ts` validates these at boot and **fails fast** if any required var is
missing — so a misconfigured deploy crashes loudly at startup, not mid-request. Required for the
web app to start: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`,
`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `SUPABASE_SERVICE_ROLE`, `SSLCOMMERZ_STORE_ID`,
`SSLCOMMERZ_STORE_PASSWORD`. Email/FCM are optional until their phases.

## 3. Database
Apply migrations then seed (psql or the Supabase CLI):
```bash
# migrations/  (run in order)
#   0001_schema.sql               tables, enums, indexes, btree_gist
#   0002_constraints_triggers.sql double-booking EXCLUDE constraint + updated_at + status-history triggers
#   0003_rls.sql                  RLS enabled on all 16 tables, 41 policies
# seed/seed.sql                   amenities, collections, demo listings + images
supabase db reset      # if using the local CLI (applies migrations + seed)
```
Confirm RLS is on and the `bookings` exclusion constraint exists before exposing the app.

## 4. Run
```bash
pnpm dev               # turbo runs apps/web (and mobile if you target it)
```

## 5. Verify the build (do this after install — it could not run offline)
```bash
pnpm -F web type-check     # tsc --noEmit across the web app
pnpm -F web lint
pnpm -F web build
```

---

## What works now vs deferred

**Working (code-complete, needs only env + DB):**
- Monorepo (Turborepo/pnpm), `@travela/shared` contract package (tokens, zod schemas/DTOs, DB types).
- Design system: tokens compiled to a Tailwind preset + CSS vars; full UI primitive set with the
  7-state matrix and AA focus/aria rules.
- Guest discovery: home (hero search, category chips, collection bands, new arrivals), search +
  filters, listing detail (gallery, amenities, host card, booking widget).
- Auth: email + Google OAuth (Supabase), middleware route protection, OAuth callback.
- Booking state machine: the full guarded `transitionBooking` in `bookings.service.ts`, driven by
  the shared `BOOKING_TRANSITIONS` map; atomic confirm path via a repository RPC.
- Supabase schema + RLS + the double-booking exclusion constraint.
- Expo mobile shell with the Explore/Booking/Inbox/Alerts/Profile bottom-nav.

**Deferred / has a focused TODO (clearly marked in-code, layering already complete):**
- SSLCommerz gateway calls: `payments.service.ts` `createPaymentSession` (session creation) and
  `verifyIpnAuthenticity` (IPN validator call) are stubbed and **fail loudly** rather than fake a
  payment. The IPN route → service → bookings-state-machine path is fully wired.
- `confirm_booking` Postgres RPC backing `confirmBookingAtomic` (see `bookings.repository.ts`).
- Reviews (Phase 5), host wizard internals (Phase 3), messaging (Phase 4) — slots stubbed.
- `pnpm install` / `tsc` / `build` have **not** been run (offline scaffold) — run step 5 first.

## Where things live (2-minute map)
- Change a **booking rule** → `apps/web/src/features/bookings/bookings.service.ts`
- Change how data is **persisted** → the feature's `*.repository.ts` (only place Supabase is imported)
- Change a **token/color** → `design.md` + `packages/shared/src/tokens/`
- Change a **UI primitive** → `apps/web/src/components/ui/`
- Add a **feature** → new folder under `apps/web/src/features/<domain>/` (actions → service → repository → schema)

Read order for a newcomer: `BUILD-PLAN-stay-platform.md` → `design.md` → `ARCHITECTURE.md` → this file.
