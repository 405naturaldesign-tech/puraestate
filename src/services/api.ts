// src/services/api.ts
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import logger from '../utils/logger';
import { ApiError } from '../types/api';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  retry?: number;
}

class APIClient {
  private client: AxiosInstance;
  private baseURL: string;
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor() {
    this.baseURL = process.env.API_BASE_URL || 'https://api.puraestate.com';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: parseInt(process.env.API_TIMEOUT || '10000'),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config: CustomAxiosRequestConfig) => {
        try {
          const token = await SecureStore.getItemAsync('auth_token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          logger.warn('Failed to retrieve auth token', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config as CustomAxiosRequestConfig;

        // Handle 401 - Try to refresh token
        if (error.response?.status === 401 && config) {
          try {
            const refreshToken = await SecureStore.getItemAsync('refresh_token');
            if (refreshToken) {
              // Attempt to refresh token
              const response = await axios.post(`${this.baseURL}/auth/refresh`, {
                refreshToken,
              });

              if (response.data.token) {
                await SecureStore.setItemAsync('auth_token', response.data.token);
                config.headers.Authorization = `Bearer ${response.data.token}`;
                return this.client(config);
              }
            }
          } catch (refreshError) {
            logger.error('Token refresh failed', refreshError);
            // Clear auth and redirect to login
            await SecureStore.deleteItemAsync('auth_token');
            await SecureStore.deleteItemAsync('refresh_token');
          }
        }

        // Retry logic for transient errors
        if (config && this.shouldRetry(error)) {
          config.retry = (config.retry || 0) + 1;

          if (config.retry <= this.maxRetries) {
            await new Promise((resolve) =>
              setTimeout(resolve, this.retryDelay * Math.pow(2, config.retry! - 1))
            );
            return this.client(config);
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private shouldRetry(error: AxiosError): boolean {
    if (!error.response) return true; // Network error
    const status = error.response.status;
    return status === 408 || status === 429 || status >= 500;
  }

  private handleError(error: any): ApiError {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      logger.error(`API Error: ${status}`, data);

      return {
        code: data?.code || `HTTP_${status}`,
        message: data?.message || error.message,
        details: data?.details,
        statusCode: status,
      };
    }

    if (error.request) {
      logger.error('Network Error: No response', error.request);
      return {
        code: 'NETWORK_ERROR',
        message: 'Network request failed',
        statusCode: 0,
      };
    }

    logger.error('Request Setup Error', error);
    return {
      code: 'REQUEST_ERROR',
      message: error.message,
      statusCode: 0,
    };
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    const { token, refreshToken, user } = response.data;

    if (token) {
      await SecureStore.setItemAsync('auth_token', token);
    }
    if (refreshToken) {
      await SecureStore.setItemAsync('refresh_token', refreshToken);
    }

    return { user, token };
  }

  async signUp(data: any) {
    const response = await this.client.post('/auth/signup', data);
    const { token, refreshToken, user } = response.data;

    if (token) {
      await SecureStore.setItemAsync('auth_token', token);
    }
    if (refreshToken) {
      await SecureStore.setItemAsync('refresh_token', refreshToken);
    }

    return { user, token };
  }

  async logout() {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('refresh_token');
  }

  // Property endpoints
  async getProperties(filters: any, page: number = 1, limit: number = 20) {
    const params = { ...filters, page, limit };
    const response = await this.client.get('/properties', { params });
    return response.data;
  }

  async getPropertyById(id: string) {
    const response = await this.client.get(`/properties/${id}`);
    return response.data;
  }

  async searchProperties(query: string, filters?: any) {
    const response = await this.client.get('/properties/search', {
      params: { q: query, ...filters },
    });
    return response.data;
  }

  async getFavoriteProperties() {
    const response = await this.client.get('/favorites');
    return response.data;
  }

  async addFavorite(propertyId: string) {
    await this.client.post(`/favorites/${propertyId}`);
  }

  async removeFavorite(propertyId: string) {
    await this.client.delete(`/favorites/${propertyId}`);
  }

  async getMyProperties() {
    const response = await this.client.get('/my-properties');
    return response.data;
  }

  // AI Matching endpoints
  async getAIMatchedProperties(preferences: any) {
    const response = await this.client.post('/matching/find', preferences);
    return response.data;
  }

  async submitMatchingPreferences(data: any) {
    const response = await this.client.post('/matching/preferences', data);
    return response.data;
  }

  // Analytics endpoints
  async getMarketAnalytics(location: string, dateRange?: any) {
    const response = await this.client.get('/analytics/market', {
      params: { location, ...dateRange },
    });
    return response.data;
  }

  async getPropertyAnalytics(propertyId: string) {
    const response = await this.client.get(`/analytics/property/${propertyId}`);
    return response.data;
  }

  async getMarketHeatmap(location: string) {
    const response = await this.client.get('/analytics/heatmap', {
      params: { location },
    });
    return response.data;
  }

  // Agents endpoints
  async getAgents() {
    const response = await this.client.get('/agents');
    return response.data;
  }

  async getAgentById(id: string) {
    const response = await this.client.get(`/agents/${id}`);
    return response.data;
  }

  async getAgentProperties(agentId: string) {
    const response = await this.client.get(`/agents/${agentId}/properties`);
    return response.data;
  }

  async contactAgent(agentId: string, message: string) {
    await this.client.post(`/agents/${agentId}/contact`, { message });
  }

  // Tools endpoints
  async getMortgageCalculation(data: any) {
    const response = await this.client.post('/tools/mortgage-calculator', data);
    return response.data;
  }

  async getPropertyValuation(propertyId: string) {
    const response = await this.client.get(`/tools/valuation/${propertyId}`);
    return response.data;
  }

  async getMarketComps(propertyId: string) {
    const response = await this.client.get(`/tools/comps/${propertyId}`);
    return response.data;
  }

  // User endpoints
  async getProfile() {
    const response = await this.client.get('/users/profile');
    return response.data;
  }

  async updateProfile(data: any) {
    const response = await this.client.put('/users/profile', data);
    return response.data;
  }

  async uploadAvatar(file: any) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.client.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.url;
  }
}

export default new APIClient();
