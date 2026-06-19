/**
 * Spinner.tsx — indeterminate progress indicator.
 *
 * SEVEN STATES (a non-interactive status element — states collapse to its single visual role):
 *   default        : rotating ring in currentColor (inherits parent text token).
 *   hover/active   : n/a — not interactive; no pointer affordance.
 *   focus-visible  : n/a — not focusable.
 *   disabled       : n/a.
 *   loading        : this component IS the loading affordance; role="status" + aria-label announce it.
 *   error          : n/a — caller swaps to an error UI.
 *
 * A11y: role="status" with an aria-label (default "Loading"). Honors prefers-reduced-motion
 *   via the global motion policy (animation collapses to ≤1ms; the status role still announces).
 */
import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const spinnerVariants = cva('inline-block animate-spin rounded-pill border-current border-solid', {
  variants: {
    size: {
      sm: 'h-4 w-4 border-2',
      md: 'h-5 w-5 border-2',
      lg: 'h-7 w-7 border-4',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export type SpinnerProps = Omit<HTMLAttributes<HTMLSpanElement>, 'role'> &
  VariantProps<typeof spinnerVariants> & {
    /** Accessible name announced to assistive tech. */
    'aria-label'?: string;
  };

export function Spinner({ size, className, 'aria-label': ariaLabel = 'Loading', ...rest }: SpinnerProps) {
  return (
    <span role="status" aria-label={ariaLabel} {...rest}>
      <span
        className={cn(spinnerVariants({ size }), 'border-r-transparent border-t-transparent', className)}
        aria-hidden="true"
      />
    </span>
  );
}
