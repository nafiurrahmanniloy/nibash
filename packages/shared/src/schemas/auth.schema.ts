/**
 * auth.schema.ts — signup / login input contracts.
 * These validate request bodies at the controller boundary before any service runs.
 */
import { z } from 'zod';

export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email');

/**
 * Password policy for v1: ≥ 8 chars, at least one letter and one number.
 * Kept deliberately simple; tighten in Phase 8 hardening.
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const signupInputSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    fullName: z.string().trim().min(2, 'Enter your full name').max(120),
    // Default role for self-signup is guest; host onboarding upgrades later.
    role: z.enum(['guest', 'host']).default('guest'),
  })
  .strict();
export type SignupInput = z.infer<typeof signupInputSchema>;

export const loginInputSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, 'Enter your password'),
  })
  .strict();
export type LoginInput = z.infer<typeof loginInputSchema>;

/** Public, client-safe view of the signed-in user (never the raw profile row). */
export const authUserDTOSchema = z.object({
  id: z.string().uuid(),
  email: emailSchema,
  fullName: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  role: z.enum(['guest', 'host', 'admin']),
  identityVerified: z.boolean(),
});
export type AuthUserDTO = z.infer<typeof authUserDTOSchema>;
