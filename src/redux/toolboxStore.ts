import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StorageManager from '../utils/storage';

export interface Calculation {
  id: string;
  type: string;
  name: string;
  data: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  type: 'residential' | 'commercial' | 'land';
  price: number;
  currency: string;
  data: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface Tenant {
  id: string;
  propertyId: string;
  name: string;
  email: string;
  phone: string;
  data: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface Transaction {
  id: string;
  propertyId: string;
  type: 'rent' | 'expense' | 'maintenance' | 'payment' | 'other';
  amount: number;
  currency: string;
  date: number;
  description: string;
  createdAt: number;
}

interface AppState {
  calculations: Calculation[];
  properties: Property[];
  tenants: Tenant[];
  transactions: Transaction[];
  language: string;
  currency: string;
  offline: boolean;

  // Calculation actions
  addCalculation: (calculation: Omit<Calculation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCalculation: (id: string, data: Partial<Calculation>) => Promise<void>;
  deleteCalculation: (id: string) => Promise<void>;
  getCalculations: (type?: string) => Calculation[];

  // Property actions
  addProperty: (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProperty: (id: string, data: Partial<Property>) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  getProperties: () => Property[];
  getPropertyById: (id: string) => Property | undefined;

  // Tenant actions
  addTenant: (tenant: Omit<Tenant, 'id' | 'createdAt'>) => Promise<void>;
  updateTenant: (id: string, data: Partial<Tenant>) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;
  getTenantsByProperty: (propertyId: string) => Tenant[];

  // Transaction actions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  getTransactions: (propertyId?: string) => Transaction[];
  getTransactionsByType: (type: string, propertyId?: string) => Transaction[];

  // Settings
  setLanguage: (language: string) => void;
  setCurrency: (currency: string) => void;
  setOffline: (offline: boolean) => void;

  // Sync
  syncWithServer: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

const generateId = (): string => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      calculations: [],
      properties: [],
      tenants: [],
      transactions: [],
      language: 'en',
      currency: 'USD',
      offline: false,

      // Calculation actions
      addCalculation: async (calculation) => {
        const newCalculation: Calculation = {
          ...calculation,
          id: generateId(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          calculations: [...state.calculations, newCalculation],
        }));

        try {
          await StorageManager.executeSQL(
            `INSERT INTO calculations (id, type, name, data, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              newCalculation.id,
              newCalculation.type,
              newCalculation.name,
              JSON.stringify(newCalculation.data),
              new Date(newCalculation.createdAt).toISOString(),
              new Date(newCalculation.updatedAt).toISOString(),
            ]
          );
        } catch (error) {
          console.error('Error saving calculation:', error);
        }
      },

      updateCalculation: async (id, data) => {
        set((state) => ({
          calculations: state.calculations.map((calc) =>
            calc.id === id
              ? { ...calc, ...data, updatedAt: Date.now() }
              : calc
          ),
        }));

        try {
          const updatedAt = new Date(Date.now()).toISOString();
          await StorageManager.executeSQL(
            `UPDATE calculations SET data = ?, updated_at = ? WHERE id = ?`,
            [JSON.stringify(data.data), updatedAt, id]
          );
        } catch (error) {
          console.error('Error updating calculation:', error);
        }
      },

      deleteCalculation: async (id) => {
        set((state) => ({
          calculations: state.calculations.filter((calc) => calc.id !== id),
        }));

        try {
          await StorageManager.executeSQL(
            `DELETE FROM calculations WHERE id = ?`,
            [id]
          );
        } catch (error) {
          console.error('Error deleting calculation:', error);
        }
      },

      getCalculations: (type?: string) => {
        const state = get();
        if (type) {
          return state.calculations.filter((calc) => calc.type === type);
        }
        return state.calculations;
      },

      // Property actions
      addProperty: async (property) => {
        const newProperty: Property = {
          ...property,
          id: generateId(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          properties: [...state.properties, newProperty],
        }));

        try {
          await StorageManager.executeSQL(
            `INSERT INTO properties (id, name, address, data, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              newProperty.id,
              newProperty.name,
              newProperty.address,
              JSON.stringify(newProperty.data),
              new Date(newProperty.createdAt).toISOString(),
              new Date(newProperty.updatedAt).toISOString(),
            ]
          );
        } catch (error) {
          console.error('Error saving property:', error);
        }
      },

      updateProperty: async (id, data) => {
        set((state) => ({
          properties: state.properties.map((prop) =>
            prop.id === id
              ? { ...prop, ...data, updatedAt: Date.now() }
              : prop
          ),
        }));

        try {
          const updatedAt = new Date(Date.now()).toISOString();
          await StorageManager.executeSQL(
            `UPDATE properties SET name = ?, address = ?, data = ?, updated_at = ?
             WHERE id = ?`,
            [
              data.name || '',
              data.address || '',
              JSON.stringify(data.data || {}),
              updatedAt,
              id,
            ]
          );
        } catch (error) {
          console.error('Error updating property:', error);
        }
      },

      deleteProperty: async (id) => {
        set((state) => ({
          properties: state.properties.filter((prop) => prop.id !== id),
          tenants: state.tenants.filter((tenant) => tenant.propertyId !== id),
          transactions: state.transactions.filter((trans) => trans.propertyId !== id),
        }));

        try {
          await StorageManager.executeSQL(`DELETE FROM properties WHERE id = ?`, [id]);
          await StorageManager.executeSQL(`DELETE FROM tenants WHERE property_id = ?`, [id]);
          await StorageManager.executeSQL(
            `DELETE FROM transactions WHERE property_id = ?`,
            [id]
          );
        } catch (error) {
          console.error('Error deleting property:', error);
        }
      },

      getProperties: () => get().properties,

      getPropertyById: (id: string) => {
        return get().properties.find((prop) => prop.id === id);
      },

      // Tenant actions
      addTenant: async (tenant) => {
        const newTenant: Tenant = {
          ...tenant,
          id: generateId(),
          createdAt: Date.now(),
        };

        set((state) => ({
          tenants: [...state.tenants, newTenant],
        }));

        try {
          await StorageManager.executeSQL(
            `INSERT INTO tenants (id, property_id, name, data, created_at)
             VALUES (?, ?, ?, ?, ?)`,
            [
              newTenant.id,
              newTenant.propertyId,
              newTenant.name,
              JSON.stringify(newTenant.data),
              new Date(newTenant.createdAt).toISOString(),
            ]
          );
        } catch (error) {
          console.error('Error saving tenant:', error);
        }
      },

      updateTenant: async (id, data) => {
        set((state) => ({
          tenants: state.tenants.map((tenant) =>
            tenant.id === id ? { ...tenant, ...data } : tenant
          ),
        }));

        try {
          await StorageManager.executeSQL(
            `UPDATE tenants SET name = ?, data = ? WHERE id = ?`,
            [data.name || '', JSON.stringify(data.data || {}), id]
          );
        } catch (error) {
          console.error('Error updating tenant:', error);
        }
      },

      deleteTenant: async (id) => {
        set((state) => ({
          tenants: state.tenants.filter((tenant) => tenant.id !== id),
        }));

        try {
          await StorageManager.executeSQL(`DELETE FROM tenants WHERE id = ?`, [id]);
        } catch (error) {
          console.error('Error deleting tenant:', error);
        }
      },

      getTenantsByProperty: (propertyId: string) => {
        return get().tenants.filter((tenant) => tenant.propertyId === propertyId);
      },

      // Transaction actions
      addTransaction: async (transaction) => {
        const newTransaction: Transaction = {
          ...transaction,
          id: generateId(),
          createdAt: Date.now(),
        };

        set((state) => ({
          transactions: [...state.transactions, newTransaction],
        }));

        try {
          await StorageManager.executeSQL(
            `INSERT INTO transactions (id, property_id, type, amount, currency, date, description, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              newTransaction.id,
              newTransaction.propertyId,
              newTransaction.type,
              newTransaction.amount,
              newTransaction.currency,
              new Date(newTransaction.date).toISOString(),
              newTransaction.description,
              new Date(newTransaction.createdAt).toISOString(),
            ]
          );
        } catch (error) {
          console.error('Error saving transaction:', error);
        }
      },

      getTransactions: (propertyId?: string) => {
        const transactions = get().transactions;
        if (propertyId) {
          return transactions.filter((t) => t.propertyId === propertyId);
        }
        return transactions;
      },

      getTransactionsByType: (type: string, propertyId?: string) => {
        let transactions = get().transactions.filter((t) => t.type === type);
        if (propertyId) {
          transactions = transactions.filter((t) => t.propertyId === propertyId);
        }
        return transactions;
      },

      // Settings
      setLanguage: (language: string) => set({ language }),
      setCurrency: (currency: string) => set({ currency }),
      setOffline: (offline: boolean) => set({ offline }),

      // Sync
      syncWithServer: async () => {
        // Implement server sync logic here
        console.log('Syncing with server...');
      },

      clearAllData: async () => {
        set({
          calculations: [],
          properties: [],
          tenants: [],
          transactions: [],
        });

        try {
          await StorageManager.clear();
        } catch (error) {
          console.error('Error clearing data:', error);
        }
      },
    }),
    {
      name: 'puraestate-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        calculations: state.calculations,
        properties: state.properties,
        tenants: state.tenants,
        transactions: state.transactions,
        language: state.language,
        currency: state.currency,
      }),
    }
  )
);

export default useAppStore;
