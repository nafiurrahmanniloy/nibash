'use client';
/**
 * GoogleButton — "Continue with Google".
 *
 * Seven states (design.md §3) are delivered by the underlying ui/Button:
 *   default / hover / focus-visible / active / disabled — Button tokens.
 *   loading  → isPending swaps label for spinner, keeps width, aria-busy.
 *   error    → surfaced inline below the button (role="alert", text-content-danger).
 * Icon + text control; accessible name comes from the visible label.
 */
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui';
import { googleAction } from '../actions.js';

export function GoogleButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      // googleAction redirects on success; only returns here on failure.
      const result = await googleAction();
      if (result && !result.ok) setError(result.error.message);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="secondary"
        onClick={handleClick}
        loading={isPending}
        disabled={isPending}
        className="w-full"
      >
        <span className="flex items-center justify-center gap-2">
          <GoogleMark />
          <span>Continue with Google</span>
        </span>
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-content-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Decorative brand mark — aria-hidden; the button text carries the name. */
function GoogleMark() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" focusable="false">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
