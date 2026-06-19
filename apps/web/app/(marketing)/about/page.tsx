/**
 * About — /about. Static marketing page. Original Nibash copy (no scraped content).
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Wallet, Headphones, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Nibash',
  description:
    'Nibash is a Bangladesh-first stay platform — rooms, apartments, hotels, resorts, and villas, booked simply and securely.',
};

const VALUES = [
  { icon: ShieldCheck, title: 'Verified stays', body: 'Every host and listing is reviewed, so what you book is what you get.' },
  { icon: Wallet, title: 'Fair BDT pricing', body: 'Prices in taka, no hidden currency tricks. Pay securely at confirmation.' },
  { icon: Headphones, title: '24/7 support', body: 'Real people on phone, WhatsApp, and email whenever your trip needs them.' },
  { icon: MapPin, title: 'Local, everywhere', body: 'From Dhaka’s neighbourhoods to the coast and the hills — built for Bangladesh.' },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <p className="font-display text-sm font-semibold uppercase tracking-wide text-brand">
        About us
      </p>
      <h1 className="mt-2 font-display text-4xl font-bold text-content-primary">
        Wherever you go, there’s always a place for you.
      </h1>
      <p className="mt-4 text-md text-content-secondary">
        Nibash is a Bangladesh-first platform for short-term stays. We connect travellers
        with furnished rooms, apartments, hotels, resorts, and private villas across the
        country — and make booking them simple, secure, and affordable.
      </p>

      <h2 className="mt-10 font-display text-2xl font-bold text-content-primary">
        Our mission
      </h2>
      <p className="mt-3 text-content-secondary">
        We started Nibash to make great places to stay easy to find and trust — and to put
        more of every booking into the hands of local hosts. Whether you’re visiting family
        in Sylhet, working a week in Gulshan, or chasing the sea at Cox’s Bazar, we want the
        “where will we stay?” question to be the easiest part of the trip.
      </p>

      <h2 className="mt-10 font-display text-2xl font-bold text-content-primary">
        Why people choose Nibash
      </h2>
      <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {VALUES.map(({ icon: Icon, title, body }) => (
          <li
            key={title}
            className="rounded-md border border-line-default bg-surface-raised p-4 shadow-soft-sm"
          >
            <Icon className="h-6 w-6 text-brand" aria-hidden="true" />
            <h3 className="mt-2 font-semibold text-content-primary">{title}</h3>
            <p className="mt-1 text-sm text-content-secondary">{body}</p>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/search"
          className="rounded-pill bg-brand px-5 py-3 text-sm font-semibold text-content-inverse transition-colors duration-instant hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          Find a stay
        </Link>
        <Link
          href="/dashboard"
          className="rounded-pill border border-line-default px-5 py-3 text-sm font-semibold text-content-primary transition-colors duration-instant hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          Become a host
        </Link>
      </div>
    </div>
  );
}
