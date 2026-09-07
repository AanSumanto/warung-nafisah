import { describe, it, expect } from 'vitest';
import { projectPublicActivity } from '../../../src/application/loyalty/projectPublicActivity.js';
import { LoyaltyLedgerEntry } from '../../../src/domain/loyalty/LoyaltyLedgerEntry.js';

function earn(delta: number, id: string, at: Date): LoyaltyLedgerEntry {
  return LoyaltyLedgerEntry.createEarnSale({
    id,
    customerId: 'cust-1',
    pointsDelta: delta,
    balanceAfter: Math.max(0, delta),
    sourceOrderId: `ord-${id}`,
    idempotencyKey: `LOYALTY:EARN_SALE:ord-${id}`,
    programSnapshot: {
      programCode: 'NAFISAH_REWARDS',
      programVersion: 1,
      pointEarnRate: 5000,
    },
    eligiblePaidAmount: delta * 5000,
    actor: { type: 'SYSTEM' },
    occurredAt: at,
  });
}

describe('projectPublicActivity', () => {
  it('omits zero-delta EARN_SALE and strips internals', () => {
    const now = new Date('2026-09-07T10:00:00.000Z');
    const items = projectPublicActivity([
      earn(4, 'a', now),
      earn(0, 'b', new Date(now.getTime() - 1000)),
      earn(3, 'c', new Date(now.getTime() - 2000)),
    ]);
    expect(items).toHaveLength(2);
    expect(items[0]?.pointsDelta).toBe(4);
    expect(items[1]?.pointsDelta).toBe(3);
    expect(JSON.stringify(items)).not.toMatch(/idempotencyKey|orderId|paymentId|actor|eligiblePaidAmount/);
  });
});
