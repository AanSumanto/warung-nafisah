import type { ClientSession } from 'mongoose';
import { BaseTransaction } from '../../core/persistence/ITransaction.js';
import { MongoSessionManager } from './MongoSessionManager.js';
import { withTransactionRetry } from './transaction-retry.js';

export class MongoTransaction extends BaseTransaction {
  readonly session: ClientSession;
  readonly sessionKey: string;

  constructor(session: ClientSession, sessionKey: string, id?: string) {
    super(id);
    this.session = session;
    this.sessionKey = sessionKey;
  }
}

export class MongoTransactionManager {
  constructor(private readonly sessionManager: MongoSessionManager) {}

  async begin(): Promise<MongoTransaction> {
    const sessionKey = `txn_${crypto.randomUUID()}`;
    const session = await this.sessionManager.startSession(sessionKey);
    session.startTransaction();
    return new MongoTransaction(session, sessionKey);
  }

  async commit(transaction: MongoTransaction): Promise<void> {
    if (!transaction.isActive) {
      throw new Error(`Transaction ${transaction.id} is not active`);
    }
    await withTransactionRetry(async () => {
      await transaction.session.commitTransaction();
    });
    transaction.markCommitted();
    try {
      await this.sessionManager.endSession(transaction.sessionKey);
    } catch {
      // Session cleanup must not roll back an already committed transaction.
    }
  }

  async rollback(transaction: MongoTransaction): Promise<void> {
    if (transaction.isCommitted) {
      try {
        await this.sessionManager.endSession(transaction.sessionKey);
      } catch {
        // Best-effort session cleanup after commit.
      }
      return;
    }
    if (!transaction.isActive) return;
    try {
      await transaction.session.abortTransaction();
    } finally {
      transaction.markRolledBack();
      await this.sessionManager.endSession(transaction.sessionKey);
    }
  }

  async execute<T>(work: (transaction: MongoTransaction) => Promise<T>): Promise<T> {
    const transaction = await this.begin();
    try {
      const result = await work(transaction);
      await this.commit(transaction);
      return result;
    } catch (error) {
      await this.rollback(transaction);
      throw error;
    }
  }
}
