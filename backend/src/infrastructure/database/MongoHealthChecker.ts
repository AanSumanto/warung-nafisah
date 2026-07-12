import { MongoConnectionManager } from './MongoConnectionManager.js';

export interface MongoHealthStatus {
  readonly connected: boolean;
  readonly ping: boolean;
  readonly readyState: number;
  readonly database?: string;
  readonly host?: string;
}

export class MongoHealthChecker {
  constructor(private readonly connectionManager: MongoConnectionManager) {}

  async check(): Promise<MongoHealthStatus> {
    const connection = this.connectionManager.getConnection();
    const ping = await this.connectionManager.ping();

    return {
      connected: this.connectionManager.isConnected(),
      ping,
      readyState: connection.readyState,
      database: connection.db?.databaseName,
      host: connection.host,
    };
  }
}
