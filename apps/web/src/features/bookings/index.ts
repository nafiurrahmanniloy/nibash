/**
 * bookings — public surface barrel.
 * App pages import the BookingWidget + the booking actions from here. The state
 * machine (transitionBooking) and repository stay internal to the feature.
 */
export { BookingWidget } from './components/BookingWidget.js';
export type { BookingWidgetProps } from './components/BookingWidget.js';

export { requestBooking, approveBooking, declineBooking } from './actions.js';

// Pricing helper is shared with the payments feature + the widget preview (one math path).
export { priceBooking, nightsBetween, SERVICE_FEE_RATE } from './bookings.pricing.js';

// Exposed for the payments IPN path (system actor) and host/guest cancellation flows
// to drive the same single state machine. listMyBookings powers the guest bookings page.
export {
  transitionBooking,
  listMyBookings,
  // System-actor entry points used by the payments IPN path (build plan §5).
  markBookingPaid,
  failBookingPayment,
  // Read used by the payments feature to open a gateway session (no table access leak).
  getBookingForPayment,
  type Actor,
  type BookingPaymentContext,
} from './bookings.service.js';
