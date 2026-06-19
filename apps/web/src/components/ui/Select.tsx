/**
 * Select.tsx — accessible native <select> styled with design tokens.
 *
 * SEVEN STATES (design.md §3):
 *   default        : bg-surface-raised, border-line-default, rounded-sm, text-content-primary, chevron icon.
 *   hover          : border-line-strong (pointer feedback only).
 *   focus-visible  : border-focus + focus-visible:ring-2 ring-focus ring-offset-2.
 *   active         : native option list open (browser-provided).
 *   disabled       : bg-surface-subtle text-content-muted, cursor-not-allowed, not focusable.
 *   loading        : aria-busy + disabled while options load (width preserved by the wrapper).
 *   error          : border danger + aria-invalid + message in text-content-danger via aria-describedby.
 *
 * A11y: native <select> for full keyboard + screen-reader + touch support. <label> ALWAYS rendered
 *   (htmlFor/id). Placeholder rendered as a disabled first <option> — never used as the label.
 */
'use client';

import { forwardRef, useId } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export type SelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'children'> & {
  label: string;
  hideLabel?: boolean;
  options: SelectOption[];
  /** Disabled, non-selectable prompt rendered first (e.g. "Select a city"). */
  placeholder?: string;
  error?: string;
  hint?: string;
  loading?: boolean;
  id?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    hideLabel = false,
    options,
    placeholder,
    error,
    hint,
    loading = false,
    id,
    className,
    disabled,
    required,
    defaultValue,
    value,
    'aria-describedby': ariaDescribedbyProp,
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const selectId = id ?? `select-${reactId}`;
  const errorId = `${selectId}-error`;
  const hintId = `${selectId}-hint`;

  const describedBy =
    [error ? errorId : null, !error && hint ? hintId : null, ariaDescribedbyProp]
      .filter(Boolean)
      .join(' ') || undefined;

  // Only force the placeholder selected when the consumer is uncontrolled and gave no default.
  const placeholderDefault =
    placeholder && value === undefined && defaultValue === undefined ? '' : undefined;

  return (
    <div className="flex w-full flex-col gap-1">
      <label
        htmlFor={selectId}
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

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          required={required}
          disabled={disabled || loading}
          value={value}
          defaultValue={value === undefined ? (placeholderDefault ?? defaultValue) : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-busy={loading || undefined}
          className={cn(
            'min-h-11 w-full appearance-none rounded-sm border bg-surface-raised px-3 pr-10 py-2',
            'font-body text-base text-content-primary outline-none',
            'transition-colors duration-instant ease-standard',
            'focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
            error
              ? 'border-content-danger focus-visible:border-content-danger'
              : 'border-line-default hover:border-line-strong focus-visible:border-focus',
            'disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-content-muted',
            className,
          )}
          {...rest}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted"
          aria-hidden="true"
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
