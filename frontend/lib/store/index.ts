import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';

import type { ComparisonItem, Property, SearchFilters, User } from '@/lib/types';

// ─── Auth Store ───────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
        setLoading: (isLoading) => set({ isLoading }),
        logout: () => set({ user: null, isAuthenticated: false, isLoading: false }),
      }),
      {
        name: 'pura-auth',
        partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      }
    ),
    { name: 'AuthStore' }
  )
);

// ─── Search Store ─────────────────────────────────────────────────────────────

interface SearchState {
  filters: SearchFilters;
  viewMode: 'grid' | 'list' | 'map';
  isSearching: boolean;
  resultCount: number;
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  setViewMode: (mode: 'grid' | 'list' | 'map') => void;
  setSearching: (isSearching: boolean) => void;
  setResultCount: (count: number) => void;
}

const defaultFilters: SearchFilters = {
  page: 1,
  per_page: 12,
  sort_by: 'created_at',
  sort_order: 'desc',
};

export const useSearchStore = create<SearchState>()(
  devtools(
    subscribeWithSelector((set) => ({
      filters: defaultFilters,
      viewMode: 'grid',
      isSearching: false,
      resultCount: 0,
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters, page: filters.page || 1 },
        })),
      resetFilters: () => set({ filters: defaultFilters }),
      setViewMode: (viewMode) => set({ viewMode }),
      setSearching: (isSearching) => set({ isSearching }),
      setResultCount: (resultCount) => set({ resultCount }),
    })),
    { name: 'SearchStore' }
  )
);

// ─── Favorites Store ──────────────────────────────────────────────────────────

interface FavoritesState {
  favoriteIds: Set<string>;
  addFavorite: (propertyId: string) => void;
  removeFavorite: (propertyId: string) => void;
  isFavorite: (propertyId: string) => boolean;
  setFavorites: (ids: string[]) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  devtools(
    persist(
      (set, get) => ({
        favoriteIds: new Set<string>(),
        addFavorite: (id) =>
          set((state) => ({ favoriteIds: new Set([...state.favoriteIds, id]) })),
        removeFavorite: (id) =>
          set((state) => {
            const next = new Set(state.favoriteIds);
            next.delete(id);
            return { favoriteIds: next };
          }),
        isFavorite: (id) => get().favoriteIds.has(id),
        setFavorites: (ids) => set({ favoriteIds: new Set(ids) }),
      }),
      {
        name: 'pura-favorites',
        storage: {
          getItem: (name) => {
            const str = localStorage.getItem(name);
            if (!str) {
              return null;
            }
            const { state } = JSON.parse(str);
            return { state: { ...state, favoriteIds: new Set(state.favoriteIds || []) } };
          },
          setItem: (name, value) => {
            const { state } = value;
            localStorage.setItem(
              name,
              JSON.stringify({
                state: { ...state, favoriteIds: [...state.favoriteIds] },
              })
            );
          },
          removeItem: (name) => localStorage.removeItem(name),
        },
      }
    ),
    { name: 'FavoritesStore' }
  )
);

// ─── Comparison Store ─────────────────────────────────────────────────────────

const MAX_COMPARISON = 4;

interface ComparisonState {
  items: ComparisonItem[];
  addItem: (property: Property) => void;
  removeItem: (propertyId: string) => void;
  clearItems: () => void;
  isInComparison: (propertyId: string) => boolean;
  canAdd: () => boolean;
}

export const useComparisonStore = create<ComparisonState>()(
  devtools(
    persist(
      (set, get) => ({
        items: [],
        addItem: (property) => {
          const { items } = get();
          if (items.length >= MAX_COMPARISON || items.some((i) => i.property.id === property.id)) {
            return;
          }
          set((state) => ({
            items: [...state.items, { property, added_at: new Date().toISOString() }],
          }));
        },
        removeItem: (propertyId) =>
          set((state) => ({ items: state.items.filter((i) => i.property.id !== propertyId) })),
        clearItems: () => set({ items: [] }),
        isInComparison: (propertyId) => get().items.some((i) => i.property.id === propertyId),
        canAdd: () => get().items.length < MAX_COMPARISON,
      }),
      { name: 'pura-comparison' }
    ),
    { name: 'ComparisonStore' }
  )
);

// ─── UI Store ─────────────────────────────────────────────────────────────────

interface UIState {
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  searchPanelOpen: boolean;
  notificationsOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setSearchPanelOpen: (open: boolean) => void;
  setNotificationsOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      sidebarOpen: true,
      mobileMenuOpen: false,
      searchPanelOpen: false,
      notificationsOpen: false,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),
      setSearchPanelOpen: (searchPanelOpen) => set({ searchPanelOpen }),
      setNotificationsOpen: (notificationsOpen) => set({ notificationsOpen }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    { name: 'UIStore' }
  )
);
