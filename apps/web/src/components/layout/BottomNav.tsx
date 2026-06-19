'use client';

/**
 * BottomNav.tsx — mobile bottom navigation (design.md §4.6).
 * Tabs: Explore / Booking / Inbox / Alerts / Profile. The active item uses
 * text-brand + a filled icon + label; others use text-content-muted. Marked as a
 * navigation landmark; the active tab carries aria-current="page". Targets are
 * ≥44px. Hidden on md+ (the top Nav covers desktop).
 *
 * Seven states for each tab (anchor): default (muted) / hover (subtle bg) /
 * focus-visible (token ring) / active==current route (text-brand + filled icon) /
 * disabled (n/a — every tab routes) / loading (n/a — client nav) / error (n/a).
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  CalendarCheck,
  MessageSquare,
  Bell,
  User,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';

type Tab = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Prefix used to determine the active state (handles nested routes). */
  match: string;
};

const TABS: Tab[] = [
  { label: 'Explore', href: '/search', icon: Compass, match: '/search' },
  { label: 'Booking', href: '/bookings', icon: CalendarCheck, match: '/bookings' },
  { label: 'Inbox', href: '/inbox', icon: MessageSquare, match: '/inbox' },
  { label: 'Alerts', href: '/notifications', icon: Bell, match: '/notifications' },
  { label: 'Profile', href: '/profile', icon: User, match: '/profile' },
];

function isActive(pathname: string, match: string): boolean {
  return pathname === match || pathname.startsWith(`${match}/`);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line-default bg-surface-raised md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.match);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-[44px] flex-col items-center justify-center gap-1 py-2 text-xs transition-colors duration-instant',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
                  active
                    ? 'text-brand'
                    : 'text-content-muted hover:bg-surface-subtle hover:text-content-secondary',
                )}
              >
                <Icon
                  className="h-5 w-5"
                  aria-hidden="true"
                  // Filled affordance for the active tab; outline otherwise.
                  fill={active ? 'currentColor' : 'none'}
                  strokeWidth={active ? 1.5 : 2}
                />
                <span className={cn(active && 'font-medium')}>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
