'use client';

/**
 * SearchFilters — thin client container (composition glue) for the search page.
 *
 * Wraps the search feature's controlled <Filters/> and maps apply/clear callbacks
 * to URL updates (price, place type, guests). Resetting to page 1 on any change.
 * No data access or filter logic — that lives in the search service. Initial values
 * are seeded from the already-validated SearchParams passed by the server page.
 */
import { useRouter, useSearchParams } from 'next/navigation';
import type { SearchParams } from '@travela/shared';
import { Filters, type FilterValues } from '@/features/search';

export interface SearchFiltersProps {
  params: SearchParams;
}

export function SearchFilters({ params }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initial: Partial<FilterValues> = {
    minPrice: params.minPrice ?? null,
    maxPrice: params.maxPrice ?? null,
    placeType: params.placeType ?? null,
    guests: params.guests ?? null,
  };

  function apply(values: FilterValues): void {
    const next = new URLSearchParams(searchParams.toString());
    const setOrDelete = (key: string, value: number | string | null): void => {
      if (value === null || value === '') next.delete(key);
      else next.set(key, String(value));
    };
    setOrDelete('minPrice', values.minPrice);
    setOrDelete('maxPrice', values.maxPrice);
    setOrDelete('placeType', values.placeType);
    setOrDelete('guests', values.guests);
    next.delete('page'); // any filter change resets pagination
    const qs = next.toString();
    router.push(qs ? `/search?${qs}` : '/search');
  }

  function clear(): void {
    const next = new URLSearchParams(searchParams.toString());
    for (const key of ['minPrice', 'maxPrice', 'placeType', 'guests', 'page']) {
      next.delete(key);
    }
    const qs = next.toString();
    router.push(qs ? `/search?${qs}` : '/search');
  }

  return <Filters initial={initial} onApply={apply} onClear={clear} />;
}
