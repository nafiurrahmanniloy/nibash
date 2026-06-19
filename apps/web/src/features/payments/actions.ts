'use server';
/**
 * actions.ts — payment server actions (THIN controllers).
 *
 * Resolve the caller from the session, validate input, call ONE service function,
 * return the Result. No business logic, no Supabase, no gateway calls here — the
 * SSLCommerz flow lives in payments.service.ts.
 *
 * Note: the IPN callback is NOT here — it is a server-to-server HTTP boundary at
 * app/api/payments/ipn/route.ts, which calls payments.service.handleIpn directly.
 */
import { z } from 'zod';
import { err, type Result } from '@travela/shared';
import { zodToApiError } from '@/lib/errors';
import { getCurrentUser } from '@/features/auth';
import { createPaymentSession, type PaymentSession } from './payments.service.js';

const initiateSchema = z.object({ bookingId: z.string().uuid() });

/** Guest starts paying for an approved booking → returns the gateway redirect URL. */
export async function initiatePayment(input: unknown): Promise<Result<PaymentSession>> {
  const parsed = initiateSchema.safeParse(input);
  if (!parsed.success) {
    return err('VALIDATION', 'Invalid payment request', zodToApiError(parsed.error));
  }
  const me = await getCurrentUser();
  if (!me.ok) return me;
  if (!me.data) return err('UNAUTHENTICATED', 'Please sign in to pay');

  return createPaymentSession(parsed.data.bookingId, me.data.id);
}
