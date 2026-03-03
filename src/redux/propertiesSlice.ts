// src/redux/slices/propertiesSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Property, PropertySearchResult } from '../../types/property';
import { AsyncStatus } from '../../types/common';
import apiClient from '../../services/api';
import logger from '../../utils/logger';

interface PropertiesState {
  items: Property[];
  favorites: string[];
  currentProperty: Property | null;
  myProperties: Property[];
  searchResults: PropertySearchResult | null;
  status: AsyncStatus;
  error: string | null;
  page: number;
  limit: number;
  total: number;
}

const initialState: PropertiesState = {
  items: [],
  favorites: [],
  currentProperty: null,
  myProperties: [],
  searchResults: null,
  status: 'idle',
  error: null,
  page: 1,
  limit: 20,
  total: 0,
};

export const fetchProperties = createAsyncThunk(
  'properties/fetchProperties',
  async (
    { filters, page = 1, limit = 20 }: { filters?: any; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const result = await apiClient.getProperties(filters || {}, page, limit);
      return result;
    } catch (error: any) {
      logger.error('Failed to fetch properties', error);
      return rejectWithValue(error.message || 'Failed to fetch properties');
    }
  }
);

export const fetchPropertyById = createAsyncThunk(
  'properties/fetchPropertyById',
  async (id: string, { rejectWithValue }) => {
    try {
      const result = await apiClient.getPropertyById(id);
      return result;
    } catch (error: any) {
      logger.error('Failed to fetch property details', error);
      return rejectWithValue(error.message || 'Failed to fetch property details');
    }
  }
);

export const searchProperties = createAsyncThunk(
  'properties/search',
  async ({ query, filters }: { query: string; filters?: any }, { rejectWithValue }) => {
    try {
      const result = await apiClient.searchProperties(query, filters);
      return result;
    } catch (error: any) {
      logger.error('Property search failed', error);
      return rejectWithValue(error.message || 'Property search failed');
    }
  }
);

export const fetchFavorites = createAsyncThunk(
  'properties/fetchFavorites',
  async (_, { rejectWithValue }) => {
    try {
      const result = await apiClient.getFavoriteProperties();
      return result;
    } catch (error: any) {
      logger.error('Failed to fetch favorites', error);
      return rejectWithValue(error.message || 'Failed to fetch favorites');
    }
  }
);

export const addFavorite = createAsyncThunk(
  'properties/addFavorite',
  async (propertyId: string, { rejectWithValue }) => {
    try {
      await apiClient.addFavorite(propertyId);
      return propertyId;
    } catch (error: any) {
      logger.error('Failed to add favorite', error);
      return rejectWithValue(error.message || 'Failed to add favorite');
    }
  }
);

export const removeFavorite = createAsyncThunk(
  'properties/removeFavorite',
  async (propertyId: string, { rejectWithValue }) => {
    try {
      await apiClient.removeFavorite(propertyId);
      return propertyId;
    } catch (error: any) {
      logger.error('Failed to remove favorite', error);
      return rejectWithValue(error.message || 'Failed to remove favorite');
    }
  }
);

export const fetchMyProperties = createAsyncThunk(
  'properties/fetchMyProperties',
  async (_, { rejectWithValue }) => {
    try {
      const result = await apiClient.getMyProperties();
      return result;
    } catch (error: any) {
      logger.error('Failed to fetch my properties', error);
      return rejectWithValue(error.message || 'Failed to fetch my properties');
    }
  }
);

const propertiesSlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {
    setCurrentProperty: (state, action: PayloadAction<Property | null>) => {
      state.currentProperty = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Properties
    builder
      .addCase(fetchProperties.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProperties.fulfilled, (state, action) => {
        state.status = 'success';
        state.items = action.payload.properties;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload as string;
      });

    // Fetch Property By ID
    builder
      .addCase(fetchPropertyById.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPropertyById.fulfilled, (state, action) => {
        state.status = 'success';
        state.currentProperty = action.payload;
      })
      .addCase(fetchPropertyById.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload as string;
      });

    // Search Properties
    builder
      .addCase(searchProperties.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(searchProperties.fulfilled, (state, action) => {
        state.status = 'success';
        state.searchResults = action.payload;
      })
      .addCase(searchProperties.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload as string;
      });

    // Fetch Favorites
    builder
      .addCase(fetchFavorites.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.favorites = action.payload.map((p: Property) => p.id);
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Add Favorite
    builder.addCase(addFavorite.fulfilled, (state, action) => {
      if (!state.favorites.includes(action.payload)) {
        state.favorites.push(action.payload);
      }
    });

    // Remove Favorite
    builder.addCase(removeFavorite.fulfilled, (state, action) => {
      state.favorites = state.favorites.filter((id) => id !== action.payload);
    });

    // Fetch My Properties
    builder
      .addCase(fetchMyProperties.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMyProperties.fulfilled, (state, action) => {
        state.status = 'success';
        state.myProperties = action.payload;
      })
      .addCase(fetchMyProperties.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentProperty, clearError } = propertiesSlice.actions;
export default propertiesSlice.reducer;
