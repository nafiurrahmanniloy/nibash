/**
 * auth.repository.ts — the ONLY auth-feature file that talks to Supabase.
 *
 * Wraps Supabase Auth + the `profiles` table. Every function returns either
 * narrow data the service can consume or throws a thin, typed error. Naming of
 * tables (`profiles`) and the supabase auth client live here and nowhere else
 * (ARCHITECTURE.md §1: repository = the only Supabase seam).
 *
 * The service maps these raw rows → the Profile/AuthUser DTO; this layer never
 * shapes client responses.
 */
import type { Profile, UserRole } from '@travela/shared';
import { createServerSupabase } from '@/lib/supabase/server';
import { RepositoryError } from '@/lib/errors';

/** Result of a credential auth call — the auth user id + email only. */
export interface AuthIdentity {
  id: string;
  email: string;
}

export interface SignUpParams {
  email: string;
  password: string;
  /** Stored in auth user_metadata so a DB trigger / ensureProfileRow can seed the profile. */
  fullName: string;
  role: UserRole;
  /** Where the email-confirmation / OAuth flow returns to (env-driven, passed by service). */
  emailRedirectTo: string;
}

/**
 * Create an auth user with email + password. Profile metadata is attached so the
 * profile row can be seeded (either by a DB trigger or ensureProfileRow).
 */
export async function signUp(params: SignUpParams): Promise<AuthIdentity> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      emailRedirectTo: params.emailRedirectTo,
      data: { full_name: params.fullName, role: params.role },
    },
  });
  if (error) throw new RepositoryError(error.message, { cause: error });
  if (!data.user) throw new RepositoryError('Sign-up did not return a user');
  return { id: data.user.id, email: data.user.email ?? params.email };
}

/** Sign in with email + password. Establishes the server session cookie. */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<AuthIdentity> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new RepositoryError(error.message, { cause: error });
  if (!data.user) throw new RepositoryError('Sign-in did not return a user');
  return { id: data.user.id, email: data.user.email ?? email };
}

/**
 * Begin an OAuth (Google) flow. Returns the provider URL the controller redirects
 * the browser to. PKCE/code-exchange completes at the auth callback route.
 */
export async function signInWithOAuthGoogle(redirectTo: string): Promise<{ url: string }> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  if (error) throw new RepositoryError(error.message, { cause: error });
  if (!data.url) throw new RepositoryError('OAuth did not return a redirect URL');
  return { url: data.url };
}

/** End the current session. */
export async function signOut(): Promise<void> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw new RepositoryError(error.message, { cause: error });
}

/** The currently authenticated auth identity, or null when signed out. */
export async function getAuthIdentity(): Promise<AuthIdentity | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? '' };
}

/** Read a single profile row by id, or null if it does not exist. */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, full_name, avatar_url, phone, role, languages, identity_verified, bio, created_at, updated_at',
    )
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new RepositoryError(error.message, { cause: error });
  return data;
}

export interface EnsureProfileParams {
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: UserRole;
}

/**
 * Idempotently ensure a profile row exists for an auth user. Used after OAuth
 * sign-in (where no metadata-trigger ran) and as a safety net after email signup.
 * Upsert on the primary key keeps it a single round-trip and race-safe.
 */
export async function ensureProfileRow(params: EnsureProfileParams): Promise<Profile> {
  const supabase = await createServerSupabase();
  const existing = await getProfile(params.userId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: params.userId,
        full_name: params.fullName,
        avatar_url: params.avatarUrl,
        role: params.role,
        identity_verified: false,
      },
      { onConflict: 'id' },
    )
    .select(
      'id, full_name, avatar_url, phone, role, languages, identity_verified, bio, created_at, updated_at',
    )
    .single();
  if (error) throw new RepositoryError(error.message, { cause: error });
  return data;
}
