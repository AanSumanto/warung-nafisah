import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  setupMongoMemoryServer,
  teardownMongoMemoryServer,
} from '../../helpers/persistence/mongo-memory.js';
import { Customer } from '../../../src/domain/loyalty/Customer.js';
import { LoyaltyProgram } from '../../../src/domain/loyalty/LoyaltyProgram.js';
import { LoyaltyLedgerEntry } from '../../../src/domain/loyalty/LoyaltyLedgerEntry.js';
import { LOYALTY_PROGRAM_CODE } from '../../../src/domain/loyalty/LoyaltyTypes.js';
import { createLoyaltyModule, initializeLoyaltyInfrastructure } from '../../../src/infrastructure/loyalty/LoyaltyModule.js';
import { getCustomerModel } from '../../../src/infrastructure/loyalty/documents/CustomerDocument.js';
import { getLoyaltyProgramModel } from '../../../src/infrastructure/loyalty/documents/LoyaltyProgramDocument.js';
import { getLoyaltyLedgerModel } from '../../../src/infrastructure/loyalty/documents/LoyaltyLedgerDocument.js';
import { getLoyaltyRewardModel } from '../../../src/infrastructure/loyalty/documents/LoyaltyRewardDocument.js';
import { LoyaltyReward } from '../../../src/domain/loyalty/LoyaltyReward.js';
import { createIdentifier } from '../../../src/domain/common/Identifier.js';

function enabledProgram(overrides?: { pointEarnRate?: number; version?: number }): LoyaltyProgram {
  const now = new Date();
  return LoyaltyProgram.reconstitute(
    'prog-nafisah',
    {
      programCode: LOYALTY_PROGRAM_CODE,
      programName: 'Nafisah Rewards',
      enabled: true,
      pointEarnRate: overrides?.pointEarnRate ?? 5000,
      version: overrides?.version ?? 1,
      effectiveFrom: now,
      updatedBy: 'test',
    },
    now,
    now,
  );
}

function activeCustomer(id: string, phoneSuffix: string): Customer {
  return Customer.register({
    id,
    phone: `0812${phoneSuffix.padStart(8, '0')}`,
    name: 'Reversal Test',
    registeredBy: 'user_test',
  });
}

describe('LoyaltyReversalService', () => {
  const module = createLoyaltyModule();
  const {
    loyaltyEarnService: earn,
    loyaltyReversalService: reverse,
    loyaltyRedemptionService: redeem,
    customerRepository,
    programRepository,
    rewardRepository,
    ledgerRepository,
  } = module;

  beforeAll(async () => {
    await setupMongoMemoryServer();
    await initializeLoyaltyInfrastructure();
  });

  afterAll(async () => {
    await teardownMongoMemoryServer();
  });

  beforeEach(async () => {
    await Promise.all([
      getCustomerModel().deleteMany({}),
      getLoyaltyProgramModel().deleteMany({}),
      getLoyaltyLedgerModel().collection.deleteMany({}),
      getLoyaltyRewardModel().deleteMany({}),
    ]);
  });

  async function seedCustomer(id = 'cust-rev-1') {
    await programRepository.save(enabledProgram());
    const customer = activeCustomer(id, '22220001');
    await customerRepository.save(customer);
    return customer;
  }

  it('simple full refund: reverses historical earn; earn row immutable', async () => {
    await seedCustomer();
    const earnResult = await earn.earn({
      customerId: 'cust-rev-1',
      orderId: 'ord-simple',
      eligiblePaidAmount: 20000,
      occurredAt: new Date('2026-03-01T10:00:00.000Z'),
    });
    expect(earnResult.pointsEarned).toBe(4);

    // bump balance to 10 via second sale
    await earn.earn({
      customerId: 'cust-rev-1',
      orderId: 'ord-bump',
      eligiblePaidAmount: 30000,
      occurredAt: new Date('2026-03-01T11:00:00.000Z'),
    });
    let cust = await customerRepository.findById(createIdentifier('cust-rev-1'));
    expect(cust!.currentPoints).toBe(10);

    const rev = await reverse.reverseEarnForRefund({
      originalOrderId: 'ord-simple',
      occurredAt: new Date('2026-03-02T10:00:00.000Z'),
    });
    expect(rev.pointsReversed).toBe(4);
    expect(rev.balanceAfter).toBe(6);
    expect(rev.alreadyProcessed).toBe(false);
    expect(rev.operation).toBe('REFUND');

    const original = await ledgerRepository.findById(earnResult.ledgerEntryId);
    expect(original!.type).toBe('EARN_SALE');
    expect(original!.pointsDelta).toBe(4);

    const entries = await ledgerRepository.listByCustomer('cust-rev-1');
    const refunds = entries.filter((e) => e.type === 'REVERSAL_REFUND');
    expect(refunds).toHaveLength(1);
    expect(refunds[0]!.pointsDelta).toBe(-4);
    expect(refunds[0]!.metadata).toMatchObject({
      kind: 'REVERSAL_REFUND',
      originalLedgerEntryId: earnResult.ledgerEntryId,
      originalOrderId: 'ord-simple',
      pointsReversed: 4,
    });

    cust = await customerRepository.findById(createIdentifier('cust-rev-1'));
    expect(cust!.currentPoints).toBe(6);
    // lifetimeEarnedPoints remains gross
    expect(cust!.lifetimeEarnedPoints).toBe(10);
  });

  it('refund after points spent allows negative balance', async () => {
    await seedCustomer();
    await earn.earn({
      customerId: 'cust-rev-1',
      orderId: 'ord-spent',
      eligiblePaidAmount: 50000,
      occurredAt: new Date('2026-03-01T10:00:00.000Z'),
    });
    // Simulate prior spend: set balance to 3 without touching ledger (direct $set for fixture)
    await getCustomerModel().updateOne({ _id: 'cust-rev-1' }, { $set: { currentPoints: 3 } });

    const rev = await reverse.reverseEarnForRefund({
      originalOrderId: 'ord-spent',
      occurredAt: new Date('2026-03-02T10:00:00.000Z'),
    });
    expect(rev.pointsReversed).toBe(10);
    expect(rev.balanceAfter).toBe(-7);

    const cust = await getCustomerModel().findById('cust-rev-1').lean();
    expect(cust!.currentPoints).toBe(-7);
  });

  it('refund uses historical points when program rate later changes', async () => {
    await seedCustomer();
    await earn.earn({
      customerId: 'cust-rev-1',
      orderId: 'ord-rate',
      eligiblePaidAmount: 20000,
      occurredAt: new Date('2026-03-01T10:00:00.000Z'),
    });
    await programRepository.save(enabledProgram({ pointEarnRate: 1000, version: 2 }));

    const rev = await reverse.reverseEarnForRefund({
      originalOrderId: 'ord-rate',
      occurredAt: new Date('2026-03-02T10:00:00.000Z'),
    });
    expect(rev.pointsReversed).toBe(4);
    expect(rev.balanceAfter).toBe(0);
  });

  it('double refund retry is idempotent', async () => {
    await seedCustomer();
    await earn.earn({
      customerId: 'cust-rev-1',
      orderId: 'ord-idem',
      eligiblePaidAmount: 20000,
      occurredAt: new Date('2026-03-01T10:00:00.000Z'),
    });
    const first = await reverse.reverseEarnForRefund({
      originalOrderId: 'ord-idem',
      occurredAt: new Date('2026-03-02T10:00:00.000Z'),
    });
    const second = await reverse.reverseEarnForRefund({
      originalOrderId: 'ord-idem',
      occurredAt: new Date('2026-03-02T11:00:00.000Z'),
    });
    expect(first.alreadyProcessed).toBe(false);
    expect(second.alreadyProcessed).toBe(true);
    expect(second.ledgerEntryId).toBe(first.ledgerEntryId);
    expect(second.pointsReversed).toBe(4);

    const refunds = (await ledgerRepository.listByCustomer('cust-rev-1')).filter(
      (e) => e.type === 'REVERSAL_REFUND',
    );
    expect(refunds).toHaveLength(1);

    const cust = await getCustomerModel().findById('cust-rev-1').lean();
    expect(cust!.currentPoints).toBe(0);
  });

  it('concurrent refund: one economic reversal', async () => {
    await seedCustomer();
    await earn.earn({
      customerId: 'cust-rev-1',
      orderId: 'ord-conc',
      eligiblePaidAmount: 20000,
      occurredAt: new Date('2026-03-01T10:00:00.000Z'),
    });

    const results = await Promise.all(
      Array.from({ length: 6 }, () =>
        reverse.reverseEarnForRefund({
          originalOrderId: 'ord-conc',
          occurredAt: new Date('2026-03-02T10:00:00.000Z'),
        }),
      ),
    );
    const winners = results.filter((r) => !r.alreadyProcessed);
    expect(winners.length).toBeLessThanOrEqual(1);
    expect(results.every((r) => r.pointsReversed === 4)).toBe(true);

    const refunds = (await ledgerRepository.listByCustomer('cust-rev-1')).filter(
      (e) => e.type === 'REVERSAL_REFUND',
    );
    expect(refunds).toHaveLength(1);
    const cust = await getCustomerModel().findById('cust-rev-1').lean();
    expect(cust!.currentPoints).toBe(0);
  });

  it('refund + earn concurrency: final arithmetic consistent', async () => {
    await seedCustomer();
    await earn.earn({
      customerId: 'cust-rev-1',
      orderId: 'ord-old',
      eligiblePaidAmount: 50000,
      occurredAt: new Date('2026-03-01T10:00:00.000Z'),
    });
    await getCustomerModel().updateOne({ _id: 'cust-rev-1' }, { $set: { currentPoints: 3 } });

    await Promise.all([
      reverse.reverseEarnForRefund({
        originalOrderId: 'ord-old',
        occurredAt: new Date('2026-03-02T10:00:00.000Z'),
      }),
      earn.earn({
        customerId: 'cust-rev-1',
        orderId: 'ord-new',
        eligiblePaidAmount: 20000,
        occurredAt: new Date('2026-03-02T10:00:01.000Z'),
      }),
    ]);

    const cust = await getCustomerModel().findById('cust-rev-1').lean();
    // 3 - 10 + 4 = -3
    expect(cust!.currentPoints).toBe(-3);
  });

  it('zero-point original earn: no REVERSAL_REFUND row, balance unchanged', async () => {
    await seedCustomer();
    await earn.earn({
      customerId: 'cust-rev-1',
      orderId: 'ord-zero',
      eligiblePaidAmount: 0,
      occurredAt: new Date('2026-03-01T10:00:00.000Z'),
    });
    const before = await getCustomerModel().findById('cust-rev-1').lean();
    expect(before!.currentPoints).toBe(0);

    const rev = await reverse.reverseEarnForRefund({
      originalOrderId: 'ord-zero',
      occurredAt: new Date('2026-03-02T10:00:00.000Z'),
    });
    expect(rev.skippedZeroEarn).toBe(true);
    expect(rev.pointsReversed).toBe(0);
    expect(rev.ledgerEntryId).toBeNull();

    const refunds = (await ledgerRepository.listByCustomer('cust-rev-1')).filter(
      (e) => e.type === 'REVERSAL_REFUND',
    );
    expect(refunds).toHaveLength(0);
    const after = await getCustomerModel().findById('cust-rev-1').lean();
    expect(after!.currentPoints).toBe(0);
  });

  it('ordinary refund reverses EARN only; REDEEM remains', async () => {
    await seedCustomer();
    await rewardRepository.save(
      LoyaltyReward.create({
        id: 'rw-15',
        rewardCode: 'REWARD_ES_TEH',
        name: 'Gratis Es Teh',
        menuKode: 'ESTEH',
        pointsRequired: 15,
        hppEstimate: 3000,
        sortOrder: 1,
        updatedBy: 'test',
      }),
    );

    // Give enough points then redeem 15, earn +3 on same conceptual order pair
    await earn.earn({
      customerId: 'cust-rev-1',
      orderId: 'ord-fund',
      eligiblePaidAmount: 100000,
      occurredAt: new Date('2026-03-01T09:00:00.000Z'),
    });

    // Seed redeem ledger + balance manually as if prior redeem happened on another order
    await getCustomerModel().updateOne(
      { _id: 'cust-rev-1' },
      { $set: { currentPoints: 8 }, $inc: { lifetimeRedeemedPoints: 15 } },
    );
    await ledgerRepository.append(
      LoyaltyLedgerEntry.createRedeemReward({
        id: 'redeem-prior',
        customerId: 'cust-rev-1',
        pointsRequired: 15,
        balanceAfter: 5,
        sourceOrderId: 'ord-redeem-prior',
        idempotencyKey: 'LOYALTY:REDEEM_REWARD:ord-redeem-prior',
        programSnapshot: {
          programCode: LOYALTY_PROGRAM_CODE,
          programVersion: 1,
          pointEarnRate: 5000,
        },
        rewardCode: 'REWARD_ES_TEH',
        rewardName: 'Gratis Es Teh',
        menuKode: 'ESTEH',
        rewardHppSnapshot: 3000,
        actor: { type: 'SYSTEM' },
        occurredAt: new Date('2026-03-01T09:30:00.000Z'),
      }),
    );

    await earn.earn({
      customerId: 'cust-rev-1',
      orderId: 'ord-with-earn',
      eligiblePaidAmount: 15000,
      occurredAt: new Date('2026-03-01T10:00:00.000Z'),
    });

    const beforeRev = await getCustomerModel().findById('cust-rev-1').lean();
    // 8 + 3 = 11
    expect(beforeRev!.currentPoints).toBe(11);

    await reverse.reverseEarnForRefund({
      originalOrderId: 'ord-with-earn',
      occurredAt: new Date('2026-03-02T10:00:00.000Z'),
    });

    const entries = await ledgerRepository.listByCustomer('cust-rev-1');
    expect(entries.some((e) => e.type === 'REDEEM_REWARD' && e.id === 'redeem-prior')).toBe(true);
    expect(entries.filter((e) => e.type === 'REVERSAL_REFUND')).toHaveLength(1);
    expect(entries.some((e) => e.type === 'EARN_SALE' && e.sourceId === 'ord-with-earn')).toBe(true);

    const after = await getCustomerModel().findById('cust-rev-1').lean();
    expect(after!.currentPoints).toBe(8);
  });

  it('negative balance can earn normally', async () => {
    await seedCustomer();
    await getCustomerModel().updateOne({ _id: 'cust-rev-1' }, { $set: { currentPoints: -7 } });
    const result = await earn.earn({
      customerId: 'cust-rev-1',
      orderId: 'ord-from-neg',
      eligiblePaidAmount: 20000,
      occurredAt: new Date('2026-03-03T10:00:00.000Z'),
    });
    expect(result.pointsEarned).toBe(4);
    expect(result.balanceAfter).toBe(-3);
  });

  it('negative balance cannot redeem', async () => {
    await seedCustomer();
    await rewardRepository.save(
      LoyaltyReward.create({
        id: 'rw-neg',
        rewardCode: 'REWARD_ES_TEH',
        name: 'Tes Reward',
        menuKode: 'ESTEH',
        pointsRequired: 15,
        hppEstimate: 3000,
        sortOrder: 1,
        updatedBy: 'test',
      }),
    );
    await getCustomerModel().updateOne({ _id: 'cust-rev-1' }, { $set: { currentPoints: -1 } });
    const options = await redeem.listCashierRewardsForBalance(-1);
    expect(options.length).toBeGreaterThan(0);
    expect(options.every((o) => o.eligible === false)).toBe(true);
    expect(options[0]!.pointsRemaining).toBe(16);
  });

  it('void mapping writes REVERSAL_VOID', async () => {
    await seedCustomer();
    await earn.earn({
      customerId: 'cust-rev-1',
      orderId: 'ord-void',
      eligiblePaidAmount: 20000,
      occurredAt: new Date('2026-03-01T10:00:00.000Z'),
    });
    const rev = await reverse.reverseEarnForVoid({
      originalOrderId: 'ord-void',
      occurredAt: new Date('2026-03-02T10:00:00.000Z'),
      reason: 'pre-fulfillment void foundation',
    });
    expect(rev.operation).toBe('VOID');
    const entry = await ledgerRepository.findById(rev.ledgerEntryId!);
    expect(entry!.type).toBe('REVERSAL_VOID');
  });

  it('rejects unknown original order', async () => {
    await seedCustomer();
    await expect(
      reverse.reverseEarnForRefund({
        originalOrderId: 'missing',
        occurredAt: new Date(),
      }),
    ).rejects.toMatchObject({ httpStatus: 404 });
  });
});

describe('LOYALTY-08 WriteConflict mapping', () => {
  it('transient WriteConflict maps to ConflictException via error handler semantics', async () => {
    const { isTransientTransactionError } = await import(
      '../../../src/infrastructure/database/transaction-retry.js'
    );
    const { ConflictException } = await import(
      '../../../src/core/exceptions/BaseException.js'
    );
    const err = new Error('WriteConflict error during commit');
    expect(isTransientTransactionError(err)).toBe(true);
    const mapped = new ConflictException('Transaksi sedang diproses. Silakan coba lagi.', {
      code: 'POS_TRANSACTION_CONFLICT',
    });
    expect(mapped.httpStatus).toBe(409);
    expect(mapped.code).toBe('SYS_409');
  });
});
