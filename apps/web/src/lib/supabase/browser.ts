/**
 * supabase/browser.ts — RLS-enforced Supabase client for Client Components.
 * Uses the public anon key only (validated via clientEnv). Created lazily and
 * memoized so one browser client instance is reused across the tab.
 *
 * Repository seam: only lib/supabase/* and client-side hooks in features may use
 * this; services never import it.
 */
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@nibash/shared';
import { clientEnv } from '../env.js';

let cached: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createBrowserSupabase() {
  if (cached) return cached;
  cached = createBrowserClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  return cached;
}
