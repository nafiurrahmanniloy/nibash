/**
 * supabase.ts — the Expo app's single Supabase seam.
 *
 * Architecture (ARCHITECTURE.md §1–2): the shared `createAnonClient` factory is the
 * cross-platform client; an app-level wrapper like this is the ONLY place outside a
 * *.repository.ts that may touch Supabase. Screens/components never import this — they
 * go through feature repositories/services (added per phase). It exists now so the
 * mobile app shares the exact same `Database`-typed client as web.
 *
 * React Native specifics:
 *  - `react-native-url-polyfill/auto` patches the URL API supabase-js relies on.
 *  - The anon client is RLS-guarded; the service-role key is server-only and never
 *    bundled into the device app.
 */
import 'react-native-url-polyfill/auto';
import { createAnonClient, type TypedSupabaseClient } from '@travela/shared/supabase';
import { env } from './env';

/**
 * Database-typed anon client for the device. Session persistence uses supabase-js
 * defaults for now; a secure-storage adapter (expo-secure-store / AsyncStorage) is
 * wired when the auth phase lands on mobile.
 */
export const supabase: TypedSupabaseClient = createAnonClient({
  url: env.supabaseUrl,
  key: env.supabaseAnonKey,
  options: {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
});
