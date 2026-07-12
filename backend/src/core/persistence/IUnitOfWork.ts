import type { ITransaction } from './ITransaction.js';

export interface IUnitOfWork {
  begin(): Promise<ITransaction>;
  commit(transaction: ITransaction): Promise<void>;
  rollback(transaction: ITransaction): Promise<void>;
  execute<T>(work: (transaction: ITransaction) => Promise<T>): Promise<T>;
}

export abstract class BaseUnitOfWork implements IUnitOfWork {
  abstract begin(): Promise<ITransaction>;
  abstract commit(transaction: ITransaction): Promise<void>;
  abstract rollback(transaction: ITransaction): Promise<void>;

  async execute<T>(work: (transaction: ITransaction) => Promise<T>): Promise<T> {
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
