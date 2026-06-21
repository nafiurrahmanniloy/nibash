/**
 * Footer.tsx — global footer (server component shell).
 * Static link columns + legal links. All links carry the focus-visible ring and
 * hover color shift (design.md §6). Pure presentation — no data fetching.
 *
 * Legal links route to the (marketing) /legal/[doc] surface; column data is local
 * structure (not a content dump), kept minimal and typed.
 */
import Link from 'next/link';
import { cn } from '@/lib/cn';

const focusRing =
  'rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2';

type FooterLink = { label: string; href: string };
type FooterColumn = { heading: string; links: FooterLink[] };

const COLUMNS: FooterColumn[] = [
  {
    heading: 'Stays',
    links: [
      { label: 'Apartments', href: '/apartments' },
      { label: 'Rooms', href: '/rooms/dhaka' },
      { label: 'Hotels', href: '/hotels/dhaka' },
      { label: 'Popular locations', href: '/popular-locations' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blogs' },
      { label: 'Become a host', href: '/dashboard' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Terms', href: '/legal/terms' },
      { label: 'Privacy', href: '/legal/privacy' },
      { label: 'Cancellation policy', href: '/legal/cancellation' },
    ],
  },
];

const SOCIALS: FooterLink[] = [
  { label: 'Facebook', href: 'https://facebook.com' },
  { label: 'Instagram', href: 'https://instagram.com' },
  { label: 'TikTok', href: 'https://tiktok.com' },
  { label: 'LinkedIn', href: 'https://linkedin.com' },
  { label: 'YouTube', href: 'https://youtube.com' },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line-default bg-surface-raised">
      {/* Extra bottom padding on mobile so the whole footer (incl. the link
          columns) can scroll clear of the fixed BottomNav on guest routes; the
          short bottom-nav (~64px) plus breathing room. Removed at md where the
          BottomNav is hidden. */}
      <div className="page-shell pb-28 pt-8 md:pb-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <p className="font-display text-lg font-bold text-brand">Nibash</p>
            <p className="mt-2 text-sm text-content-secondary">
              Short stays across Bangladesh. Request, pay, and stay with confidence.
            </p>
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'text-sm text-content-muted transition-colors duration-instant hover:text-content-primary',
                      focusRing,
                    )}
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          {COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="text-sm font-semibold text-content-primary">
                {column.heading}
              </h2>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={`${column.heading}-${link.href}-${link.label}`}>
                    <Link
                      href={link.href}
                      className={cn(
                        'text-sm text-content-secondary transition-colors duration-instant hover:text-content-primary',
                        focusRing,
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t border-line-default pt-6 text-sm text-content-muted md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Nibash. All rights reserved.</p>
          <p>Prices in BDT (৳) · Asia/Dhaka</p>
        </div>
      </div>
    </footer>
  );
}
