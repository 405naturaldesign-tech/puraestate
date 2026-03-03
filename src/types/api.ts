// src/types/api.ts
import { Property, PropertySearchResult, MatchingResult } from './property';
import { User, Agent } from './user';

export interface APIClient {
  // Auth endpoints
  login(email: string, password: string): Promise<{ user: User; token: string }>;
  signUp(data: any): Promise<{ user: User; token: string }>;
  logout(): Promise<void>;
  refreshToken(token: string): Promise<{ token: string }>;

  // Property endpoints
  getProperties(filters: any, page: number, limit: number): Promise<PropertySearchResult>;
  getPropertyById(id: string): Promise<Property>;
  searchProperties(query: string, filters?: any): Promise<PropertySearchResult>;
  getFavoriteProperties(): Promise<Property[]>;
  addFavorite(propertyId: string): Promise<void>;
  removeFavorite(propertyId: string): Promise<void>;
  getMyProperties(): Promise<Property[]>;

  // AI Matching
  getAIMatchedProperties(preferences: any): Promise<MatchingResult[]>;
  submitMatchingPreferences(data: any): Promise<MatchingResult[]>;

  // Analytics
  getMarketAnalytics(location: string, dateRange?: any): Promise<any>;
  getPropertyAnalytics(propertyId: string): Promise<any>;
  getMarketHeatmap(location: string): Promise<any>;

  // Agents
  getAgents(): Promise<Agent[]>;
  getAgentById(id: string): Promise<Agent>;
  getAgentProperties(agentId: string): Promise<Property[]>;
  contactAgent(agentId: string, message: string): Promise<void>;

  // Tools
  getMortgageCalculation(data: any): Promise<any>;
  getPropertyValuation(propertyId: string): Promise<any>;
  getMarketComps(propertyId: string): Promise<Property[]>;

  // User
  getProfile(): Promise<User>;
  updateProfile(data: Partial<User>): Promise<User>;
  uploadAvatar(file: any): Promise<string>;
}

export interface CalculatorInputs {
  principal: number;
  interestRate: number;
  loanTerm: number;
  downPayment?: number;
  propertyPrice?: number;
}

export interface CalculatorResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  breakdown: PaymentBreakdown[];
}

export interface PaymentBreakdown {
  month: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface ValuationResult {
  estimatedValue: number;
  lowEstimate: number;
  highEstimate: number;
  confidence: number;
  factors: ValuationFactor[];
}

export interface ValuationFactor {
  name: string;
  impact: number;
  description: string;
}
