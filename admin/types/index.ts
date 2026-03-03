export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'admin' | 'agent' | 'buyer' | 'seller';
  subscription?: SubscriptionPlan;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  avatar?: string;
  bio?: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
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
  propertyType: 'apartment' | 'house' | 'villa' | 'commercial' | 'land';
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  amenities: string[];
  images: string[];
  price: number;
  currency: string;
  agent: {
    id: string;
    name: string;
    email: string;
  };
  status: 'available' | 'sold' | 'rented' | 'pending';
  createdAt: Date;
  updatedAt: Date;
  views: number;
  favorites: number;
  verified: boolean;
}

export interface Booking {
  id: string;
  propertyId: string;
  userId: string;
  agentId: string;
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalPrice: number;
  commission: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: string;
  user: User;
  license: string;
  licenseExpiry: Date;
  agency?: string;
  specialization: string[];
  rating: number;
  reviewCount: number;
  totalBookings: number;
  totalCommission: number;
  properties: string[];
  verified: boolean;
  verificationDate?: Date;
  bankDetails: {
    accountHolder: string;
    accountNumber: string;
    bankName: string;
    routingNumber: string;
  };
}

export interface Transaction {
  id: string;
  bookingId?: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  type: 'booking' | 'subscription' | 'commission';
  paymentMethod: 'stripe' | 'bank_transfer' | 'cash';
  stripeTransactionId?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  duration: 'monthly' | 'yearly';
  stripeProductId: string;
  stripePriceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  stripeSubscriptionId: string;
  status: 'active' | 'cancelled' | 'expired';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  type: 'text' | 'image' | 'document';
  channel: 'whatsapp' | 'email' | 'in-app';
  status: 'sent' | 'delivered' | 'read';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardMetrics {
  totalProperties: number;
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  monthlyBookings: number;
  monthlyRevenue: number;
  activeUsers: number;
  pendingVerifications: number;
}

export interface ReportData {
  id: string;
  title: string;
  type: 'user_metrics' | 'property_performance' | 'revenue' | 'agent_performance' | 'custom';
  generatedBy: string;
  generatedAt: Date;
  data: Record<string, any>;
  filters?: Record<string, any>;
}

export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'agent' | 'buyer' | 'seller';
  avatar?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
