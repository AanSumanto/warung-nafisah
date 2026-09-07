import { AsyncLocalStorage } from 'node:async_hooks';
import type { ITransaction } from '../../core/persistence/ITransaction.js';
import { BaseUnitOfWork } from '../../core/persistence/IUnitOfWork.js';
import {
  MongoTransactionManager,
  type MongoTransaction,
} from '../database/MongoTransactionManager.js';
import { MongoSessionManager } from '../database/MongoSessionManager.js';

/**
 * Per-async-context active transaction.
 * A single MongoUnitOfWork instance is shared across concurrent requests;
 * mutable instance fields would cross-wire sessions under concurrency.
 */
const activeTxnStorage = new AsyncLocalStorage<MongoTransaction>();

export class MongoUnitOfWork extends BaseUnitOfWork {
  private readonly transactionManager: MongoTransactionManager;

  constructor(sessionManager = new MongoSessionManager()) {
    super();
    this.transactionManager = new MongoTransactionManager(sessionManager);
  }

  async begin(): Promise<ITransaction> {
    const txn = await this.transactionManager.begin();
    activeTxnStorage.enterWith(txn);
    return txn;
  }

  async commit(transaction: ITransaction): Promise<void> {
    await this.transactionManager.commit(transaction as MongoTransaction);
  }

  async rollback(transaction: ITransaction): Promise<void> {
    await this.transactionManager.rollback(transaction as MongoTransaction);
  }

  getActiveSession() {
    return activeTxnStorage.getStore()?.session ?? null;
  }

  getTransactionManager(): MongoTransactionManager {
    return this.transactionManager;
  }

  override async execute<T>(work: (transaction: ITransaction) => Promise<T>): Promise<T> {
    return this.transactionManager.execute(async (txn) =>
      activeTxnStorage.run(txn, () => work(txn)),
    );
  }
}
