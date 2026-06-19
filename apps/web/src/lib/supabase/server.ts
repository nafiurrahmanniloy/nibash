/**
 * supabase/server.ts — RLS-enforced Supabase client for Server Components, Route
 * Handlers, and Server Actions. Built on @supabase/ssr with Next's cookie store so
 * the signed-in user's session is read (and refreshed) per request.
 *
 * This is part of the repository seam: only lib/supabase/* and *.repository.ts may
 * import a Supabase client. Services never see this.
 */
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@travela/shared';
import { clientEnv } from '../env.js';

/**
 * Create a request-scoped client. Note: in pure Server Components the cookie store
 * is read-only, so `setAll` is wrapped in try/catch — session writes happen in
 * middleware (see apps/web/middleware.ts), which is the supported pattern.
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component render — ignore; middleware refreshes.
          }
        },
      },
    },
  );
}
