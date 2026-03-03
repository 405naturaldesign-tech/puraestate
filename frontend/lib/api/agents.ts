import apiClient from './client';

import type { AgentProfile, PaginatedResponse, User } from '@/lib/types';

export interface AgentFilters {
  query?: string;
  city?: string;
  specialization?: string;
  language?: string;
  rating_min?: number;
  page?: number;
  per_page?: number;
  sort_by?: 'rating' | 'listings_count' | 'sales_count' | 'years_experience';
}

export const agentsApi = {
  getAll: async (filters?: AgentFilters): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get('/agents', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/agents/${id}`);
    return response.data.agent;
  },

  getListings: async (agentId: string, page = 1, perPage = 12) => {
    const response = await apiClient.get(`/agents/${agentId}/listings`, {
      params: { page, per_page: perPage },
    });
    return response.data;
  },

  getReviews: async (agentId: string, page = 1) => {
    const response = await apiClient.get(`/agents/${agentId}/reviews`, { params: { page } });
    return response.data;
  },

  submitReview: async (agentId: string, rating: number, comment: string) => {
    const response = await apiClient.post(`/agents/${agentId}/reviews`, { rating, comment });
    return response.data;
  },

  contact: async (agentId: string, message: string, phone?: string) => {
    const response = await apiClient.post(`/agents/${agentId}/contact`, { message, phone });
    return response.data;
  },

  updateProfile: async (data: Partial<AgentProfile>): Promise<AgentProfile> => {
    const response = await apiClient.put('/agents/profile', data);
    return response.data.profile;
  },
};
