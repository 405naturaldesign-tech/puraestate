'use client';

import { useEffect, useRef, useState } from 'react';

import { MapPin } from 'lucide-react';

import { PropertyCard } from '@/components/properties/PropertyCard';
import type { Coordinates, Property } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface PropertyMapProps {
  properties?: Array<{
    id: string;
    coordinates: Coordinates;
    price: number;
    title: string;
    property_type: string;
    listing_type: string;
    thumbnail_url?: string;
  }>;
  center?: Coordinates;
  zoom?: number;
  height?: string;
  selectedPropertyId?: string;
  onPropertyClick?: (id: string) => void;
  onBoundsChange?: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => void;
  selectedProperty?: Property;
}

export function PropertyMap({
  properties = [],
  center = { lat: 40.7128, lng: -74.006 },
  zoom = 12,
  height = '600px',
  selectedPropertyId,
  onPropertyClick,
  onBoundsChange,
  selectedProperty,
}: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) {
      return;
    }

    // Dynamic import of leaflet (client-side only)
    const initMap = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      // Fix default marker icons
      delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        iconUrl: '/leaflet/marker-icon.png',
        shadowUrl: '/leaflet/marker-shadow.png',
      });

      const map = L.map(mapRef.current!, {
        center: [center.lat, center.lng],
        zoom,
        zoomControl: false,
      });

      // Tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Custom zoom control
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Bounds change handler
      if (onBoundsChange) {
        const handleMoveEnd = () => {
          const bounds = map.getBounds();
          onBoundsChange({
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest(),
          });
        };
        map.on('moveend', handleMoveEnd);
        map.on('zoomend', handleMoveEnd);
      }

      mapInstanceRef.current = map;
      setIsMapLoaded(true);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
        setIsMapLoaded(false);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when properties change
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapLoaded) {
      return;
    }

    const addMarkers = async () => {
      const L = (await import('leaflet')).default;
      const map = mapInstanceRef.current as {
        removeLayer: (layer: unknown) => void;
        addLayer: (layer: unknown) => void;
      };

      // Remove old markers
      markersRef.current.forEach((marker) => map.removeLayer(marker));
      markersRef.current = [];

      // Add new markers
      properties.forEach((property) => {
        const isSelected = property.id === selectedPropertyId;
        const icon = L.divIcon({
          html: `<div class="map-marker ${
            isSelected
              ? 'h-10 w-auto min-w-10 rounded-full bg-primary-700 text-xs'
              : 'h-8 w-auto min-w-8 rounded-full bg-primary-600 text-xs'
          } flex items-center justify-center font-bold text-white shadow-lg border-2 border-white px-2 whitespace-nowrap transition-all">
            ${formatCurrency(property.price, 'USD', 'en-US', true)}
          </div>`,
          className: '',
          iconSize: isSelected ? [80, 40] : [70, 32],
          iconAnchor: isSelected ? [40, 20] : [35, 16],
        });

        const marker = L.marker([property.coordinates.lat, property.coordinates.lng], { icon });

        marker.on('click', () => {
          onPropertyClick?.(property.id);
        });

        marker.addTo(map as unknown as import('leaflet').Map);
        markersRef.current.push(marker);
      });
    };

    addMarkers();
  }, [properties, selectedPropertyId, isMapLoaded, onPropertyClick]);

  // Pan to selected property
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedPropertyId) {
      return;
    }
    const selected = properties.find((p) => p.id === selectedPropertyId);
    if (selected) {
      (mapInstanceRef.current as {
        panTo: (coords: [number, number]) => void;
      }).panTo([selected.coordinates.lat, selected.coordinates.lng]);
    }
  }, [selectedPropertyId, properties]);

  return (
    <div className="relative" style={{ height }}>
      <div ref={mapRef} className="h-full w-full rounded-xl" />

      {/* Loading overlay */}
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
          <div className="flex flex-col items-center gap-3 text-neutral-500">
            <MapPin className="h-8 w-8 animate-bounce text-primary-600" />
            <span className="text-sm">Loading map...</span>
          </div>
        </div>
      )}

      {/* Selected property card overlay */}
      {selectedProperty && (
        <div className="absolute bottom-4 left-4 right-4 z-10 max-w-sm md:right-auto">
          <PropertyCard property={selectedProperty} compact />
        </div>
      )}

      {/* Property count */}
      {properties.length > 0 && (
        <div className="absolute right-4 top-4 z-10 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium shadow-sm backdrop-blur-sm dark:bg-neutral-900/90">
          {properties.length} properties
        </div>
      )}
    </div>
  );
}

// Single property map (for detail page)
interface SinglePropertyMapProps {
  coordinates: Coordinates;
  title: string;
  height?: string;
}

export function SinglePropertyMap({
  coordinates,
  title,
  height = '300px',
}: SinglePropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }
    let map: import('leaflet').Map | null = null;

    const init = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        iconUrl: '/leaflet/marker-icon.png',
        shadowUrl: '/leaflet/marker-shadow.png',
      });

      map = L.map(mapRef.current!, {
        center: [coordinates.lat, coordinates.lng],
        zoom: 15,
        zoomControl: false,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const icon = L.divIcon({
        html: `<div class="flex items-center justify-center h-10 w-10 rounded-full bg-primary-600 border-3 border-white shadow-lg">
          <svg class="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
          </svg>
        </div>`,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

      L.marker([coordinates.lat, coordinates.lng], { icon })
        .addTo(map)
        .bindPopup(title, { className: 'property-popup' });

      // Click to enable scroll zoom
      map.on('click', () => {
        if (map) {
          map.scrollWheelZoom.enable();
        }
      });

      setIsLoaded(true);
    };

    init();

    return () => {
      if (map) {
        map.remove();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl" style={{ height }}>
      <div ref={mapRef} className="h-full w-full" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800">
          <MapPin className="h-8 w-8 animate-bounce text-primary-600" />
        </div>
      )}
    </div>
  );
}
