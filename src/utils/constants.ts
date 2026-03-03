// src/utils/constants.ts

export const PROPERTY_TYPES = [
  { label: 'House', value: 'house' },
  { label: 'Apartment', value: 'apartment' },
  { label: 'Condo', value: 'condo' },
  { label: 'Townhouse', value: 'townhouse' },
  { label: 'Land', value: 'land' },
];

export const AMENITIES = [
  'Pool',
  'Gym',
  'Parking',
  'Security',
  'Air Conditioning',
  'Heating',
  'Hardwood Floors',
  'Marble Counters',
  'Stainless Steel Appliances',
  'Walk-in Closets',
  'Balcony',
  'Patio',
  'Fireplace',
  'Hot Tub',
  'Basketball Court',
  'Tennis Court',
];

export const PRICE_RANGES = [
  { label: 'Any', min: 0, max: Infinity },
  { label: 'Under $250k', min: 0, max: 250000 },
  { label: '$250k - $500k', min: 250000, max: 500000 },
  { label: '$500k - $1M', min: 500000, max: 1000000 },
  { label: '$1M - $2M', min: 1000000, max: 2000000 },
  { label: 'Over $2M', min: 2000000, max: Infinity },
];

export const BEDROOM_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

export const BATHROOM_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 5];

export const USER_ROLES = ['buyer', 'seller', 'agent', 'investor'];

export const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'Chinese',
  'Japanese',
  'German',
];

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

export const MORTGAGE_RATES = {
  '15-year': 6.5,
  '30-year': 7.0,
  'ARM': 6.75,
};

export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  PROPERTIES: '/api/properties',
  USERS: '/api/users',
  AGENTS: '/api/agents',
  FAVORITES: '/api/favorites',
  AI_MATCHING: '/api/matching',
  ANALYTICS: '/api/analytics',
  TOOLS: '/api/tools',
};

export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[+]?[(]?[0-9]{1,4}[)]?[-\s]?[(]?[0-9]{1,4}[)]?[-\s]?[0-9]{1,9}$/,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  ZIP_CODE: /^\d{5}(-\d{4})?$/,
};

export const CACHE_DURATIONS = {
  PROPERTIES: 5 * 60 * 1000, // 5 minutes
  ANALYTICS: 10 * 60 * 1000, // 10 minutes
  USER_PROFILE: 1 * 60 * 1000, // 1 minute
  AGENTS: 30 * 60 * 1000, // 30 minutes
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  EMAIL_EXISTS: 'Email already registered.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
};

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  SIGNUP_SUCCESS: 'Account created successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  FAVORITE_ADDED: 'Added to favorites!',
  FAVORITE_REMOVED: 'Removed from favorites!',
};
