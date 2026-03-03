import mongoose from 'mongoose';
import config from '../config';
import logger from '../logger';

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDatabase(): Promise<typeof mongoose> {
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      const conn = await mongoose.connect(config.database.mongoUri, {
        dbName: config.database.dbName,
        retryWrites: true,
        w: 'majority',
      });

      logger.info('MongoDB connected successfully', {
        host: conn.connection.host,
        database: conn.connection.name,
      });

      return conn;
    } catch (error) {
      logger.error('MongoDB connection failed', { error });
      connectionPromise = null;
      throw error;
    }
  })();

  return connectionPromise;
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
    connectionPromise = null;
  }
}

export function getDatabase() {
  return mongoose.connection.getClient().db(config.database.dbName);
}

export default {
  connectDatabase,
  disconnectDatabase,
  getDatabase,
};
