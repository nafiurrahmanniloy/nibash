# Build Plan — Short-Term Stay Booking Platform (Nibash-style)
### Claude Code execution spec · Web + Android

This is the master plan to hand to Claude Code. Build **phase by phase** — give Claude Code one phase at a time, verify the acceptance criteria, commit, then move on. Don't paste the whole file as one prompt.

---

## 0. Principles

- **Functional clone, original assets.** Replicate features/UX from Nibash; generate original copy, use the client's brand and the client's real listings. Reference only — never ship scraped content, photos, or brand.
- **MVP-first, Android-first.** Ship a usable web product, then full web, then the app. iOS later.
- **Request-to-book** model (guest requests → host approves → pay → confirmed).
- **One gateway for v1:** SSLCommerz (covers cards + bKash + Nagad + bank).
- **Locale:** English UI v1, BDT currency, `Asia/Dhaka` timezone. Bangla is a later add-on.

---

## 1. Tech stack (final)

| Layer | Choice |
|---|---|
| Monorepo | Turborepo (pnpm) — `apps/web`, `apps/mobile`, `packages/shared` |
| Web | Next.js (App Router), TypeScript, Tailwind |
| Backend / DB | Supabase — Postgres, Auth, Storage, Realtime, Row Level Security |
| Mobile | Expo (React Native), shares `packages/shared` |
| Payments | SSLCommerz (server-initiated session + IPN callback) |
| Maps | Google Maps (Static Maps for listing cards, JS map on detail) |
| Email | Resend (or SMTP from client) |
| Push | Expo Push / FCM |
| Hosting | Web on Vercel or VPS; Supabase cloud |

**Repo structure**
```
apps/
  web/        Next.js app (guest, host, admin)
  mobile/     Expo app
packages/
  shared/     TS types, zod schemas, supabase client, API helpers, design tokens
supabase/
  migrations/ SQL schema + RLS policies
  seed/       amenities, collections, demo listings
```

---

## 2. Design system (`design.md` baseline — original, from the demo)

Use these tokens instead of copying Nibash's visual identity. Swap the palette later for the client's brand.

```
--bg:#F6F4EF  --ink:#16201C  --primary:#0E5C4A  --primary-d:#0A4537
--accent:#E8902B  --card:#FFFFFF  --muted:#6B7A72  --line:#E4E0D7
radius: 18px cards / 999px pills      shadow: soft, low-opacity green-tinted
Display font: Bricolage Grotesque (used with restraint)   Body: Inter
```
Signature elements: the booking widget, the listing card with BDT price + rating, the app bottom-nav (Explore / Booking / Inbox / Alerts / Profile).

---

## 3. Data model (Postgres / Supabase)

Core tables and key fields. Full SQL is Phase 0's job; this is the contract.

| Table | Key fields |
|---|---|
| `profiles` (1:1 auth.users) | full_name, avatar_url, phone, role `guest\|host\|admin`, languages[], identity_verified, bio |
| `listings` | host_id, title, slug, description, place_type `entire\|private\|shared`, category `apartment\|room\|hotel\|resort\|villa\|studio`, status `draft\|pending\|published\|suspended`, division, district, area, address, lat, lng, max_guests, bedrooms, beds, baths, price_per_day, min_nights, rules |
| `listing_images` | listing_id, url, sort_order, is_cover |
| `amenities` | name, icon_url, category |
| `listing_amenities` | listing_id, amenity_id (composite PK) |
| `collections` | name, slug, description, sort_order *(New Arrivals, Party Stays, city bands…)* |
| `listing_collections` | collection_id, listing_id, sort_order |
| `availability_blocks` | listing_id, start_date, end_date, reason `booked\|manual` |
| `bookings` | listing_id, guest_id, host_id, check_in, check_out, guests, nights, base_amount, service_fee, total_amount, status, special_request, payment_id |
| `booking_status_history` | booking_id, from_status, to_status, actor_id, note |
| `conversations` | listing_id, guest_id, host_id, booking_id?, last_message_at |
| `messages` | conversation_id, sender_id, body, read_at |
| `reviews` | booking_id, listing_id, reviewer_id, rating 1–5, comment |
| `payments` | booking_id, gateway, gateway_txn_id, amount, status `initiated\|success\|failed\|refunded`, raw_payload |
| `notifications` | user_id, type, title, body, data(jsonb), read_at |
| `blog_posts` | title, slug, excerpt, body, cover_url, category, author, read_minutes, status, published_at |

**Double-booking prevention (do this at the DB level, not just app logic):**
add a Postgres exclusion constraint so two overlapping confirmed bookings for the same listing can't exist:
```sql
-- on bookings, for status in ('confirmed')
EXCLUDE USING gist (
  listing_id WITH =,
  daterange(check_in, check_out, '[)') WITH &&
) WHERE (status = 'confirmed');
```
Availability check = no overlapping `availability_blocks` AND no overlapping confirmed booking for the requested range.

**RLS:** guests see their own bookings/messages; hosts see bookings/messages for their listings; admins see all; published listings are public-read.

---

## 4. Booking state machine (the core logic — get this right)

```
requested ──host approve──> approved ──> payment_pending ──pay ok──> confirmed ──after checkout──> completed
   │                           │                              │
   └──host decline──> declined └──> (timeout/expire) cancelled└──pay fail──> cancelled
confirmed ──cancel (per policy)──> cancelled
```
- On **confirmed**: write an `availability_blocks` row for the range, notify guest + host.
- Every transition writes a `booking_status_history` row.
- Block invalid transitions in a single server-side function, not scattered across UI.

---

## 5. Payments — SSLCommerz flow

1. Guest confirms an approved booking → server creates a payment session (amount, unique txn id, success/fail/cancel + IPN URLs) → redirect to gateway.
2. Gateway calls **IPN/callback** → server validates, marks `payments.status=success`, transitions booking to `confirmed`, writes availability block, fires notifications.
3. Build and test on **sandbox** first; swap to production store credentials (client-provided) at the end.
4. Buffer a few days for production approval, IP whitelisting, and callback-URL setup — don't promise instant.

---

## 6. Surfaces & feature spec

**Guest web:** home (hero search, category chips, curated collections, new arrivals grid), search results with filters (location, dates, guests, price, type), listing detail (gallery, amenities, calendar, host card, map, reviews, booking widget), auth, profile, bookings list, blog, legal pages.

**Host tools:** become-a-host onboarding, create/edit listing wizard (details → photos upload → amenities → pricing → availability), manage availability calendar, incoming requests (approve/decline), host dashboard (upcoming stays, earnings view).

**Admin:** moderate listings/users/bookings, manage collections, payouts/commission tracking, disputes, blog CMS, reporting.

**Android app (Expo):** Explore/search, listing detail, booking flow, Inbox (realtime), Notifications (push), Profile — bottom-nav UX mirroring the web.

---

## 7. Phased build sequence (give Claude Code one block at a time)

Each phase lists a **prompt seed** and **acceptance criteria**. Commit after each.

### Phase 0 — Foundations
> *Prompt seed:* "Set up a Turborepo (pnpm) with `apps/web` (Next.js App Router + TS + Tailwind) and `packages/shared`. Initialise Supabase, write migrations for all tables in the data model spec with RLS policies and the booking exclusion constraint. Build the design-token system from `design.md`, the app shell (nav + footer), and Supabase auth (email + Google)."
> **Done when:** schema migrates cleanly, RLS on, auth works, design tokens applied, app shell renders.

### Phase 1 — Guest discovery (read-only marketplace)
> *Prompt seed:* "Seed amenities, collections, and demo listings. Build home (hero search, category chips, curated collection bands, new-arrivals grid), search results with filters, and listing detail (gallery, amenities, availability calendar display, host card, static map, reviews section). Add blog list/detail and legal pages. SEO metadata + sitemaps."
> **Done when:** a visitor can browse, filter, and open any listing; SEO tags present.

### Phase 2 — Booking flow
> *Prompt seed:* "Implement the booking state machine as server actions. Guest selects dates+guests → creates a `requested` booking with availability validation. Host approve/decline. On approve, guest pays via SSLCommerz (sandbox) → IPN confirms → booking `confirmed`, availability block written, emails sent."
> **Done when:** a full request→approve→pay→confirm cycle works on sandbox; no double-booking possible.

### Phase 3 — Host tools
> *Prompt seed:* "Build host onboarding and the create/edit listing wizard with image upload to Supabase Storage, availability management, incoming-request management, and a host dashboard."
> **Done when:** a host can publish a real listing and manage its bookings end-to-end.

### Phase 4 — Messaging + notifications
> *Prompt seed:* "Add conversations/messages using Supabase Realtime (guest↔host, optionally tied to a booking), plus in-app + email notifications for all booking events."
> **Done when:** real-time chat works and key events notify both parties.

### Phase 5 — Reviews
> *Prompt seed:* "Allow a guest to review a completed booking (rating + comment); show aggregate rating on listings and host profiles."

### Phase 6 — Admin panel
> *Prompt seed:* "Build an admin area: moderate listings/users/bookings, manage collections, track commission/payouts, and a blog CMS."

### Phase 7 — Android app (Expo)
> *Prompt seed:* "Build `apps/mobile` in Expo consuming `packages/shared`. Screens: Explore/search, listing detail, booking, Inbox (realtime), Notifications (push via FCM/Expo), Profile, with the bottom-nav UX. Configure an Android build and Play Store submission."
> **Done when:** signed Android build runs the core flows and is ready for Play Console.

### Phase 8 — Hardening & launch
Production SSLCommerz creds, security pass, performance/SEO, error/empty states, then iOS build and optional extra payment methods.

---

## 8. Client-provided config (env / secrets)

Have the client supply before the relevant phase; timeline pauses without them:
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE`, `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `GOOGLE_MAPS_API_KEY`, email/SMTP or `RESEND_API_KEY`, FCM credentials, Play Console account, domain. Brand assets and real listing content also client-supplied.

---

## 9. Decisions to confirm with the client

1. Instant-book ever, or request-to-book only? (Plan assumes request-only for v1.)
2. Commission model + host payout method?
3. Bangla localisation in scope, or English-only v1?
4. Identity verification: manual admin review v1, or a KYC provider?
5. Cancellation/refund policy rules (drives the state machine edges)?

---

*Hand Phase 0 to Claude Code first. Verify, commit, then Phase 1. Keep the client's real brand and listings as the content layer — the code is yours, the look is original, the product is theirs.*
