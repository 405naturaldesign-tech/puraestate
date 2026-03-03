import apiClient from './client';

import type { PaginatedResponse, Property, User } from '@/lib/types';

export const adminApi = {
  // Users
  getUsers: async (params?: {
    page?: number;
    per_page?: number;
    role?: string;
    query?: string;
    status?: string;
  }): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },

  getUser: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/admin/users/${id}`);
    return response.data.user;
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await apiClient.put(`/admin/users/${id}`, data);
    return response.data.user;
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/users/${id}`);
  },

  banUser: async (id: string, reason: string): Promise<void> => {
    await apiClient.post(`/admin/users/${id}/ban`, { reason });
  },

  unbanUser: async (id: string): Promise<void> => {
    await apiClient.post(`/admin/users/${id}/unban`);
  },

  verifyUser: async (id: string): Promise<void> => {
    await apiClient.post(`/admin/users/${id}/verify`);
  },

  // Properties
  getPendingProperties: async (params?: {
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<Property>> => {
    const response = await apiClient.get('/admin/properties/pending', { params });
    return response.data;
  },

  approveProperty: async (id: string): Promise<Property> => {
    const response = await apiClient.post(`/admin/properties/${id}/approve`);
    return response.data.property;
  },

  rejectProperty: async (id: string, reason: string): Promise<void> => {
    await apiClient.post(`/admin/properties/${id}/reject`, { reason });
  },

  featureProperty: async (id: string, featured: boolean): Promise<void> => {
    await apiClient.post(`/admin/properties/${id}/feature`, { featured });
  },

  // Stats
  getDashboardStats: async () => {
    const response = await apiClient.get('/admin/stats/dashboard');
    return response.data;
  },

  getRecentActivity: async (limit = 20) => {
    const response = await apiClient.get('/admin/activity', { params: { limit } });
    return response.data;
  },

  // Settings
  getSettings: async () => {
    const response = await apiClient.get('/admin/settings');
    return response.data.settings;
  },

  updateSettings: async (settings: Record<string, unknown>) => {
    const response = await apiClient.put('/admin/settings', settings);
    return response.data.settings;
  },
};
