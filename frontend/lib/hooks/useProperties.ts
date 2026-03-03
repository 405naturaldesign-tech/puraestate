'use client';

import { useCallback, useEffect, useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { propertiesApi } from '@/lib/api/properties';
import { useFavoritesStore } from '@/lib/store';
import type { PaginatedResponse, Property, SearchFilters } from '@/lib/types';

export const PROPERTIES_QUERY_KEY = 'properties';

export function useProperties(filters?: SearchFilters) {
  return useQuery({
    queryKey: [PROPERTIES_QUERY_KEY, filters],
    queryFn: () => propertiesApi.getAll(filters),
    staleTime: 30 * 1000, // 30 seconds
    placeholderData: (prev) => prev,
  });
}

export function useProperty(id?: string) {
  return useQuery({
    queryKey: [PROPERTIES_QUERY_KEY, 'detail', id],
    queryFn: () => propertiesApi.getById(id!),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function usePropertyBySlug(slug?: string) {
  return useQuery({
    queryKey: [PROPERTIES_QUERY_KEY, 'slug', slug],
    queryFn: () => propertiesApi.getBySlug(slug!),
    enabled: !!slug,
    staleTime: 60 * 1000,
  });
}

export function useFeaturedProperties(limit = 6) {
  return useQuery({
    queryKey: [PROPERTIES_QUERY_KEY, 'featured', limit],
    queryFn: () => propertiesApi.getFeatured(limit),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSimilarProperties(propertyId?: string, limit = 4) {
  return useQuery({
    queryKey: [PROPERTIES_QUERY_KEY, 'similar', propertyId, limit],
    queryFn: () => propertiesApi.getSimilar(propertyId!, limit),
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFavorites() {
  const { addFavorite, removeFavorite, isFavorite, favoriteIds, setFavorites } = useFavoritesStore();
  const queryClient = useQueryClient();

  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: () => propertiesApi.getFavorites(),
    staleTime: 2 * 60 * 1000,
  });

  // Sync favorite IDs from server
  useEffect(() => {
    if (favoritesQuery.data?.data) {
      setFavorites(favoritesQuery.data.data.map((f) => f.property.id));
    }
  }, [favoritesQuery.data, setFavorites]);

  const toggleFavorite = useCallback(
    async (property: Property) => {
      const wasFavorite = isFavorite(property.id);

      // Optimistic update
      if (wasFavorite) {
        removeFavorite(property.id);
      } else {
        addFavorite(property.id);
      }

      try {
        if (wasFavorite) {
          await propertiesApi.removeFavorite(property.id);
          toast.success('Removed from favorites');
        } else {
          await propertiesApi.addFavorite(property.id);
          toast.success('Added to favorites');
        }
        queryClient.invalidateQueries({ queryKey: ['favorites'] });
      } catch {
        // Revert
        if (wasFavorite) {
          addFavorite(property.id);
        } else {
          removeFavorite(property.id);
        }
        toast.error('Failed to update favorites');
      }
    },
    [addFavorite, removeFavorite, isFavorite, queryClient]
  );

  return {
    favorites: favoritesQuery.data?.data || [],
    favoriteIds,
    isLoading: favoritesQuery.isLoading,
    isFavorite,
    toggleFavorite,
  };
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Property>) => propertiesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROPERTIES_QUERY_KEY] });
      toast.success('Property created successfully');
    },
    onError: () => toast.error('Failed to create property'),
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Property> }) =>
      propertiesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [PROPERTIES_QUERY_KEY, 'detail', id] });
      queryClient.invalidateQueries({ queryKey: [PROPERTIES_QUERY_KEY] });
      toast.success('Property updated successfully');
    },
    onError: () => toast.error('Failed to update property'),
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => propertiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROPERTIES_QUERY_KEY] });
      toast.success('Property deleted successfully');
    },
    onError: () => toast.error('Failed to delete property'),
  });
}

export function usePriceHistory(propertyId?: string) {
  return useQuery({
    queryKey: [PROPERTIES_QUERY_KEY, 'price-history', propertyId],
    queryFn: () => propertiesApi.getPriceHistory(propertyId!),
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useInfiniteProperties(filters?: SearchFilters) {
  const [pages, setPages] = useState<PaginatedResponse<Property>[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data, isLoading } = useProperties({ ...filters, page: currentPage });

  useEffect(() => {
    if (data) {
      setPages((prev) =>
        currentPage === 1 ? [data] : [...prev, data]
      );
    }
  }, [data, currentPage]);

  const loadMore = useCallback(async () => {
    if (!data?.has_next || isLoadingMore) {
      return;
    }
    setIsLoadingMore(true);
    setCurrentPage((p) => p + 1);
    setIsLoadingMore(false);
  }, [data, isLoadingMore]);

  const reset = useCallback(() => {
    setCurrentPage(1);
    setPages([]);
  }, []);

  const allProperties = pages.flatMap((p) => p.data);

  return {
    properties: allProperties,
    total: data?.total || 0,
    hasMore: data?.has_next || false,
    isLoading,
    isLoadingMore,
    loadMore,
    reset,
  };
}
