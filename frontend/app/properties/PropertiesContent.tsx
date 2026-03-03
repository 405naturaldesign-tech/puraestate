'use client';

import { useEffect } from 'react';

import { LayoutGrid, List, Map } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

import { PropertyCard } from '@/components/properties/PropertyCard';
import { SearchFiltersPanel } from '@/components/properties/SearchFilters';
import { Button } from '@/components/ui/Button';
import { PropertyCardSkeleton } from '@/components/ui/Skeleton';
import { useProperties } from '@/lib/hooks/useProperties';
import { useSearchStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export function PropertiesContent() {
  const searchParams = useSearchParams();
  const { filters, setFilters, viewMode, setViewMode } = useSearchStore();
  const { data, isLoading, isFetching } = useProperties(filters);

  // Sync URL params to filters on mount
  useEffect(() => {
    const query = searchParams.get('query');
    const listingType = searchParams.get('listing_type');
    if (query || listingType) {
      setFilters({
        query: query || undefined,
        listing_type: (listingType as 'sale' | 'rent' | 'lease' | 'auction') || undefined,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const properties = data?.data || [];
  const total = data?.total || 0;

  return (
    <div className="container-app py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Properties</h1>
        <p className="mt-1 text-neutral-500 dark:text-neutral-400">
          {isLoading ? 'Searching...' : `${total.toLocaleString()} properties found`}
        </p>
      </div>

      {/* Filters */}
      <SearchFiltersPanel />

      {/* View mode & results */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {isFetching && !isLoading && (
            <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          )}
          Showing {properties.length} of {total}
        </p>
        <div className="flex items-center gap-1 rounded-lg border border-neutral-200 p-1 dark:border-neutral-700">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'ghost'}
            size="icon-sm"
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            size="icon-sm"
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'map' ? 'primary' : 'ghost'}
            size="icon-sm"
            onClick={() => setViewMode('map')}
            title="Map view"
          >
            <Map className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Property Grid/List */}
      <div className="mt-6">
        {isLoading ? (
          <div
            className={cn(
              'grid gap-6',
              viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1'
            )}
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="py-24 text-center">
            <div className="mb-4 text-6xl">🏠</div>
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">
              No properties found
            </h3>
            <p className="mt-2 text-neutral-500 dark:text-neutral-400">
              Try adjusting your filters to find more properties
            </p>
          </div>
        ) : (
          <div
            className={cn(
              'grid gap-6',
              viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                : viewMode === 'list'
                ? 'grid-cols-1'
                : 'grid-cols-1'
            )}
          >
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                compact={viewMode === 'list'}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!data.has_prev}
            onClick={() => setFilters({ page: (filters.page || 1) - 1 })}
          >
            Previous
          </Button>
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            Page {filters.page || 1} of {data.total_pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!data.has_next}
            onClick={() => setFilters({ page: (filters.page || 1) + 1 })}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
