'use client';

import { useEffect } from 'react';

import {
  Bath,
  Bed,
  Calendar,
  ChevronRight,
  Eye,
  Heart,
  Home,
  Maximize2,
  Scale,
  Share2,
  ShieldCheck,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

import { PriceChart } from '@/components/properties/PriceChart';
import { ContactForm } from '@/components/properties/ContactForm';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { PropertyGallery } from '@/components/properties/PropertyGallery';
import { ROICalculator } from '@/components/properties/ROICalculator';
import { SinglePropertyMap } from '@/components/map/PropertyMap';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PropertyDetailSkeleton } from '@/components/ui/Skeleton';
import { useFavorites, usePropertyBySlug, useSimilarProperties } from '@/lib/hooks/useProperties';
import { useComparisonStore } from '@/lib/store';
import {
  cn,
  formatArea,
  formatCurrency,
  formatDate,
  getListingTypeLabel,
  getPropertyTypeLabel,
  getStatusColor,
} from '@/lib/utils';
import { propertiesApi } from '@/lib/api/properties';

interface PropertyDetailContentProps {
  slug: string;
}

export function PropertyDetailContent({ slug }: PropertyDetailContentProps) {
  const { data: property, isLoading } = usePropertyBySlug(slug);
  const { data: similar } = useSimilarProperties(property?.id, 3);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addItem, removeItem, isInComparison, canAdd } = useComparisonStore();

  // Track view on mount
  useEffect(() => {
    if (property?.id) {
      propertiesApi.trackView(property.id).catch(() => {});
    }
  }, [property?.id]);

  if (isLoading) {
    return (
      <div className="container-app py-8">
        <PropertyDetailSkeleton />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container-app py-24 text-center">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Property Not Found</h1>
        <p className="mt-2 text-neutral-500">This property may have been removed or the link is invalid.</p>
        <Button className="mt-6" asChild>
          <Link href="/properties">Browse Properties</Link>
        </Button>
      </div>
    );
  }

  const isFav = isFavorite(property.id);
  const inComparison = isInComparison(property.id);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: property.title, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    }
  };

  const handleCompare = () => {
    if (inComparison) {
      removeItem(property.id);
      toast.success('Removed from comparison');
    } else if (canAdd()) {
      addItem(property);
      toast.success('Added to comparison. View comparison →');
    } else {
      toast.error('Max 4 properties for comparison');
    }
  };

  const amenityGroups = {
    'Interior': property.amenities?.filter((a) =>
      ['hardwood floors', 'granite countertops', 'stainless appliances', 'walk-in closet', 'fireplace'].includes(a.toLowerCase())
    ) || [],
    'Outdoor': property.amenities?.filter((a) =>
      ['pool', 'deck', 'patio', 'garden', 'garage'].includes(a.toLowerCase())
    ) || [],
    'Building': property.amenities?.filter((a) =>
      ['doorman', 'gym', 'rooftop', 'storage', 'elevator'].includes(a.toLowerCase())
    ) || [],
  };

  return (
    <div className="container-app py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1 text-sm text-neutral-500">
        <Link href="/" className="hover:text-primary-600">
          <Home className="h-3.5 w-3.5" />
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/properties" className="hover:text-primary-600">Properties</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="truncate text-neutral-900 dark:text-white">{property.title}</span>
      </nav>

      {/* Gallery */}
      <PropertyGallery images={property.images || []} title={property.title} />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge variant="primary">{getListingTypeLabel(property.listing_type)}</Badge>
                  <Badge variant="default">{getPropertyTypeLabel(property.property_type)}</Badge>
                  <span className={cn('status-badge', getStatusColor(property.status))}>
                    {property.status.replace('_', ' ')}
                  </span>
                  {property.is_verified && (
                    <Badge variant="success" className="flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                  {property.title}
                </h1>
                <div className="mt-2 flex items-center gap-1 text-neutral-500">
                  <span className="text-lg">{property.address.formatted || `${property.address.street}, ${property.address.city}, ${property.address.state}`}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                  {formatCurrency(property.price)}
                  {property.listing_type === 'rent' && <span className="text-base font-normal text-neutral-500">/mo</span>}
                </div>
                {property.price_per_sqft && (
                  <div className="text-sm text-neutral-500">
                    {formatCurrency(property.price_per_sqft)}/sqft
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant={isFav ? 'danger' : 'outline'}
                leftIcon={<Heart className={cn('h-4 w-4', isFav && 'fill-current')} />}
                onClick={() => toggleFavorite(property)}
              >
                {isFav ? 'Saved' : 'Save'}
              </Button>
              <Button
                variant={inComparison ? 'secondary' : 'outline'}
                leftIcon={<Scale className="h-4 w-4" />}
                onClick={handleCompare}
              >
                {inComparison ? 'In Comparison' : 'Compare'}
              </Button>
              <Button variant="outline" leftIcon={<Share2 className="h-4 w-4" />} onClick={handleShare}>
                Share
              </Button>
            </div>
          </div>

          {/* Key Features */}
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {property.features.bedrooms > 0 && (
                  <div className="feature-chip flex-col items-center justify-center py-4">
                    <Bed className="mb-2 h-6 w-6 text-primary-600" />
                    <div className="text-xl font-bold">{property.features.bedrooms}</div>
                    <div className="text-xs">Bedrooms</div>
                  </div>
                )}
                {property.features.bathrooms > 0 && (
                  <div className="feature-chip flex-col items-center justify-center py-4">
                    <Bath className="mb-2 h-6 w-6 text-primary-600" />
                    <div className="text-xl font-bold">{property.features.bathrooms}</div>
                    <div className="text-xs">Bathrooms</div>
                  </div>
                )}
                {property.features.area_sqft > 0 && (
                  <div className="feature-chip flex-col items-center justify-center py-4">
                    <Maximize2 className="mb-2 h-6 w-6 text-primary-600" />
                    <div className="text-xl font-bold">{formatArea(property.features.area_sqft)}</div>
                    <div className="text-xs">Interior</div>
                  </div>
                )}
                {property.year_built && (
                  <div className="feature-chip flex-col items-center justify-center py-4">
                    <Calendar className="mb-2 h-6 w-6 text-primary-600" />
                    <div className="text-xl font-bold">{property.year_built}</div>
                    <div className="text-xs">Year Built</div>
                  </div>
                )}
              </div>

              {/* Extended features */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { label: 'Lot Size', value: property.features.lot_size_sqft ? formatArea(property.features.lot_size_sqft) : null },
                  { label: 'Parking', value: property.features.parking_spaces ? `${property.features.parking_spaces} spaces` : null },
                  { label: 'Garage', value: property.features.garage_spaces ? `${property.features.garage_spaces} car` : null },
                  { label: 'Floors', value: property.features.floors ? String(property.features.floors) : null },
                  { label: 'HOA Fee', value: property.hoa_fee ? formatCurrency(property.hoa_fee) + '/mo' : null },
                  { label: 'Tax/Year', value: property.tax_annual ? formatCurrency(property.tax_annual) : null },
                ].filter((f) => f.value).map(({ label, value }) => (
                  <div key={label} className="text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400">{label}:</span>
                    <span className="ml-2 font-medium text-neutral-900 dark:text-white">{value}</span>
                  </div>
                ))}
              </div>

              {/* Feature chips */}
              <div className="mt-4 flex flex-wrap gap-2">
                {property.features.pool && <span className="feature-chip">Pool</span>}
                {property.features.fireplace && <span className="feature-chip">Fireplace</span>}
                {property.features.basement && <span className="feature-chip">Basement</span>}
                {property.features.air_conditioning && <span className="feature-chip">A/C</span>}
                {property.features.laundry_in_unit && <span className="feature-chip">In-unit Laundry</span>}
                {property.features.elevator && <span className="feature-chip">Elevator</span>}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>About This Property</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {property.description}
              </p>
            </CardContent>
          </Card>

          {/* Amenities */}
          {property.amenities?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Amenities & Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity) => (
                    <span key={amenity} className="feature-chip">{amenity}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Map */}
          {property.coordinates && (
            <Card padding="none" className="overflow-hidden">
              <CardHeader className="p-6 pb-0">
                <CardTitle>Location</CardTitle>
                <p className="text-sm text-neutral-500">
                  {property.address.city}, {property.address.state}
                  {property.address.zip_code && ` ${property.address.zip_code}`}
                </p>
              </CardHeader>
              <div className="p-6 pt-4">
                <SinglePropertyMap
                  coordinates={property.coordinates}
                  title={property.title}
                  height="320px"
                />
                {/* Walk scores */}
                {(property.walk_score || property.transit_score || property.bike_score) && (
                  <div className="mt-4 flex gap-4">
                    {property.walk_score && (
                      <div className="flex flex-col items-center">
                        <div className="text-2xl font-bold text-primary-600">{property.walk_score}</div>
                        <div className="text-xs text-neutral-500">Walk Score</div>
                      </div>
                    )}
                    {property.transit_score && (
                      <div className="flex flex-col items-center">
                        <div className="text-2xl font-bold text-success-600">{property.transit_score}</div>
                        <div className="text-xs text-neutral-500">Transit</div>
                      </div>
                    )}
                    {property.bike_score && (
                      <div className="flex flex-col items-center">
                        <div className="text-2xl font-bold text-accent-600">{property.bike_score}</div>
                        <div className="text-xs text-neutral-500">Bike Score</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Price History Chart */}
          <PriceChart propertyId={property.id} />

          {/* Agent Info */}
          {property.agent && (
            <Card>
              <CardHeader>
                <CardTitle>Listed By</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-xl font-bold text-white">
                    {property.agent.first_name?.[0]}{property.agent.last_name?.[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-neutral-900 dark:text-white">
                        {property.agent.full_name}
                      </h3>
                      {property.agent.agent_profile?.verified && (
                        <ShieldCheck className="h-4 w-4 text-primary-500" />
                      )}
                    </div>
                    {property.agent.agent_profile && (
                      <>
                        <p className="text-sm text-neutral-500">{property.agent.agent_profile.agency_name}</p>
                        <div className="mt-1 flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-accent-400 text-accent-400" />
                            {property.agent.agent_profile.rating} ({property.agent.agent_profile.reviews_count} reviews)
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5 text-neutral-400" />
                            {property.agent.agent_profile.sales_count} sales
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/agents/${property.agent.id}`}>View Profile</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Listing metadata */}
          <div className="flex flex-wrap items-center gap-4 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            <span>Listed: {property.published_at ? formatDate(property.published_at) : 'N/A'}</span>
            <span>Updated: {formatDate(property.updated_at)}</span>
            <span>{property.views_count.toLocaleString()} views</span>
            <span>ID: {property.id.slice(0, 8)}</span>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <ContactForm property={property} />
          <ROICalculator propertyPrice={property.price} />
        </div>
      </div>

      {/* Similar Properties */}
      {similar && similar.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-white">
            Similar Properties
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
