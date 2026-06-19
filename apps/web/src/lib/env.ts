/**
 * env.ts — environment loader with fail-fast zod validation (ARCHITECTURE.md §4,
 * BUILD-PLAN §8). Importing this module validates the process environment once at
 * boot; a missing/invalid var throws immediately with a readable message instead
 * of producing an undefined-key bug deep in a request path.
 *
 * Split surfaces:
 *  - `clientEnv`  : only NEXT_PUBLIC_* — safe to reference from client components.
 *  - `serverEnv`  : server-only secrets (service role, SSLCommerz, email/FCM).
 *
 * NEVER read `process.env.X` directly elsewhere — import from here so every var is
 * validated and typed.
 */
import { z } from 'zod';

/** Coerce the common "true"/"false"/"1"/"0" string env shapes to a boolean. */
const booleanEnv = z
  .enum(['true', 'false', '1', '0'])
  .transform((v) => v === 'true' || v === '1');

/* ── Public (browser-exposed) env ────────────────────────────────────────────── */
const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().min(1),
});

/* ── Server-only env (secrets) ───────────────────────────────────────────────── */
const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE: z.string().min(1),
  SSLCOMMERZ_STORE_ID: z.string().min(1),
  SSLCOMMERZ_STORE_PASSWORD: z.string().min(1),
  SSLCOMMERZ_IS_SANDBOX: booleanEnv.default('true'),
  // Email + push are optional until their phases are wired; validated when present.
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).optional(),
  FCM_PROJECT_ID: z.string().min(1).optional(),
  FCM_CLIENT_EMAIL: z.string().min(1).optional(),
  FCM_PRIVATE_KEY: z.string().min(1).optional(),
});

export type ClientEnv = z.infer<typeof clientSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

/** Format zod issues into a single actionable boot error. */
function formatIssues(prefix: string, error: z.ZodError): never {
  const lines = error.issues
    .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
  throw new Error(
    `[env] Invalid ${prefix} environment configuration:\n${lines}\n` +
      `Check your .env against .env.example (BUILD-PLAN §8).`,
  );
}

/**
 * NEXT_PUBLIC_* are inlined by the bundler, so they must be referenced statically
 * (not via dynamic key access) to survive client builds.
 */
function loadClientEnv(): ClientEnv {
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  });
  if (!parsed.success) formatIssues('public', parsed.error);
  return parsed.data;
}

function loadServerEnv(): ServerEnv {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) formatIssues('server', parsed.error);
  return parsed.data;
}

/** Validated public env — safe everywhere (client + server). */
export const clientEnv: ClientEnv = loadClientEnv();

/**
 * Validated server env. Accessing this on the client is a bug; guard so a stray
 * import doesn't leak secrets into a client bundle.
 */
export const serverEnv: ServerEnv =
  typeof window === 'undefined'
    ? loadServerEnv()
    : (new Proxy(
        {},
        {
          get() {
            throw new Error('[env] serverEnv accessed in a client context');
          },
        },
      ) as ServerEnv);
