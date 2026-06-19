/**
 * Badge.tsx — small non-interactive status/label token.
 *
 * SEVEN STATES (a Badge is presentational; interactive states are n/a):
 *   default        : tone-based fill + text token, rounded-pill, text-xs/medium.
 *   hover/active   : n/a — not interactive (no pointer affordance).
 *   focus-visible  : n/a — not focusable.
 *   disabled       : n/a.
 *   loading        : caller swaps to a Skeleton; Badge does not animate.
 *   error          : expressed via the `danger` tone, not by colour alone — text carries the meaning.
 *
 * A11y: meaning is conveyed by the label text, not colour alone (WCAG 1.4.1). Amber `accent` tone is used
 *   only as a fill with bold text (design.md: amber may be a fill/badge, never body-size amber text on light).
 */
import type { HTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-pill px-2 py-0.5 font-body text-xs font-semibold',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-subtle text-content-secondary',
        brand: 'bg-surface-subtle text-brand',
        accent: 'bg-accent text-content-primary',
        success: 'bg-surface-subtle text-status-success',
        danger: 'bg-surface-danger text-content-danger',
      },
    },
    defaultVariants: {
      tone: 'neutral',
    },
  },
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants> & {
    /** Optional leading icon (decorative). */
    icon?: ReactNode;
    children: ReactNode;
  };

export function Badge({ tone, icon, className, children, ...rest }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...rest}>
      {icon ? (
        <span className="inline-flex shrink-0" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  );
}

export { badgeVariants };
