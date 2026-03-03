'use client';

import { Scale, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { useComparisonStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export function ComparisonBar() {
  const { items, removeItem, clearItems } = useComparisonStore();

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 bg-white/95 shadow-lg backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-900/95">
      <div className="container-app py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            <Scale className="h-4 w-4 text-primary-600" />
            <span>Comparing {items.length} of 4</span>
          </div>

          {/* Property thumbnails */}
          <div className="flex flex-1 items-center gap-3 overflow-x-auto">
            {items.map(({ property }) => (
              <div
                key={property.id}
                className="group relative flex shrink-0 items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-2 pr-7 dark:border-neutral-700 dark:bg-neutral-800"
              >
                {property.images?.[0] ? (
                  <div className="relative h-8 w-12 overflow-hidden rounded">
                    <Image
                      src={property.images[0].thumbnail_url || property.images[0].url}
                      alt={property.title}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                ) : (
                  <div className="h-8 w-12 rounded bg-neutral-200 dark:bg-neutral-700" />
                )}
                <div>
                  <div className="max-w-28 truncate text-xs font-medium text-neutral-900 dark:text-white">
                    {property.title}
                  </div>
                  <div className="text-xs text-neutral-500">
                    ${(property.price / 1000).toFixed(0)}k
                  </div>
                </div>
                <button
                  onClick={() => removeItem(property.id)}
                  className="absolute right-1.5 top-1.5 rounded text-neutral-400 hover:text-danger-500"
                  aria-label="Remove from comparison"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: 4 - items.length }).map((_, i) => (
              <div
                key={i}
                className="flex h-12 w-28 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-neutral-200 text-xs text-neutral-400 dark:border-neutral-700"
              >
                + Add property
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearItems}
              className="text-neutral-500"
            >
              Clear
            </Button>
            <Button size="sm" asChild>
              <Link href="/compare">
                <Scale className="mr-2 h-4 w-4" />
                Compare Now
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
