/**
 * bookings.service.ts — THE booking state machine + booking orchestration.
 *
 * No Supabase, no req/res. All transition legality lives here in ONE function,
 * `transitionBooking(booking, event, actor)`, which consults the shared
 * BOOKING_TRANSITIONS map (BUILD-PLAN §4 / booking.schema) — it never invents edges.
 *
 * Responsibilities:
 *  - requestBooking: validate availability + capacity + min-nights, price it, persist
 *    a `requested` booking, write the initial status-history row.
 *  - transitionBooking: the single guarded transition fn. Rejects illegal edges and
 *    wrong actors. Side effects per edge:
 *      • approve / decline / initiate_payment / payment_failed / expire / complete /
 *        cancel  → update status + status-history + notify.
 *      • payment_succeeded (→ confirmed) → the ATOMIC unit: status + availability
 *        block + status-history committed together. That all-or-nothing boundary is
 *        OWNED by the repository (`confirmBookingAtomic`, backed by a Postgres RPC) —
 *        documented in bookings.repository.ts — because a transaction cannot span
 *        multiple supabase-js calls. The service decides WHEN to confirm; the repo
 *        performs the atomic WRITE. Notifications fire after the commit (best-effort).
 *
 * Returns Result<T> for every expected failure (ILLEGAL_TRANSITION, UNAVAILABLE,
 * FORBIDDEN, NOT_FOUND, VALIDATION, CONFLICT).
 */
import {
  bookingDTOSchema,
  transitionFor,
  ok,
  err,
  type Booking,
  type BookingAction,
  type BookingDTO,
  type BookingStatusValue,
  type CreateBookingInput,
  type Result,
} from '@nibash/shared';
import { toApiError } from '@/lib/errors';
import * as repo from './bookings.repository.js';
import { priceBooking, nightsBetween } from './bookings.pricing.js';
import { notifyBookingEvent } from './bookings.notifications.js';

/** Who is performing a transition (drives the actor-authorization check). */
export interface Actor {
  /** null = system (IPN/timeout/cron). */
  id: string | null;
  role: 'guest' | 'host' | 'system';
}

/* ────────────────────────────────────────────────────────────────────────────
 * DTO mapping
 * ────────────────────────────────────────────────────────────────────────── */
async function toBookingDTO(b: Booking): Promise<BookingDTO> {
  const summary = await repo.getListingSummary(b.listing_id);
  return bookingDTOSchema.parse({
    id: b.id,
    listingId: b.listing_id,
    guestId: b.guest_id,
    hostId: b.host_id,
    checkIn: b.check_in,
    checkOut: b.check_out,
    guests: b.guests,
    nights: b.nights,
    baseAmount: b.base_amount,
    serviceFee: b.service_fee,
    totalAmount: b.total_amount,
    status: b.status,
    specialRequest: b.special_request,
    paymentId: b.payment_id,
    listing: {
      id: summary?.id ?? b.listing_id,
      slug: summary?.slug ?? '',
      title: summary?.title ?? 'Listing',
      coverImageUrl: summary?.cover_url ?? null,
      area: summary?.area ?? null,
      district: summary?.district ?? null,
    },
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Request a booking (creates a `requested` row after availability validation)
 * ────────────────────────────────────────────────────────────────────────── */
export async function requestBooking(
  input: CreateBookingInput,
  guestId: string,
): Promise<Result<BookingDTO>> {
  try {
    const listing = await repo.getListingForBooking(input.listingId);
    if (!listing || listing.status !== 'published') {
      return err('NOT_FOUND', 'This listing is not available to book');
    }
    if (listing.host_id === guestId) {
      return err('FORBIDDEN', 'You cannot book your own listing');
    }
    if (input.guests > listing.max_guests) {
      return err('VALIDATION', `This stay hosts up to ${listing.max_guests} guests`, {
        fields: { guests: [`Maximum ${listing.max_guests} guests`] },
      });
    }

    const nights = nightsBetween(input.checkIn, input.checkOut);
    if (nights < 1) {
      return err('VALIDATION', 'Check-out must be after check-in', {
        fields: { checkOut: ['Check-out must be after check-in'] },
      });
    }
    if (nights < listing.min_nights) {
      return err('VALIDATION', `Minimum stay is ${listing.min_nights} night(s)`, {
        fields: { checkOut: [`Minimum stay is ${listing.min_nights} night(s)`] },
      });
    }

    // Availability: no overlapping block AND no overlapping confirmed booking.
    const conflict = await repo.checkOverlap(
      input.listingId,
      input.checkIn,
      input.checkOut,
    );
    if (conflict) {
      return err('UNAVAILABLE', 'Those dates are no longer available');
    }

    const price = priceBooking(listing.price_per_day, input.checkIn, input.checkOut);

    const booking = await repo.createBooking({
      listing_id: input.listingId,
      guest_id: guestId,
      host_id: listing.host_id,
      check_in: input.checkIn,
      check_out: input.checkOut,
      guests: input.guests,
      nights: price.nights,
      base_amount: price.baseAmount,
      service_fee: price.serviceFee,
      total_amount: price.totalAmount,
      special_request: input.specialRequest ?? null,
    });

    // Initial audit row: from null → requested.
    await repo.insertStatusHistory({
      booking_id: booking.id,
      from_status: null,
      to_status: 'requested',
      actor_id: guestId,
      note: input.specialRequest ?? null,
    });

    await notifyBookingEvent({
      bookingId: booking.id,
      guestId: booking.guest_id,
      hostId: booking.host_id,
      action: 'approve', // event marker; "requested" is announced to the host
      toStatus: 'requested',
    });

    return ok(await toBookingDTO(booking));
  } catch (e) {
    return err('INTERNAL', 'Could not create your booking request', toApiError(e));
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * The single guarded transition function (the state machine)
 * ────────────────────────────────────────────────────────────────────────── */

/** Is this actor allowed to perform an edge whose contract requires `requiredActor`? */
function actorMayPerform(
  actor: Actor,
  requiredActor: 'guest' | 'host' | 'system',
  booking: Booking,
): boolean {
  if (actor.role !== requiredActor) return false;
  if (requiredActor === 'system') return true;
  if (requiredActor === 'guest') return actor.id === booking.guest_id;
  if (requiredActor === 'host') return actor.id === booking.host_id;
  return false;
}

/**
 * Apply `action` to `booking` as `actor`. Single source of transition truth.
 * Rejects: terminal/illegal edges (ILLEGAL_TRANSITION) and wrong actor (FORBIDDEN).
 */
export async function transitionBooking(
  booking: Booking,
  action: BookingAction,
  actor: Actor,
  note?: string,
): Promise<Result<BookingDTO>> {
  // 1. Legality: is `action` a defined edge out of the current status?
  const edge = transitionFor(booking.status, action);
  if (!edge) {
    return err(
      'ILLEGAL_TRANSITION',
      `Cannot ${action} a booking that is ${booking.status}`,
    );
  }

  // 2. Authorization: only the edge's actor may trigger it.
  if (!actorMayPerform(actor, edge.actor, booking)) {
    return err('FORBIDDEN', 'You are not allowed to perform this action');
  }

  try {
    const from: BookingStatusValue = booking.status;
    let updated: Booking;

    if (edge.to === 'confirmed') {
      // ── ATOMIC confirm (status + availability block + history) ──
      // Re-check availability immediately before confirming to close the race
      // window between approval and payment.
      const conflict = await repo.checkOverlap(
        booking.listing_id,
        booking.check_in,
        booking.check_out,
      );
      if (conflict) {
        return err('CONFLICT', 'Those dates were booked while payment was pending');
      }
      updated = await repo.confirmBookingAtomic({
        bookingId: booking.id,
        listingId: booking.listing_id,
        fromStatus: from,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        actorId: actor.id,
        note: note ?? null,
      });
    } else {
      // ── Simple status transition + audit row ──
      updated = await repo.updateBookingStatus(booking.id, edge.to);
      await repo.insertStatusHistory({
        booking_id: booking.id,
        from_status: from,
        to_status: edge.to,
        actor_id: actor.id,
        note: note ?? null,
      });
    }

    // Notifications are best-effort and fire AFTER the state change is committed;
    // a notification failure must never roll back a completed transition.
    await notifyBookingEvent({
      bookingId: updated.id,
      guestId: updated.guest_id,
      hostId: updated.host_id,
      action,
      toStatus: edge.to,
    });

    return ok(await toBookingDTO(updated));
  } catch (e) {
    return err('INTERNAL', 'Could not update the booking', toApiError(e));
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * Action-oriented wrappers used by the controllers (load booking → transition)
 * ────────────────────────────────────────────────────────────────────────── */
async function loadAndTransition(
  bookingId: string,
  action: BookingAction,
  actor: Actor,
  note?: string,
): Promise<Result<BookingDTO>> {
  const booking = await repo.getBooking(bookingId);
  if (!booking) return err('NOT_FOUND', 'Booking not found');
  return transitionBooking(booking, action, actor, note);
}

export function approveBooking(
  bookingId: string,
  hostId: string,
  note?: string,
): Promise<Result<BookingDTO>> {
  return loadAndTransition(bookingId, 'approve', { id: hostId, role: 'host' }, note);
}

export function declineBooking(
  bookingId: string,
  hostId: string,
  note?: string,
): Promise<Result<BookingDTO>> {
  return loadAndTransition(bookingId, 'decline', { id: hostId, role: 'host' }, note);
}

/**
 * System-actor transitions driven by the payments IPN (build plan §5). The payments
 * feature owns the `payments` table; it calls these so the booking confirm/cancel
 * runs through the SAME guarded state machine with a system actor — payments never
 * touches the bookings tables directly. `markBookingPaid` drives the atomic confirm
 * (status + availability block + history); `failBookingPayment` cancels a stuck pay.
 */
const SYSTEM_ACTOR: Actor = { id: null, role: 'system' };

/** Minimal, payment-safe view of a booking the payments feature needs to open a session. */
export interface BookingPaymentContext {
  bookingId: string;
  guestId: string;
  amount: number;
  status: BookingStatusValue;
}

/**
 * Resolve the amount + ownership the payments feature needs to start a gateway
 * session, WITHOUT exposing the bookings tables to that feature. Only the booking's
 * own guest may pay, and only an `approved` booking is payable (build plan §4).
 */
export async function getBookingForPayment(
  bookingId: string,
  guestId: string,
): Promise<Result<BookingPaymentContext>> {
  try {
    const booking = await repo.getBooking(bookingId);
    if (!booking) return err('NOT_FOUND', 'Booking not found');
    if (booking.guest_id !== guestId) {
      return err('FORBIDDEN', 'You can only pay for your own booking');
    }
    if (booking.status !== 'approved') {
      return err('ILLEGAL_TRANSITION', 'This booking is not awaiting payment');
    }
    return ok({
      bookingId: booking.id,
      guestId: booking.guest_id,
      amount: booking.total_amount,
      status: booking.status,
    });
  } catch (e) {
    return err('INTERNAL', 'Could not load the booking', toApiError(e));
  }
}

export function markBookingPaid(bookingId: string): Promise<Result<BookingDTO>> {
  return loadAndTransition(bookingId, 'payment_succeeded', SYSTEM_ACTOR);
}

export function failBookingPayment(bookingId: string): Promise<Result<BookingDTO>> {
  return loadAndTransition(bookingId, 'payment_failed', SYSTEM_ACTOR);
}

/** Guest's own bookings as DTOs (newest first). */
export async function listMyBookings(
  guestId: string,
): Promise<Result<BookingDTO[]>> {
  try {
    const rows = await repo.listGuestBookings(guestId);
    const dtos = await Promise.all(rows.map(toBookingDTO));
    return ok(dtos);
  } catch (e) {
    return err('INTERNAL', 'Could not load your bookings', toApiError(e));
  }
}
