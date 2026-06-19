/**
 * Textarea.tsx — labelled multi-line text field.
 *
 * SEVEN STATES (design.md §3):
 *   default        : bg-surface-raised, border-line-default, rounded-sm, text-content-primary.
 *   hover          : border-line-strong (pointer feedback only).
 *   focus-visible  : border-focus + focus-visible:ring-2 ring-focus ring-offset-2.
 *   active         : caret present while typing.
 *   disabled       : bg-surface-subtle text-content-muted, cursor-not-allowed, not focusable.
 *   loading        : aria-busy + read-only so the value/height are preserved.
 *   error          : border danger + aria-invalid + message in text-content-danger via aria-describedby.
 *
 * A11y: <label> ALWAYS rendered (htmlFor/id). Error/hint linked via aria-describedby; invalid state
 *   exposed with aria-invalid (not colour alone). Optional character counter announced politely.
 */
'use client';

import { forwardRef, useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & {
  /** Visible label text — always rendered. */
  label: string;
  hideLabel?: boolean;
  error?: string;
  hint?: string;
  loading?: boolean;
  /** Show an "N / max" counter (requires maxLength). */
  showCount?: boolean;
  id?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    hideLabel = false,
    error,
    hint,
    loading = false,
    showCount = false,
    id,
    className,
    disabled,
    required,
    readOnly,
    maxLength,
    value,
    rows = 4,
    'aria-describedby': ariaDescribedbyProp,
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const fieldId = id ?? `textarea-${reactId}`;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const countId = `${fieldId}-count`;

  const count = typeof value === 'string' ? value.length : undefined;
  const describedBy =
    [
      error ? errorId : null,
      !error && hint ? hintId : null,
      showCount && maxLength ? countId : null,
      ariaDescribedbyProp,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div className="flex w-full flex-col gap-1">
      <label
        htmlFor={fieldId}
        className={cn('font-body text-sm font-medium text-content-primary', hideLabel && 'sr-only')}
      >
        {label}
        {required ? (
          <span className="text-content-danger" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </label>

      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        required={required}
        disabled={disabled}
        readOnly={readOnly || loading}
        maxLength={maxLength}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        aria-busy={loading || undefined}
        className={cn(
          'min-h-24 w-full resize-y rounded-sm border bg-surface-raised px-3 py-2',
          'font-body text-base text-content-primary outline-none placeholder:text-content-muted',
          'transition-colors duration-instant ease-standard',
          'focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
          error
            ? 'border-content-danger focus-visible:border-content-danger'
            : 'border-line-default hover:border-line-strong focus-visible:border-focus',
          'disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-content-muted',
          (readOnly || loading) && 'bg-surface-subtle',
          className,
        )}
        {...rest}
      />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
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
        {showCount && maxLength ? (
          <p id={countId} className="shrink-0 font-body text-sm text-content-muted" aria-live="polite">
            {count ?? 0} / {maxLength}
          </p>
        ) : null}
      </div>
    </div>
  );
});
