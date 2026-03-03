// User types
export interface Investor {
  id: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  preferences: {
    minPrice: number;
    maxPrice: number;
    location: string[];
    propertyType: string[];
    language: 'es' | 'en';
  };
  whatsappOptIn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  agencyId: string;
  language: 'es' | 'en';
  whatsappOptIn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Property types
export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  previousPrice?: number;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  details: {
    bedrooms: number;
    bathrooms: number;
    area: number;
    yearBuilt: number;
    propertyType: string;
  };
  images: string[];
  agentId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Viewing types
export interface Viewing {
  id: string;
  propertyId: string;
  investorId: string;
  agentId: string;
  scheduledDate: Date;
  duration: number; // minutes
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Message types
export interface WhatsAppMessage {
  id: string;
  recipientPhoneNumber: string;
  recipientType: 'investor' | 'agent';
  recipientId: string;
  messageType: string; // 'property_match', 'booking_confirmation', 'reminder', etc.
  content: {
    text: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'document' | 'video';
  };
  status: 'queued' | 'sent' | 'failed' | 'delivered' | 'read';
  composioMessageId?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  errorMessage?: string;
  retries: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
}

// Subscription types
export interface Subscription {
  id: string;
  investorId: string;
  planId: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'expired';
  paymentStatus: 'pending' | 'completed' | 'failed';
  startDate: Date;
  endDate: Date;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics types
export interface MessageAnalytics {
  id: string;
  messageId: string;
  campaignType: string;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  readCount: number;
  responseCount: number;
  averageDeliveryTime: number; // seconds
  createdAt: Date;
  updatedAt: Date;
}

// Template types
export interface MessageTemplate {
  id: string;
  key: string;
  category: string;
  language: 'es' | 'en';
  subject?: string;
  body: string;
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Queue job types
export interface JobData {
  type: string;
  retryCount: number;
  [key: string]: any;
}

// Webhook types
export interface WebhookEvent {
  id: string;
  type: string;
  timestamp: Date;
  data: Record<string, any>;
  processed: boolean;
  processedAt?: Date;
  createdAt: Date;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
}

// Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: Date;
}

// Request types
export interface PropertyMatchRequest {
  investorId: string;
  propertyIds: string[];
  topAgentsCount?: number;
}

export interface BookingRequest {
  investorId: string;
  propertyId: string;
  agentId: string;
  preferredDate: Date;
  notes?: string;
}

export interface SendMessageRequest {
  phoneNumber: string;
  message: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'document' | 'video';
  templateId?: string;
  variables?: Record<string, string>;
}

// Composio types
export interface ComposioClient {
  execute_action(action: string, params: Record<string, any>): Promise<any>;
  get_action(action: string): Promise<any>;
}

// Rate limiting
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

// Cache types
export interface CacheEntry<T> {
  data: T;
  expiresAt: Date;
}
