'use client';

import { Heart } from 'lucide-react';
import Link from 'next/link';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { Button } from '@/components/ui/Button';
import { PropertyCardSkeleton } from '@/components/ui/Skeleton';
import { useFavorites } from '@/lib/hooks/useProperties';

export default function FavoritesPage() {
  const { favorites, isLoading } = useFavorites();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Saved Properties
            </h1>
            <p className="mt-1 text-neutral-500 dark:text-neutral-400">
              {isLoading ? 'Loading...' : `${favorites.length} saved properties`}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/properties">
              <Heart className="mr-2 h-4 w-4" />
              Browse More
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
          </div>
        ) : favorites.length === 0 ? (
          <div className="py-24 text-center">
            <Heart className="mx-auto mb-4 h-16 w-16 text-neutral-200 dark:text-neutral-700" />
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
              No Saved Properties
            </h2>
            <p className="mt-2 text-neutral-500">
              Browse properties and click the heart icon to save your favorites
            </p>
            <Button className="mt-6" asChild>
              <Link href="/properties">Browse Properties</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map(({ property }) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
