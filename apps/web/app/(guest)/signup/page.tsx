/**
 * Signup — server component (thin) composing the auth feature.
 * Renders <SignupForm/> + <GoogleButton/>. Forms own client state and call the auth
 * server actions; this page only lays them out and links to login.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { SignupForm } from '@/features/auth';
import { cn } from '@/lib/cn';

export const metadata: Metadata = {
  title: 'Sign up',
};

const linkClass =
  'rounded-sm text-brand underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2';

export default function SignupPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold text-content-primary">
        Create your account
      </h1>
      <p className="mt-1 text-sm text-content-secondary">
        Join Nibash to book stays across Bangladesh.
      </p>

      {/* SignupForm already renders the fields, the divider, and the Google OAuth
          button — the page only frames it. */}
      <div className="mt-8">
        <SignupForm />
      </div>

      <p className="mt-8 text-sm text-content-secondary">
        Already have an account?{' '}
        <Link href="/login" className={cn(linkClass)}>
          Log in
        </Link>
      </p>
    </div>
  );
}
