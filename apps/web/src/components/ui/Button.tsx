/**
 * Button.tsx — domain-agnostic action primitive.
 *
 * SEVEN STATES (design.md §3):
 *   default        : variant base tokens (e.g. bg-brand text-content-inverse).
 *   hover          : darkens to the *-hover token via duration-instant; pointer-only, never the sole affordance.
 *   focus-visible  : focus-visible:ring-2 ring-focus ring-offset-2 (visible keyboard ring, WCAG 2.4.11).
 *   active         : active:translate-y-px + darker fill (pressed/depressed treatment).
 *   disabled       : bg-surface-subtle text-content-muted, aria-disabled, not focusable, no pointer events.
 *   loading        : Spinner replaces label, width preserved (label kept invisible), aria-busy, non-interactive.
 *   error          : owned by the caller/form (Button itself has no validation); danger variant available.
 *
 * A11y: min-h 44px at md size (primary target ≥44px). Icon-only requires `aria-label` (enforced by prop type).
 * Reduced motion: transitions are color/opacity/transform only and collapse under prefers-reduced-motion globally.
 */
'use client';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Spinner } from './Spinner';
import { buttonVariants, type ButtonVariantProps } from './button-variants';

type ButtonBaseProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> & {
  variant?: ButtonVariantProps['variant'];
  size?: ButtonVariantProps['size'];
  /** Stretch to fill the container width. */
  block?: boolean;
  /** Swaps the label for a spinner, preserves width, sets aria-busy and blocks interaction. */
  loading?: boolean;
  disabled?: boolean;
  /** Leading icon node. */
  leadingIcon?: ReactNode;
  /** Trailing icon node. */
  trailingIcon?: ReactNode;
};

/** Labelled (text) button — children act as the accessible name. */
export type LabelledButtonProps = ButtonBaseProps & {
  iconOnly?: false;
  children: ReactNode;
  'aria-label'?: string;
};

/** Icon-only button — `aria-label` is REQUIRED for the accessible name. */
export type IconOnlyButtonProps = ButtonBaseProps & {
  iconOnly: true;
  'aria-label': string;
  children: ReactNode;
};

export type ButtonProps = LabelledButtonProps | IconOnlyButtonProps;

const spinnerSizeForButton = { sm: 'sm', md: 'sm', lg: 'md' } as const;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant,
    size = 'md',
    block,
    iconOnly,
    loading = false,
    disabled = false,
    leadingIcon,
    trailingIcon,
    className,
    children,
    type = 'button',
    onClick,
    ...rest
  },
  ref,
) {
  const isInert = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size, iconOnly, block }), className)}
      aria-busy={loading || undefined}
      aria-disabled={isInert || undefined}
      // Keep the node focusable while loading (so focus is not lost), but block disabled actions.
      disabled={disabled && !loading}
      onClick={(event) => {
        if (isInert) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      {...rest}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner
            size={spinnerSizeForButton[size ?? 'md']}
            aria-label="Loading"
            className="text-current"
          />
        </span>
      )}
      {/* Content keeps the button at its natural width during loading (visibility:hidden, not display:none). */}
      <span
        className={cn('inline-flex items-center gap-2', loading && 'invisible')}
        aria-hidden={loading || undefined}
      >
        {leadingIcon ? <span className="inline-flex shrink-0">{leadingIcon}</span> : null}
        {children}
        {trailingIcon ? <span className="inline-flex shrink-0">{trailingIcon}</span> : null}
      </span>
    </button>
  );
});

