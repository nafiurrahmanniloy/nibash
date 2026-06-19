'use server';
/**
 * actions.ts — booking server actions (THIN controllers).
 *
 * Each action: resolve the caller from the session, validate input with the booking
 * schema, call ONE service function, return the DTO Result. No business logic and no
 * Supabase here — the state machine and rules live in bookings.service.ts.
 *
 * The caller's identity comes from the session via getCurrentUser() (auth feature),
 * never from client-supplied ids — guest/host authorization is enforced server-side.
 */
import {
  createBookingInputSchema,
  bookingTransitionInputSchema,
  err,
  type BookingDTO,
  type Result,
} from '@nibash/shared';
import { zodToApiError } from '@/lib/errors';
import { getCurrentUser } from '@/features/auth';
import * as service from './bookings.service.js';

/** Guest requests a stay → creates a `requested` booking after availability checks. */
export async function requestBooking(input: unknown): Promise<Result<BookingDTO>> {
  const parsed = createBookingInputSchema.safeParse(input);
  if (!parsed.success) {
    return err('VALIDATION', 'Please fix the errors below', zodToApiError(parsed.error));
  }
  const me = await getCurrentUser();
  if (!me.ok) return me;
  if (!me.data) return err('UNAUTHENTICATED', 'Please sign in to request a booking');

  return service.requestBooking(parsed.data, me.data.id);
}

/** Host approves a pending request (requested → approved). */
export async function approveBooking(input: unknown): Promise<Result<BookingDTO>> {
  const parsed = bookingTransitionInputSchema.safeParse(input);
  if (!parsed.success || parsed.data.action !== 'approve') {
    return err('VALIDATION', 'Invalid approve request', parsed.success ? undefined : zodToApiError(parsed.error));
  }
  const me = await getCurrentUser();
  if (!me.ok) return me;
  if (!me.data) return err('UNAUTHENTICATED', 'Please sign in');

  return service.approveBooking(parsed.data.bookingId, me.data.id, parsed.data.note);
}

/** Host declines a pending request (requested → declined). */
export async function declineBooking(input: unknown): Promise<Result<BookingDTO>> {
  const parsed = bookingTransitionInputSchema.safeParse(input);
  if (!parsed.success || parsed.data.action !== 'decline') {
    return err('VALIDATION', 'Invalid decline request', parsed.success ? undefined : zodToApiError(parsed.error));
  }
  const me = await getCurrentUser();
  if (!me.ok) return me;
  if (!me.data) return err('UNAUTHENTICATED', 'Please sign in');

  return service.declineBooking(parsed.data.bookingId, me.data.id, parsed.data.note);
}
