import { describe, it, expect } from 'vitest';
import { projectPublicActivity } from '../../../src/application/loyalty/projectPublicActivity.js';
import { LoyaltyLedgerEntry } from '../../../src/domain/loyalty/LoyaltyLedgerEntry.js';

const snapshot = {
  programCode: 'NAFISAH_REWARDS',
  programVersion: 1,
  pointEarnRate: 5000,
};

function earn(delta: number, id: string, at: Date): LoyaltyLedgerEntry {
  return LoyaltyLedgerEntry.createEarnSale({
    id,
    customerId: 'cust-1',
    pointsDelta: delta,
    balanceAfter: Math.max(0, delta),
    sourceOrderId: `ord-${id}`,
    idempotencyKey: `LOYALTY:EARN_SALE:ord-${id}`,
    programSnapshot: snapshot,
    eligiblePaidAmount: delta * 5000,
    actor: { type: 'SYSTEM' },
    occurredAt: at,
  });
}

function refund(delta: number, id: string, at: Date): LoyaltyLedgerEntry {
  return LoyaltyLedgerEntry.createReversalRefund({
    id,
    customerId: 'cust-1',
    pointsReversed: delta,
    balanceAfter: -delta,
    originalLedgerEntryId: 'earn-orig',
    originalOrderId: 'ord-orig',
    idempotencyKey: `LOYALTY:REVERSAL_REFUND:earn-orig`,
    programSnapshot: snapshot,
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

  it('maps REVERSAL_REFUND / REVERSAL_VOID to customer-safe labels', () => {
    const now = new Date('2026-09-07T10:00:00.000Z');
    const items = projectPublicActivity([
      refund(4, 'r1', now),
      LoyaltyLedgerEntry.createReversalVoid({
        id: 'v1',
        customerId: 'cust-1',
        pointsReversed: 2,
        balanceAfter: -2,
        originalLedgerEntryId: 'earn-2',
        originalOrderId: 'ord-2',
        idempotencyKey: 'LOYALTY:REVERSAL_VOID:earn-2',
        programSnapshot: snapshot,
        actor: { type: 'USER', userId: 'cashier-1' },
        occurredAt: new Date(now.getTime() - 1000),
      }),
    ]);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      type: 'ADJUSTMENT',
      pointsDelta: -4,
      label: 'Penyesuaian poin refund',
    });
    expect(items[1]).toMatchObject({
      type: 'ADJUSTMENT',
      pointsDelta: -2,
      label: 'Pembatalan transaksi',
    });
    expect(JSON.stringify(items)).not.toMatch(/cashier-1|originalLedgerEntryId|reason/);
  });

  it('maps MANUAL_ADJUSTMENT without leaking reason/actor', () => {
    const now = new Date('2026-09-08T10:00:00.000Z');
    const items = projectPublicActivity([
      LoyaltyLedgerEntry.createManualAdjustment({
        id: 'm1',
        customerId: 'cust-1',
        pointsDelta: -5,
        balanceAfter: 2,
        idempotencyKey: 'LOYALTY:MANUAL_ADJUSTMENT:reqpublic01',
        programSnapshot: snapshot,
        reason: 'INTERNAL_ADMIN_REASON_SECRET',
        note: 'secret-note',
        requestId: 'reqpublic01',
        actor: { type: 'USER', userId: 'owner-secret' },
        occurredAt: now,
      }),
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      type: 'ADJUSTMENT',
      pointsDelta: -5,
      label: 'Penyesuaian poin',
    });
    expect(JSON.stringify(items)).not.toMatch(/INTERNAL_ADMIN|secret-note|owner-secret/);
  });
});
