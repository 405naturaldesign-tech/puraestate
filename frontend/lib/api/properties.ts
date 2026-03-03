import apiClient from './client';

import type {
  ContactFormData,
  Favorite,
  PaginatedResponse,
  Property,
  SearchFilters,
} from '@/lib/types';

export const propertiesApi = {
  // List & Search
  getAll: async (filters?: SearchFilters): Promise<PaginatedResponse<Property>> => {
    const response = await apiClient.get('/properties', { params: filters });
    return response.data;
  },

  search: async (filters: SearchFilters): Promise<PaginatedResponse<Property>> => {
    const response = await apiClient.post('/properties/search', filters);
    return response.data;
  },

  getFeatured: async (limit = 6): Promise<Property[]> => {
    const response = await apiClient.get('/properties/featured', { params: { limit } });
    return response.data.properties;
  },

  getSimilar: async (propertyId: string, limit = 4): Promise<Property[]> => {
    const response = await apiClient.get(`/properties/${propertyId}/similar`, {
      params: { limit },
    });
    return response.data.properties;
  },

  // Single Property
  getById: async (id: string): Promise<Property> => {
    const response = await apiClient.get(`/properties/${id}`);
    return response.data.property;
  },

  getBySlug: async (slug: string): Promise<Property> => {
    const response = await apiClient.get(`/properties/slug/${slug}`);
    return response.data.property;
  },

  // CRUD
  create: async (data: Partial<Property>): Promise<Property> => {
    const response = await apiClient.post('/properties', data);
    return response.data.property;
  },

  update: async (id: string, data: Partial<Property>): Promise<Property> => {
    const response = await apiClient.put(`/properties/${id}`, data);
    return response.data.property;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/properties/${id}`);
  },

  // Images
  uploadImages: async (
    propertyId: string,
    files: File[],
    onProgress?: (progress: number) => void
  ): Promise<{ images: Property['images'] }> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    const response = await apiClient.post(`/properties/${propertyId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
    return response.data;
  },

  deleteImage: async (propertyId: string, imageId: string): Promise<void> => {
    await apiClient.delete(`/properties/${propertyId}/images/${imageId}`);
  },

  // Favorites
  getFavorites: async (): Promise<PaginatedResponse<Favorite>> => {
    const response = await apiClient.get('/properties/favorites');
    return response.data;
  },

  addFavorite: async (propertyId: string, notes?: string): Promise<Favorite> => {
    const response = await apiClient.post(`/properties/${propertyId}/favorite`, { notes });
    return response.data.favorite;
  },

  removeFavorite: async (propertyId: string): Promise<void> => {
    await apiClient.delete(`/properties/${propertyId}/favorite`);
  },

  // Inquiries / Contact
  sendInquiry: async (data: ContactFormData): Promise<void> => {
    await apiClient.post(`/properties/${data.property_id}/inquire`, data);
  },

  // Views tracking
  trackView: async (propertyId: string): Promise<void> => {
    await apiClient.post(`/properties/${propertyId}/view`);
  },

  // Comparison
  compare: async (propertyIds: string[]): Promise<Property[]> => {
    const response = await apiClient.post('/properties/compare', { property_ids: propertyIds });
    return response.data.properties;
  },

  // Price history
  getPriceHistory: async (propertyId: string): Promise<Property['price_history']> => {
    const response = await apiClient.get(`/properties/${propertyId}/price-history`);
    return response.data.history;
  },

  // Map
  getMapListings: async (
    bounds: { north: number; south: number; east: number; west: number },
    filters?: SearchFilters
  ): Promise<
    Array<{
      id: string;
      coordinates: { lat: number; lng: number };
      price: number;
      title: string;
      property_type: string;
      listing_type: string;
      thumbnail_url?: string;
    }>
  > => {
    const response = await apiClient.get('/properties/map', { params: { ...bounds, ...filters } });
    return response.data.listings;
  },
};
