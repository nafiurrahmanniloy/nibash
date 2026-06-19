/**
 * Root layout — loads fonts via next/font, applies the global stylesheet, and
 * renders the persistent app shell (Nav + Footer) around route content.
 *
 * Bricolage Grotesque (display) + Inter (body) are exposed as CSS variables
 * (--font-display / --font-body) consumed by tailwind.config.ts so `font-display`
 * and `font-body` resolve to the loaded fonts. This file is a thin composition
 * boundary — no business logic, no data fetching.
 */
import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Inter } from 'next/font/google';
import { clientEnv } from '@/lib/env';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

export const metadata: Metadata = {
  metadataBase: new URL(clientEnv.NEXT_PUBLIC_SITE_URL),
  title: {
    default: 'Nibash — Short stays across Bangladesh',
    template: '%s · Nibash',
  },
  description:
    'Find and book apartments, rooms, villas, and resorts across Bangladesh. Request to book, pay securely, stay confidently.',
};

export const viewport: Viewport = {
  themeColor: '#0E5C4A',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${bricolage.variable}`}>
      <body className="min-h-dvh flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
