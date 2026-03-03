import AsyncStorage from '@react-native-async-storage/async-storage';
import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase({
  name: 'PuraEstate.db',
  location: 'default',
  createFromLocation: '~www/PuraEstate.db',
});

export class StorageManager {
  // Simple key-value storage for small data
  static async setItem(key: string, value: any): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('AsyncStorage setItem error:', error);
      throw error;
    }
  }

  static async getItem<T = any>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('AsyncStorage getItem error:', error);
      return null;
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('AsyncStorage removeItem error:', error);
      throw error;
    }
  }

  static async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('AsyncStorage clear error:', error);
      throw error;
    }
  }

  // Database operations
  static async executeSQL(
    sql: string,
    params: any[] = []
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      db.transaction((tx: any) => {
        tx.executeSql(
          sql,
          params,
          (_, result) => resolve(result),
          (_, error) => {
            console.error('SQL error:', error);
            reject(error);
            return true;
          }
        );
      });
    });
  }

  static async createTables(): Promise<void> {
    const schemas = [
      `CREATE TABLE IF NOT EXISTS calculations (
        id TEXT PRIMARY KEY,
        type TEXT,
        name TEXT,
        data TEXT,
        created_at TEXT,
        updated_at TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS properties (
        id TEXT PRIMARY KEY,
        name TEXT,
        address TEXT,
        data TEXT,
        created_at TEXT,
        updated_at TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        property_id TEXT,
        name TEXT,
        data TEXT,
        created_at TEXT,
        updated_at TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        property_id TEXT,
        type TEXT,
        amount REAL,
        currency TEXT,
        date TEXT,
        description TEXT,
        created_at TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS inspections (
        id TEXT PRIMARY KEY,
        property_id TEXT,
        data TEXT,
        created_at TEXT
      )`,
    ];

    for (const schema of schemas) {
      try {
        await this.executeSQL(schema);
      } catch (error) {
        console.error('Schema creation error:', error);
      }
    }
  }
}

export default StorageManager;
