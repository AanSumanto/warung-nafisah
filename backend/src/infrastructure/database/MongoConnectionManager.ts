import mongoose, { type Connection } from 'mongoose';
import { getEnv } from '../../config/env.js';
import { logger } from '../../config/logger.js';

function maskMongoUri(uri: string): string {
  try {
    const parsed = new URL(uri);
    if (parsed.password) parsed.password = '***';
    if (parsed.username) parsed.username = '***';
    return parsed.toString();
  } catch {
    return '[mongodb-uri]';
  }
}

export class MongoConnectionManager {
  private static instance: MongoConnectionManager | null = null;
  private connected = false;
  private overrideUri: string | null = null;
  private overrideDbName: string | null = null;

  static getInstance(): MongoConnectionManager {
    if (!MongoConnectionManager.instance) {
      MongoConnectionManager.instance = new MongoConnectionManager();
    }
    return MongoConnectionManager.instance;
  }

  /** Test-only — override connection target without changing env. */
  configureForTest(uri: string, dbName: string): void {
    this.overrideUri = uri;
    this.overrideDbName = dbName;
  }

  resetTestConfiguration(): void {
    this.overrideUri = null;
    this.overrideDbName = null;
  }

  async connect(): Promise<Connection> {
    if (mongoose.connection.readyState === 1) {
      this.connected = true;
      return mongoose.connection;
    }

    const uri = this.overrideUri ?? getEnv().MONGODB_URI;
    const dbName = this.overrideDbName ?? getEnv().MONGODB_DB_NAME;

    try {
      await mongoose.connect(uri, { dbName });
      this.connected = true;
      logger.info({ dbName, url: maskMongoUri(uri) }, '✓ MongoDB Connected');
      return mongoose.connection;
    } catch (error) {
      logger.fatal(
        {
          dbName,
          url: maskMongoUri(uri),
          reason: error instanceof Error ? error.message : 'Unknown error',
        },
        '✗ MongoDB Connection Failed',
      );
      throw error;
    }
  }

  getConnection(): Connection {
    if (!this.isConnected()) {
      throw new Error('MongoDB is not connected');
    }
    return mongoose.connection;
  }

  isConnected(): boolean {
    return this.connected && mongoose.connection.readyState === 1;
  }

  async disconnect(): Promise<void> {
    if (mongoose.connection.readyState === 0) {
      this.connected = false;
      return;
    }
    await mongoose.disconnect();
    this.connected = false;
    logger.info('MongoDB disconnected');
  }

  async ping(): Promise<boolean> {
    if (!this.isConnected()) return false;
    try {
      await mongoose.connection.db?.admin().ping();
      return true;
    } catch {
      return false;
    }
  }
}

export { mongoose };
