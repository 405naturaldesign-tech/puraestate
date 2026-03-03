'use client';

import { useState } from 'react';

import type { Metadata } from 'next';

import { SearchFiltersPanel } from '@/components/properties/SearchFilters';
import { PropertyMap } from '@/components/map/PropertyMap';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { Navbar } from '@/components/layout/Navbar';
import { useSearchStore } from '@/lib/store';
import { propertiesApi } from '@/lib/api/properties';
import type { Property } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';

export default function MapPage() {
  const { filters } = useSearchStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bounds, setBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);

  const { data: mapListings } = useQuery({
    queryKey: ['map-listings', bounds, filters],
    queryFn: () =>
      bounds
        ? propertiesApi.getMapListings(bounds, filters)
        : propertiesApi.getMapListings(
            { north: 42, south: 39, east: -70, west: -76 },
            filters
          ),
    staleTime: 30 * 1000,
  });

  const { data: selectedProperty } = useQuery<Property | null>({
    queryKey: ['property-detail', selectedId],
    queryFn: () => (selectedId ? propertiesApi.getById(selectedId) : null),
    enabled: !!selectedId,
  });

  return (
    <div className="flex h-screen flex-col">
      <Navbar />

      {/* Search bar overlay */}
      <div className="border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
        <SearchFiltersPanel compact />
      </div>

      {/* Map fills remaining space */}
      <div className="relative flex-1">
        <PropertyMap
          properties={mapListings || []}
          selectedPropertyId={selectedId || undefined}
          onPropertyClick={(id) => setSelectedId(selectedId === id ? null : id)}
          onBoundsChange={setBounds}
          height="100%"
          selectedProperty={selectedProperty || undefined}
        />

        {/* Properties count */}
        <div className="absolute left-4 top-4 z-10 rounded-full bg-white/90 px-4 py-2 shadow-sm backdrop-blur-sm dark:bg-neutral-900/90">
          <span className="text-sm font-medium text-neutral-900 dark:text-white">
            {mapListings?.length || 0} properties in view
          </span>
        </div>
      </div>
    </div>
  );
}
