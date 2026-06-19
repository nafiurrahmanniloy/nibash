/**
 * bookings.notifications.ts — booking-event notification fan-out (stub seam).
 *
 * The service calls notifyBookingEvent on every successful transition. The real
 * implementation (in-app `notifications` insert + email via Resend + push via FCM)
 * lands in Phase 4; the call path is wired now so the state machine is complete.
 *
 * This is intentionally side-effecting glue, NOT business logic — it never decides a
 * transition, it only announces one that already happened.
 */
import type { BookingAction, BookingStatusValue } from '@travela/shared';

export interface BookingEvent {
  bookingId: string;
  guestId: string;
  hostId: string;
  action: BookingAction;
  toStatus: BookingStatusValue;
}

/**
 * Announce a booking transition to the relevant parties.
 *
 * TODO(Phase 4): persist a `notifications` row per recipient (via a notifications
 * repository), send the templated email (Resend), and push (FCM/Expo). For now this
 * is a no-op so the state machine's call path is real and testable; failures here
 * must never roll back a committed transition (best-effort, logged).
 */
export async function notifyBookingEvent(_event: BookingEvent): Promise<void> {
  // No-op until Phase 4. Kept async so callers `await` the real impl unchanged.
  return;
}
