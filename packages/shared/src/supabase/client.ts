/**
 * client.ts — typed Supabase client factory shared by web + mobile.
 *
 * This is the cross-platform seam: app-level clients (apps/web/src/lib/supabase/*,
 * apps/mobile/...) call these factories with their own env + storage adapters so
 * every `SupabaseClient` in the codebase is `SupabaseClient<Database>` and fully
 * typed. No URLs/keys are hardcoded here — callers pass validated config (env is
 * validated at boot in each app's lib/env.ts).
 *
 * Architecture note: this factory is imported ONLY by app lib/supabase wrappers and
 * by *.repository.ts files — never by a service.
 */
import {
  createClient,
  type SupabaseClient,
  type SupabaseClientOptions,
} from '@supabase/supabase-js';
import type { Database } from './database.types.js';

/** A Database-typed Supabase client — the only client type used across the app. */
export type TypedSupabaseClient = SupabaseClient<Database>;

export interface SupabaseClientConfig {
  /** Project URL, e.g. process.env.SUPABASE_URL (validated by the app's env loader). */
  url: string;
  /** anon (public) key OR service-role key depending on the factory used. */
  key: string;
  /** Optional passthrough to supabase-js (auth storage, headers, realtime, etc.). */
  options?: SupabaseClientOptions<'public'>;
}

/**
 * Anon/public client — RLS-enforced. Use for browser, server-rendered reads,
 * and any path acting as the signed-in user.
 */
export function createAnonClient(config: SupabaseClientConfig): TypedSupabaseClient {
  return createClient<Database>(config.url, config.key, config.options);
}

/**
 * Service-role client — BYPASSES RLS. Server-only (IPN handler, admin tasks,
 * trusted server actions). Never import into client bundles. Auth session
 * persistence is disabled by default since it acts as the platform, not a user.
 */
export function createServiceRoleClient(
  config: SupabaseClientConfig,
): TypedSupabaseClient {
  return createClient<Database>(config.url, config.key, {
    ...config.options,
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      ...config.options?.auth,
    },
  });
}

export type { SupabaseClient, SupabaseClientOptions };
