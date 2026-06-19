/**
 * search — public surface barrel.
 * App pages import the search/filter UI + the read actions from here.
 */
export { SearchBar } from './components/SearchBar.js';
export type { SearchBarProps, SearchBarValues } from './components/SearchBar.js';
export { Filters } from './components/Filters.js';
export type { FiltersProps, FilterValues } from './components/Filters.js';
export { CategoryChips } from './components/CategoryChips.js';
export type { CategoryChipsProps } from './components/CategoryChips.js';
export { CollectionBand } from './components/CollectionBand.js';
export type { CollectionBandProps } from './components/CollectionBand.js';
export { ListingGrid } from './components/ListingGrid.js';
export type { ListingGridProps } from './components/ListingGrid.js';

export { searchListings, getCollections } from './actions.js';
export type { CollectionBandDTO } from './search.service.js';
