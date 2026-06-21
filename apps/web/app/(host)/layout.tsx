/**
 * (host) layout — wraps host tools (dashboard, listing wizard, calendar).
 * Access is enforced by middleware (role >= host on the /dashboard and /host
 * prefixes). This shell adds a simple host-area container; richer host chrome is a
 * Phase 3 concern.
 */
export default function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="page-shell py-8">{children}</div>;
}
