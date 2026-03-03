import type { Metadata } from 'next';

import type { Property } from '@/lib/types';
import {
  formatCurrency,
  formatArea,
  getListingTypeLabel,
  getPropertyTypeLabel,
} from '@/lib/utils';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://puraestate.com';
const SITE_NAME = 'PuraEstate';

export function generatePropertyMetadata(property: Property): Metadata {
  const title = `${property.title} - ${getListingTypeLabel(property.listing_type)} | ${SITE_NAME}`;
  const description = `${getPropertyTypeLabel(property.property_type)} ${getListingTypeLabel(property.listing_type).toLowerCase()} in ${property.address.city}, ${property.address.state}. ${property.features.bedrooms} bed, ${property.features.bathrooms} bath, ${formatArea(property.features.area_sqft)}. ${formatCurrency(property.price)}. ${property.description?.slice(0, 100)}`;

  const primaryImage = property.images?.find((img) => img.is_primary) || property.images?.[0];
  const ogImage = primaryImage?.url || `${BASE_URL}/og-image.jpg`;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/properties/${property.slug}`,
    },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `${BASE_URL}/properties/${property.slug}`,
      siteName: SITE_NAME,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: property.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    other: {
      'price:amount': String(property.price),
      'price:currency': property.currency || 'USD',
    },
  };
}

export function generatePropertyStructuredData(property: Property) {
  const primaryImage = property.images?.find((img) => img.is_primary) || property.images?.[0];

  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description,
    url: `${BASE_URL}/properties/${property.slug}`,
    image: primaryImage?.url,
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address.street,
      addressLocality: property.address.city,
      addressRegion: property.address.state,
      postalCode: property.address.zip_code,
      addressCountry: property.address.country || 'US',
    },
    geo: property.coordinates
      ? {
          '@type': 'GeoCoordinates',
          latitude: property.coordinates.lat,
          longitude: property.coordinates.lng,
        }
      : undefined,
    numberOfRooms: property.features.bedrooms,
    numberOfBathroomsTotal: property.features.bathrooms,
    floorSize: {
      '@type': 'QuantitativeValue',
      value: property.features.area_sqft,
      unitCode: 'FTK',
    },
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: property.currency || 'USD',
      availability:
        property.status === 'active'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/SoldOut',
    },
  };
}

export function generateBreadcrumbStructuredData(
  items: Array<{ name: string; href: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.href}`,
    })),
  };
}
