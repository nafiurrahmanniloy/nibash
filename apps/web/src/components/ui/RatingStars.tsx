/**
 * RatingStars.tsx — amber star + numeric rating value (design.md §4.2 rating).
 *
 * SEVEN STATES (display variant is presentational; interactive states apply only when `onRate` is given):
 *   default        : filled accent star(s) + numeric value in text-content-secondary.
 *   hover          : interactive mode only — preview stars up to the pointer position (duration-instant).
 *   focus-visible  : interactive mode — radiogroup option shows focus-visible:ring-2 ring-focus ring-offset-2.
 *   active         : interactive mode — pressed star commits the rating.
 *   disabled       : interactive mode — reduced opacity, not focusable.
 *   loading        : caller swaps to a Skeleton; this component does not animate.
 *   error          : n/a (display) / caller-handled for input.
 *
 * A11y: DISPLAY mode renders one star glyph (aria-hidden) + the numeric value, wrapped with an aria-label
 *   like "4.8 out of 5". INPUT mode is a radiogroup of star buttons, each with its own label. Amber is used
 *   only as an icon fill (allowed by design.md), never as body-size amber text.
 */
'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/cn';

type RatingBaseProps = {
  /** Rating value (e.g. 4.8). */
  value: number;
  /** Maximum stars. */
  max?: number;
  /** Optional review count shown in parentheses (display mode). */
  count?: number;
  size?: 'sm' | 'md';
  className?: string;
};

type DisplayProps = RatingBaseProps & {
  onRate?: undefined;
};

type InputProps = RatingBaseProps & {
  /** Provide to render an interactive star input (radiogroup). */
  onRate: (value: number) => void;
  disabled?: boolean;
  /** Accessible group label (e.g. "Rate this stay"). */
  label?: string;
};

export type RatingStarsProps = DisplayProps | InputProps;

const starSize = { sm: 'h-4 w-4', md: 'h-5 w-5' } as const;

export function RatingStars(props: RatingStarsProps) {
  const { value, max = 5, size = 'sm', className } = props;

  // ---- Interactive input mode ----
  if (props.onRate) {
    return <RatingInput {...props} max={max} size={size} className={className} />;
  }

  // ---- Display mode ----
  const rounded = Math.round(value * 10) / 10;
  return (
    <span
      className={cn('inline-flex items-center gap-1', className)}
      aria-label={`${rounded} out of ${max}`}
    >
      <Star className={cn(starSize[size], 'fill-accent text-accent')} aria-hidden="true" />
      <span className="font-body text-sm font-semibold text-content-primary" aria-hidden="true">
        {rounded.toFixed(1)}
      </span>
      {typeof props.count === 'number' ? (
        <span className="font-body text-sm text-content-muted" aria-hidden="true">
          ({props.count})
        </span>
      ) : null}
    </span>
  );
}

function RatingInput({
  value,
  max = 5,
  size = 'sm',
  className,
  onRate,
  disabled = false,
  label = 'Rating',
}: InputProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const active = hovered ?? value;

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('inline-flex items-center gap-1', disabled && 'opacity-60', className)}
      onMouseLeave={() => setHovered(null)}
    >
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => {
        const filled = star <= active;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
            disabled={disabled}
            onMouseEnter={() => setHovered(star)}
            onFocus={() => setHovered(star)}
            onBlur={() => setHovered(null)}
            onClick={() => onRate(star)}
            className={cn(
              'inline-flex min-h-11 min-w-11 items-center justify-center rounded-pill',
              'transition-colors duration-instant ease-standard',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed',
            )}
          >
            <Star
              className={cn(starSize[size], filled ? 'fill-accent text-accent' : 'text-content-muted')}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}
