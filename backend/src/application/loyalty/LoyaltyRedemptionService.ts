import { randomUUID } from 'node:crypto';
import {
  NotFoundException,
  ValidationException,
} from '../../core/exceptions/BaseException.js';
import { createIdentifier } from '../../domain/common/Identifier.js';
import { LoyaltyLedgerEntry } from '../../domain/loyalty/LoyaltyLedgerEntry.js';
import type { ICustomerRepository } from '../../domain/loyalty/ICustomerRepository.js';
import type { ILoyaltyLedgerRepository } from '../../domain/loyalty/ILoyaltyLedgerRepository.js';
import type { ILoyaltyProgramRepository } from '../../domain/loyalty/ILoyaltyProgramRepository.js';
import type { ILoyaltyRewardRepository } from '../../domain/loyalty/ILoyaltyRewardRepository.js';
import { buildRedeemRewardIdempotencyKey } from '../../domain/loyalty/LoyaltyLedgerTypes.js';
import { LOYALTY_PROGRAM_CODE } from '../../domain/loyalty/LoyaltyTypes.js';
import type { LoyaltyReward } from '../../domain/loyalty/LoyaltyReward.js';
import type { Menu } from '../../domain/pos/Menu.js';
import { OrderItem } from '../../domain/pos/OrderItem.js';
import type { IMenuReferenceLookup } from './IMenuReferenceLookup.js';
import { getEnv } from '../../config/env.js';

export interface CashierRewardOption {
  readonly rewardCode: string;
  readonly name: string;
  readonly pointsRequired: number;
  readonly eligible: boolean;
  readonly availability: 'AVAILABLE' | 'TEMPORARILY_UNAVAILABLE';
  readonly pointsRemaining?: number;
}

export interface LoyaltyRedeemInput {
  readonly customerId: string;
  readonly orderId: string;
  readonly rewardCode: string;
  readonly occurredAt: Date;
  readonly actorUserId?: string;
}

export interface LoyaltyRedeemResult {
  readonly customerId: string;
  readonly rewardCode: string;
  readonly rewardName: string;
  readonly menuKode: string;
  readonly pointsUsed: number;
  readonly rewardHppSnapshot: number;
  readonly balanceAfter: number;
  readonly ledgerEntryId: string;
  readonly programVersion: number;
  readonly alreadyProcessed: boolean;
  readonly rewardLineProps: ReturnType<typeof OrderItem.rewardLine>;
}

function isDuplicateKeyError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: number }).code;
  if (code === 11000) return true;
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('E11000') || message.includes('duplicate key');
}

/**
 * Internal redemption — cashier-controlled, no public mutation.
 * Points deducted only when invoked inside pay UoW (not on draft intent).
 */
export class LoyaltyRedemptionService {
  constructor(
    private readonly customers: ICustomerRepository,
    private readonly ledger: ILoyaltyLedgerRepository,
    private readonly programs: ILoyaltyProgramRepository,
    private readonly rewards: ILoyaltyRewardRepository,
    private readonly menus: IMenuReferenceLookup,
  ) {}

  assertRedemptionGateEnabled(): void {
    if (!getEnv().LOYALTY_REDEMPTION_ENABLED) {
      throw new ValidationException('Penukaran reward belum diaktifkan', {
        code: 'LOYALTY_REDEMPTION_DISABLED',
      });
    }
  }

  async listCashierRewardsForBalance(currentPoints: number): Promise<CashierRewardOption[]> {
    const list = await this.rewards.listAll();
    const active = list
      .filter((r) => r.status === 'active')
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder || a.rewardCode.localeCompare(b.rewardCode));
    const menuMap = await this.menus.findByKodeMenus(active.map((r) => r.menuKode));
    const out: CashierRewardOption[] = [];
    for (const reward of active) {
      const menu = menuMap.get(reward.menuKode);
      if (menu?.status === 'hidden') continue;
      const availability =
        menu?.status === 'available' ? 'AVAILABLE' : 'TEMPORARILY_UNAVAILABLE';
      const eligible = currentPoints >= reward.pointsRequired && availability === 'AVAILABLE';
      out.push({
        rewardCode: reward.rewardCode,
        name: reward.name,
        pointsRequired: reward.pointsRequired,
        eligible,
        availability,
        pointsRemaining: eligible
          ? undefined
          : Math.max(0, reward.pointsRequired - currentPoints),
      });
    }
    return out;
  }

  /**
   * Validate reward for draft intent selection (no mutation).
   */
  async assertRewardSelectable(rewardCode: string, customerId: string): Promise<LoyaltyReward> {
    this.assertRedemptionGateEnabled();
    const program = await this.programs.findByProgramCode(LOYALTY_PROGRAM_CODE);
    if (!program || !program.enabled) {
      throw new ValidationException('Nafisah Rewards belum aktif', {
        code: 'LOYALTY_REDEMPTION_PROGRAM_DISABLED',
      });
    }
    const customer = await this.customers.findById(createIdentifier(customerId));
    if (!customer) {
      throw new NotFoundException('Pelanggan tidak ditemukan', {
        code: 'LOYALTY_REDEMPTION_CUSTOMER_NOT_FOUND',
      });
    }
    if (!customer.isActive()) {
      throw new ValidationException('Pelanggan diblokir', {
        code: 'LOYALTY_REDEMPTION_CUSTOMER_BLOCKED',
      });
    }
    const reward = await this.rewards.findByRewardCode(rewardCode.trim().toUpperCase());
    if (!reward) {
      throw new NotFoundException('Reward tidak ditemukan', {
        code: 'LOYALTY_REWARD_NOT_FOUND',
      });
    }
    if (reward.status !== 'active') {
      throw new ValidationException('Reward tidak aktif', {
        code: 'LOYALTY_REWARD_INACTIVE',
      });
    }
    const menu = await this.menus.findByKodeMenu(reward.menuKode);
    if (!menu || menu.status !== 'available') {
      throw new ValidationException('Reward sedang tidak tersedia. Pilih reward lain.', {
        code: 'LOYALTY_REWARD_UNAVAILABLE',
      });
    }
    if (customer.currentPoints < reward.pointsRequired) {
      throw new ValidationException('Poin tidak mencukupi', {
        code: 'LOYALTY_REDEMPTION_INSUFFICIENT_POINTS',
      });
    }
    return reward;
  }

  /**
   * Atomic redeem inside active pay session (or own txn).
   */
  async redeemInActiveSession(
    input: LoyaltyRedeemInput,
    menuForLine: Menu,
  ): Promise<LoyaltyRedeemResult> {
    this.assertRedemptionGateEnabled();
    const idempotencyKey = buildRedeemRewardIdempotencyKey(input.orderId);

    const existing = await this.ledger.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      if (existing.type !== 'REDEEM_REWARD') {
        throw new ValidationException('Konflik penukaran reward', {
          code: 'LOYALTY_REDEEM_CONFLICT',
        });
      }
      const meta = existing.metadata;
      if (meta.kind !== 'REDEEM_REWARD') {
        throw new ValidationException('Konflik penukaran reward', {
          code: 'LOYALTY_REDEEM_CONFLICT',
        });
      }
      if (meta.rewardCode !== input.rewardCode.trim().toUpperCase()) {
        throw new ValidationException('Order sudah menukar reward lain', {
          code: 'LOYALTY_REDEEM_CONFLICT',
        });
      }
      return {
        customerId: existing.customerId,
        rewardCode: meta.rewardCode,
        rewardName: meta.rewardName,
        menuKode: meta.menuKode,
        pointsUsed: meta.pointsRequired,
        rewardHppSnapshot: meta.rewardHppSnapshot,
        balanceAfter: existing.balanceAfter,
        ledgerEntryId: existing.id,
        programVersion: existing.programSnapshot.programVersion,
        alreadyProcessed: true,
        rewardLineProps: OrderItem.rewardLine({
          kodeMenu: menuForLine.kodeMenu,
          namaMenu: menuForLine.namaMenu,
          kodeKategori: menuForLine.kodeKategori,
          namaKategori: menuForLine.namaKategori,
          tipeMenu: menuForLine.tipeMenu,
          rewardCode: meta.rewardCode,
          rewardHppSnapshot: meta.rewardHppSnapshot,
          pointsUsed: meta.pointsRequired,
        }),
      };
    }

    const program = await this.programs.findByProgramCode(LOYALTY_PROGRAM_CODE);
    if (!program || !program.enabled) {
      throw new ValidationException('Nafisah Rewards belum aktif', {
        code: 'LOYALTY_REDEMPTION_PROGRAM_DISABLED',
      });
    }

    const customer = await this.customers.findById(createIdentifier(input.customerId));
    if (!customer) {
      throw new ValidationException('Pelanggan tidak ditemukan', {
        code: 'LOYALTY_REDEMPTION_CUSTOMER_NOT_FOUND',
      });
    }
    if (!customer.isActive()) {
      throw new ValidationException('Pelanggan diblokir', {
        code: 'LOYALTY_REDEMPTION_CUSTOMER_BLOCKED',
      });
    }

    const reward = await this.rewards.findByRewardCode(input.rewardCode.trim().toUpperCase());
    if (!reward) {
      throw new ValidationException('Reward tidak ditemukan', {
        code: 'LOYALTY_REWARD_NOT_FOUND',
      });
    }
    if (reward.status !== 'active') {
      throw new ValidationException('Reward tidak aktif', {
        code: 'LOYALTY_REWARD_INACTIVE',
      });
    }

    const menuRef = await this.menus.findByKodeMenu(reward.menuKode);
    if (!menuRef || menuRef.status !== 'available') {
      throw new ValidationException('Reward sedang tidak tersedia. Pilih reward lain.', {
        code: 'LOYALTY_REWARD_UNAVAILABLE',
      });
    }
    if (menuForLine.kodeMenu !== reward.menuKode) {
      throw new ValidationException('Menu reward tidak cocok', {
        code: 'LOYALTY_REWARD_UNAVAILABLE',
      });
    }

    let mutation;
    try {
      mutation = await this.customers.applyRedeemMutation(createIdentifier(customer.id), {
        pointsRequired: reward.pointsRequired,
        occurredAt: input.occurredAt,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'CUSTOMER_REDEEM_MUTATION_FAILED') {
        // Re-check for clear error
        const fresh = await this.customers.findById(createIdentifier(input.customerId));
        if (!fresh || !fresh.isActive()) {
          throw new ValidationException('Pelanggan diblokir atau tidak ditemukan', {
            code: 'LOYALTY_REDEMPTION_CUSTOMER_BLOCKED',
          });
        }
        throw new ValidationException('Poin tidak mencukupi', {
          code: 'LOYALTY_REDEMPTION_INSUFFICIENT_POINTS',
        });
      }
      throw error;
    }

    const entry = LoyaltyLedgerEntry.createRedeemReward({
      id: randomUUID(),
      customerId: customer.id,
      pointsRequired: reward.pointsRequired,
      balanceAfter: mutation.currentPoints,
      sourceOrderId: input.orderId.trim(),
      idempotencyKey,
      programSnapshot: {
        programCode: program.programCode,
        programVersion: program.version,
        pointEarnRate: program.pointEarnRate,
      },
      rewardCode: reward.rewardCode,
      rewardName: reward.name,
      menuKode: reward.menuKode,
      rewardHppSnapshot: reward.hppEstimate,
      actor: input.actorUserId
        ? { type: 'USER', userId: input.actorUserId }
        : { type: 'SYSTEM' },
      occurredAt: input.occurredAt,
    });

    try {
      await this.ledger.append(entry);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ValidationException('Konflik penukaran reward', {
          code: 'LOYALTY_REDEEM_CONFLICT',
        });
      }
      throw error;
    }

    return {
      customerId: customer.id,
      rewardCode: reward.rewardCode,
      rewardName: reward.name,
      menuKode: reward.menuKode,
      pointsUsed: reward.pointsRequired,
      rewardHppSnapshot: reward.hppEstimate,
      balanceAfter: mutation.currentPoints,
      ledgerEntryId: entry.id,
      programVersion: program.version,
      alreadyProcessed: false,
      rewardLineProps: OrderItem.rewardLine({
        kodeMenu: menuForLine.kodeMenu,
        namaMenu: menuForLine.namaMenu,
        kodeKategori: menuForLine.kodeKategori,
        namaKategori: menuForLine.namaKategori,
        tipeMenu: menuForLine.tipeMenu,
        rewardCode: reward.rewardCode,
        rewardHppSnapshot: reward.hppEstimate,
        pointsUsed: reward.pointsRequired,
      }),
    };
  }
}
