/**
 * Skeleton.tsx — content placeholder for the loading state (no layout shift).
 *
 * SEVEN STATES (a Skeleton IS the loading affordance; other states are n/a):
 *   default        : pulsing bg-surface-subtle block; defaults to rounded-md (design.md signature radius).
 *   hover/active   : n/a — not interactive.
 *   focus-visible  : n/a — not focusable.
 *   disabled       : n/a.
 *   loading        : its sole purpose — reserve the final element's footprint so swap-in causes no CLS.
 *   error          : n/a — caller replaces it with content or an error UI.
 *
 * A11y: aria-hidden by default (decorative). The region it lives in should expose aria-busy="true" and a
 *   single status announcement; many sibling skeletons must NOT each announce. Honors prefers-reduced-motion
 *   via the global policy (pulse collapses; the box still reserves space).
 */
import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const skeletonVariants = cva('block animate-pulse bg-surface-subtle', {
  variants: {
    radius: {
      sm: 'rounded-sm',
      md: 'rounded-md',
      pill: 'rounded-pill',
    },
  },
  defaultVariants: {
    radius: 'md',
  },
});

export type SkeletonProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof skeletonVariants>;

export function Skeleton({ radius, className, ...rest }: SkeletonProps) {
  return <span aria-hidden="true" className={cn(skeletonVariants({ radius }), className)} {...rest} />;
}

export { skeletonVariants };
