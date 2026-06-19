/**
 * supabase/admin.ts — service-role Supabase client that BYPASSES RLS. Server-only,
 * privileged paths: the SSLCommerz IPN handler, admin moderation tasks, and trusted
 * server actions that must act as the platform (not a user).
 *
 * Hard rule: never import this into a client bundle. The `server-only` import makes
 * a client import fail the build. Memoized per server process.
 */
import 'server-only';
import { createServiceRoleClient, type TypedSupabaseClient } from '@nibash/shared';
import { clientEnv, serverEnv } from '../env.js';

let cached: TypedSupabaseClient | undefined;

export function getAdminSupabase(): TypedSupabaseClient {
  if (cached) return cached;
  cached = createServiceRoleClient({
    url: clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    key: serverEnv.SUPABASE_SERVICE_ROLE,
  });
  return cached;
}
