import type { ClientSession } from 'mongoose';
import { MongoConnectionManager } from './MongoConnectionManager.js';

export class MongoSessionManager {
  private readonly sessions = new Map<string, ClientSession>();

  async startSession(sessionId?: string): Promise<ClientSession> {
    const connection = MongoConnectionManager.getInstance().getConnection();
    const session = await connection.startSession();
    const id = sessionId ?? `sess_${crypto.randomUUID()}`;
    this.sessions.set(id, session);
    return session;
  }

  getSession(sessionId: string): ClientSession | undefined {
    return this.sessions.get(sessionId);
  }

  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    await session.endSession();
    this.sessions.delete(sessionId);
  }

  async endAllSessions(): Promise<void> {
    const ids = [...this.sessions.keys()];
    await Promise.all(ids.map((id) => this.endSession(id)));
  }
}
