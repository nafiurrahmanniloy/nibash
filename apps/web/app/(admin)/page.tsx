/**
 * Admin home (stub) — server component (thin).
 * Phase 6 composes the admin feature (moderation, collections, payouts, blog CMS).
 * Middleware gates this route to admins; this shell confirms the surface exists.
 */
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin',
};

export default function AdminHomePage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-content-primary">Admin</h1>
      <p className="mt-2 text-content-secondary">
        Moderation, collections, payouts, and the blog CMS will live here.
      </p>
    </div>
  );
}
