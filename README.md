# Nibash — Short-Term Stay Booking Platform

A Nibash-style short-stay marketplace (request-to-book): guests discover and request
listings, hosts approve, guests pay via SSLCommerz, bookings confirm. Web first
(Next.js), then an Expo Android app, both sharing one typed contract.

This README orients a newcomer in ~2 minutes. **Read the three design docs in this order
before writing code:**

1. [`BUILD-PLAN-stay-platform.md`](./BUILD-PLAN-stay-platform.md) — _what_ to build and in
   what order (data model §3, booking state machine §4, payments §5, env §8, phased plan §7).
2. [`design.md`](./design.md) — the _tokens_: semantic colors, type/spacing scales, the
   mandatory 7-state component matrix, and WCAG 2.2 AA acceptance criteria.
3. [`ARCHITECTURE.md`](./ARCHITECTURE.md) — _where_ every file goes: the route → service →
   repository → model layering and the one-way dependency rule.

---

## Top-level layout

```
apps/
  web/        Next.js (App Router) — guest, host, and admin surfaces
  mobile/     Expo (React Native) Android app, consumes packages/shared
packages/
  shared/     @nibash/shared — TS types, zod schemas, Supabase client,
              API helpers, and the design tokens compiled from design.md
supabase/
  migrations/ SQL schema + RLS policies + the booking EXCLUDE constraint (§3)
  seed/       amenities, collections, demo listings
```

Root config (this folder): `package.json` (pnpm + turbo scripts), `pnpm-workspace.yaml`,
`turbo.json` (task graph), `tsconfig.base.json` (strict TS + `@nibash/shared` path),
`.env.example`, `.prettierrc`, `.nvmrc`.

## The layering rule (one-way, enforced in review)

```
route handler / server action  →  <domain>.service.ts  →  <domain>.repository.ts  →  models / DB
(THIN controller: validate          (business logic,        (the ONLY files that
 input with the zod schema,          framework-agnostic,     import Supabase —
 call ONE service fn, shape          no Supabase, no         .from()/.rpc() live here)
 the DTO response)                   table names)
```

Dependencies flow **down only**. Supabase is imported _only_ inside `*.repository.ts` and
`apps/web/src/lib/supabase/*`. Never return a raw DB row — map to a DTO from the feature's
zod schema. The booking state machine is **one** server-side function in
`features/bookings/bookings.service.ts`.

## Run it (after the apps exist)

Requires **Node 20** (`.nvmrc`) and **pnpm 9** (`corepack enable`).

```bash
corepack enable          # provisions the pinned pnpm
pnpm install             # install all workspaces
cp .env.example .env     # then fill in real values (see BUILD-PLAN §8)

pnpm dev                 # run all apps (turbo, persistent)
pnpm build               # build everything
pnpm lint                # lint all workspaces
pnpm type-check          # strict TS check across the monorepo
pnpm format              # prettier write
```

> Note: this repo root currently holds only configuration and the design docs. The
> `apps/`, `packages/`, and `supabase/` trees are built phase by phase per
> `BUILD-PLAN-stay-platform.md` §7. Hand Phase 0 first, verify, commit, then Phase 1.

## Where to add a feature

Each domain is one self-contained folder under `apps/web/src/features/<domain>/` with the
same four files: `actions.ts` (thin controllers / server actions), `<domain>.service.ts`
(logic), `<domain>.repository.ts` (the Supabase seam), `<domain>.schema.ts` (zod: input
validation **and** the response DTO), plus `components/`, `hooks/`, and an `index.ts`
barrel. UI primitives live in `apps/web/src/components/ui` and import no feature code.
Cross-platform types and schemas belong in `packages/shared` so web and mobile share one
contract. See `ARCHITECTURE.md` §2–§3 for the full tree and the "to change X, open Y" map.
