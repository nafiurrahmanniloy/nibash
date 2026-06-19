/**
 * SSLCommerz IPN endpoint — THIN HTTP boundary (ARCHITECTURE.md §1, §3).
 *
 * SSLCommerz POSTs an instant payment notification (form-encoded) after a payment
 * attempt. This handler does NOT contain payment logic: it only parses the body
 * into a plain record and hands it to `payments.service.handleIpn`, which validates
 * the gateway signature, marks the payment, and (on success) drives the booking
 * state machine + availability block + notifications inside a transaction.
 *
 * The service is the single source of truth for the flow (build plan §5). The route
 * just adapts HTTP → service call → HTTP response and never logs secrets.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { handleIpn } from '@/features/payments';
import { statusForError } from '@/lib/errors';
import { logger } from '@/lib/logger';

// SSLCommerz calls server-to-server; this must run on the Node runtime (service
// uses the service-role client) and never be statically cached.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Parse a form-encoded or JSON IPN body into a flat string record. */
async function parseIpnBody(request: NextRequest): Promise<Record<string, string>> {
  const contentType = request.headers.get('content-type') ?? '';
  const out: Record<string, string> = {};
  if (contentType.includes('application/json')) {
    const json = (await request.json()) as Record<string, unknown>;
    for (const [k, v] of Object.entries(json)) out[k] = String(v ?? '');
    return out;
  }
  const form = await request.formData();
  for (const [k, v] of form.entries()) out[k] = typeof v === 'string' ? v : '';
  return out;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await parseIpnBody(request);
    const result = await handleIpn(payload);

    if (!result.ok) {
      // Acknowledge with the mapped status; the gateway may retry on 5xx.
      return NextResponse.json(
        { ok: false, error: result.error.code },
        { status: result.error.code === 'INTERNAL' ? 500 : 200 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error('IPN handler failed', {
      error: error instanceof Error ? error.message : 'unknown',
    });
    return NextResponse.json({ ok: false }, { status: statusForError(error) });
  }
}
