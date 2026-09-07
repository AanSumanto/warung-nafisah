import { randomUUID } from 'node:crypto';
import {
  NotFoundException,
  ValidationException,
} from '../../core/exceptions/BaseException.js';
import { DomainError } from '../../domain/errors/DomainError.js';
import { LoyaltyProgram } from '../../domain/loyalty/LoyaltyProgram.js';
import type { ILoyaltyProgramRepository } from '../../domain/loyalty/ILoyaltyProgramRepository.js';
import { LOYALTY_PROGRAM_CODE } from '../../domain/loyalty/LoyaltyTypes.js';

export interface LoyaltyProgramDto {
  readonly id: string;
  readonly programCode: string;
  readonly programName: string;
  readonly enabled: boolean;
  readonly pointEarnRate: number;
  readonly version: number;
  readonly effectiveFrom: string;
  readonly updatedAt: string;
}

function toValidation(error: unknown): never {
  if (error instanceof DomainError) {
    throw new ValidationException(error.message, error.field ? { field: error.field } : undefined);
  }
  throw error;
}

export function toLoyaltyProgramDto(program: LoyaltyProgram): LoyaltyProgramDto {
  return {
    id: program.id,
    programCode: program.programCode,
    programName: program.programName,
    enabled: program.enabled,
    pointEarnRate: program.pointEarnRate,
    version: program.version,
    effectiveFrom: program.effectiveFrom.toISOString(),
    updatedAt: program.updatedAt.toISOString(),
  };
}

export class LoyaltyProgramService {
  constructor(private readonly programs: ILoyaltyProgramRepository) {}

  async getProgram(programCode: string = LOYALTY_PROGRAM_CODE): Promise<LoyaltyProgramDto> {
    const program = await this.programs.findByProgramCode(programCode);
    if (!program) {
      throw new NotFoundException('Program loyalty belum diinstal', {
        code: 'LOYALTY_PROGRAM_NOT_FOUND',
      });
    }
    return toLoyaltyProgramDto(program);
  }

  /**
   * Owner may update pointEarnRate / programName.
   * Enabling the program is intentionally NOT supported until LOYALTY-03/04.
   */
  async updateProgramConfig(input: {
    pointEarnRate?: number;
    programName?: string;
    updatedBy: string;
    /** Rejected if true — earning engine not deployed. */
    enabled?: boolean;
  }): Promise<LoyaltyProgramDto> {
    if (input.enabled === true) {
      throw new ValidationException(
        'Aktivasi program loyalty belum diizinkan. Engine earn/ledger belum tersedia (LOYALTY-03/04).',
        { code: 'LOYALTY_PROGRAM_ACTIVATION_BLOCKED' },
      );
    }

    const program = await this.programs.findByProgramCode(LOYALTY_PROGRAM_CODE);
    if (!program) {
      throw new NotFoundException('Program loyalty belum diinstal', {
        code: 'LOYALTY_PROGRAM_NOT_FOUND',
      });
    }

    let updated: LoyaltyProgram;
    try {
      updated = program.updateConfig({
        pointEarnRate: input.pointEarnRate,
        programName: input.programName,
        updatedBy: input.updatedBy,
      });
    } catch (error) {
      toValidation(error);
    }

    const saved = await this.programs.save(updated);
    return toLoyaltyProgramDto(saved);
  }

  /** Used by installer only — creates baseline disabled program. */
  async ensureBaseline(updatedBy: string): Promise<{ created: boolean; program: LoyaltyProgramDto }> {
    const existing = await this.programs.findByProgramCode(LOYALTY_PROGRAM_CODE);
    if (existing) {
      return { created: false, program: toLoyaltyProgramDto(existing) };
    }

    let program: LoyaltyProgram;
    try {
      program = LoyaltyProgram.createBaseline({
        id: randomUUID(),
        updatedBy,
      });
    } catch (error) {
      toValidation(error);
    }

    const saved = await this.programs.save(program);
    return { created: true, program: toLoyaltyProgramDto(saved) };
  }
}
