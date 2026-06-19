-- ============================================================================
-- 0001_schema.sql — Core schema for the Travela Stay Platform (BUILD-PLAN §3)
-- ----------------------------------------------------------------------------
-- Translates the §3 data model into Postgres for Supabase:
--   * enums for every closed value set
--   * all tables with correct types, FKs, defaults, created_at/updated_at
--   * helpful indexes (slug unique, listing geo, bookings by listing/date,
--     messages by conversation, etc.)
--   * btree_gist extension so 0002 can add the double-booking EXCLUDE constraint
-- Constraints/triggers live in 0002; RLS lives in 0003.
-- Idempotent-friendly: extensions + enums guarded; tables use IF NOT EXISTS.
-- ============================================================================

-- ── Extensions ──────────────────────────────────────────────────────────────
-- pgcrypto: gen_random_uuid() for primary keys.
-- btree_gist: lets a gist EXCLUDE constraint mix equality (listing_id) with
--             range overlap (daterange) — required for double-booking guard.
create extension if not exists pgcrypto with schema extensions;
create extension if not exists btree_gist with schema extensions;

-- ── Enums (closed value sets from §3) ───────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('guest', 'host', 'admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'place_type') then
    create type public.place_type as enum ('entire', 'private', 'shared');
  end if;

  if not exists (select 1 from pg_type where typname = 'listing_category') then
    create type public.listing_category as enum
      ('apartment', 'room', 'hotel', 'resort', 'villa', 'studio');
  end if;

  if not exists (select 1 from pg_type where typname = 'listing_status') then
    create type public.listing_status as enum
      ('draft', 'pending', 'published', 'suspended');
  end if;

  -- Booking state machine (BUILD-PLAN §4).
  if not exists (select 1 from pg_type where typname = 'booking_status') then
    create type public.booking_status as enum
      ('requested', 'approved', 'payment_pending', 'confirmed',
       'completed', 'declined', 'cancelled');
  end if;

  -- Payment lifecycle (BUILD-PLAN §3 payments).
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum
      ('initiated', 'success', 'failed', 'refunded');
  end if;

  -- Why a date range is unavailable.
  if not exists (select 1 from pg_type where typname = 'availability_reason') then
    create type public.availability_reason as enum ('booked', 'manual');
  end if;

  -- Generic content status reused by blog_posts.
  if not exists (select 1 from pg_type where typname = 'content_status') then
    create type public.content_status as enum ('draft', 'published', 'archived');
  end if;
end
$$;

-- ============================================================================
-- profiles — 1:1 with auth.users. The app's user record.
-- ============================================================================
create table if not exists public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  full_name         text,
  avatar_url        text,
  phone             text,
  role              public.user_role not null default 'guest',
  languages         text[] not null default array['en']::text[],
  identity_verified boolean not null default false,
  bio               text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.profiles is
  '1:1 with auth.users; application-level user record (role, contact, verification).';

create index if not exists profiles_role_idx on public.profiles (role);

-- ============================================================================
-- listings — the rentable stays.
-- ============================================================================
create table if not exists public.listings (
  id            uuid primary key default gen_random_uuid(),
  host_id       uuid not null references public.profiles (id) on delete cascade,
  title         text not null,
  slug          text not null,
  description   text,
  place_type    public.place_type not null,
  category      public.listing_category not null,
  status        public.listing_status not null default 'draft',
  division      text not null,
  district      text not null,
  area          text,
  address       text,
  lat           double precision,
  lng           double precision,
  max_guests    integer not null default 1 check (max_guests > 0),
  bedrooms      integer not null default 0 check (bedrooms >= 0),
  beds          integer not null default 1 check (beds >= 0),
  baths         numeric(3, 1) not null default 1 check (baths >= 0),
  price_per_day numeric(12, 2) not null check (price_per_day >= 0),  -- BDT
  min_nights    integer not null default 1 check (min_nights >= 1),
  rules         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.listings is 'Rentable stays; price_per_day is BDT.';

-- Slug must be globally unique (used as the public URL key).
create unique index if not exists listings_slug_key on public.listings (slug);
create index if not exists listings_host_idx on public.listings (host_id);
create index if not exists listings_status_idx on public.listings (status);
-- Geo lookups (map bounds, nearby) — composite covers lat/lng range scans.
create index if not exists listings_geo_idx on public.listings (lat, lng);
-- Common discovery filters.
create index if not exists listings_location_idx
  on public.listings (division, district);
create index if not exists listings_category_idx on public.listings (category);

-- ============================================================================
-- listing_images — gallery, ordered, one cover.
-- ============================================================================
create table if not exists public.listing_images (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  url        text not null,
  sort_order integer not null default 0,
  is_cover   boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.listing_images is 'Ordered gallery images per listing.';

create index if not exists listing_images_listing_idx
  on public.listing_images (listing_id, sort_order);
-- At most one cover per listing.
create unique index if not exists listing_images_one_cover_idx
  on public.listing_images (listing_id) where (is_cover);

-- ============================================================================
-- amenities — master list (wifi, ac, kitchen…).
-- ============================================================================
create table if not exists public.amenities (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null,
  icon_url   text,
  category   text,
  created_at timestamptz not null default now()
);

comment on table public.amenities is 'Master amenity catalogue.';

create unique index if not exists amenities_slug_key on public.amenities (slug);

-- ============================================================================
-- listing_amenities — M:N join (composite PK).
-- ============================================================================
create table if not exists public.listing_amenities (
  listing_id uuid not null references public.listings (id) on delete cascade,
  amenity_id uuid not null references public.amenities (id) on delete cascade,
  primary key (listing_id, amenity_id)
);

comment on table public.listing_amenities is 'Listing↔amenity join.';

create index if not exists listing_amenities_amenity_idx
  on public.listing_amenities (amenity_id);

-- ============================================================================
-- collections — curated bands (New Arrivals, Party Stays, city bands…).
-- ============================================================================
create table if not exists public.collections (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null,
  description text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.collections is 'Curated homepage bands of listings.';

create unique index if not exists collections_slug_key on public.collections (slug);
create index if not exists collections_sort_idx on public.collections (sort_order);

-- ============================================================================
-- listing_collections — M:N join with per-collection ordering.
-- ============================================================================
create table if not exists public.listing_collections (
  collection_id uuid not null references public.collections (id) on delete cascade,
  listing_id    uuid not null references public.listings (id) on delete cascade,
  sort_order    integer not null default 0,
  primary key (collection_id, listing_id)
);

comment on table public.listing_collections is 'Collection↔listing join, ordered.';

create index if not exists listing_collections_listing_idx
  on public.listing_collections (listing_id);
create index if not exists listing_collections_order_idx
  on public.listing_collections (collection_id, sort_order);

-- ============================================================================
-- availability_blocks — date ranges a listing is unavailable.
--   reason='booked' is written by the system on confirm; 'manual' by the host.
-- ============================================================================
create table if not exists public.availability_blocks (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  start_date date not null,
  end_date   date not null,
  reason     public.availability_reason not null default 'manual',
  booking_id uuid,  -- FK added in 0002 after bookings exists (avoids cycle)
  created_at timestamptz not null default now(),
  constraint availability_blocks_range_chk check (end_date > start_date)
);

comment on table public.availability_blocks is
  'Unavailable date ranges per listing (half-open [start,end)).';

create index if not exists availability_blocks_listing_idx
  on public.availability_blocks (listing_id, start_date, end_date);

-- ============================================================================
-- bookings — the booking request and its lifecycle.
-- ============================================================================
create table if not exists public.bookings (
  id              uuid primary key default gen_random_uuid(),
  listing_id      uuid not null references public.listings (id) on delete restrict,
  guest_id        uuid not null references public.profiles (id) on delete restrict,
  host_id         uuid not null references public.profiles (id) on delete restrict,
  check_in        date not null,
  check_out       date not null,
  guests          integer not null default 1 check (guests > 0),
  nights          integer not null check (nights > 0),
  base_amount     numeric(12, 2) not null check (base_amount >= 0),   -- BDT
  service_fee     numeric(12, 2) not null default 0 check (service_fee >= 0),
  total_amount    numeric(12, 2) not null check (total_amount >= 0),
  status          public.booking_status not null default 'requested',
  special_request text,
  payment_id      uuid,  -- FK added in 0002 after payments exists (avoids cycle)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint bookings_date_order_chk check (check_out > check_in)
);

comment on table public.bookings is
  'Booking requests + lifecycle; amounts in BDT. Double-booking guard in 0002.';

create index if not exists bookings_listing_dates_idx
  on public.bookings (listing_id, check_in, check_out);
create index if not exists bookings_guest_idx on public.bookings (guest_id);
create index if not exists bookings_host_idx on public.bookings (host_id);
create index if not exists bookings_status_idx on public.bookings (status);

-- ============================================================================
-- booking_status_history — append-only audit of every transition (§4).
-- ============================================================================
create table if not exists public.booking_status_history (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  from_status public.booking_status,
  to_status  public.booking_status not null,
  actor_id   uuid references public.profiles (id) on delete set null,
  note       text,
  created_at timestamptz not null default now()
);

comment on table public.booking_status_history is
  'Append-only audit; one row per booking status transition.';

create index if not exists booking_status_history_booking_idx
  on public.booking_status_history (booking_id, created_at);

-- ============================================================================
-- conversations — a guest↔host thread, optionally tied to a booking.
-- ============================================================================
create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  listing_id      uuid references public.listings (id) on delete set null,
  guest_id        uuid not null references public.profiles (id) on delete cascade,
  host_id         uuid not null references public.profiles (id) on delete cascade,
  booking_id      uuid references public.bookings (id) on delete set null,
  last_message_at timestamptz,
  created_at      timestamptz not null default now()
);

comment on table public.conversations is 'Guest↔host message thread.';

-- One thread per (listing, guest, host) trio.
create unique index if not exists conversations_unique_idx
  on public.conversations (listing_id, guest_id, host_id);
create index if not exists conversations_guest_idx on public.conversations (guest_id);
create index if not exists conversations_host_idx on public.conversations (host_id);
create index if not exists conversations_recent_idx
  on public.conversations (last_message_at desc nulls last);

-- ============================================================================
-- messages — individual chat messages.
-- ============================================================================
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null references public.profiles (id) on delete cascade,
  body            text not null,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

comment on table public.messages is 'Chat messages within a conversation.';

create index if not exists messages_conversation_idx
  on public.messages (conversation_id, created_at);
create index if not exists messages_sender_idx on public.messages (sender_id);

-- ============================================================================
-- reviews — one per completed booking.
-- ============================================================================
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references public.bookings (id) on delete cascade,
  listing_id  uuid not null references public.listings (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.reviews is 'Guest review of a completed booking (1–5).';

-- One review per booking.
create unique index if not exists reviews_booking_key on public.reviews (booking_id);
create index if not exists reviews_listing_idx on public.reviews (listing_id);

-- ============================================================================
-- payments — gateway transactions (SSLCommerz).
-- ============================================================================
create table if not exists public.payments (
  id             uuid primary key default gen_random_uuid(),
  booking_id     uuid not null references public.bookings (id) on delete cascade,
  gateway        text not null default 'sslcommerz',
  gateway_txn_id text,
  amount         numeric(12, 2) not null check (amount >= 0),  -- BDT
  status         public.payment_status not null default 'initiated',
  raw_payload    jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.payments is 'Gateway transactions; raw_payload keeps IPN body.';

create index if not exists payments_booking_idx on public.payments (booking_id);
create unique index if not exists payments_txn_key
  on public.payments (gateway, gateway_txn_id)
  where (gateway_txn_id is not null);

-- ============================================================================
-- notifications — in-app notification feed.
-- ============================================================================
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text,
  data       jsonb not null default '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.notifications is 'Per-user in-app notification feed.';

create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);
-- Fast unread badge count.
create index if not exists notifications_unread_idx
  on public.notifications (user_id) where (read_at is null);

-- ============================================================================
-- blog_posts — marketing CMS content.
-- ============================================================================
create table if not exists public.blog_posts (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  slug         text not null,
  excerpt      text,
  body         text,
  cover_url    text,
  category     text,
  author       text,
  read_minutes integer not null default 1 check (read_minutes >= 0),
  status       public.content_status not null default 'draft',
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.blog_posts is 'Marketing blog content (CMS).';

create unique index if not exists blog_posts_slug_key on public.blog_posts (slug);
create index if not exists blog_posts_published_idx
  on public.blog_posts (status, published_at desc);
