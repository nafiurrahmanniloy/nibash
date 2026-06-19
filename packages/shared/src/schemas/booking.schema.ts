/**
 * booking.schema.ts — booking status enum, the legal-transitions map (BUILD-PLAN §4),
 * createBooking input, and the public bookingDTO.
 *
 * The transitions map below is the single declarative source of truth for the
 * booking state machine. The server-side transition function in
 * features/bookings/bookings.service.ts MUST consult `BOOKING_TRANSITIONS` (or the
 * `canTransition` helper) — it does not invent its own edges. UI uses the same map
 * to know which actions to show, so legality lives in exactly one place.
 *
 * State machine (BUILD-PLAN §4):
 *   requested ──approve──> approved ──(guest pays-initiates)──> payment_pending ──pay ok──> confirmed ──checkout──> completed
 *      │                      │                                       │
 *      └──decline──> declined └──(timeout/expire)──> cancelled        └──pay fail──> cancelled
 *   confirmed ──cancel (per policy)──> cancelled
 */
import { z } from 'zod';
import { dateStringSchema, idSchema, isoDateTimeSchema, moneySchema } from './common.schema.js';

/* ────────────────────────────────────────────────────────────────────────────
 * Status enum
 * ────────────────────────────────────────────────────────────────────────── */
export const bookingStatusSchema = z.enum([
  'requested',
  'approved',
  'payment_pending',
  'confirmed',
  'completed',
  'declined',
  'cancelled',
]);
export type BookingStatusValue = z.infer<typeof bookingStatusSchema>;

export const BOOKING_STATUSES = bookingStatusSchema.options;

/** Terminal states — no outgoing transitions. */
export const TERMINAL_BOOKING_STATUSES = [
  'completed',
  'declined',
  'cancelled',
] as const satisfies readonly BookingStatusValue[];

/* ────────────────────────────────────────────────────────────────────────────
 * Transition actions + legal-transitions map (the contract for the service fn)
 * ────────────────────────────────────────────────────────────────────────── */
export type BookingAction =
  | 'approve' // host: requested → approved
  | 'decline' // host: requested → declined
  | 'initiate_payment' // guest: approved → payment_pending (SSLCommerz session created)
  | 'payment_succeeded' // system/IPN: payment_pending → confirmed
  | 'payment_failed' // system/IPN: payment_pending → cancelled
  | 'expire' // system/timeout: approved → cancelled
  | 'complete' // system: confirmed → completed (after checkout)
  | 'cancel'; // guest/host per policy: confirmed → cancelled

/** One legal edge in the state machine. */
export interface BookingTransition {
  from: BookingStatusValue;
  to: BookingStatusValue;
  action: BookingAction;
  /** Who is allowed to trigger this edge. `system` = server-driven (IPN/timeout/cron). */
  actor: 'guest' | 'host' | 'system';
}

/**
 * The complete legal-transitions map. Keyed by from-status, listing every allowed
 * outgoing edge. Anything not present here is an ILLEGAL transition and the service
 * must reject it.
 */
export const BOOKING_TRANSITIONS: Record<BookingStatusValue, BookingTransition[]> = {
  requested: [
    { from: 'requested', to: 'approved', action: 'approve', actor: 'host' },
    { from: 'requested', to: 'declined', action: 'decline', actor: 'host' },
  ],
  approved: [
    { from: 'approved', to: 'payment_pending', action: 'initiate_payment', actor: 'guest' },
    { from: 'approved', to: 'cancelled', action: 'expire', actor: 'system' },
  ],
  payment_pending: [
    { from: 'payment_pending', to: 'confirmed', action: 'payment_succeeded', actor: 'system' },
    { from: 'payment_pending', to: 'cancelled', action: 'payment_failed', actor: 'system' },
  ],
  confirmed: [
    { from: 'confirmed', to: 'completed', action: 'complete', actor: 'system' },
    { from: 'confirmed', to: 'cancelled', action: 'cancel', actor: 'guest' },
  ],
  completed: [],
  declined: [],
  cancelled: [],
};

/** Is moving from → to a legal transition? */
export const canTransition = (
  from: BookingStatusValue,
  to: BookingStatusValue,
): boolean => BOOKING_TRANSITIONS[from].some((t) => t.to === to);

/** Resolve the transition for a given action from a given state (or null if illegal). */
export const transitionFor = (
  from: BookingStatusValue,
  action: BookingAction,
): BookingTransition | null =>
  BOOKING_TRANSITIONS[from].find((t) => t.action === action) ?? null;

export const isTerminalStatus = (s: BookingStatusValue): boolean =>
  (TERMINAL_BOOKING_STATUSES as readonly string[]).includes(s);

/* ────────────────────────────────────────────────────────────────────────────
 * Create-booking input (guest requests a stay)
 * ────────────────────────────────────────────────────────────────────────── */
export const createBookingInputSchema = z
  .object({
    listingId: idSchema,
    checkIn: dateStringSchema,
    checkOut: dateStringSchema,
    guests: z.number().int().min(1).max(50),
    specialRequest: z.string().trim().max(1000).optional(),
  })
  .strict()
  .refine((b) => b.checkOut > b.checkIn, {
    message: 'Check-out must be after check-in',
    path: ['checkOut'],
  });
export type CreateBookingInput = z.infer<typeof createBookingInputSchema>;

/** Input for a status transition request at the controller boundary. */
export const bookingTransitionInputSchema = z
  .object({
    bookingId: idSchema,
    action: z.enum([
      'approve',
      'decline',
      'initiate_payment',
      'payment_succeeded',
      'payment_failed',
      'expire',
      'complete',
      'cancel',
    ]),
    note: z.string().trim().max(500).optional(),
  })
  .strict();
export type BookingTransitionInput = z.infer<typeof bookingTransitionInputSchema>;

/* ────────────────────────────────────────────────────────────────────────────
 * Public booking DTO + price breakdown
 * ────────────────────────────────────────────────────────────────────────── */
export const priceBreakdownSchema = z.object({
  pricePerDay: moneySchema,
  nights: z.number().int().positive(),
  baseAmount: moneySchema, // pricePerDay * nights
  serviceFee: moneySchema,
  totalAmount: moneySchema, // baseAmount + serviceFee
  currency: z.literal('BDT'),
});
export type PriceBreakdown = z.infer<typeof priceBreakdownSchema>;

/** Compact listing summary embedded in a booking DTO. */
export const bookingListingSummarySchema = z.object({
  id: idSchema,
  slug: z.string(),
  title: z.string(),
  coverImageUrl: z.string().url().nullable(),
  area: z.string().nullable(),
  district: z.string().nullable(),
});

export const bookingDTOSchema = z.object({
  id: idSchema,
  listingId: idSchema,
  guestId: idSchema,
  hostId: idSchema,
  checkIn: dateStringSchema,
  checkOut: dateStringSchema,
  guests: z.number().int().positive(),
  nights: z.number().int().positive(),
  baseAmount: moneySchema,
  serviceFee: moneySchema,
  totalAmount: moneySchema,
  status: bookingStatusSchema,
  specialRequest: z.string().nullable(),
  // null until a payment session is created; never exposes raw gateway payload
  paymentId: idSchema.nullable(),
  listing: bookingListingSummarySchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});
export type BookingDTO = z.infer<typeof bookingDTOSchema>;
