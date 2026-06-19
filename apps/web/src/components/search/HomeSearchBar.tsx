'use client';

/**
 * HomeSearchBar — thin client container (composition glue, NOT business logic).
 *
 * The search feature's <SearchBar/> is a controlled client component that emits
 * values via `onSearch`. Server pages can't pass a callback, so this wrapper owns
 * the single responsibility of translating those values into a /search URL and
 * navigating. No data access, no validation rules — just UI→URL routing.
 *
 * States are owned by the wrapped <SearchBar/> (seven-state primitive).
 */
import { useRouter } from 'next/navigation';
import { SearchBar, type SearchBarValues } from '@/features/search/components/SearchBar';

export function HomeSearchBar() {
  const router = useRouter();

  function handleSearch(values: SearchBarValues): void {
    const params = new URLSearchParams();
    if (values.location.trim()) params.set('location', values.location.trim());
    if (values.checkIn) params.set('checkIn', values.checkIn);
    if (values.checkOut) params.set('checkOut', values.checkOut);
    if (values.guests > 0) params.set('guests', String(values.guests));
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : '/search');
  }

  return <SearchBar onSearch={handleSearch} />;
}
