/**
 * database.ts — DB row types for every table in BUILD-PLAN §3 data model.
 *
 * These mirror the Postgres/Supabase schema 1:1 (snake_case columns, nullable
 * where the column is nullable). They are INTERNAL: repositories read these rows
 * and map them to the public zod DTOs before anything reaches a client. Never
 * return one of these row types directly to the web/mobile layer.
 *
 * `supabase/database.types.ts` derives the supabase-js `Database` generic from
 * these so the client is fully typed.
 */

/* ────────────────────────────────────────────────────────────────────────────
 * Enum string-literal unions (BUILD-PLAN §3)
 * ────────────────────────────────────────────────────────────────────────── */

/** profiles.role */
export type UserRole = 'guest' | 'host' | 'admin';

/** listings.place_type */
export type PlaceType = 'entire' | 'private' | 'shared';

/** listings.category */
export type ListingCategory =
  | 'apartment'
  | 'room'
  | 'hotel'
  | 'resort'
  | 'villa'
  | 'studio';

/** listings.status */
export type ListingStatus = 'draft' | 'pending' | 'published' | 'suspended';

/** bookings.status — the booking state machine (BUILD-PLAN §4) */
export type BookingStatus =
  | 'requested'
  | 'approved'
  | 'payment_pending'
  | 'confirmed'
  | 'completed'
  | 'declined'
  | 'cancelled';

/** payments.status */
export type PaymentStatus = 'initiated' | 'success' | 'failed' | 'refunded';

/** availability_blocks.reason */
export type AvailabilityReason = 'booked' | 'manual';

/** blog_posts.status (and reused listing-style publish lifecycle for content) */
export type ContentStatus = 'draft' | 'published';

/** Shared helpers — timestamps are ISO-8601 strings as returned by PostgREST. */
export type Timestamp = string;
export type UUID = string;
/** A bare calendar date `YYYY-MM-DD` (check_in/check_out, availability ranges). */
export type DateString = string;
/** Arbitrary JSON payload (jsonb columns). */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/* ────────────────────────────────────────────────────────────────────────────
 * Table row types
 * ────────────────────────────────────────────────────────────────────────── */

/** profiles — 1:1 with auth.users */
export interface Profile {
  id: UUID; // = auth.users.id
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  languages: string[] | null;
  identity_verified: boolean;
  bio: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Listing {
  id: UUID;
  host_id: UUID;
  title: string;
  slug: string;
  description: string | null;
  place_type: PlaceType;
  category: ListingCategory;
  status: ListingStatus;
  division: string | null;
  district: string | null;
  area: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  max_guests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  price_per_day: number; // BDT, integer minor-unit-free (whole taka)
  min_nights: number;
  rules: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ListingImage {
  id: UUID;
  listing_id: UUID;
  url: string;
  sort_order: number;
  is_cover: boolean;
  created_at: Timestamp;
}

export interface Amenity {
  id: UUID;
  name: string;
  icon_url: string | null;
  category: string | null;
}

/** listing_amenities — composite PK (listing_id, amenity_id) */
export interface ListingAmenity {
  listing_id: UUID;
  amenity_id: UUID;
}

export interface Collection {
  id: UUID;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  created_at: Timestamp;
}

/** listing_collections — composite PK (collection_id, listing_id) */
export interface ListingCollection {
  collection_id: UUID;
  listing_id: UUID;
  sort_order: number;
}

export interface AvailabilityBlock {
  id: UUID;
  listing_id: UUID;
  start_date: DateString;
  end_date: DateString;
  reason: AvailabilityReason;
  created_at: Timestamp;
}

export interface Booking {
  id: UUID;
  listing_id: UUID;
  guest_id: UUID;
  host_id: UUID;
  check_in: DateString;
  check_out: DateString;
  guests: number;
  nights: number;
  base_amount: number; // price_per_day * nights (BDT)
  service_fee: number; // BDT
  total_amount: number; // base_amount + service_fee (BDT)
  status: BookingStatus;
  special_request: string | null;
  payment_id: UUID | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface BookingStatusHistory {
  id: UUID;
  booking_id: UUID;
  from_status: BookingStatus | null; // null for the initial `requested` insert
  to_status: BookingStatus;
  actor_id: UUID | null; // null for system transitions (timeout/IPN)
  note: string | null;
  created_at: Timestamp;
}

export interface Conversation {
  id: UUID;
  listing_id: UUID;
  guest_id: UUID;
  host_id: UUID;
  booking_id: UUID | null;
  last_message_at: Timestamp | null;
  created_at: Timestamp;
}

export interface Message {
  id: UUID;
  conversation_id: UUID;
  sender_id: UUID;
  body: string;
  read_at: Timestamp | null;
  created_at: Timestamp;
}

export interface Review {
  id: UUID;
  booking_id: UUID;
  listing_id: UUID;
  reviewer_id: UUID;
  rating: number; // 1–5
  comment: string | null;
  created_at: Timestamp;
}

export interface Payment {
  id: UUID;
  booking_id: UUID;
  gateway: string; // e.g. "sslcommerz"
  gateway_txn_id: string | null;
  amount: number; // BDT
  status: PaymentStatus;
  raw_payload: Json | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Notification {
  id: UUID;
  user_id: UUID;
  type: string;
  title: string;
  body: string | null;
  data: Json | null;
  read_at: Timestamp | null;
  created_at: Timestamp;
}

export interface BlogPost {
  id: UUID;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  cover_url: string | null;
  category: string | null;
  author: string | null;
  read_minutes: number | null;
  status: ContentStatus;
  published_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}
