/**
 * Chip.tsx — filter / category pill toggle (design.md §4.3).
 *
 * SEVEN STATES (design.md §3):
 *   default        : bg-surface-raised, border-line-default, text-content-secondary, rounded-pill.
 *   hover          : border-line-strong (pointer feedback only).
 *   focus-visible  : focus-visible:ring-2 ring-focus ring-offset-2.
 *   active          : active:translate-y-px (pressed feedback).
 *   disabled       : text-content-muted + reduced surface, aria-disabled, not interactive.
 *   loading        : aria-busy; leading spinner; non-interactive (e.g. applying a server-side filter).
 *   error          : not a form field — caller surfaces filter errors elsewhere.
 *   SELECTED       : bg-surface-subtle + border-brand + text-brand (design.md §4.3), exposed via aria-pressed.
 *
 * A11y: real <button> with aria-pressed reflecting selection (state not by colour alone). Min 44px touch
 *   target via min-h-11 + horizontal padding. Space/Enter toggle natively.
 */
'use client';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Spinner } from './Spinner';

export type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> & {
  /** Whether the chip is currently selected (drives aria-pressed + styling). */
  selected?: boolean;
  disabled?: boolean;
  loading?: boolean;
  /** Leading icon/emoji (e.g. category glyph). */
  leadingIcon?: ReactNode;
  children: ReactNode;
};

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { selected = false, disabled = false, loading = false, leadingIcon, className, children, onClick, type = 'button', ...rest },
  ref,
) {
  const isInert = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={selected}
      aria-disabled={isInert || undefined}
      aria-busy={loading || undefined}
      disabled={disabled && !loading}
      onClick={(event) => {
        if (isInert) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      className={cn(
        'inline-flex min-h-11 items-center gap-2 rounded-pill border px-4',
        'font-body text-sm font-medium',
        'transition-colors duration-instant ease-standard',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
        'active:translate-y-px',
        selected
          ? 'border-brand bg-surface-subtle text-brand'
          : 'border-line-default bg-surface-raised text-content-secondary hover:border-line-strong',
        isInert && 'pointer-events-none border-line-default bg-surface-subtle text-content-muted',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Spinner size="sm" aria-label="Applying filter" className="text-current" />
      ) : leadingIcon ? (
        <span className="inline-flex shrink-0" aria-hidden="true">
          {leadingIcon}
        </span>
      ) : null}
      {children}
    </button>
  );
});
