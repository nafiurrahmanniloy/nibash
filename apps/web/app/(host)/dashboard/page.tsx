/**
 * Host dashboard (stub) — server component (thin).
 * Phase 3 composes the host feature (upcoming stays, earnings, incoming requests).
 * For now it resolves the host identity (middleware already gates the route) and
 * renders a minimal shell so the protected route exists end-to-end.
 */
import type { Metadata } from 'next';
import { getCurrentUser } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Host dashboard',
};

export default async function HostDashboardPage() {
  const user = await getCurrentUser();
  const name = user.ok && user.data ? (user.data.fullName ?? 'there') : 'there';

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-content-primary">
        Welcome, {name}
      </h1>
      <p className="mt-2 text-content-secondary">
        Your hosting tools — listings, availability, and incoming requests — will
        appear here.
      </p>
    </div>
  );
}
