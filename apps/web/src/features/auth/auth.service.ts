/**
 * auth.service.ts — auth business logic (framework-agnostic, no Supabase, no req/res).
 *
 * Orchestrates the repository, applies rules (default role, profile seeding), and
 * maps raw `Profile` rows → the public `AuthUserDTO`. Returns `Result<T>` for
 * expected failures so the controller maps one error shape (ARCHITECTURE.md §4).
 *
 * It reads identity-return URLs from validated env (lib/env.ts) — never hardcoded —
 * and passes them down to the repository.
 */
import {
  authUserDTOSchema,
  ok,
  err,
  type AuthUserDTO,
  type LoginInput,
  type Profile,
  type Result,
  type SignupInput,
} from '@travela/shared';
import { clientEnv } from '@/lib/env';
import { toApiError } from '@/lib/errors';
import * as repo from './auth.repository.js';

/** Map an internal profile row → the client-safe AuthUserDTO. */
function toAuthUserDTO(profile: Profile, email: string): AuthUserDTO {
  return authUserDTOSchema.parse({
    id: profile.id,
    email,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
    role: profile.role,
    identityVerified: profile.identity_verified,
  });
}

const authCallbackUrl = () => `${clientEnv.NEXT_PUBLIC_SITE_URL}/auth/callback`;

/**
 * Register a new user. Creates the auth user, then ensures a matching profile row
 * exists (a DB trigger may also seed it; ensureProfileRow is idempotent).
 */
export async function signup(input: SignupInput): Promise<Result<AuthUserDTO>> {
  try {
    const identity = await repo.signUp({
      email: input.email,
      password: input.password,
      fullName: input.fullName,
      role: input.role,
      emailRedirectTo: authCallbackUrl(),
    });
    const profile = await repo.ensureProfileRow({
      userId: identity.id,
      fullName: input.fullName,
      avatarUrl: null,
      role: input.role,
    });
    return ok(toAuthUserDTO(profile, identity.email));
  } catch (e) {
    return err('INTERNAL', 'Could not create your account', toApiError(e));
  }
}

/** Sign in with email + password and return the public user DTO. */
export async function login(input: LoginInput): Promise<Result<AuthUserDTO>> {
  try {
    const identity = await repo.signInWithPassword(input.email, input.password);
    // Safety net: OAuth-first users may lack a profile row; seed a guest profile.
    const profile = await repo.ensureProfileRow({
      userId: identity.id,
      fullName: null,
      avatarUrl: null,
      role: 'guest',
    });
    return ok(toAuthUserDTO(profile, identity.email));
  } catch (e) {
    return err('UNAUTHENTICATED', 'Invalid email or password', toApiError(e));
  }
}

/**
 * Begin Google OAuth. Returns the provider redirect URL for the controller to send
 * the browser to. Profile seeding happens at the callback (see ensureSession).
 */
export async function startGoogleOAuth(): Promise<Result<{ url: string }>> {
  try {
    const { url } = await repo.signInWithOAuthGoogle(authCallbackUrl());
    return ok({ url });
  } catch (e) {
    return err('INTERNAL', 'Could not start Google sign-in', toApiError(e));
  }
}

/** Sign the current user out. */
export async function logout(): Promise<Result<null>> {
  try {
    await repo.signOut();
    return ok(null);
  } catch (e) {
    return err('INTERNAL', 'Could not sign you out', toApiError(e));
  }
}

/**
 * Resolve the current session into a public user DTO, ensuring a profile exists.
 * Used by the OAuth callback and by server components needing the signed-in user.
 */
export async function getCurrentUser(): Promise<Result<AuthUserDTO | null>> {
  try {
    const identity = await repo.getAuthIdentity();
    if (!identity) return ok(null);
    const profile = await repo.ensureProfileRow({
      userId: identity.id,
      fullName: null,
      avatarUrl: null,
      role: 'guest',
    });
    return ok(toAuthUserDTO(profile, identity.email));
  } catch (e) {
    return err('INTERNAL', 'Could not load your account', toApiError(e));
  }
}
