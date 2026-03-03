import { create } from 'zustand';
import { DashboardMetrics, Property, Booking, User } from '@/types';

interface DashboardStore {
  metrics: DashboardMetrics | null;
  properties: Property[];
  bookings: Booking[];
  users: User[];
  isLoading: boolean;
  error: string | null;
  setMetrics: (metrics: DashboardMetrics) => void;
  setProperties: (properties: Property[]) => void;
  setBookings: (bookings: Booking[]) => void;
  setUsers: (users: User[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  metrics: null,
  properties: [],
  bookings: [],
  users: [],
  isLoading: false,
  error: null,
  setMetrics: (metrics) => set({ metrics }),
  setProperties: (properties) => set({ properties }),
  setBookings: (bookings) => set({ bookings }),
  setUsers: (users) => set({ users }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set({
    metrics: null,
    properties: [],
    bookings: [],
    users: [],
    isLoading: false,
    error: null,
  }),
}));
