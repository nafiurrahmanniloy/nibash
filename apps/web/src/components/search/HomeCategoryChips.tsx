'use client';

/**
 * HomeCategoryChips — thin client container (composition glue).
 *
 * Wraps the search feature's controlled <CategoryChips/> and routes the selected
 * category to /search?category=…. No business logic; UI→URL routing only. The
 * `selected` state is derived from the current URL so the chip reflects deep links.
 */
import { useRouter, useSearchParams } from 'next/navigation';
import {
  listingCategorySchema,
  type ListingCategory,
} from '@travela/shared';
import { CategoryChips } from '@/features/search/components/CategoryChips';

export function HomeCategoryChips() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawCategory = searchParams.get('category');
  const parsed = listingCategorySchema.safeParse(rawCategory);
  const selected: ListingCategory | null = parsed.success ? parsed.data : null;

  function handleSelect(category: ListingCategory | null): void {
    const params = new URLSearchParams(searchParams.toString());
    if (category) params.set('category', category);
    else params.delete('category');
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : '/search');
  }

  return <CategoryChips selected={selected} onSelect={handleSelect} />;
}
