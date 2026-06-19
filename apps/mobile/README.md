# @travela/mobile — Expo (React Native) app

Phase-7 scaffold of the Travela Stay Platform mobile client. Consumes
[`@travela/shared`](../../packages/shared) for the design tokens, zod schemas/DTOs,
enum unions, and the typed Supabase client — so web and mobile share **one** contract.

## What's here

```
app/
  _layout.tsx              root Stack (SafeAreaProvider + brand status bar)
  (tabs)/
    _layout.tsx            bottom-nav: Explore / Booking / Inbox / Alerts / Profile
    index.tsx              Explore  — listings list (shared ListingCardDTO)
    booking.tsx            Booking  — lifecycle from shared BOOKING_STATUSES
    inbox.tsx              Inbox    — conversations (empty state)
    alerts.tsx             Alerts   — notifications (empty state)
    profile.tsx            Profile  — sign-in entry (shared UserRole)
src/
  lib/
    env.ts                 fail-fast zod validation of EXPO_PUBLIC_* at boot
    supabase.ts            the app's single Supabase seam (shared createAnonClient)
    money.ts               BDT (৳) formatting for the device
  theme/theme.ts           native bridge to @travela/shared design tokens (no raw hex)
  components/
    ScreenScaffold.tsx     shared screen shell (cream surface, display H1)
    ListingCard.tsx        listing card primitive (design.md §4.2), seven states
    TabBarIcon.tsx         bottom-nav glyphs (active = filled, not color-only)
```

## Design discipline

- **Tokens only.** React Native can't use the Tailwind class names, so `theme.ts`
  re-exports the **semantic** token layer from `@travela/shared`. Components reference
  `theme.color.*` / `theme.space.*` — never a raw hex, never a primitive
  (`design.md` §2.2 / §7).
- **Seven states.** Interactive components (`ListingCard`, the Profile CTA) document
  and implement default / hover (web parity) / focus / active / disabled / loading /
  error per `design.md` §3, and expose state via `accessibilityRole` /
  `accessibilityState` / `aria`-equivalents.
- **44px targets.** Tab items and primary buttons meet the ≥44px minimum.

## Architecture (one-way dependency rule)

Screens/components never import Supabase. `src/lib/supabase.ts` is the only seam
(the mobile equivalent of a `*.repository.ts`), built on the shared `createAnonClient`
factory. Live data fetching is added per phase through feature repositories/services;
the current screens render typed placeholders that conform to the shared DTOs, so
swapping in real responses is a drop-in.

## Running (when network/install is available)

```bash
cp .env.example .env   # fill EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY
pnpm install           # from the monorepo root
pnpm --filter @travela/mobile start
```

> The service-role key is **never** bundled into the device app — only the RLS-guarded
> anon key ships to mobile.
