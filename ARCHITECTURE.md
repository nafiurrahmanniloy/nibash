# ARCHITECTURE.md — Stay Platform

> **File-level layering contract.** The build plan (`BUILD-PLAN-stay-platform.md`) defines *what*
> to build and in what order; `design.md` defines the *tokens*; this file defines *where every file
> goes* so a new developer can guess which single file to open to change any behavior — without grep.
>
> Stack: **Next.js App Router + TypeScript** (web) · **Supabase** (Postgres/Auth/Storage/Realtime,
> behind a repository seam) · **Expo** (mobile) · **Turborepo/pnpm** monorepo.
> Scale tier: **large/monorepo → feature-grouped, same layers, infra mandatory.**

---

## 1. The layers (universal invariant, mapped to this stack)

```
HTTP boundary            business logic         data access          shape
─────────────────        ──────────────         ───────────          ─────
app/api/*/route.ts   →   <domain>.service.ts →  <domain>.repository → models / DB
app/**/actions.ts        (no req/res,           (ONLY file that       (TS types +
(server actions)         no Supabase calls)     imports supabase)     zod schemas)
```

- **Route handler / server action = controller (thin).** Reads input, validates with the domain
  schema, calls **one** service function, shapes the response. Over ~15 lines of real logic → it's
  doing a service's job.
- **Service = business logic, framework-agnostic.** The booking state machine (build plan §4) lives
  here as a single server-side transition function. No `Request`/`Response`. No Supabase. Owns the
  transaction boundary for multi-step writes (booking confirm → availability block → notifications).
- **Repository = the only Supabase seam.** All `.from()`, `.rpc()`, RLS-aware queries live here.
  Swapping or mocking the DB touches these files only. A service must never see a table name.
- **Models/schemas = shape.** TS types + zod in `packages/shared` so web and mobile share one
  contract. Validation **and** the public DTO both come from the schema — never return the raw row.

Dependencies flow **down only**: route → controller(action) → service → repository → model.
A service never imports an action; a repository never knows about HTTP.

---

## 2. Folder tree

```
apps/
  web/
    app/
      (marketing)/        home, blog, legal            ← route groups + per-group layout.tsx
      (guest)/            search, listing detail, bookings, profile
      (host)/             onboarding, listing wizard, calendar, dashboard
      (admin)/            moderation, collections, payouts, blog CMS
      api/
        <feature>/route.ts   thin HTTP boundary (webhooks e.g. SSLCommerz IPN live here)
      layout.tsx  globals.css
    src/
      features/              ← feature-grouped; one folder per domain
        listings/  bookings/  search/  payments/  messaging/  reviews/  host/  admin/
          components/        feature UI (BookingWidget, ListingCard…)
          hooks/
          actions.ts         server actions = thin controllers
          <domain>.service.ts
          <domain>.repository.ts
          <domain>.schema.ts  zod: input validation + response DTO
          index.ts           barrel: the feature's public surface
      components/
        ui/                  dumb primitives (Button, Input, Chip) — never import feature code
        shared/              promoted only when a 2nd feature needs it
      lib/
        supabase/            browser + server clients (one place)
        env.ts               env loader, fail-fast validation at boot
        errors.ts            error types + one handler shape
        logger.ts            structured logger (no console.log in request paths)
        money.ts             BDT formatting (৳, Asia/Dhaka)
  mobile/                    Expo — consumes packages/shared; mirrors the feature layer
packages/
  shared/
    types/   schemas/        TS types + zod (single source for web + mobile)
    tokens/                  design.md compiled to TS/CSS variables
    api/                     cross-platform API helpers
supabase/
  migrations/                SQL schema, RLS policies, booking EXCLUDE constraint (build plan §3)
  seed/                      amenities, collections, demo listings
.env.example                 every required var listed (build plan §8)
```

---

## 3. Predictability table (the acceptance test)

| To change… | Open… |
|---|---|
| A booking transition rule (approve/decline/expire) | `features/bookings/bookings.service.ts` |
| How a booking is persisted / availability blocked | `features/bookings/bookings.repository.ts` |
| The SSLCommerz IPN handling | `app/api/payments/ipn/route.ts` → `payments.service.ts` |
| A field on a listing | `packages/shared/schemas` + `supabase/migrations` + `listings.repository.ts` |
| The price/colour of a button | `apps/web/src/components/ui/Button.tsx` + `design.md` tokens |
| The booking widget layout | `features/bookings/components/BookingWidget.tsx` |
| Which DB powers the app | only the `*.repository.ts` files |

If the answer to any "to change X" is "grep around," a layer has collapsed — fix the structure.

---

## 4. Infra that is mandatory at this tier (not optional)
- **Env-driven config, validated at boot** (`lib/env.ts`) — fail fast if a build-plan §8 var is missing.
- **One error handler shape + structured logging** — no repeated `try/catch → 500`, no `console.log`.
- **Schema validation at the boundary** (zod in `*.schema.ts`) before any controller logic.
- **DTO mapping at the boundary** — never return a raw Supabase row to the client.
- **Transactions owned by the service** for multi-write use-cases (confirm booking = booking +
  availability block + notification, all-or-nothing).
- **Tests** colocated per feature; at minimum the booking state machine has a starter test.

## 5. Deliberately deferred (state it, don't hide it)
- Background `jobs/` (booking-expiry timeout) — add when Phase 2 needs the timer; lives as
  `features/bookings/bookings.jobs.ts` calling the same service, not a new code path.
- Rate-limiting / caching layer — Phase 8 hardening.
- iOS target — post-Android.

---

*Read order for a newcomer: `BUILD-PLAN-stay-platform.md` (what & when) → `design.md` (tokens) →
this file (where). Then open `features/<domain>/` and follow the four files.*
