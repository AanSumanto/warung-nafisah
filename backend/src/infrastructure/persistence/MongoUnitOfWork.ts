import type { ITransaction } from '../../core/persistence/ITransaction.js';
import { BaseUnitOfWork } from '../../core/persistence/IUnitOfWork.js';
import {
  MongoTransactionManager,
  type MongoTransaction,
} from '../database/MongoTransactionManager.js';
import { MongoSessionManager } from '../database/MongoSessionManager.js';

export class MongoUnitOfWork extends BaseUnitOfWork {
  private readonly transactionManager: MongoTransactionManager;
  private activeTransaction: MongoTransaction | null = null;

  constructor(sessionManager = new MongoSessionManager()) {
    super();
    this.transactionManager = new MongoTransactionManager(sessionManager);
  }

  async begin(): Promise<ITransaction> {
    this.activeTransaction = await this.transactionManager.begin();
    return this.activeTransaction;
  }

  async commit(transaction: ITransaction): Promise<void> {
    await this.transactionManager.commit(transaction as MongoTransaction);
    if (this.activeTransaction?.id === transaction.id) {
      this.activeTransaction = null;
    }
  }

  async rollback(transaction: ITransaction): Promise<void> {
    await this.transactionManager.rollback(transaction as MongoTransaction);
    if (this.activeTransaction?.id === transaction.id) {
      this.activeTransaction = null;
    }
  }

  getActiveSession() {
    return this.activeTransaction?.session ?? null;
  }

  getTransactionManager(): MongoTransactionManager {
    return this.transactionManager;
  }

  override async execute<T>(work: (transaction: ITransaction) => Promise<T>): Promise<T> {
    return this.transactionManager.execute(async (txn) => {
      this.activeTransaction = txn;
      try {
        return await work(txn);
      } finally {
        this.activeTransaction = null;
      }
    });
  }
}
