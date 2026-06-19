'use client';
/**
 * CategoryChips — horizontal, keyboard-navigable category filter using ui/Chip.
 *
 * Each chip is interactive; the seven-state matrix (design.md §3) is delivered by
 * ui/Chip (default/hover/focus-visible/active/disabled), and selection is conveyed
 * via aria-pressed (state non-visually, WCAG 1.4.1). Loading is a parent concern;
 * disabled chips are passed through while a search is running.
 *
 * Categories come from the shared listingCategorySchema enum — one source of truth.
 */
import { listingCategorySchema, type ListingCategory } from '@travela/shared';
import { Chip } from '@/components/ui';

export interface CategoryChipsProps {
  /** Currently selected category, or null for "All". */
  selected: ListingCategory | null;
  onSelect: (category: ListingCategory | null) => void;
  disabled?: boolean;
}

const CATEGORY_LABELS: Record<ListingCategory, string> = {
  apartment: 'Apartments',
  room: 'Rooms',
  hotel: 'Hotels',
  resort: 'Resorts',
  villa: 'Villas',
  studio: 'Studios',
};

const CATEGORIES = listingCategorySchema.options;

export function CategoryChips({ selected, onSelect, disabled }: CategoryChipsProps) {
  return (
    <div
      role="group"
      aria-label="Filter by category"
      className="flex gap-2 overflow-x-auto pb-1"
    >
      <Chip selected={selected === null} disabled={disabled} onClick={() => onSelect(null)}>
        All stays
      </Chip>
      {CATEGORIES.map((category) => (
        <Chip
          key={category}
          selected={selected === category}
          disabled={disabled}
          onClick={() => onSelect(selected === category ? null : category)}
        >
          {CATEGORY_LABELS[category]}
        </Chip>
      ))}
    </div>
  );
}
