/**
 * Input.tsx — labelled single-line text field (design.md §4.5).
 *
 * SEVEN STATES (design.md §3):
 *   default        : bg-surface-raised, border-line-default, rounded-sm, text-content-primary.
 *   hover          : border-line-strong (pointer feedback only).
 *   focus-visible  : border-focus + focus-visible:ring-2 ring-focus ring-offset-2.
 *   active         : same as focus while typing (text caret present).
 *   disabled       : bg-surface-subtle text-content-muted, cursor-not-allowed, not focusable.
 *   loading        : caller sets `loading` → aria-busy + non-editable (readOnly) so width/value are preserved.
 *   error          : border danger + aria-invalid + message in text-content-danger wired via aria-describedby.
 *
 * A11y: <label> ALWAYS rendered and tied via htmlFor/id (never placeholder-as-label, anti-pattern §7).
 *   Error + hint messages linked with aria-describedby; error sets aria-invalid="true" (state not by colour alone).
 */
'use client';

import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  /** Visible label text — always rendered. */
  label: string;
  /** Visually hide the label while keeping it for assistive tech. */
  hideLabel?: boolean;
  /** Error message; when present the field is marked invalid and described by it. */
  error?: string;
  /** Optional helper text shown below the field (suppressed while an error is shown). */
  hint?: string;
  /** Marks the field busy and read-only (e.g. async validation/prefill). */
  loading?: boolean;
  /** Node rendered inside the field on the leading edge (e.g. ৳, search icon). */
  leadingAddon?: ReactNode;
  id?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hideLabel = false,
    error,
    hint,
    loading = false,
    leadingAddon,
    id,
    className,
    disabled,
    required,
    readOnly,
    'aria-describedby': ariaDescribedbyProp,
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? `input-${reactId}`;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  const describedBy =
    [error ? errorId : null, !error && hint ? hintId : null, ariaDescribedbyProp]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div className="flex w-full flex-col gap-1">
      <label
        htmlFor={inputId}
        className={cn(
          'font-body text-sm font-medium text-content-primary',
          hideLabel && 'sr-only',
        )}
      >
        {label}
        {required ? (
          <span className="text-content-danger" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </label>

      <div
        className={cn(
          'flex items-center gap-2 rounded-sm border bg-surface-raised px-3',
          'transition-colors duration-instant ease-standard',
          'focus-within:ring-2 focus-within:ring-focus focus-within:ring-offset-2',
          error ? 'border-content-danger focus-within:border-content-danger' : 'border-line-default focus-within:border-focus',
          !error && 'hover:border-line-strong',
          (disabled || loading) && 'bg-surface-subtle',
        )}
      >
        {leadingAddon ? (
          <span className="shrink-0 text-content-muted" aria-hidden="true">
            {leadingAddon}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          required={required}
          disabled={disabled}
          readOnly={readOnly || loading}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-busy={loading || undefined}
          className={cn(
            'min-h-11 w-full bg-transparent py-2 font-body text-base text-content-primary outline-none',
            'placeholder:text-content-muted',
            'disabled:cursor-not-allowed disabled:text-content-muted',
            className,
          )}
          {...rest}
        />
      </div>

      {error ? (
        <p id={errorId} className="font-body text-sm text-content-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="font-body text-sm text-content-secondary">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
