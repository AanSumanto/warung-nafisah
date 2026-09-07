import type { LoyaltyLedgerEntry } from './LoyaltyLedgerEntry.js';

/**
 * Append-only loyalty ledger contract.
 * No update/delete — corrections use compensating entries (future).
 */
export interface ILoyaltyLedgerRepository {
  append(entry: LoyaltyLedgerEntry): Promise<LoyaltyLedgerEntry>;
  findByIdempotencyKey(key: string): Promise<LoyaltyLedgerEntry | null>;
  findBySource(sourceType: string, sourceId: string): Promise<LoyaltyLedgerEntry[]>;
  sumPointsDelta(customerId: string): Promise<number>;
  listByCustomer(customerId: string): Promise<LoyaltyLedgerEntry[]>;
  /**
   * Recent entries for a customer (newest first).
   * Uses { customerId, occurredAt } index — bounded limit required.
   */
  listRecentByCustomer(customerId: string, limit: number): Promise<LoyaltyLedgerEntry[]>;
}
