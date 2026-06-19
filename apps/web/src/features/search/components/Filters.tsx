'use client';
/**
 * Filters — price range / place type / guests, with proper labels + a Clear action.
 *
 * Each control is interactive; the seven-state matrix (design.md §3) is delivered by
 * ui/Input, ui/Chip and ui/Button. Every field has a visible <label>; the place-type
 * group conveys selection via aria-pressed (not color alone). "Clear filters" resets
 * to the empty filter state and is a descriptive, non-ambiguous label.
 */
import { useState } from 'react';
import { placeTypeSchema, type PlaceType } from '@nibash/shared';
import { Button, Chip, Input } from '@/components/ui';

export interface FilterValues {
  minPrice: number | null;
  maxPrice: number | null;
  placeType: PlaceType | null;
  guests: number | null;
}

export interface FiltersProps {
  initial?: Partial<FilterValues>;
  loading?: boolean;
  onApply: (values: FilterValues) => void;
  onClear: () => void;
}

const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  entire: 'Entire place',
  private: 'Private room',
  shared: 'Shared room',
};

const PLACE_TYPES = placeTypeSchema.options;

const EMPTY: FilterValues = {
  minPrice: null,
  maxPrice: null,
  placeType: null,
  guests: null,
};

export function Filters({ initial, loading, onApply, onClear }: FiltersProps) {
  const [values, setValues] = useState<FilterValues>({ ...EMPTY, ...initial });
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FilterValues>(key: K, value: FilterValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function toNumberOrNull(raw: string): number | null {
    if (raw.trim() === '') return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (
      values.minPrice !== null &&
      values.maxPrice !== null &&
      values.maxPrice < values.minPrice
    ) {
      setError('Max price must be greater than or equal to min price.');
      return;
    }
    onApply(values);
  }

  function handleClear() {
    setValues(EMPTY);
    setError(null);
    onClear();
  }

  return (
    <form
      onSubmit={handleApply}
      aria-busy={loading}
      className="flex flex-col gap-4 rounded-md bg-surface-raised p-4 shadow-soft-sm"
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-content-primary">Price per night (৳)</legend>
        <div className="flex items-end gap-3">
          <Input
            label="Min"
            type="number"
            min={0}
            value={values.minPrice ?? ''}
            onChange={(e) => update('minPrice', toNumberOrNull(e.target.value))}
            disabled={loading}
          />
          <Input
            label="Max"
            type="number"
            min={0}
            value={values.maxPrice ?? ''}
            onChange={(e) => update('maxPrice', toNumberOrNull(e.target.value))}
            disabled={loading}
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-content-primary">Place type</legend>
        <div role="group" aria-label="Place type" className="flex flex-wrap gap-2">
          {PLACE_TYPES.map((type) => (
            <Chip
              key={type}
              selected={values.placeType === type}
              disabled={loading}
              onClick={() =>
                update('placeType', values.placeType === type ? null : type)
              }
            >
              {PLACE_TYPE_LABELS[type]}
            </Chip>
          ))}
        </div>
      </fieldset>

      <Input
        label="Guests"
        type="number"
        min={1}
        max={50}
        value={values.guests ?? ''}
        onChange={(e) => update('guests', toNumberOrNull(e.target.value))}
        disabled={loading}
      />

      {error ? (
        <p role="alert" className="text-sm text-content-danger">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button type="submit" variant="primary" loading={loading}>
          Apply filters
        </Button>
        <Button type="button" variant="ghost" onClick={handleClear} disabled={loading}>
          Clear filters
        </Button>
      </div>
    </form>
  );
}
