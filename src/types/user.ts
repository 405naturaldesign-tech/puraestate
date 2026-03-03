// src/types/user.ts
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  profileComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  userId: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  darkMode: boolean;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD';
  language: string;
  savedSearches: string[];
  favorites: string[];
}

export interface UserProfile extends User {
  preferences: UserPreferences;
  role: 'buyer' | 'seller' | 'agent' | 'investor';
  preferredLocation?: string;
  investmentGoals?: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  agency?: string;
  bio?: string;
  rating: number;
  reviewCount: number;
  propertiesListed: number;
  speaksLanguages: string[];
  specializations: string[];
  yearsExperience: number;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignUpData extends AuthCredentials {
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'buyer' | 'seller' | 'agent';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken?: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
