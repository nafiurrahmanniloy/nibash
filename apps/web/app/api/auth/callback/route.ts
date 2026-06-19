/**
 * OAuth callback — Supabase code exchange (thin HTTP boundary).
 *
 * After Google sign-in, Supabase redirects here with `?code=…`. We exchange the
 * code for a session (which writes the session cookies via the @supabase/ssr server
 * client), then redirect the user to their intended destination (`next`, defaulting
 * to home). On failure we send them to /login with an error flag.
 *
 * The Supabase client is created through lib/supabase/server (the sanctioned seam);
 * no table access or business logic lives here.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { clientEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Only allow same-origin relative redirects to avoid open-redirect abuse. */
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/';
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));
  const origin = clientEnv.NEXT_PUBLIC_SITE_URL;

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', origin));
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    logger.warn('OAuth code exchange failed', { error: error.message });
    return NextResponse.redirect(new URL('/login?error=oauth', origin));
  }

  return NextResponse.redirect(new URL(next, origin));
}
