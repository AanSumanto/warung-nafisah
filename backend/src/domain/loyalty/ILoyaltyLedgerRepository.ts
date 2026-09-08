import type { LoyaltyLedgerEntry } from './LoyaltyLedgerEntry.js';

/**
 * Append-only loyalty ledger contract.
 * No update/delete — corrections use compensating entries.
 */
export interface ILoyaltyLedgerRepository {
  append(entry: LoyaltyLedgerEntry): Promise<LoyaltyLedgerEntry>;
  findById(id: string): Promise<LoyaltyLedgerEntry | null>;
  findByIdempotencyKey(key: string): Promise<LoyaltyLedgerEntry | null>;
  findBySource(sourceType: string, sourceId: string): Promise<LoyaltyLedgerEntry[]>;
  sumPointsDelta(customerId: string): Promise<number>;
  listByCustomer(customerId: string): Promise<LoyaltyLedgerEntry[]>;
  /**
   * Recent entries for a customer (newest first).
   * Uses { customerId, occurredAt } index — bounded limit required.
   */
  listRecentByCustomer(customerId: string, limit: number): Promise<LoyaltyLedgerEntry[]>;
  /**
   * Paginated history (newest first). Deterministic sort: occurredAt desc, _id desc.
   * Optional type filter. Bounded limit.
   */
  listPageByCustomer(input: {
    readonly customerId: string;
    readonly limit: number;
    readonly beforeOccurredAt?: Date;
    readonly beforeId?: string;
    readonly type?: string;
  }): Promise<LoyaltyLedgerEntry[]>;
}
