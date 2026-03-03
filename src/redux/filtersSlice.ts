// src/redux/slices/filtersSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PropertyFilters } from '../../types/common';

interface FiltersState {
  current: PropertyFilters;
  saved: PropertyFilters[];
}

const initialState: FiltersState = {
  current: {},
  saved: [],
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<PropertyFilters>) => {
      state.current = action.payload;
    },
    updateFilter: (state, action: PayloadAction<{ key: keyof PropertyFilters; value: any }>) => {
      const { key, value } = action.payload;
      state.current[key] = value;
    },
    clearFilters: (state) => {
      state.current = {};
    },
    resetFilters: (state) => {
      state.current = {};
    },
    saveFilter: (state, action: PayloadAction<PropertyFilters>) => {
      state.saved.push(action.payload);
    },
    removeFilter: (state, action: PayloadAction<number>) => {
      state.saved.splice(action.payload, 1);
    },
    loadSavedFilter: (state, action: PayloadAction<PropertyFilters>) => {
      state.current = action.payload;
    },
  },
});

export const {
  setFilters,
  updateFilter,
  clearFilters,
  resetFilters,
  saveFilter,
  removeFilter,
  loadSavedFilter,
} = filtersSlice.actions;

export default filtersSlice.reducer;
