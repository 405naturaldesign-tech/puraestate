import apiClient from './client';

import type { AnalyticsSummary, MarketTrend, PriceRangeDistribution } from '@/lib/types';

export const analyticsApi = {
  getSummary: async (): Promise<AnalyticsSummary> => {
    const response = await apiClient.get('/analytics/summary');
    return response.data;
  },

  getMarketTrends: async (
    period: '1m' | '3m' | '6m' | '1y' | '2y' | '5y' = '1y',
    city?: string,
    property_type?: string
  ): Promise<MarketTrend[]> => {
    const response = await apiClient.get('/analytics/market-trends', {
      params: { period, city, property_type },
    });
    return response.data.trends;
  },

  getPriceDistribution: async (
    city?: string,
    property_type?: string
  ): Promise<PriceRangeDistribution[]> => {
    const response = await apiClient.get('/analytics/price-distribution', {
      params: { city, property_type },
    });
    return response.data.distribution;
  },

  getPropertyViews: async (
    propertyId: string,
    period = '30d'
  ): Promise<Array<{ date: string; views: number }>> => {
    const response = await apiClient.get(`/analytics/properties/${propertyId}/views`, {
      params: { period },
    });
    return response.data.views;
  },

  getUserActivity: async (period = '30d') => {
    const response = await apiClient.get('/analytics/user-activity', { params: { period } });
    return response.data;
  },

  getTopCities: async () => {
    const response = await apiClient.get('/analytics/top-cities');
    return response.data.cities;
  },

  getTopAgents: async (limit = 10) => {
    const response = await apiClient.get('/analytics/top-agents', { params: { limit } });
    return response.data.agents;
  },

  getInventoryReport: async () => {
    const response = await apiClient.get('/analytics/inventory');
    return response.data;
  },
};
