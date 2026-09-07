import { describe, expect, it } from 'vitest';
import { DomainError } from '../../../src/domain/errors/DomainError.js';
import { LoyaltyProgram } from '../../../src/domain/loyalty/LoyaltyProgram.js';
import {
  DEFAULT_POINT_EARN_RATE,
  LOYALTY_PROGRAM_CODE,
} from '../../../src/domain/loyalty/LoyaltyTypes.js';

describe('LoyaltyProgram', () => {
  it('creates baseline disabled with default earn rate', () => {
    const program = LoyaltyProgram.createBaseline({
      id: 'prog-1',
      updatedBy: 'user_owner',
    });
    expect(program.programCode).toBe(LOYALTY_PROGRAM_CODE);
    expect(program.enabled).toBe(false);
    expect(program.pointEarnRate).toBe(DEFAULT_POINT_EARN_RATE);
    expect(program.version).toBe(1);
  });

  it('rejects invalid pointEarnRate', () => {
    expect(() =>
      LoyaltyProgram.createBaseline({
        id: 'prog-2',
        pointEarnRate: 0,
        updatedBy: 'user_owner',
      }),
    ).toThrow(DomainError);
    expect(() =>
      LoyaltyProgram.createBaseline({
        id: 'prog-3',
        pointEarnRate: 1.5,
        updatedBy: 'user_owner',
      }),
    ).toThrow(DomainError);
  });

  it('increments version when pointEarnRate changes', () => {
    const program = LoyaltyProgram.createBaseline({
      id: 'prog-4',
      updatedBy: 'user_owner',
    });
    const updated = program.updateConfig({ pointEarnRate: 6000, updatedBy: 'user_owner' });
    expect(updated.pointEarnRate).toBe(6000);
    expect(updated.version).toBe(2);
    expect(updated.enabled).toBe(false);
  });

  it('does not enable via updateConfig', () => {
    const program = LoyaltyProgram.createBaseline({
      id: 'prog-5',
      updatedBy: 'user_owner',
    });
    const updated = program.updateConfig({ programName: 'Nafisah Rewards V1', updatedBy: 'x' });
    expect(updated.enabled).toBe(false);
  });
});
