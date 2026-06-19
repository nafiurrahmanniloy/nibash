/**
 * Nav.tsx — top app bar (server component shell).
 * Composes: brand wordmark, a search entry that links into /search, and auth
 * links. Interactive items are real links/buttons with token classes and a
 * visible focus ring (design.md §6). No business logic or data fetching here —
 * auth-aware affordances are progressively layered by the auth feature later; this
 * shell renders the always-present links.
 *
 * Interactive elements documented states (links inherit the global focus-visible
 * ring + per-element ring tokens): default / hover (color shift) / focus-visible
 * (ring) / active (darker) / disabled (n/a for links) / loading (n/a) / error (n/a).
 */
import Link from 'next/link';
import { Search, Menu } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button-variants';
import { cn } from '@/lib/cn';
import { getCurrentUser, LogoutButton } from '@/features/auth';

const focusRing =
  'rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2';

export async function Nav() {
  // Auth-aware: resolve the session so the bar shows the right affordances.
  const me = await getCurrentUser();
  const user = me.ok ? me.data : null;

  return (
    <header className="sticky top-0 z-40 border-b border-line-default bg-surface-raised/95 backdrop-blur">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6"
      >
        {/* Brand */}
        <Link
          href="/"
          className={cn(
            'font-display text-xl font-bold text-brand transition-colors duration-instant hover:text-brand-hover',
            focusRing,
          )}
        >
          Nibash
        </Link>

        {/* Search entry — links into the discovery surface */}
        <Link
          href="/search"
          aria-label="Search stays"
          className={cn(
            'hidden flex-1 items-center gap-2 rounded-pill border border-line-default bg-surface-base px-4 py-2 text-sm text-content-secondary shadow-soft-sm transition-colors duration-instant hover:border-line-strong md:flex md:max-w-md',
            focusRing,
          )}
        >
          <Search className="h-4 w-4 shrink-0 text-content-muted" aria-hidden="true" />
          <span>Where to? Anywhere · Any week · Add guests</span>
        </Link>

        {/* Auth + host links — signed-in vs signed-out affordances */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/bookings"
                className={cn(
                  'hidden rounded-pill px-3 py-2 text-sm font-medium text-content-primary transition-colors duration-instant hover:bg-surface-subtle sm:inline-block',
                  focusRing,
                )}
              >
                Trips
              </Link>
              <Link
                href="/dashboard"
                className={cn(
                  'hidden rounded-pill px-3 py-2 text-sm font-medium text-content-primary transition-colors duration-instant hover:bg-surface-subtle sm:inline-block',
                  focusRing,
                )}
              >
                Host
              </Link>
              <Link
                href="/profile"
                aria-label="Your profile"
                className={cn(
                  'hidden text-sm font-medium text-content-secondary sm:inline-block',
                  focusRing,
                )}
              >
                {user.fullName ?? user.email}
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className={cn(
                  'hidden rounded-pill px-3 py-2 text-sm font-medium text-content-primary transition-colors duration-instant hover:bg-surface-subtle sm:inline-block',
                  focusRing,
                )}
              >
                Become a host
              </Link>
              {/* Auth links styled with the Button variant classes (Button is a real
                  <button>, so links use buttonVariants to stay visually consistent). */}
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ variant: 'primary', size: 'sm' }),
                  'hidden sm:inline-flex',
                )}
              >
                Sign up
              </Link>
            </>
          )}
          {/* Mobile menu affordance → search surface */}
          <Link
            href="/search"
            aria-label="Open search"
            className={cn(
              'inline-flex h-11 w-11 items-center justify-center rounded-pill border border-line-default text-content-primary transition-colors duration-instant hover:bg-surface-subtle md:hidden',
              focusRing,
            )}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
