/**
 * middleware.ts — Supabase session refresh + route protection.
 *
 * 1. Refreshes the auth session on every matched request (@supabase/ssr pattern):
 *    reads cookies from the request, lets Supabase rotate them, and writes the
 *    updated cookies onto the response. Without this, server reads see a stale
 *    session.
 * 2. Guards the (host) and (admin) route groups by role. Unauthenticated users are
 *    redirected to /login (with a `next` param); authenticated-but-wrong-role users
 *    are redirected to a safe surface.
 *
 * Roles live on the `profiles` row (build plan §3). Note: route GROUPS like (host)
 * are not part of the URL — we map real path prefixes to required roles here.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Database, UserRole } from '@travela/shared';
import { DEMO_MODE, DEMO_COOKIE, DEMO_ROLE } from '@/lib/demo/flag';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Path prefixes that require a signed-in user, with the minimum role required. */
const PROTECTED_PREFIXES: ReadonlyArray<{ prefix: string; role: UserRole }> = [
  { prefix: '/dashboard', role: 'host' }, // (host) group
  { prefix: '/host', role: 'host' },
  { prefix: '/admin', role: 'admin' }, // (admin) group
];

/** Guest-area prefixes that require any signed-in user (no specific role). */
const AUTH_ONLY_PREFIXES: readonly string[] = ['/bookings', '/profile'];

function requiredRoleFor(pathname: string): UserRole | 'any' | null {
  for (const { prefix, role } of PROTECTED_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return role;
  }
  for (const prefix of AUTH_ONLY_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return 'any';
  }
  return null;
}

/** admin satisfies host-gated routes; host does not satisfy admin-gated routes. */
function roleSatisfies(actual: UserRole, required: UserRole | 'any'): boolean {
  if (required === 'any') return true;
  if (actual === 'admin') return true;
  return actual === required;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // DEMO_MODE: no real Supabase to ask, so gate protected routes on the demo session
  // cookie + the fixed demo role. Short-circuits before any Supabase client is created.
  if (DEMO_MODE) {
    const required = requiredRoleFor(pathname);
    if (!required) return NextResponse.next();
    const signedIn = Boolean(request.cookies.get(DEMO_COOKIE)?.value);
    if (!signedIn) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (required !== 'any' && !roleSatisfies(DEMO_ROLE, required)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Refresh + read the user (do not run logic between createServerClient and this).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const required = requiredRoleFor(pathname);

  if (required) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (required !== 'any') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const role = (profile?.role ?? 'guest') as UserRole;
      if (!roleSatisfies(role, required)) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }

  return response;
}

/**
 * Run on app routes only; skip static assets, image optimizer, favicon, and the
 * SSLCommerz IPN endpoint (server-to-server, no user session).
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/payments/ipn|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
