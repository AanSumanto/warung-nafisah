import { randomUUID } from 'node:crypto';
import { LoyaltyProgram } from '../../domain/loyalty/LoyaltyProgram.js';
import { LoyaltyReward } from '../../domain/loyalty/LoyaltyReward.js';
import type { ILoyaltyProgramRepository } from '../../domain/loyalty/ILoyaltyProgramRepository.js';
import type { ILoyaltyRewardRepository } from '../../domain/loyalty/ILoyaltyRewardRepository.js';
import {
  DEFAULT_POINT_EARN_RATE,
  LOYALTY_PROGRAM_CODE,
  LOYALTY_PROGRAM_NAME,
} from '../../domain/loyalty/LoyaltyTypes.js';
import { BASELINE_REWARD_CATALOG } from './baselineRewardCatalog.js';
import type { IMenuReferenceLookup } from './IMenuReferenceLookup.js';

export interface InstallLoyaltyResult {
  readonly dryRun: boolean;
  readonly program: {
    readonly action: 'create' | 'already_exists' | 'conflict' | 'would_create' | 'blocked';
    readonly programCode: string;
    readonly enabled?: boolean;
    readonly message: string;
  };
  readonly rewards: Array<{
    readonly rewardCode: string;
    readonly action: 'create' | 'already_exists' | 'conflict' | 'would_create' | 'blocked';
    readonly message: string;
  }>;
  readonly menuValidation: Array<{
    readonly menuKode: string;
    readonly menuNameExpected: string;
    readonly found: boolean;
    readonly actualName?: string;
    readonly actualStatus?: string;
    readonly actualHargaJual?: number;
  }>;
  readonly success: boolean;
  readonly errors: string[];
}

function rewardCompatible(
  existing: LoyaltyReward,
  expected: (typeof BASELINE_REWARD_CATALOG)[number],
): boolean {
  return (
    existing.menuKode === expected.menuKode &&
    existing.pointsRequired === expected.pointsRequired &&
    existing.hppEstimate === expected.hppEstimate
  );
}

function programCompatible(existing: LoyaltyProgram): boolean {
  return (
    existing.programCode === LOYALTY_PROGRAM_CODE &&
    existing.pointEarnRate === DEFAULT_POINT_EARN_RATE &&
    existing.enabled === false
  );
}

/**
 * Explicit one-time installer for Nafisah Rewards V1 config.
 * Idempotent WITHOUT silent overwrite:
 * - absent → create
 * - compatible → no-op
 * - conflict → stop / report
 */
export class LoyaltyConfigInstaller {
  constructor(
    private readonly programs: ILoyaltyProgramRepository,
    private readonly rewards: ILoyaltyRewardRepository,
    private readonly menus: IMenuReferenceLookup,
  ) {}

  async install(options: {
    dryRun?: boolean;
    actorId?: string;
  } = {}): Promise<InstallLoyaltyResult> {
    const dryRun = options.dryRun === true;
    const actorId = options.actorId?.trim() || 'system:install-loyalty-v1';
    const errors: string[] = [];

    const menuValidation: InstallLoyaltyResult['menuValidation'] = [];
    for (const def of BASELINE_REWARD_CATALOG) {
      const menu = await this.menus.findByKodeMenu(def.menuKode);
      if (!menu) {
        menuValidation.push({
          menuKode: def.menuKode,
          menuNameExpected: def.menuNameExpected,
          found: false,
        });
        errors.push(`Menu ${def.menuKode} (${def.menuNameExpected}) tidak ditemukan`);
      } else {
        menuValidation.push({
          menuKode: def.menuKode,
          menuNameExpected: def.menuNameExpected,
          found: true,
          actualName: menu.namaMenu,
          actualStatus: menu.status,
          actualHargaJual: menu.hargaJual,
        });
      }
    }

    if (errors.length > 0) {
      return {
        dryRun,
        program: {
          action: 'blocked',
          programCode: LOYALTY_PROGRAM_CODE,
          message: 'Instalasi dibatalkan: referensi menu tidak lengkap',
        },
        rewards: BASELINE_REWARD_CATALOG.map((def) => ({
          rewardCode: def.rewardCode,
          action: 'blocked' as const,
          message: 'Dibatalkan karena validasi menu gagal',
        })),
        menuValidation,
        success: false,
        errors,
      };
    }

    // Program
    let programResult: InstallLoyaltyResult['program'];
    const existingProgram = await this.programs.findByProgramCode(LOYALTY_PROGRAM_CODE);
    if (existingProgram) {
      if (programCompatible(existingProgram)) {
        programResult = {
          action: 'already_exists',
          programCode: LOYALTY_PROGRAM_CODE,
          enabled: existingProgram.enabled,
          message: `Program ${LOYALTY_PROGRAM_CODE} sudah ada dan kompatibel (enabled=${existingProgram.enabled})`,
        };
      } else {
        const msg = `Program ${LOYALTY_PROGRAM_CODE} sudah ada tetapi berbeda dari baseline (enabled=${existingProgram.enabled}, pointEarnRate=${existingProgram.pointEarnRate}). Tidak di-overwrite.`;
        errors.push(msg);
        programResult = {
          action: 'conflict',
          programCode: LOYALTY_PROGRAM_CODE,
          enabled: existingProgram.enabled,
          message: msg,
        };
      }
    } else if (dryRun) {
      programResult = {
        action: 'would_create',
        programCode: LOYALTY_PROGRAM_CODE,
        enabled: false,
        message: `Dry-run: akan membuat program ${LOYALTY_PROGRAM_NAME} (enabled=false, pointEarnRate=${DEFAULT_POINT_EARN_RATE})`,
      };
    } else {
      const program = LoyaltyProgram.createBaseline({
        id: randomUUID(),
        updatedBy: actorId,
      });
      await this.programs.save(program);
      programResult = {
        action: 'create',
        programCode: LOYALTY_PROGRAM_CODE,
        enabled: false,
        message: `Program ${LOYALTY_PROGRAM_CODE} dibuat (enabled=false)`,
      };
    }

    // Rewards
    const rewardResults: InstallLoyaltyResult['rewards'] = [];
    for (const def of BASELINE_REWARD_CATALOG) {
      if (errors.some((e) => e.includes('berbeda dari baseline') && e.includes('Program'))) {
        // Continue reporting rewards even if program conflicts
      }

      const existing = await this.rewards.findByRewardCode(def.rewardCode);
      if (existing) {
        if (rewardCompatible(existing, def)) {
          rewardResults.push({
            rewardCode: def.rewardCode,
            action: 'already_exists',
            message: `${def.rewardCode} sudah ada dan kompatibel`,
          });
        } else {
          const msg = `${def.rewardCode} sudah ada tetapi berbeda (menuKode=${existing.menuKode}, points=${existing.pointsRequired}, hpp=${existing.hppEstimate}). Tidak di-overwrite.`;
          errors.push(msg);
          rewardResults.push({
            rewardCode: def.rewardCode,
            action: 'conflict',
            message: msg,
          });
        }
        continue;
      }

      if (dryRun) {
        rewardResults.push({
          rewardCode: def.rewardCode,
          action: 'would_create',
          message: `Dry-run: akan membuat ${def.rewardCode} → ${def.menuKode} (${def.pointsRequired} pts, HPP ${def.hppEstimate})`,
        });
        continue;
      }

      // Skip create if we already have fatal program conflict? Still create missing rewards
      // unless overall we want to abort — prompt says fail loudly on conflicting; create absent OK
      const reward = LoyaltyReward.create({
        id: randomUUID(),
        rewardCode: def.rewardCode,
        name: def.name,
        menuKode: def.menuKode,
        pointsRequired: def.pointsRequired,
        hppEstimate: def.hppEstimate,
        sortOrder: def.sortOrder,
        status: 'active',
        updatedBy: actorId,
      });
      await this.rewards.save(reward);
      rewardResults.push({
        rewardCode: def.rewardCode,
        action: 'create',
        message: `${def.rewardCode} dibuat`,
      });
    }

    const success = errors.length === 0;
    return {
      dryRun,
      program: programResult!,
      rewards: rewardResults,
      menuValidation,
      success,
      errors,
    };
  }
}
