import axios, { AxiosInstance, AxiosError } from 'axios';

/**
 * Flask API Gateway
 * Centralized HTTP client for communicating with Flask backend
 */
export class FlaskGateway {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.FLASK_API_URL || 'http://localhost:5000',
      timeout: 10000,
      headers: {
        'X-API-Key': process.env.FLASK_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('[Flask] API error:', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url,
        });
        throw new Error(`Flask API error: ${error.response?.status} ${error.message}`);
      }
    );
  }

  /**
   * Listings endpoints
   */
  async getListings(filters?: {
    status?: string;
    property_type?: string;
    min_price?: number;
    max_price?: number;
    limit?: number;
    offset?: number;
  }) {
    const response = await this.client.get('/api/listings', { params: filters });
    return response.data;
  }

  async getListingById(id: string) {
    const response = await this.client.get(`/api/listings/${id}`);
    return response.data;
  }

  async createListing(data: any, token: string) {
    const response = await this.client.post('/api/listings', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async updateListing(id: string, data: any, token: string) {
    const response = await this.client.put(`/api/listings/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async deleteListing(id: string, token: string) {
    const response = await this.client.delete(`/api/listings/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  /**
   * Inquiries endpoints
   */
  async getInquiries(token: string, filters?: { status?: string; limit?: number }) {
    const response = await this.client.get('/api/inquiries', {
      params: filters,
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async createInquiry(data: any, token: string) {
    const response = await this.client.post('/api/inquiries', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async updateInquiry(id: string, data: any, token: string) {
    const response = await this.client.put(`/api/inquiries/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  /**
   * Users endpoints
   */
  async getUserProfile(token: string) {
    const response = await this.client.get('/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async updateUserProfile(data: any, token: string) {
    const response = await this.client.put('/api/users/profile', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  /**
   * Search/Analytics endpoints
   */
  async searchListings(query: string, filters?: any) {
    const response = await this.client.get('/api/search', {
      params: { q: query, ...filters },
    });
    return response.data;
  }

  async getListingStats(id: string) {
    const response = await this.client.get(`/api/listings/${id}/stats`);
    return response.data;
  }

  /**
   * Transaction endpoints
   */
  async getTransactions(token: string) {
    const response = await this.client.get('/api/transactions', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async createTransaction(data: any, token: string) {
    const response = await this.client.post('/api/transactions', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }
}

// Export singleton instance
export const flaskGateway = new FlaskGateway();
