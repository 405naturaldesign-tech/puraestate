// ─── User & Auth ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  preferences?: UserPreferences;
  agent_profile?: AgentProfile;
}

export type UserRole = 'admin' | 'agent' | 'buyer' | 'seller' | 'moderator';

export interface UserPreferences {
  notifications_email: boolean;
  notifications_sms: boolean;
  notifications_push: boolean;
  theme: 'light' | 'dark' | 'system';
  currency: string;
  language: string;
  saved_searches_alerts: boolean;
}

export interface AgentProfile {
  id: string;
  license_number: string;
  agency_name: string;
  bio?: string;
  years_experience: number;
  specializations: string[];
  languages: string[];
  rating: number;
  reviews_count: number;
  listings_count: number;
  sales_count: number;
  website?: string;
  social_links?: SocialLinks;
  verified: boolean;
}

export interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirm: string;
  role?: UserRole;
  phone?: string;
}

// ─── Property ────────────────────────────────────────────────────────────────

export interface Property {
  id: string;
  title: string;
  slug: string;
  description: string;
  property_type: PropertyType;
  listing_type: ListingType;
  status: PropertyStatus;
  price: number;
  price_per_sqft?: number;
  currency: string;
  address: Address;
  coordinates: Coordinates;
  features: PropertyFeatures;
  amenities: string[];
  images: PropertyImage[];
  videos?: PropertyVideo[];
  virtual_tour_url?: string;
  documents?: PropertyDocument[];
  agent: User;
  owner?: User;
  views_count: number;
  favorites_count: number;
  inquiries_count: number;
  is_featured: boolean;
  is_verified: boolean;
  tags: string[];
  seo: PropertySEO;
  created_at: string;
  updated_at: string;
  published_at?: string;
  price_history?: PriceHistoryEntry[];
  nearby_schools?: NearbyPlace[];
  nearby_transit?: NearbyPlace[];
  nearby_amenities?: NearbyPlace[];
  walk_score?: number;
  transit_score?: number;
  bike_score?: number;
  hoa_fee?: number;
  tax_annual?: number;
  year_built?: number;
  last_sale_date?: string;
  last_sale_price?: number;
}

export type PropertyType =
  | 'house'
  | 'apartment'
  | 'condo'
  | 'townhouse'
  | 'villa'
  | 'land'
  | 'commercial'
  | 'industrial'
  | 'office'
  | 'retail';

export type ListingType = 'sale' | 'rent' | 'lease' | 'auction';

export type PropertyStatus =
  | 'active'
  | 'pending'
  | 'sold'
  | 'rented'
  | 'off_market'
  | 'draft'
  | 'under_review';

export interface Address {
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  formatted?: string;
  neighborhood?: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PropertyFeatures {
  bedrooms: number;
  bathrooms: number;
  half_bathrooms?: number;
  area_sqft: number;
  lot_size_sqft?: number;
  floors?: number;
  parking_spaces?: number;
  garage_spaces?: number;
  pool: boolean;
  basement: boolean;
  fireplace: boolean;
  laundry_in_unit: boolean;
  air_conditioning: boolean;
  heating: boolean;
  elevator?: boolean;
  wheelchair_accessible?: boolean;
}

export interface PropertyImage {
  id: string;
  url: string;
  thumbnail_url: string;
  caption?: string;
  order: number;
  is_primary: boolean;
  width?: number;
  height?: number;
}

export interface PropertyVideo {
  id: string;
  url: string;
  thumbnail_url?: string;
  title?: string;
  duration?: number;
}

export interface PropertyDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploaded_at: string;
}

export interface PropertySEO {
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
}

export interface PriceHistoryEntry {
  date: string;
  price: number;
  event: 'listed' | 'price_drop' | 'price_increase' | 'sold' | 'relisted';
}

export interface NearbyPlace {
  name: string;
  type: string;
  distance: number;
  rating?: number;
  address?: string;
}

// ─── Search & Filters ────────────────────────────────────────────────────────

export interface SearchFilters {
  query?: string;
  property_type?: PropertyType[];
  listing_type?: ListingType;
  status?: PropertyStatus[];
  price_min?: number;
  price_max?: number;
  bedrooms_min?: number;
  bedrooms_max?: number;
  bathrooms_min?: number;
  area_sqft_min?: number;
  area_sqft_max?: number;
  city?: string;
  state?: string;
  zip_code?: string;
  neighborhood?: string;
  amenities?: string[];
  features?: Partial<PropertyFeatures>;
  agent_id?: string;
  is_featured?: boolean;
  sort_by?: SortOption;
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
  bounds?: MapBounds;
  radius_miles?: number;
  center?: Coordinates;
}

export type SortOption =
  | 'price'
  | 'price_per_sqft'
  | 'area_sqft'
  | 'created_at'
  | 'updated_at'
  | 'views_count'
  | 'favorites_count'
  | 'relevance';

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  alert_enabled: boolean;
  alert_frequency: 'instant' | 'daily' | 'weekly';
  last_alert_at?: string;
  new_results_count?: number;
  created_at: string;
  updated_at: string;
}

// ─── Favorites ───────────────────────────────────────────────────────────────

export interface Favorite {
  id: string;
  property: Property;
  notes?: string;
  created_at: string;
}

// ─── Inquiries & Messages ─────────────────────────────────────────────────────

export interface Inquiry {
  id: string;
  property: Property;
  sender: User;
  agent: User;
  message: string;
  phone?: string;
  email: string;
  viewing_date?: string;
  status: 'pending' | 'responded' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
  viewing_date?: string;
  property_id: string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  total_properties: number;
  total_users: number;
  total_agents: number;
  total_inquiries: number;
  active_listings: number;
  sold_this_month: number;
  revenue_this_month: number;
  avg_days_on_market: number;
  avg_price: number;
  total_views: number;
  new_users_this_month: number;
  conversion_rate: number;
}

export interface MarketTrend {
  date: string;
  avg_price: number;
  median_price: number;
  listings_count: number;
  sold_count: number;
  days_on_market: number;
  price_per_sqft: number;
}

export interface PriceRangeDistribution {
  range: string;
  min: number;
  max: number;
  count: number;
  percentage: number;
}

// ─── API Response Types ──────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  details?: Record<string, string[]>;
}

// ─── UI State Types ──────────────────────────────────────────────────────────

export type ViewMode = 'grid' | 'list' | 'map';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  read: boolean;
  link?: string;
  created_at: string;
}

export interface ComparisonItem {
  property: Property;
  added_at: string;
}

// ─── Utility Types ────────────────────────────────────────────────────────────

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type Nullable<T> = T | null;
export type AsyncFunction<T = void> = () => Promise<T>;
