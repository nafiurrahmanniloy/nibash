/**
 * payments.service.ts — SSLCommerz payment flow (build plan §5). No req/res, no
 * Supabase (that's payments.repository). This is the single source of truth for the
 * flow; the IPN route and the initiate-payment action are thin adapters over it.
 *
 *   createPaymentSession: approved booking → create `initiated` payment row → ask the
 *     gateway for a hosted session → return the redirect URL.
 *   handleIpn: gateway calls back → verify authenticity → mark the payment success/
 *     failed → drive the booking state machine via the bookings feature's system-actor
 *     entry points (markBookingPaid / failBookingPayment). Booking confirm, availability
 *     block, and notifications all happen inside the bookings feature — payments never
 *     touches the bookings tables.
 */
import { randomUUID } from 'node:crypto';
import { err, ok, type Json, type Result } from '@travela/shared';
import { toApiError } from '@/lib/errors';
import { serverEnv } from '@/lib/env';
import { logger } from '@/lib/logger';
import {
  getBookingForPayment,
  markBookingPaid,
  failBookingPayment,
} from '@/features/bookings';
import * as repo from './payments.repository.js';

const GATEWAY = 'sslcommerz';

export interface PaymentSession {
  paymentId: string;
  gatewayTxnId: string;
  /** Where the controller should redirect the guest to complete payment. */
  redirectUrl: string;
}

/**
 * Start a gateway session for an approved booking. Amount + ownership come from the
 * bookings feature (never from the client). Creates the `initiated` payment row first
 * so the IPN can always correlate the callback to a known transaction.
 */
export async function createPaymentSession(
  bookingId: string,
  guestId: string,
): Promise<Result<PaymentSession>> {
  const context = await getBookingForPayment(bookingId, guestId);
  if (!context.ok) return context;

  try {
    const gatewayTxnId = `TRX-${randomUUID()}`;
    const payment = await repo.createPayment({
      booking_id: context.data.bookingId,
      gateway: GATEWAY,
      gateway_txn_id: gatewayTxnId,
      amount: context.data.amount,
    });

    // The `initiated` payment row now exists, so any IPN can correlate the callback.
    logger.info('Payment session created (pending gateway wiring)', {
      paymentId: payment.id,
      gatewayTxnId,
    });

    // TODO(payments): call the SSLCommerz "create session" API with store creds
    // (serverEnv.SSLCOMMERZ_STORE_ID / STORE_PASSWORD), passing amount, gatewayTxnId,
    // and the success/fail/cancel + IPN URLs derived from clientEnv.NEXT_PUBLIC_SITE_URL.
    // Build and test on sandbox first (serverEnv.SSLCOMMERZ_IS_SANDBOX), then swap to
    // production. The call returns a GatewayPageURL; the success path then becomes:
    //   return ok({ paymentId: payment.id, gatewayTxnId, redirectUrl: session.GatewayPageURL });
    // Until wired, fail loudly rather than return a fake URL so it's never mistaken
    // for a working payment.
    void serverEnv; // validated at boot; referenced so the dependency is explicit.
    return err(
      'INTERNAL',
      'Payment gateway is not configured yet',
      toApiError(new Error('SSLCommerz session creation not implemented')),
    );
  } catch (e) {
    return err('INTERNAL', 'Could not start the payment', toApiError(e));
  }
}

/** Did the gateway report this transaction as paid? (SSLCommerz: VALID / VALIDATED.) */
function isGatewaySuccess(status: string | undefined): boolean {
  const s = (status ?? '').toUpperCase();
  return s === 'VALID' || s === 'VALIDATED';
}

/**
 * Verify the IPN is genuinely from the gateway for the stated amount. SSLCommerz
 * requires a server-side validation call (val_id → validator API) plus a store-id and
 * amount match. Returning false here rejects spoofed callbacks.
 */
async function verifyIpnAuthenticity(
  _payload: Record<string, string>,
): Promise<boolean> {
  // TODO(payments): POST val_id to the SSLCommerz validation API with store creds and
  // confirm status === VALID, the store_id matches env.SSLCOMMERZ_STORE_ID, and the
  // validated amount equals the payment row amount. Until then, do NOT trust the call.
  logger.warn('IPN authenticity verification is stubbed — wire SSLCommerz validator');
  return false;
}

/**
 * Process a gateway IPN callback. Idempotent-by-status: a payment already in a terminal
 * state is acknowledged without re-driving the booking.
 */
export async function handleIpn(
  payload: Record<string, string>,
): Promise<Result<{ paymentId: string }>> {
  try {
    const gatewayTxnId = payload.tran_id;
    if (!gatewayTxnId) return err('VALIDATION', 'Missing transaction id');

    const payment = await repo.getPaymentByTxnId(gatewayTxnId);
    if (!payment) return err('NOT_FOUND', 'Unknown transaction');

    // Already settled → acknowledge, do nothing (gateway may retry).
    if (payment.status === 'success' || payment.status === 'failed') {
      return ok({ paymentId: payment.id });
    }

    const rawPayload = payload as unknown as Json;
    const authentic = await verifyIpnAuthenticity(payload);
    const succeeded = authentic && isGatewaySuccess(payload.status);

    if (succeeded) {
      await repo.updatePaymentStatus(payment.id, 'success', rawPayload);
      // Drive the booking through its own guarded state machine (system actor).
      const transition = await markBookingPaid(payment.booking_id);
      if (!transition.ok) {
        logger.error('Payment succeeded but booking confirm failed', {
          paymentId: payment.id,
          bookingId: payment.booking_id,
          code: transition.error.code,
        });
        return transition;
      }
    } else {
      await repo.updatePaymentStatus(payment.id, 'failed', rawPayload);
      await failBookingPayment(payment.booking_id);
    }

    return ok({ paymentId: payment.id });
  } catch (e) {
    return err('INTERNAL', 'Could not process the payment notification', toApiError(e));
  }
}
