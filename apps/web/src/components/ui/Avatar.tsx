/**
 * Avatar.tsx — user image with initials fallback.
 *
 * SEVEN STATES (presentational; interactive states are n/a unless wrapped by a link/button):
 *   default        : circular (rounded-pill) image, or initials on bg-surface-subtle when no/failed image.
 *   hover/active   : n/a — the Avatar itself is not interactive.
 *   focus-visible  : n/a — focus belongs to any wrapping control.
 *   disabled       : n/a.
 *   loading        : `loading` → Skeleton-style pulse circle (no layout shift; size preserved).
 *   error          : a broken/missing image falls back to initials automatically (onError).
 *
 * A11y: when an image is shown, `alt` (from `name`) names it. The initials fallback is aria-hidden and the
 *   wrapper carries an aria-label so screen readers always announce the person, never the raw letters.
 */
'use client';

import { useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const avatarVariants = cva(
  'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-pill bg-surface-subtle font-body font-semibold text-brand uppercase',
  {
    variants: {
      size: {
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-14 w-14 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export type AvatarProps = VariantProps<typeof avatarVariants> & {
  /** Person's display name — used for alt text, the aria-label, and initials derivation. */
  name: string;
  /** Optional image URL; falls back to initials if absent or it fails to load. */
  src?: string;
  loading?: boolean;
  className?: string;
};

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2);
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).slice(0, 2);
}

export function Avatar({ name, src, size, loading = false, className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed && !loading;

  if (loading) {
    return (
      <span
        className={cn(avatarVariants({ size }), 'animate-pulse', className)}
        role="status"
        aria-label={`Loading ${name}`}
      />
    );
  }

  return (
    <span className={cn(avatarVariants({ size }), className)} aria-label={name} role="img">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- domain-agnostic primitive; no next/image coupling
        <img
          src={src}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{initialsFrom(name)}</span>
      )}
    </span>
  );
}

export { avatarVariants };
