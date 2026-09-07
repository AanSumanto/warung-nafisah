import { describe, expect, it } from 'vitest';
import { DomainError } from '../../../src/domain/errors/DomainError.js';
import { LoyaltyReward } from '../../../src/domain/loyalty/LoyaltyReward.js';

describe('LoyaltyReward', () => {
  const base = {
    id: 'rwd-1',
    rewardCode: 'REWARD_ES_TEH',
    name: 'Gratis Es Teh',
    menuKode: 'MNM001',
    pointsRequired: 15,
    hppEstimate: 1500,
    sortOrder: 10,
    updatedBy: 'user_owner',
  };

  it('creates valid reward', () => {
    const reward = LoyaltyReward.create(base);
    expect(reward.rewardCode).toBe('REWARD_ES_TEH');
    expect(reward.status).toBe('active');
    expect(reward.version).toBe(1);
  });

  it('rejects invalid rewardCode / points / hpp', () => {
    expect(() => LoyaltyReward.create({ ...base, rewardCode: 'BAD' })).toThrow(DomainError);
    expect(() => LoyaltyReward.create({ ...base, pointsRequired: 0 })).toThrow(DomainError);
    expect(() => LoyaltyReward.create({ ...base, hppEstimate: -1 })).toThrow(DomainError);
  });

  it('increments version on economic update', () => {
    const reward = LoyaltyReward.create(base);
    const updated = reward.update({ pointsRequired: 20, updatedBy: 'user_owner' });
    expect(updated.pointsRequired).toBe(20);
    expect(updated.version).toBe(2);
  });

  it('deactivates without destroying fields', () => {
    const reward = LoyaltyReward.create(base);
    const inactive = reward.deactivate('user_owner');
    expect(inactive.status).toBe('inactive');
    expect(inactive.pointsRequired).toBe(15);
  });
});
