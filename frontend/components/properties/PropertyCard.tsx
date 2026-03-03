'use client';

import { Bath, Bed, Heart, MapPin, Maximize2, Scale, Share2, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useFavorites } from '@/lib/hooks/useProperties';
import { useComparisonStore } from '@/lib/store';
import type { Property } from '@/lib/types';
import {
  cn,
  formatArea,
  formatCurrency,
  getListingTypeLabel,
  getPropertyTypeLabel,
  getStatusColor,
} from '@/lib/utils';

interface PropertyCardProps {
  property: Property;
  className?: string;
  compact?: boolean;
}

export function PropertyCard({ property, className, compact = false }: PropertyCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addItem, removeItem, isInComparison, canAdd } = useComparisonStore();

  const isFav = isFavorite(property.id);
  const inComparison = isInComparison(property.id);

  const primaryImage = property.images?.find((img) => img.is_primary) || property.images?.[0];

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(property);
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inComparison) {
      removeItem(property.id);
      toast.success('Removed from comparison');
    } else if (canAdd()) {
      addItem(property);
      toast.success('Added to comparison');
    } else {
      toast.error('You can compare up to 4 properties at a time');
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/properties/${property.slug}`;
    if (navigator.share) {
      navigator.share({ title: property.title, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  return (
    <article
      className={cn(
        'property-card group animate-enter',
        compact ? 'flex gap-4' : 'flex flex-col',
        className
      )}
    >
      {/* Image */}
      <Link
        href={`/properties/${property.slug}`}
        className={cn(
          'relative overflow-hidden bg-neutral-100',
          compact ? 'h-28 w-36 shrink-0 rounded-xl' : 'aspect-property'
        )}
      >
        {primaryImage ? (
          <Image
            src={primaryImage.thumbnail_url || primaryImage.url}
            alt={property.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-200 dark:bg-neutral-700">
            <span className="text-neutral-400 dark:text-neutral-500">No image</span>
          </div>
        )}

        {/* Badges */}
        {!compact && (
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <Badge variant="primary">{getListingTypeLabel(property.listing_type)}</Badge>
            {property.is_featured && <Badge variant="accent">Featured</Badge>}
            <span className={cn('status-badge', getStatusColor(property.status))}>
              {property.status.replace('_', ' ')}
            </span>
          </div>
        )}

        {/* Action buttons */}
        {!compact && (
          <div className="absolute right-3 top-3 flex flex-col gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <button
              onClick={handleFavorite}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-colors hover:scale-110',
                isFav ? 'text-danger-500' : 'text-neutral-400 hover:text-danger-500'
              )}
              aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={cn('h-4 w-4', isFav && 'fill-current')} />
            </button>
            <button
              onClick={handleCompare}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-colors hover:scale-110',
                inComparison ? 'text-primary-500' : 'text-neutral-400 hover:text-primary-500'
              )}
              aria-label={inComparison ? 'Remove from comparison' : 'Add to comparison'}
            >
              <Scale className="h-4 w-4" />
            </button>
            <button
              onClick={handleShare}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-400 shadow-sm backdrop-blur-sm transition-colors hover:scale-110 hover:text-primary-500"
              aria-label="Share property"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Image count */}
        {!compact && property.images?.length > 1 && (
          <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
            1/{property.images.length}
          </div>
        )}
      </Link>

      {/* Content */}
      <div className={cn('flex flex-1 flex-col', compact ? 'py-1' : 'p-4')}>
        {/* Price */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xl font-bold text-primary-600 dark:text-primary-400">
              {formatCurrency(property.price)}
              {property.listing_type === 'rent' && (
                <span className="text-sm font-normal text-neutral-500">/mo</span>
              )}
            </div>
            {property.price_per_sqft && !compact && (
              <div className="text-xs text-neutral-500">
                {formatCurrency(property.price_per_sqft)}/sqft
              </div>
            )}
          </div>
          {!compact && property.agent?.agent_profile?.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-accent-400 text-accent-400" />
              <span className="text-xs text-neutral-600 dark:text-neutral-400">
                {property.agent.agent_profile.rating}
              </span>
            </div>
          )}
        </div>

        {/* Title */}
        <Link href={`/properties/${property.slug}`}>
          <h3 className="mt-2 line-clamp-2 font-semibold text-neutral-900 transition-colors hover:text-primary-600 dark:text-white dark:hover:text-primary-400">
            {property.title}
          </h3>
        </Link>

        {/* Location */}
        <div className="mt-1 flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {property.address.city}, {property.address.state}
          </span>
        </div>

        {/* Features */}
        {!compact && (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-neutral-600 dark:text-neutral-300">
            {property.features.bedrooms > 0 && (
              <span className="flex items-center gap-1">
                <Bed className="h-4 w-4 text-neutral-400" />
                {property.features.bedrooms} bed{property.features.bedrooms !== 1 ? 's' : ''}
              </span>
            )}
            {property.features.bathrooms > 0 && (
              <span className="flex items-center gap-1">
                <Bath className="h-4 w-4 text-neutral-400" />
                {property.features.bathrooms} bath{property.features.bathrooms !== 1 ? 's' : ''}
              </span>
            )}
            {property.features.area_sqft > 0 && (
              <span className="flex items-center gap-1">
                <Maximize2 className="h-4 w-4 text-neutral-400" />
                {formatArea(property.features.area_sqft)}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        {!compact && (
          <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
            <span className="text-xs text-neutral-400">
              {getPropertyTypeLabel(property.property_type)}
            </span>
            <Button variant="primary" size="xs" asChild>
              <Link href={`/properties/${property.slug}`}>View Details</Link>
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
