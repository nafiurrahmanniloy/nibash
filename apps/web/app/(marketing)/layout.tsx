/**
 * (marketing) layout — wraps home, blog, and legal pages.
 * The global Nav/Footer come from the root layout; this group adds no chrome of its
 * own beyond a content container, keeping marketing pages full-bleed-capable.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
