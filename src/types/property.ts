// src/types/property.ts
import { Location } from './common';

export interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  location: Location;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  propertyType: 'apartment' | 'house' | 'condo' | 'townhouse' | 'land';
  yearBuilt?: number;
  images: PropertyImage[];
  amenities: string[];
  features: PropertyFeature[];
  agentId: string;
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
  status: 'available' | 'pending' | 'sold' | 'rented';
  listedDate: string;
  daysOnMarket?: number;
  priceHistory?: PriceHistoryEntry[];
  taxInfo?: PropertyTaxInfo;
  hoaFee?: number;
  virtualTourUrl?: string;
  isFavorite?: boolean;
  matchScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyImage {
  id: string;
  url: string;
  caption?: string;
  isPrimary?: boolean;
}

export interface PropertyFeature {
  name: string;
  value: string;
}

export interface PropertyTaxInfo {
  annualTaxAmount: number;
  taxRate: number;
  lastAssessmentYear: number;
}

export interface PriceHistoryEntry {
  price: number;
  date: string;
  changePercent?: number;
}

export interface PropertySearchResult {
  properties: Property[];
  total: number;
  page: number;
  limit: number;
}

export interface PropertyStats {
  totalViews: number;
  totalFavorites: number;
  marketDays: number;
  pricePerSqFt: number;
}

export interface MatchingResult {
  propertyId: string;
  matchScore: number;
  matchReasons: string[];
  matchDetails: MatchDetail[];
}

export interface MatchDetail {
  criteria: string;
  userValue: string;
  propertyValue: string;
  matchPercent: number;
}

export interface PropertyPortfolio {
  ownedProperties: Property[];
  rentedProperties: Property[];
  totalValue: number;
  monthlyIncome?: number;
}
