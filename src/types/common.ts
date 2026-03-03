// src/types/common.ts
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  NotFound: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  VerifyEmail: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  PropertySearch: { initialFilters?: PropertyFilters };
  PropertyDetail: { propertyId: string };
  MyProperties: undefined;
  Agents: undefined;
  MarketAnalytics: undefined;
  Tools: undefined;
  Account: undefined;
};

export interface PropertyFilters {
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  location?: string;
  propertyType?: 'apartment' | 'house' | 'condo' | 'townhouse' | 'land';
  amenities?: string[];
  yearBuiltMin?: number;
  yearBuiltMax?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  statusCode: number;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';
