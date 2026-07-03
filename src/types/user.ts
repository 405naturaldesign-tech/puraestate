// src/types/user.ts — ENHANCED
// Sovereign Breeze forensic audit — July 3, 2026
// Added: consent records, verification, terms acceptance, MFA, data export

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
  // ENHANCED: verification & compliance
  emailVerified: boolean;
  phoneVerified: boolean;
  identityVerified: boolean;
  mfaEnabled: boolean;
  mfaMethod?: 'totp' | 'sms' | 'email' | 'none';
  termsAcceptedAt?: string;        // timestamp of latest Terms acceptance
  termsVersion?: string;            // which version of Terms they accepted
  privacyPolicyAcceptedAt?: string; // GDPR requirement
  dataExportRequested?: boolean;
  dataDeletionRequested?: boolean;
  deletionScheduledFor?: string;
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
  // ENHANCED: consent & cookie preferences
  cookiePreferences: {
    essential: boolean;    // always true, not optional
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
    lastUpdated: string;
  };
  marketingConsent: boolean;
  marketingConsentDate?: string;
  dataProcessingConsent: boolean;
  dataProcessingConsentDate?: string;
}

export interface UserProfile extends User {
  preferences: UserPreferences;
  role: 'buyer' | 'seller' | 'agent' | 'investor';
  preferredLocation?: string;
  investmentGoals?: string;
  // ENHANCED: profile completeness tracking
  profileCompletionScore: number;  // 0-100
  missingFields: string[];         // list of fields still needed
  lastActiveAt: string;
  accountStatus: 'active' | 'suspended' | 'deleted' | 'pending_verification';
}

export interface ConsentRecord {
  id: string;
  userId: string;
  type: 'terms' | 'privacy_policy' | 'cookie_consent' | 'marketing' | 'data_processing';
  version: string;
  granted: boolean;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  documentUrl?: string;
}

export interface DataExportRequest {
  id: string;
  userId: string;
  requestedAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  completedAt?: string;
  downloadUrl?: string;
  expiresAt?: string;
  format: 'json' | 'csv';
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
  // ENHANCED: agent verification
  licenseVerified: boolean;
  licenseNumber?: string;
  licenseState?: string;
  backgroundCheckCompleted: boolean;
}

export interface AuthCredentials {
  email: string;
  password?: string;
  mfaCode?: string;
  // ENHANCED: session tracking
  sessionId?: string;
  deviceId?: string;
  consentVerified?: boolean;
  termsVersion?: string;
}

export interface AuthSession {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  lastActivityAt: string;
  ipAddress: string;
  userAgent: string;
  deviceId?: string;
  isActive: boolean;
  mfaVerified: boolean;
}