/**
 * env.ts — fail-fast, zod-validated client config for the Expo app.
 *
 * Mirrors apps/web/src/lib/env.ts: validate the environment ONCE at module load
 * so a missing/misshaped var crashes at boot with a readable message instead of a
 * vague runtime failure deep in a screen. Only EXPO_PUBLIC_* vars are readable on
 * the device (Expo inlines them at build time) — no secrets here.
 *
 * Nothing hardcoded: every value comes from the environment (BUILD-PLAN §8).
 */
import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z
    .string({ required_error: 'EXPO_PUBLIC_SUPABASE_URL is required' })
    .url('EXPO_PUBLIC_SUPABASE_URL must be a valid URL'),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z
    .string({ required_error: 'EXPO_PUBLIC_SUPABASE_ANON_KEY is required' })
    .min(1, 'EXPO_PUBLIC_SUPABASE_ANON_KEY must not be empty'),
});

/**
 * Expo statically replaces `process.env.EXPO_PUBLIC_*` references at build time,
 * so they must be read as explicit property accesses (not dynamic indexing).
 */
const parsed = envSchema.safeParse({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
});

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(
    `Invalid mobile environment. Check apps/mobile/.env against .env.example:\n${issues}`,
  );
}

export const env = Object.freeze({
  supabaseUrl: parsed.data.EXPO_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: parsed.data.EXPO_PUBLIC_SUPABASE_ANON_KEY,
});

export type Env = typeof env;
