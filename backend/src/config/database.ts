import { MongoConnectionManager } from '../infrastructure/database/MongoConnectionManager.js';

const connectionManager = MongoConnectionManager.getInstance();

export async function connectDatabase(): Promise<void> {
  await connectionManager.connect();
}

export async function disconnectDatabase(): Promise<void> {
  await connectionManager.disconnect();
}

export function isDatabaseConnected(): boolean {
  return connectionManager.isConnected();
}

export async function pingDatabase(): Promise<boolean> {
  return connectionManager.ping();
}

export { mongoose } from '../infrastructure/database/MongoConnectionManager.js';
export { MongoConnectionManager };
