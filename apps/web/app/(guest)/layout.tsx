/**
 * (guest) layout — wraps the guest-facing app surfaces (search, listing detail,
 * bookings, profile, auth). Adds the mobile BottomNav (design.md §4.6) and bottom
 * padding so content clears it. Route protection for /bookings and /profile is
 * enforced in middleware.ts, not here.
 */
import { BottomNav } from '@/components/layout/BottomNav';

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pb-16 md:pb-0">
      {children}
      <BottomNav />
    </div>
  );
}
