'use client';

import { Bath, Bed, Check, Maximize2, Plus, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { Button } from '@/components/ui/Button';
import { useComparisonStore } from '@/lib/store';
import { formatCurrency, getPropertyTypeLabel } from '@/lib/utils';

export default function ComparePage() {
  const { items, removeItem } = useComparisonStore();

  const properties = items.map((i) => i.property);

  const featureRows = [
    { label: 'Price', key: 'price', format: (p: typeof properties[0]) => formatCurrency(p.price) },
    { label: 'Type', key: 'property_type', format: (p: typeof properties[0]) => getPropertyTypeLabel(p.property_type) },
    { label: 'Bedrooms', key: 'bedrooms', format: (p: typeof properties[0]) => `${p.features.bedrooms}` },
    { label: 'Bathrooms', key: 'bathrooms', format: (p: typeof properties[0]) => `${p.features.bathrooms}` },
    { label: 'Area', key: 'area', format: (p: typeof properties[0]) => `${p.features.area_sqft.toLocaleString()} sqft` },
    { label: 'Price/sqft', key: 'ppsf', format: (p: typeof properties[0]) => p.price_per_sqft ? formatCurrency(p.price_per_sqft) : 'N/A' },
    { label: 'Year Built', key: 'year', format: (p: typeof properties[0]) => p.year_built ? String(p.year_built) : 'N/A' },
    { label: 'HOA Fee', key: 'hoa', format: (p: typeof properties[0]) => p.hoa_fee ? formatCurrency(p.hoa_fee) + '/mo' : 'None' },
    { label: 'Pool', key: 'pool', format: (p: typeof properties[0]) => p.features.pool ? '✓' : '✗' },
    { label: 'Garage', key: 'garage', format: (p: typeof properties[0]) => p.features.garage_spaces ? `${p.features.garage_spaces} car` : 'No' },
    { label: 'A/C', key: 'ac', format: (p: typeof properties[0]) => p.features.air_conditioning ? '✓' : '✗' },
    { label: 'Fireplace', key: 'fp', format: (p: typeof properties[0]) => p.features.fireplace ? '✓' : '✗' },
  ];

  return (
    <MarketingLayout>
      <div className="container-app py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Compare Properties</h1>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">
            Compare up to 4 properties side by side
          </p>
        </div>

        {properties.length === 0 ? (
          <div className="py-24 text-center">
            <div className="mb-4 text-6xl">⚖️</div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
              No Properties Selected
            </h2>
            <p className="mt-2 text-neutral-500">
              Browse properties and click the compare icon to add them here
            </p>
            <Button className="mt-6" asChild>
              <Link href="/properties">Browse Properties</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              {/* Property headers */}
              <thead>
                <tr>
                  <th className="w-36 p-4 text-left text-sm font-medium text-neutral-500">Feature</th>
                  {properties.map((p) => (
                    <th key={p.id} className="p-4">
                      <div className="relative">
                        <button
                          onClick={() => removeItem(p.id)}
                          className="absolute -right-1 -top-1 rounded-full bg-danger-100 p-0.5 text-danger-600 hover:bg-danger-200"
                          aria-label="Remove from comparison"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="relative mb-3 aspect-video overflow-hidden rounded-xl">
                          {p.images?.[0] ? (
                            <Image
                              src={p.images[0].thumbnail_url || p.images[0].url}
                              alt={p.title}
                              fill
                              className="object-cover"
                              sizes="300px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-400 text-sm">
                              No image
                            </div>
                          )}
                        </div>
                        <Link
                          href={`/properties/${p.slug}`}
                          className="font-semibold text-neutral-900 hover:text-primary-600 dark:text-white dark:hover:text-primary-400 line-clamp-2"
                        >
                          {p.title}
                        </Link>
                        <div className="mt-1 text-sm text-neutral-500">
                          {p.address.city}, {p.address.state}
                        </div>
                        <div className="mt-2 text-xl font-bold text-primary-600">
                          {formatCurrency(p.price)}
                        </div>
                      </div>
                    </th>
                  ))}
                  {/* Add more slot */}
                  {properties.length < 4 && (
                    <th className="p-4">
                      <Link
                        href="/properties"
                        className="flex h-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 p-8 text-neutral-400 transition-colors hover:border-primary-400 hover:text-primary-600 dark:border-neutral-700 dark:hover:border-primary-600"
                      >
                        <Plus className="mb-2 h-8 w-8" />
                        <span className="text-sm font-medium">Add Property</span>
                      </Link>
                    </th>
                  )}
                </tr>
              </thead>

              {/* Feature rows */}
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {featureRows.map(({ label, format }) => (
                  <tr key={label} className="hover:bg-neutral-50 dark:hover:bg-neutral-900">
                    <td className="p-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      {label}
                    </td>
                    {properties.map((p) => {
                      const value = format(p);
                      const isCheck = value === '✓';
                      const isCross = value === '✗';
                      return (
                        <td key={p.id} className="p-4 text-center">
                          {isCheck ? (
                            <Check className="mx-auto h-5 w-5 text-success-500" />
                          ) : isCross ? (
                            <X className="mx-auto h-5 w-5 text-neutral-300 dark:text-neutral-600" />
                          ) : (
                            <span className="text-sm font-medium text-neutral-900 dark:text-white">
                              {value}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    {properties.length < 4 && <td />}
                  </tr>
                ))}
              </tbody>

              {/* Action row */}
              <tfoot>
                <tr>
                  <td className="p-4" />
                  {properties.map((p) => (
                    <td key={p.id} className="p-4">
                      <Button fullWidth size="sm" asChild>
                        <Link href={`/properties/${p.slug}`}>View Details</Link>
                      </Button>
                    </td>
                  ))}
                  {properties.length < 4 && <td />}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </MarketingLayout>
  );
}
