import apiClient from './client';

import type { PaginatedResponse, SavedSearch, SearchFilters } from '@/lib/types';

export const savedSearchesApi = {
  getAll: async (): Promise<PaginatedResponse<SavedSearch>> => {
    const response = await apiClient.get('/saved-searches');
    return response.data;
  },

  create: async (
    name: string,
    filters: SearchFilters,
    alertEnabled = false,
    alertFrequency: SavedSearch['alert_frequency'] = 'daily'
  ): Promise<SavedSearch> => {
    const response = await apiClient.post('/saved-searches', {
      name,
      filters,
      alert_enabled: alertEnabled,
      alert_frequency: alertFrequency,
    });
    return response.data.saved_search;
  },

  update: async (id: string, data: Partial<SavedSearch>): Promise<SavedSearch> => {
    const response = await apiClient.put(`/saved-searches/${id}`, data);
    return response.data.saved_search;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/saved-searches/${id}`);
  },

  toggleAlert: async (id: string, enabled: boolean): Promise<SavedSearch> => {
    const response = await apiClient.patch(`/saved-searches/${id}/alert`, { enabled });
    return response.data.saved_search;
  },

  getNewResults: async (id: string) => {
    const response = await apiClient.get(`/saved-searches/${id}/results`);
    return response.data;
  },
};
