/**
 * Profile — server component (thin).
 * Protected by middleware (auth required). Resolves the signed-in user via the auth
 * feature and renders their account summary. Editing forms are owned by the auth/
 * profile feature; this page composes them when present and otherwise shows the
 * resolved identity.
 */
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Your profile',
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user.ok || !user.data) {
    redirect('/login?next=/profile');
  }

  const me = user.data;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold text-content-primary">
        Your profile
      </h1>

      <dl className="mt-6 divide-y divide-line-default rounded-md border border-line-default bg-surface-raised">
        <div className="flex items-center justify-between gap-4 p-4">
          <dt className="text-sm text-content-secondary">Name</dt>
          <dd className="text-sm font-medium text-content-primary">
            {me.fullName ?? '—'}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 p-4">
          <dt className="text-sm text-content-secondary">Email</dt>
          <dd className="text-sm font-medium text-content-primary">{me.email}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 p-4">
          <dt className="text-sm text-content-secondary">Role</dt>
          <dd className="text-sm font-medium capitalize text-content-primary">
            {me.role}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 p-4">
          <dt className="text-sm text-content-secondary">Identity verified</dt>
          <dd className="text-sm font-medium text-content-primary">
            {me.identityVerified ? 'Yes' : 'Not yet'}
          </dd>
        </div>
      </dl>
    </div>
  );
}
