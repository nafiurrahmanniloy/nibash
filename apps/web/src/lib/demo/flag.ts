/**
 * demo/flag.ts — the single source of truth for "are we in demo mode?".
 *
 * Driven by validated env (NEXT_PUBLIC_DEMO_MODE) so it's typed and boot-checked like
 * everything else. Kept in its own tiny module so repositories can import the flag
 * without pulling in the cookie/session code (next/headers).
 */
import { clientEnv } from '@/lib/env';

export const DEMO_MODE = clientEnv.NEXT_PUBLIC_DEMO_MODE === true;

/** Cookie that backs the demo auth session (read in middleware + the auth repo). */
export const DEMO_COOKIE = 'demo_session';

/** Role the demo user carries (host → can reach guest + host surfaces). */
export const DEMO_ROLE = 'host' as const;
