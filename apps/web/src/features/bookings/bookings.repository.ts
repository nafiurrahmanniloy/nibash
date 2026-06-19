/**
 * bookings.repository.ts — the ONLY bookings-feature Supabase seam.
 *
 * Persists bookings, status history, availability blocks; answers the overlap /
 * availability question (BUILD-PLAN §3). Explicit columns only; returns raw rows.
 * The service maps rows → DTOs and owns all transition rules.
 *
 * TRANSACTION BOUNDARY (BUILD-PLAN §4 "On confirmed"): the confirm step must write
 * the booking status update + availability block + status-history row atomically.
 * Postgres transactions cannot span multiple supabase-js calls, so that all-or-
 * nothing unit is exposed here as a SINGLE repository call — `confirmBookingAtomic`
 * — which the migrations back with a `confirm_booking` SQL function (RPC). The
 * service calls this one repo function and never sees the table writes; the service
 * is where the *decision* to confirm is made, the repo is where the atomic write
 * lives. (Until the SQL fn ships, see the documented fallback path below.)
 */
import type {
  AvailabilityBlock,
  Booking,
  BookingStatus,
  BookingStatusHistory,
  Listing,
} from '@travela/shared';
import { randomUUID } from 'node:crypto';
import { createServerSupabase } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { RepositoryError } from '@/lib/errors';
import { DEMO_MODE } from '@/lib/demo/flag';
import * as demo from '@/lib/demo/data';

/** Fixed timestamp helper for demo rows (no Date.now needed for correctness). */
const DEMO_TS = '2026-06-20T09:00:00.000Z';

const BOOKING_COLUMNS =
  'id, listing_id, guest_id, host_id, check_in, check_out, guests, nights, base_amount, service_fee, total_amount, status, special_request, payment_id, created_at, updated_at';

/** Pricing-relevant listing fields needed to price a booking request. */
export interface BookingListingPricing {
  id: string;
  host_id: string;
  status: Listing['status'];
  price_per_day: number;
  min_nights: number;
  max_guests: number;
}

/** Read the pricing/host fields for a listing (published only). */
export async function getListingForBooking(
  listingId: string,
): Promise<BookingListingPricing | null> {
  if (DEMO_MODE) return demo.demoListingForBooking(listingId);
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('listings')
    .select('id, host_id, status, price_per_day, min_nights, max_guests')
    .eq('id', listingId)
    .maybeSingle();
  if (error) throw new RepositoryError(error.message, { cause: error });
  return data;
}

/**
 * Is [checkIn, checkOut) free for this listing? Mirrors the DB-level rule:
 * no overlapping availability_blocks AND no overlapping confirmed booking.
 * Half-open overlap: existing.start < checkOut AND existing.end > checkIn.
 */
export async function checkOverlap(
  listingId: string,
  checkIn: string,
  checkOut: string,
): Promise<boolean> {
  if (DEMO_MODE) return false; // every demo listing is available
  const supabase = await createServerSupabase();

  const [blocks, bookings] = await Promise.all([
    supabase
      .from('availability_blocks')
      .select('id')
      .eq('listing_id', listingId)
      .lt('start_date', checkOut)
      .gt('end_date', checkIn)
      .limit(1),
    supabase
      .from('bookings')
      .select('id')
      .eq('listing_id', listingId)
      .eq('status', 'confirmed')
      .lt('check_in', checkOut)
      .gt('check_out', checkIn)
      .limit(1),
  ]);

  if (blocks.error) throw new RepositoryError(blocks.error.message, { cause: blocks.error });
  if (bookings.error)
    throw new RepositoryError(bookings.error.message, { cause: bookings.error });

  return (blocks.data?.length ?? 0) > 0 || (bookings.data?.length ?? 0) > 0;
}

export interface CreateBookingRow {
  listing_id: string;
  guest_id: string;
  host_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  nights: number;
  base_amount: number;
  service_fee: number;
  total_amount: number;
  special_request: string | null;
}

/** Insert a new `requested` booking and return the persisted row. */
export async function createBooking(row: CreateBookingRow): Promise<Booking> {
  if (DEMO_MODE) {
    return {
      id: randomUUID(),
      ...row,
      status: 'requested',
      payment_id: null,
      created_at: DEMO_TS,
      updated_at: DEMO_TS,
    };
  }
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('bookings')
    .insert({ ...row, status: 'requested', payment_id: null })
    .select(BOOKING_COLUMNS)
    .single();
  if (error) throw new RepositoryError(error.message, { cause: error });
  return data;
}

/** Fetch a single booking by id (RLS scopes who can see it). */
export async function getBooking(bookingId: string): Promise<Booking | null> {
  if (DEMO_MODE) return demo.demoBookingById(bookingId);
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_COLUMNS)
    .eq('id', bookingId)
    .maybeSingle();
  if (error) throw new RepositoryError(error.message, { cause: error });
  return data;
}

/** Update only the status of a booking and return the updated row. */
export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
): Promise<Booking> {
  if (DEMO_MODE) {
    const booking = demo.demoBookingById(bookingId);
    if (!booking) throw new RepositoryError('Demo booking not found');
    return { ...booking, status, updated_at: DEMO_TS };
  }
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)
    .select(BOOKING_COLUMNS)
    .single();
  if (error) throw new RepositoryError(error.message, { cause: error });
  return data;
}

export interface StatusHistoryRow {
  booking_id: string;
  from_status: BookingStatus | null;
  to_status: BookingStatus;
  actor_id: string | null;
  note: string | null;
}

/** Append a booking_status_history row (audit trail for every transition). */
export async function insertStatusHistory(
  row: StatusHistoryRow,
): Promise<BookingStatusHistory> {
  if (DEMO_MODE) return { id: randomUUID(), ...row, created_at: DEMO_TS };
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('booking_status_history')
    .insert(row)
    .select('id, booking_id, from_status, to_status, actor_id, note, created_at')
    .single();
  if (error) throw new RepositoryError(error.message, { cause: error });
  return data;
}

export interface AvailabilityBlockRow {
  listing_id: string;
  start_date: string;
  end_date: string;
  reason: AvailabilityBlock['reason'];
}

/** Write an availability block (called when a booking is confirmed). */
export async function insertAvailabilityBlock(
  row: AvailabilityBlockRow,
): Promise<AvailabilityBlock> {
  if (DEMO_MODE) return { id: randomUUID(), ...row, created_at: DEMO_TS };
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('availability_blocks')
    .insert(row)
    .select('id, listing_id, start_date, end_date, reason, created_at')
    .single();
  if (error) throw new RepositoryError(error.message, { cause: error });
  return data;
}

/** Bookings belonging to a guest, newest first. */
export async function listGuestBookings(guestId: string): Promise<Booking[]> {
  if (DEMO_MODE) return demo.demoBookingsForGuest(guestId);
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_COLUMNS)
    .eq('guest_id', guestId)
    .order('created_at', { ascending: false });
  if (error) throw new RepositoryError(error.message, { cause: error });
  return data ?? [];
}

/** Compact listing summary for embedding in a booking DTO. */
export interface BookingListingSummaryRow {
  id: string;
  slug: string;
  title: string;
  area: string | null;
  district: string | null;
  cover_url: string | null;
}

export async function getListingSummary(
  listingId: string,
): Promise<BookingListingSummaryRow | null> {
  if (DEMO_MODE) return demo.demoListingSummary(listingId);
  const supabase = await createServerSupabase();
  const { data: listing, error } = await supabase
    .from('listings')
    .select('id, slug, title, area, district')
    .eq('id', listingId)
    .maybeSingle();
  if (error) throw new RepositoryError(error.message, { cause: error });
  if (!listing) return null;

  const { data: cover, error: coverErr } = await supabase
    .from('listing_images')
    .select('url, is_cover, sort_order')
    .eq('listing_id', listingId)
    .order('is_cover', { ascending: false })
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (coverErr) throw new RepositoryError(coverErr.message, { cause: coverErr });

  return { ...listing, cover_url: cover?.url ?? null };
}

export interface ConfirmBookingParams {
  bookingId: string;
  listingId: string;
  fromStatus: BookingStatus;
  checkIn: string;
  checkOut: string;
  actorId: string | null;
  note: string | null;
}

/**
 * ATOMIC confirm: status→confirmed + availability block + status-history, all-or-
 * nothing. Backed by a Postgres `confirm_booking` RPC (in supabase/migrations) so the
 * three writes share one transaction — the only way to be truly atomic with
 * supabase-js. Uses the service-role client because IPN/system confirms run without a
 * user session. Returns the confirmed booking row.
 */
export async function confirmBookingAtomic(
  params: ConfirmBookingParams,
): Promise<Booking> {
  if (DEMO_MODE) {
    const booking = demo.demoBookingById(params.bookingId);
    if (!booking) throw new RepositoryError('Demo booking not found');
    return { ...booking, status: 'confirmed', updated_at: DEMO_TS };
  }
  const supabase = getAdminSupabase();
  // `confirm_booking` is a Postgres function shipped by supabase/migrations; it is
  // not yet in the generated `Database['public']['Functions']` map, so we narrow to
  // the untyped rpc surface at this single seam (the only such cast in the feature).
  const rpc = supabase.rpc.bind(supabase) as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;

  const { data, error } = await rpc('confirm_booking', {
    p_booking_id: params.bookingId,
    p_listing_id: params.listingId,
    p_check_in: params.checkIn,
    p_check_out: params.checkOut,
    p_from_status: params.fromStatus,
    p_actor_id: params.actorId,
    p_note: params.note,
  });
  if (error) throw new RepositoryError(error.message, { cause: error });
  // The RPC returns the confirmed booking row.
  return data as Booking;
}
