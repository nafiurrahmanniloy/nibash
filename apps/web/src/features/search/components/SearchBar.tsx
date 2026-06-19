'use client';
/**
 * SearchBar — location + date range + guests + a primary "Search" button.
 *
 * Seven states (design.md §3) come from the ui primitives (Input/Button); SearchBar
 * orchestrates them. The Search button:
 *   default/hover/focus-visible/active/disabled → ui/Button
 *   loading → `loading` prop shows spinner, keeps width, aria-busy
 *   error   → inline message (role="alert") when the date range is invalid
 * Every field has a visible <label> (never placeholder-as-label, design.md §4.5).
 */
import { useState } from 'react';
import { Button, Input } from '@/components/ui';

export interface SearchBarValues {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

export interface SearchBarProps {
  initial?: Partial<SearchBarValues>;
  loading?: boolean;
  onSearch: (values: SearchBarValues) => void;
}

export function SearchBar({ initial, loading, onSearch }: SearchBarProps) {
  const [location, setLocation] = useState(initial?.location ?? '');
  const [checkIn, setCheckIn] = useState(initial?.checkIn ?? '');
  const [checkOut, setCheckOut] = useState(initial?.checkOut ?? '');
  const [guests, setGuests] = useState(initial?.guests ?? 1);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Both-or-neither + ordering rule mirrors searchParamsSchema.
    if ((checkIn && !checkOut) || (!checkIn && checkOut)) {
      setError('Choose both a check-in and a check-out date.');
      return;
    }
    if (checkIn && checkOut && checkOut <= checkIn) {
      setError('Check-out must be after check-in.');
      return;
    }
    onSearch({ location: location.trim(), checkIn, checkOut, guests });
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={loading}
      className="flex flex-col gap-3 rounded-md bg-surface-raised p-4 shadow-soft-sm md:flex-row md:items-end"
    >
      <div className="flex-[2]">
        <Input
          label="Location"
          type="text"
          placeholder="Where to? e.g. Cox's Bazar"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className="flex-1">
        <Input
          label="Check-in"
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className="flex-1">
        <Input
          label="Check-out"
          type="date"
          value={checkOut}
          min={checkIn || undefined}
          onChange={(e) => setCheckOut(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className="w-full md:w-28">
        <Input
          label="Guests"
          type="number"
          min={1}
          max={50}
          value={guests}
          onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
          disabled={loading}
        />
      </div>
      <div className="md:pb-0.5">
        <Button type="submit" variant="primary" loading={loading} className="w-full md:w-auto">
          Search stays
        </Button>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-content-danger md:basis-full">
          {error}
        </p>
      ) : null}
    </form>
  );
}
