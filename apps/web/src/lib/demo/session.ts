/**
 * demo/session.ts — a cookie-backed fake auth session for DEMO_MODE.
 *
 * Stands in for Supabase Auth when there's no real backend: signing in/up sets a
 * cookie, getAuthIdentity reads it, signing out clears it. The auth.repository calls
 * these in demo mode so the whole sign-in → nav-reflects-user → protected-routes flow
 * works. Writes (set/delete) must run from a Server Action or Route Handler.
 */
import { cookies } from 'next/headers';
import { DEMO_USER } from './data';
import { DEMO_COOKIE } from './flag';

export { DEMO_COOKIE };

export interface DemoIdentity {
  id: string;
  email: string;
}

/** Current demo identity from the cookie, or null when signed out. */
export async function getDemoIdentity(): Promise<DemoIdentity | null> {
  const store = await cookies();
  const cookie = store.get(DEMO_COOKIE);
  if (!cookie?.value) return null;
  return { id: DEMO_USER.id, email: cookie.value };
}

/** Start a demo session for the given email (any password is accepted in demo). */
export async function setDemoSession(email: string): Promise<void> {
  const store = await cookies();
  store.set(DEMO_COOKIE, email, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

/** End the demo session. */
export async function clearDemoSession(): Promise<void> {
  const store = await cookies();
  store.delete(DEMO_COOKIE);
}

export { DEMO_USER };
