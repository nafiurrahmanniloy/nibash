'use server';
/**
 * actions.ts — auth server actions (THIN controllers).
 *
 * Each action: (1) reads input, (2) validates with the feature's zod schema,
 * (3) calls ONE service function, (4) returns a DTO/Result. No business logic,
 * no Supabase. The googleAction additionally performs the redirect the service
 * computed (a pure controller concern).
 */
import { redirect } from 'next/navigation';
import {
  loginInputSchema,
  signupInputSchema,
  err,
  type AuthUserDTO,
  type Result,
} from '@nibash/shared';
import { zodToApiError } from '@/lib/errors';
import * as service from './auth.service.js';

export async function signupAction(input: unknown): Promise<Result<AuthUserDTO>> {
  const parsed = signupInputSchema.safeParse(input);
  if (!parsed.success) {
    return err('VALIDATION', 'Please fix the errors below', zodToApiError(parsed.error));
  }
  return service.signup(parsed.data);
}

export async function loginAction(input: unknown): Promise<Result<AuthUserDTO>> {
  const parsed = loginInputSchema.safeParse(input);
  if (!parsed.success) {
    return err('VALIDATION', 'Please fix the errors below', zodToApiError(parsed.error));
  }
  return service.login(parsed.data);
}

/**
 * Start Google OAuth. On success the controller redirects the browser to the
 * provider URL the service produced; on failure it returns the Result for the UI.
 */
export async function googleAction(): Promise<Result<never>> {
  const result = await service.startGoogleOAuth();
  if (!result.ok) return result;
  redirect(result.data.url);
}

export async function logoutAction(): Promise<Result<null>> {
  return service.logout();
}
