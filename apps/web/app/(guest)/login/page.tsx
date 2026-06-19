/**
 * Login — server component (thin) composing the auth feature.
 * Renders <LoginForm/> + <GoogleButton/>. The forms own their client-side state and
 * call the auth server actions; this page only lays them out and links to signup.
 * (Post-auth redirect to the `next` destination is handled inside the auth feature
 * actions, so this thin page does not need to thread props the forms don't accept.)
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm, GoogleButton } from '@/features/auth';
import { cn } from '@/lib/cn';

export const metadata: Metadata = {
  title: 'Log in',
};

const linkClass =
  'rounded-sm text-brand underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2';

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12 md:px-6">
      <h1 className="font-display text-2xl font-bold text-content-primary">
        Welcome back
      </h1>
      <p className="mt-1 text-sm text-content-secondary">
        Log in to manage your stays and bookings.
      </p>

      <div className="mt-8 space-y-6">
        <LoginForm />

        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-line-default" />
          <span className="text-xs text-content-muted">or</span>
          <span className="h-px flex-1 bg-line-default" />
        </div>

        <GoogleButton />
      </div>

      <p className="mt-8 text-sm text-content-secondary">
        New to Travela?{' '}
        <Link href="/signup" className={cn(linkClass)}>
          Create an account
        </Link>
      </p>
    </div>
  );
}
