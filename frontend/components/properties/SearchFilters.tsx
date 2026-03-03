'use client';

import { useEffect, useState } from 'react';

import { Filter, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useSearchStore } from '@/lib/store';
import type { SearchFilters as SearchFiltersType } from '@/lib/types';

const propertyTypes = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'villa', label: 'Villa' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' },
];

const listingTypes = [
  { value: 'sale', label: 'For Sale' },
  { value: 'rent', label: 'For Rent' },
  { value: 'lease', label: 'For Lease' },
  { value: 'auction', label: 'Auction' },
];

const bedroomOptions = [
  { value: '0', label: 'Any' },
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
  { value: '5', label: '5+' },
];

const sortOptions = [
  { value: 'created_at', label: 'Newest' },
  { value: 'price', label: 'Price' },
  { value: 'area_sqft', label: 'Area' },
  { value: 'views_count', label: 'Most Viewed' },
  { value: 'favorites_count', label: 'Most Saved' },
];

interface SearchFiltersProps {
  compact?: boolean;
}

export function SearchFiltersPanel({ compact = false }: SearchFiltersProps) {
  const { filters, setFilters, resetFilters } = useSearchStore();
  const [localQuery, setLocalQuery] = useState(filters.query || '');
  const debouncedQuery = useDebounce(localQuery, 400);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setFilters({ query: debouncedQuery });
  }, [debouncedQuery, setFilters]);

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Search properties..."
            className="search-input pl-10"
          />
        </div>
        <Select
          options={listingTypes}
          value={filters.listing_type || ''}
          onChange={(e) => setFilters({ listing_type: e.target.value as SearchFiltersType['listing_type'] })}
          placeholder="Any type"
          className="w-36"
        />
        <Select
          options={sortOptions}
          value={filters.sort_by || 'created_at'}
          onChange={(e) => setFilters({ sort_by: e.target.value as SearchFiltersType['sort_by'] })}
          className="w-36"
        />
        <Button variant="outline" size="icon" onClick={() => setExpanded(!expanded)}>
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
      {/* Main search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="Search by city, neighborhood, address..."
          className="search-input pl-11 py-3.5"
        />
      </div>

      {/* Quick filters row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Select
          label="Listing Type"
          options={listingTypes}
          value={filters.listing_type || ''}
          onChange={(e) =>
            setFilters({
              listing_type: e.target.value as SearchFiltersType['listing_type'] || undefined,
            })
          }
          placeholder="Any"
        />
        <Select
          label="Property Type"
          options={propertyTypes}
          value={filters.property_type?.[0] || ''}
          onChange={(e) =>
            setFilters({
              property_type: e.target.value
                ? [e.target.value as SearchFiltersType['property_type'][0]]
                : undefined,
            })
          }
          placeholder="Any"
        />
        <Select
          label="Bedrooms"
          options={bedroomOptions}
          value={String(filters.bedrooms_min || 0)}
          onChange={(e) =>
            setFilters({ bedrooms_min: Number(e.target.value) || undefined })
          }
        />
        <Select
          label="Sort by"
          options={sortOptions}
          value={filters.sort_by || 'created_at'}
          onChange={(e) => setFilters({ sort_by: e.target.value as SearchFiltersType['sort_by'] })}
        />
      </div>

      {/* Advanced filters toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-4 flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400"
      >
        <Filter className="h-4 w-4" />
        {expanded ? 'Less filters' : 'More filters'}
      </button>

      {/* Advanced filters */}
      {expanded && (
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800 sm:grid-cols-3 md:grid-cols-4">
          <Input
            label="Min Price"
            type="number"
            placeholder="$0"
            value={filters.price_min || ''}
            onChange={(e) => setFilters({ price_min: Number(e.target.value) || undefined })}
          />
          <Input
            label="Max Price"
            type="number"
            placeholder="Any"
            value={filters.price_max || ''}
            onChange={(e) => setFilters({ price_max: Number(e.target.value) || undefined })}
          />
          <Input
            label="Min Area (sqft)"
            type="number"
            placeholder="0"
            value={filters.area_sqft_min || ''}
            onChange={(e) => setFilters({ area_sqft_min: Number(e.target.value) || undefined })}
          />
          <Input
            label="Max Area (sqft)"
            type="number"
            placeholder="Any"
            value={filters.area_sqft_max || ''}
            onChange={(e) => setFilters({ area_sqft_max: Number(e.target.value) || undefined })}
          />
          <Input
            label="City"
            placeholder="Any city"
            value={filters.city || ''}
            onChange={(e) => setFilters({ city: e.target.value || undefined })}
          />
          <Input
            label="ZIP Code"
            placeholder="ZIP"
            value={filters.zip_code || ''}
            onChange={(e) => setFilters({ zip_code: e.target.value || undefined })}
          />
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4 dark:border-neutral-800">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            resetFilters();
            setLocalQuery('');
          }}
          leftIcon={<RotateCcw className="h-4 w-4" />}
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
}
