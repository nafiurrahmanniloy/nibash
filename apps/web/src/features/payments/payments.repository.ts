/**
 * payments.repository.ts — the ONLY payments-feature Supabase seam.
 *
 * Owns the `payments` table only (build plan §3/§5). The IPN runs server-to-server
 * with no user session, so this layer uses the service-role admin client. Explicit
 * columns only; returns raw rows. All flow decisions live in payments.service.ts;
 * driving the booking state machine is delegated to the bookings feature.
 */
import type { Json, Payment, PaymentStatus } from '@nibash/shared';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { RepositoryError } from '@/lib/errors';

const PAYMENT_COLUMNS =
  'id, booking_id, gateway, gateway_txn_id, amount, status, raw_payload, created_at, updated_at';

/** Create an `initiated` payment row for a booking and return it (gateway_txn_id set by caller). */
export async function createPayment(input: {
  booking_id: string;
  gateway: string;
  gateway_txn_id: string;
  amount: number;
}): Promise<Payment> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from('payments')
    .insert({
      booking_id: input.booking_id,
      gateway: input.gateway,
      gateway_txn_id: input.gateway_txn_id,
      amount: input.amount,
      status: 'initiated' satisfies PaymentStatus,
    })
    .select(PAYMENT_COLUMNS)
    .single();
  if (error) throw new RepositoryError(error.message, { cause: error });
  return data as Payment;
}

/** Look up a payment by the gateway transaction id we generated for the session. */
export async function getPaymentByTxnId(
  gatewayTxnId: string,
): Promise<Payment | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from('payments')
    .select(PAYMENT_COLUMNS)
    .eq('gateway_txn_id', gatewayTxnId)
    .maybeSingle();
  if (error) throw new RepositoryError(error.message, { cause: error });
  return data as Payment | null;
}

/** Mark a payment's terminal status and persist the raw gateway payload for audit. */
export async function updatePaymentStatus(
  paymentId: string,
  status: PaymentStatus,
  rawPayload: Json,
): Promise<Payment> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from('payments')
    .update({ status, raw_payload: rawPayload })
    .eq('id', paymentId)
    .select(PAYMENT_COLUMNS)
    .single();
  if (error) throw new RepositoryError(error.message, { cause: error });
  return data as Payment;
}
