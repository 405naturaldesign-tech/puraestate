'use client';

import Link from 'next/link';

import { PropertyCard } from '@/components/properties/PropertyCard';
import { PropertyCardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { useFeaturedProperties } from '@/lib/hooks/useProperties';

export function FeaturedProperties() {
  const { data: properties, isLoading } = useFeaturedProperties(6);

  return (
    <section className="bg-neutral-50 py-16 dark:bg-neutral-900 md:py-24">
      <div className="container-app">
        <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="section-heading">Featured Properties</h2>
            <p className="section-subheading">
              Hand-picked properties from top agents across the country
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/properties">View All Properties</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)
            : properties?.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
        </div>
      </div>
    </section>
  );
}
