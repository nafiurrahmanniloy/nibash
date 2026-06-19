/**
 * Card.tsx — surface container primitive (design.md §4.2 anatomy host).
 *
 * SEVEN STATES (design.md §3) — a Card is presentational; interactivity is opt-in via `interactive`:
 *   default        : bg-surface-raised, rounded-md, shadow-soft-sm, border-line-default.
 *   hover          : when interactive, lifts shadow-soft-sm → shadow-soft-md (duration-instant).
 *   focus-visible  : when `asButton`, focus-visible:ring-2 ring-focus ring-offset-2 on the card itself.
 *   active         : when interactive, active:translate-y-px (subtle press).
 *   disabled       : when asButton + disabled → reduced opacity, not focusable, no pointer events.
 *   loading        : caller composes a Skeleton inside; Card preserves the rounded-md frame (no CLS).
 *   error          : caller renders danger content inside; Card stays neutral.
 *
 * A11y: a non-interactive Card is a plain <div>. For a clickable card, prefer wrapping ONE link/button
 *   child (design.md §4.2: whole card is one link). `asButton` is available for genuine button cards
 *   and forwards aria-* + keyboard semantics to a native <button>.
 */
'use client';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode, Ref } from 'react';
import { cn } from '@/lib/cn';

const cardBase = cn(
  'rounded-md border border-line-default bg-surface-raised shadow-soft-sm',
  'transition-shadow duration-instant ease-standard',
);

const interactiveBase = cn(
  'hover:shadow-soft-md active:translate-y-px',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
);

type CommonProps = {
  /** Adds hover-lift + press feedback (use when the whole card is a link/button). */
  interactive?: boolean;
  /** Inner padding preset. */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: ReactNode;
};

const paddingClass = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
} as const;

export type CardProps = HTMLAttributes<HTMLDivElement> &
  CommonProps & {
    asButton?: false;
  };

export type CardButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  CommonProps & {
    asButton: true;
  };

export type AnyCardProps = CardProps | CardButtonProps;

export const Card = forwardRef<HTMLDivElement | HTMLButtonElement, AnyCardProps>(function Card(
  props,
  ref,
) {
  const { interactive = false, padding = 'md', className, children } = props;

  const classes = cn(cardBase, paddingClass[padding], (interactive || props.asButton) && interactiveBase, className);

  if (props.asButton) {
    const { asButton: _asButton, interactive: _i, padding: _p, className: _c, children: _ch, type = 'button', ...rest } = props;
    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        type={type}
        className={cn(classes, 'block w-full text-left disabled:pointer-events-none disabled:opacity-60')}
        {...rest}
      >
        {children}
      </button>
    );
  }

  const { interactive: _i2, padding: _p2, className: _c2, children: _ch2, asButton: _a2, ...rest } = props;
  return (
    <div ref={ref as Ref<HTMLDivElement>} className={classes} {...rest}>
      {children}
    </div>
  );
});
