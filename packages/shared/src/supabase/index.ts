/**
 * supabase/index.ts — barrel for the typed Supabase contract + client factories.
 * Imported only by app lib/supabase wrappers and *.repository.ts files.
 */
export type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from './database.types.js';

export {
  createAnonClient,
  createServiceRoleClient,
} from './client.js';
export type {
  TypedSupabaseClient,
  SupabaseClientConfig,
  SupabaseClient,
  SupabaseClientOptions,
} from './client.js';
