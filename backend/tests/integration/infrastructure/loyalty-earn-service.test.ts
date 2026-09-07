import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  setupMongoMemoryServer,
  teardownMongoMemoryServer,
} from '../../helpers/persistence/mongo-memory.js';
import { createIdentifier } from '../../../src/domain/common/Identifier.js';
import { Customer } from '../../../src/domain/loyalty/Customer.js';
import { LoyaltyProgram } from '../../../src/domain/loyalty/LoyaltyProgram.js';
import { LOYALTY_PROGRAM_CODE } from '../../../src/domain/loyalty/LoyaltyTypes.js';
import type { ILoyaltyLedgerRepository } from '../../../src/domain/loyalty/ILoyaltyLedgerRepository.js';
import type { LoyaltyLedgerEntry } from '../../../src/domain/loyalty/LoyaltyLedgerEntry.js';
import { LoyaltyEarnService } from '../../../src/application/loyalty/LoyaltyEarnService.js';
import { NotFoundException } from '../../../src/core/exceptions/BaseException.js';
import { createLoyaltyModule } from '../../../src/infrastructure/loyalty/LoyaltyModule.js';
import { getCustomerModel } from '../../../src/infrastructure/loyalty/documents/CustomerDocument.js';
import { getLoyaltyProgramModel } from '../../../src/infrastructure/loyalty/documents/LoyaltyProgramDocument.js';
import { getLoyaltyLedgerModel } from '../../../src/infrastructure/loyalty/documents/LoyaltyLedgerDocument.js';
import { getLoyaltyRewardModel } from '../../../src/infrastructure/loyalty/documents/LoyaltyRewardDocument.js';
import { initializeLoyaltyInfrastructure } from '../../../src/infrastructure/loyalty/LoyaltyModule.js';

function enabledProgram(overrides?: {
  pointEarnRate?: number;
  version?: number;
  enabled?: boolean;
}): LoyaltyProgram {
  const now = new Date();
  return LoyaltyProgram.reconstitute(
    'prog-nafisah',
    {
      programCode: LOYALTY_PROGRAM_CODE,
      programName: 'Nafisah Rewards',
      enabled: overrides?.enabled ?? true,
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
    name: 'Earn Test',
    registeredBy: 'user_test',
  });
}

function blockedCustomer(id: string): Customer {
  const base = activeCustomer(id, '99990001');
  const now = new Date();
  return Customer.reconstitute(
    id,
    {
      ...base.toRecord(),
      status: 'blocked',
    },
    now,
    now,
  );
}

describe('LoyaltyEarnService', () => {
  const module = createLoyaltyModule();
  const { loyaltyEarnService: earn, customerRepository, programRepository, ledgerRepository } =
    module;

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
      // Bypass Mongoose append-only guards for test cleanup only
      getLoyaltyLedgerModel().collection.deleteMany({}),
      getLoyaltyRewardModel().deleteMany({}),
    ]);
  });

  async function seedActiveEarnFixture(customerId = 'cust-earn-1') {
    await programRepository.save(enabledProgram());
    const customer = activeCustomer(customerId, '11110001');
    await customerRepository.save(customer);
    return customer;
  }

  it('basic earn: 20000 → 4 points with ledger + customer mutation', async () => {
    await seedActiveEarnFixture();
    const occurredAt = new Date('2026-03-01T10:00:00.000Z');

    const result = await earn.earn({
      customerId: 'cust-earn-1',
      orderId: 'ORD-001',
      eligiblePaidAmount: 20000,
      occurredAt,
      actorUserId: 'user_kasir',
    });

    expect(result.pointsEarned).toBe(4);
    expect(result.balanceAfter).toBe(4);
    expect(result.alreadyProcessed).toBe(false);
    expect(result.programCode).toBe(LOYALTY_PROGRAM_CODE);
    expect(result.programVersion).toBe(1);
    expect(result.pointEarnRate).toBe(5000);

    const ledger = await ledgerRepository.listByCustomer('cust-earn-1');
    expect(ledger).toHaveLength(1);
    expect(ledger[0]!.type).toBe('EARN_SALE');
    expect(ledger[0]!.pointsDelta).toBe(4);
    expect(ledger[0]!.balanceAfter).toBe(4);
    expect(ledger[0]!.programSnapshot).toEqual({
      programCode: LOYALTY_PROGRAM_CODE,
      programVersion: 1,
      pointEarnRate: 5000,
    });
    expect(ledger[0]!.occurredAt.toISOString()).toBe(occurredAt.toISOString());

    const customer = await customerRepository.findById(createIdentifier('cust-earn-1'));
    expect(customer?.currentPoints).toBe(4);
    expect(customer?.lifetimeEarnedPoints).toBe(4);
    expect(customer?.totalSpending).toBe(20000);
    expect(customer?.transactionCount).toBe(1);
    expect(customer?.lastTransactionAt?.toISOString()).toBe(occurredAt.toISOString());
  });

  it('sequential sales accumulate without remainder carry', async () => {
    await seedActiveEarnFixture();
    const amounts = [7000, 3000, 17000, 23000];
    let i = 0;
    for (const amount of amounts) {
      i += 1;
      await earn.earn({
        customerId: 'cust-earn-1',
        orderId: `ORD-SEQ-${i}`,
        eligiblePaidAmount: amount,
        occurredAt: new Date(),
      });
    }

    const customer = await customerRepository.findById(createIdentifier('cust-earn-1'));
    expect(customer?.currentPoints).toBe(8);
    expect(customer?.lifetimeEarnedPoints).toBe(8);
    expect(customer?.totalSpending).toBe(50000);
    expect(customer?.transactionCount).toBe(4);

    const ledger = await ledgerRepository.listByCustomer('cust-earn-1');
    expect(ledger).toHaveLength(4);
    expect(ledger.map((e) => e.pointsDelta)).toEqual([1, 0, 3, 4]);
    expect(await ledgerRepository.sumPointsDelta('cust-earn-1')).toBe(8);
  });

  it('zero-point sale still appends ledger and updates stats', async () => {
    await seedActiveEarnFixture();
    const occurredAt = new Date('2026-03-02T08:00:00.000Z');

    const first = await earn.earn({
      customerId: 'cust-earn-1',
      orderId: 'ORD-ZERO',
      eligiblePaidAmount: 3000,
      occurredAt,
    });
    expect(first.pointsEarned).toBe(0);
    expect(first.balanceAfter).toBe(0);

    const ledger = await ledgerRepository.listByCustomer('cust-earn-1');
    expect(ledger).toHaveLength(1);
    expect(ledger[0]!.pointsDelta).toBe(0);
    expect(ledger[0]!.balanceAfter).toBe(0);

    const customer = await customerRepository.findById(createIdentifier('cust-earn-1'));
    expect(customer?.currentPoints).toBe(0);
    expect(customer?.totalSpending).toBe(3000);
    expect(customer?.transactionCount).toBe(1);
    expect(customer?.lastTransactionAt?.toISOString()).toBe(occurredAt.toISOString());

    const retry = await earn.earn({
      customerId: 'cust-earn-1',
      orderId: 'ORD-ZERO',
      eligiblePaidAmount: 3000,
      occurredAt,
    });
    expect(retry.alreadyProcessed).toBe(true);
    expect(await ledgerRepository.listByCustomer('cust-earn-1')).toHaveLength(1);
    const after = await customerRepository.findById(createIdentifier('cust-earn-1'));
    expect(after?.transactionCount).toBe(1);
    expect(after?.totalSpending).toBe(3000);
  });

  it('idempotent retry returns alreadyProcessed without second mutation', async () => {
    await seedActiveEarnFixture();
    const input = {
      customerId: 'cust-earn-1',
      orderId: 'ORD-IDEM',
      eligiblePaidAmount: 20000,
      occurredAt: new Date('2026-03-03T09:00:00.000Z'),
    };

    const first = await earn.earn(input);
    const second = await earn.earn(input);

    expect(first.alreadyProcessed).toBe(false);
    expect(second.alreadyProcessed).toBe(true);
    expect(second.pointsEarned).toBe(first.pointsEarned);
    expect(second.balanceAfter).toBe(first.balanceAfter);
    expect(second.ledgerEntryId).toBe(first.ledgerEntryId);

    expect(await ledgerRepository.listByCustomer('cust-earn-1')).toHaveLength(1);
    const customer = await customerRepository.findById(createIdentifier('cust-earn-1'));
    expect(customer?.currentPoints).toBe(4);
    expect(customer?.transactionCount).toBe(1);
    expect(customer?.totalSpending).toBe(20000);
  });

  it('conflicting retry: different eligiblePaidAmount', async () => {
    await seedActiveEarnFixture();
    await earn.earn({
      customerId: 'cust-earn-1',
      orderId: 'ORD-X',
      eligiblePaidAmount: 20000,
      occurredAt: new Date(),
    });

    await expect(
      earn.earn({
        customerId: 'cust-earn-1',
        orderId: 'ORD-X',
        eligiblePaidAmount: 25000,
        occurredAt: new Date(),
      }),
    ).rejects.toMatchObject({
      details: { code: 'LOYALTY_EARN_CONFLICT' },
    });

    const customer = await customerRepository.findById(createIdentifier('cust-earn-1'));
    expect(customer?.currentPoints).toBe(4);
    expect(customer?.totalSpending).toBe(20000);
    expect(await ledgerRepository.listByCustomer('cust-earn-1')).toHaveLength(1);
  });

  it('conflicting retry: different customerId', async () => {
    await seedActiveEarnFixture('cust-a');
    await customerRepository.save(activeCustomer('cust-b', '22220002'));

    await earn.earn({
      customerId: 'cust-a',
      orderId: 'ORD-X',
      eligiblePaidAmount: 20000,
      occurredAt: new Date(),
    });

    await expect(
      earn.earn({
        customerId: 'cust-b',
        orderId: 'ORD-X',
        eligiblePaidAmount: 20000,
        occurredAt: new Date(),
      }),
    ).rejects.toMatchObject({
      details: { code: 'LOYALTY_EARN_CONFLICT' },
    });

    expect((await customerRepository.findById(createIdentifier('cust-b')))?.currentPoints).toBe(0);
    expect(await ledgerRepository.findBySource('SALE', 'ORD-X')).toHaveLength(1);
  });

  it('same-order concurrency: exactly one ledger mutation', async () => {
    await seedActiveEarnFixture();
    const input = {
      customerId: 'cust-earn-1',
      orderId: 'ORD-SAME',
      eligiblePaidAmount: 10000,
      occurredAt: new Date(),
    };

    const results = await Promise.all(
      Array.from({ length: 8 }, () => earn.earn(input)),
    );

    const ledger = await ledgerRepository.listByCustomer('cust-earn-1');
    expect(ledger).toHaveLength(1);
    expect(new Set(results.map((r) => r.ledgerEntryId))).toEqual(new Set([ledger[0]!.id]));

    for (const r of results) {
      expect(r.pointsEarned).toBe(2);
      expect(r.balanceAfter).toBe(2);
      expect(r.ledgerEntryId).toBe(ledger[0]!.id);
    }
    expect(results.filter((r) => !r.alreadyProcessed)).toHaveLength(1);
    expect(results.filter((r) => r.alreadyProcessed)).toHaveLength(7);

    const customer = await customerRepository.findById(createIdentifier('cust-earn-1'));
    expect(customer?.currentPoints).toBe(2);
    expect(customer?.lifetimeEarnedPoints).toBe(2);
    expect(customer?.totalSpending).toBe(10000);
    expect(customer?.transactionCount).toBe(1);
  });

  it('different-order concurrency: all earns apply', async () => {
    await seedActiveEarnFixture();

    const results = await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        earn.earn({
          customerId: 'cust-earn-1',
          orderId: `ORD-DIFF-${i}`,
          eligiblePaidAmount: 5000,
          occurredAt: new Date(),
        }),
      ),
    );

    expect(results.every((r) => r.pointsEarned === 1 && !r.alreadyProcessed)).toBe(true);
    expect(new Set(results.map((r) => r.ledgerEntryId)).size).toBe(8);

    const customer = await customerRepository.findById(createIdentifier('cust-earn-1'));
    expect(customer?.currentPoints).toBe(8);
    expect(customer?.lifetimeEarnedPoints).toBe(8);
    expect(customer?.totalSpending).toBe(40000);
    expect(customer?.transactionCount).toBe(8);

    const ledger = await ledgerRepository.listByCustomer('cust-earn-1');
    expect(ledger).toHaveLength(8);
    expect(await ledgerRepository.sumPointsDelta('cust-earn-1')).toBe(8);

    const balanceAfters = ledger.map((e) => e.balanceAfter).sort((a, b) => a - b);
    expect(balanceAfters).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('rolls back customer mutation when ledger append fails', async () => {
    await seedActiveEarnFixture();

    const failingLedger: ILoyaltyLedgerRepository = {
      append: async () => {
        throw new Error('INJECTED_LEDGER_FAILURE');
      },
      findByIdempotencyKey: (key) => ledgerRepository.findByIdempotencyKey(key),
      findBySource: (t, id) => ledgerRepository.findBySource(t, id),
      sumPointsDelta: (id) => ledgerRepository.sumPointsDelta(id),
      listByCustomer: (id) => ledgerRepository.listByCustomer(id),
    };

    const failingEarn = new LoyaltyEarnService(
      customerRepository,
      failingLedger,
      programRepository,
      module.unitOfWork,
    );

    await expect(
      failingEarn.earn({
        customerId: 'cust-earn-1',
        orderId: 'ORD-ROLLBACK-1',
        eligiblePaidAmount: 20000,
        occurredAt: new Date(),
      }),
    ).rejects.toThrow('INJECTED_LEDGER_FAILURE');

    const customer = await customerRepository.findById(createIdentifier('cust-earn-1'));
    expect(customer?.currentPoints).toBe(0);
    expect(customer?.totalSpending).toBe(0);
    expect(customer?.transactionCount).toBe(0);
    expect(await getLoyaltyLedgerModel().countDocuments()).toBe(0);
  });

  it('rolls back both when failure occurs after append before commit', async () => {
    await seedActiveEarnFixture();

    let appended = false;
    const wrappingLedger: ILoyaltyLedgerRepository = {
      append: async (entry: LoyaltyLedgerEntry) => {
        await ledgerRepository.append(entry);
        appended = true;
        throw new Error('INJECTED_POST_APPEND_FAILURE');
      },
      findByIdempotencyKey: (key) => ledgerRepository.findByIdempotencyKey(key),
      findBySource: (t, id) => ledgerRepository.findBySource(t, id),
      sumPointsDelta: (id) => ledgerRepository.sumPointsDelta(id),
      listByCustomer: (id) => ledgerRepository.listByCustomer(id),
    };

    const failingEarn = new LoyaltyEarnService(
      customerRepository,
      wrappingLedger,
      programRepository,
      module.unitOfWork,
    );

    await expect(
      failingEarn.earn({
        customerId: 'cust-earn-1',
        orderId: 'ORD-ROLLBACK-2',
        eligiblePaidAmount: 20000,
        occurredAt: new Date(),
      }),
    ).rejects.toThrow('INJECTED_POST_APPEND_FAILURE');

    expect(appended).toBe(true);
    expect(await getLoyaltyLedgerModel().countDocuments()).toBe(0);
    const customer = await customerRepository.findById(createIdentifier('cust-earn-1'));
    expect(customer?.currentPoints).toBe(0);
    expect(customer?.transactionCount).toBe(0);
  });

  it('rejects disabled program', async () => {
    await programRepository.save(enabledProgram({ enabled: false }));
    await customerRepository.save(activeCustomer('cust-earn-1', '11110001'));

    await expect(
      earn.earn({
        customerId: 'cust-earn-1',
        orderId: 'ORD-DISABLED',
        eligiblePaidAmount: 20000,
        occurredAt: new Date(),
      }),
    ).rejects.toMatchObject({
      details: { code: 'LOYALTY_PROGRAM_DISABLED' },
    });

    expect(await getLoyaltyLedgerModel().countDocuments()).toBe(0);
    expect((await customerRepository.findById(createIdentifier('cust-earn-1')))?.currentPoints).toBe(
      0,
    );
  });

  it('rejects blocked customer', async () => {
    await programRepository.save(enabledProgram());
    await customerRepository.save(blockedCustomer('cust-blocked'));

    await expect(
      earn.earn({
        customerId: 'cust-blocked',
        orderId: 'ORD-BLOCKED',
        eligiblePaidAmount: 20000,
        occurredAt: new Date(),
      }),
    ).rejects.toMatchObject({
      details: { code: 'LOYALTY_CUSTOMER_BLOCKED' },
    });

    expect(await getLoyaltyLedgerModel().countDocuments()).toBe(0);
  });

  it('rejects unknown customer', async () => {
    await programRepository.save(enabledProgram());
    await expect(
      earn.earn({
        customerId: 'missing',
        orderId: 'ORD-MISS',
        eligiblePaidAmount: 5000,
        occurredAt: new Date(),
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('preserves immutable program snapshot across rate change', async () => {
    await seedActiveEarnFixture();

    await earn.earn({
      customerId: 'cust-earn-1',
      orderId: 'ORD-SNAP-1',
      eligiblePaidAmount: 10000,
      occurredAt: new Date(),
    });

    const program = await programRepository.findByProgramCode(LOYALTY_PROGRAM_CODE);
    const updated = program!.updateConfig({ pointEarnRate: 10000, updatedBy: 'test' });
    // Force enabled for next earn (updateConfig never flips enabled)
    const enabledV2 = LoyaltyProgram.reconstitute(
      String(updated.id),
      {
        programCode: updated.programCode,
        programName: updated.programName,
        enabled: true,
        pointEarnRate: updated.pointEarnRate,
        version: updated.version,
        effectiveFrom: updated.effectiveFrom,
        updatedBy: updated.updatedBy,
      },
      updated.createdAt,
      updated.updatedAt,
    );
    await programRepository.save(enabledV2);
    expect(enabledV2.version).toBe(2);
    expect(enabledV2.pointEarnRate).toBe(10000);

    await earn.earn({
      customerId: 'cust-earn-1',
      orderId: 'ORD-SNAP-2',
      eligiblePaidAmount: 10000,
      occurredAt: new Date(),
    });

    const ledger = await ledgerRepository.listByCustomer('cust-earn-1');
    expect(ledger[0]!.programSnapshot).toEqual({
      programCode: LOYALTY_PROGRAM_CODE,
      programVersion: 1,
      pointEarnRate: 5000,
    });
    expect(ledger[1]!.programSnapshot).toEqual({
      programCode: LOYALTY_PROGRAM_CODE,
      programVersion: 2,
      pointEarnRate: 10000,
    });
    expect(ledger[1]!.pointsDelta).toBe(1);

    const customer = await customerRepository.findById(createIdentifier('cust-earn-1'));
    expect(customer?.currentPoints).toBe(3); // 2 + 1
  });

  it('reconcileBalance detects ledger sum == cached points', async () => {
    await seedActiveEarnFixture();
    await earn.earn({
      customerId: 'cust-earn-1',
      orderId: 'ORD-REC-1',
      eligiblePaidAmount: 3000,
      occurredAt: new Date(),
    });
    await earn.earn({
      customerId: 'cust-earn-1',
      orderId: 'ORD-REC-2',
      eligiblePaidAmount: 15000,
      occurredAt: new Date(),
    });

    const recon = await earn.reconcileBalance('cust-earn-1');
    expect(recon.cachedPoints).toBe(3);
    expect(recon.ledgerSum).toBe(3);
    expect(recon.matches).toBe(true);
  });

  it('does not expose update/delete on ledger repository and schema forbids mutations', async () => {
    await seedActiveEarnFixture();
    await earn.earn({
      customerId: 'cust-earn-1',
      orderId: 'ORD-IMM',
      eligiblePaidAmount: 5000,
      occurredAt: new Date(),
    });

    expect('update' in ledgerRepository).toBe(false);
    expect('delete' in ledgerRepository).toBe(false);

    await expect(
      getLoyaltyLedgerModel().updateOne({ sourceId: 'ORD-IMM' }, { $set: { pointsDelta: 99 } }),
    ).rejects.toThrow(/append-only/);
  });

  it('does not create public earn route symbols via ValidationException leak of E11000', async () => {
    await seedActiveEarnFixture();
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () =>
        earn.earn({
          customerId: 'cust-earn-1',
          orderId: 'ORD-NO-LEAK',
          eligiblePaidAmount: 5000,
          occurredAt: new Date(),
        }),
      ),
    );
    for (const r of results) {
      expect(r.status).toBe('fulfilled');
      if (r.status === 'fulfilled') {
        expect(String(r.value)).not.toMatch(/E11000/);
      }
    }
  });
});
