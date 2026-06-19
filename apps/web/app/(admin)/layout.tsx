/**
 * (admin) layout — wraps the admin area (moderation, collections, payouts, CMS).
 * Access is enforced by middleware (role === admin on the /admin prefix). Minimal
 * container shell; the admin feature provides the real chrome in Phase 6.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">{children}</div>;
}
