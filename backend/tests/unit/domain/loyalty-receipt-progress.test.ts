import { describe, it, expect } from 'vitest';
import { buildLoyaltyReceiptProgress } from '../../../src/application/loyalty/LoyaltyReceiptProgress.js';
import { buildMemberPortalUrl } from '../../../src/application/loyalty/buildMemberPortalUrl.js';
import { generatePublicMemberId } from '../../../src/domain/loyalty/publicMemberId.js';

const catalog = [
  { rewardCode: 'REWARD_ES_TEH', name: 'Es Teh', pointsRequired: 15, sortOrder: 10, status: 'active' },
  { rewardCode: 'REWARD_NASI_PUTIH', name: 'Nasi Putih', pointsRequired: 30, sortOrder: 20, status: 'active' },
  { rewardCode: 'REWARD_MODEL_GANDUM', name: 'Model Gandum', pointsRequired: 45, sortOrder: 30, status: 'active' },
  { rewardCode: 'REWARD_CAH_KANGKUNG', name: 'Cah Kangkung', pointsRequired: 60, sortOrder: 40, status: 'active', menuStatus: 'hidden' },
  { rewardCode: 'REWARD_LELE', name: 'Lele', pointsRequired: 75, sortOrder: 50, status: 'active' },
  { rewardCode: 'REWARD_AYAM_PAHA', name: 'Ayam Paha', pointsRequired: 100, sortOrder: 60, status: 'active' },
  { rewardCode: 'REWARD_AYAM_DADA', name: 'Ayam Dada', pointsRequired: 100, sortOrder: 70, status: 'active' },
];

describe('buildLoyaltyReceiptProgress', () => {
  it('shows next nasi putih remaining for balance 27', () => {
    const progress = buildLoyaltyReceiptProgress(27, catalog);
    expect(progress.nextReward?.name).toBe('Nasi Putih');
    expect(progress.nextReward?.pointsRemaining).toBe(3);
    expect(progress.progressMessage).toContain('3 poin');
    expect(progress.progressMessage).toContain('Nasi Putih');
    expect(progress.eligibleRewardCount).toBe(1);
  });

  it('exact threshold uses redeemable wording when no higher next', () => {
    const only = [
      { rewardCode: 'A', name: 'Es Teh', pointsRequired: 15, sortOrder: 1, status: 'active' },
      { rewardCode: 'B', name: 'Nasi', pointsRequired: 30, sortOrder: 2, status: 'active' },
    ];
    const progress = buildLoyaltyReceiptProgress(30, only);
    expect(progress.hasRedeemableThreshold).toBe(true);
    expect(progress.nextReward).toBeUndefined();
    expect(progress.progressMessage).toMatch(/Reward tersedia|tukar reward/i);
  });

  it('above max has no negative remaining', () => {
    const progress = buildLoyaltyReceiptProgress(120, catalog);
    expect(progress.nextReward).toBeUndefined();
    expect(progress.progressMessage).not.toMatch(/-/);
    expect(progress.progressMessage).toMatch(/Reward tersedia/);
  });

  it('duplicate 100-point rewards use generic threshold wording', () => {
    const progress = buildLoyaltyReceiptProgress(90, catalog);
    expect(progress.nextReward?.pointsRequired).toBe(100);
    expect(progress.nextReward?.pointsRemaining).toBe(10);
    expect(progress.progressMessage).toContain('reward 100 poin');
  });

  it('skips hidden menu for next nomination', () => {
    const progress = buildLoyaltyReceiptProgress(50, catalog);
    // next after 45 would be Cah 60 but hidden → Lele 75
    expect(progress.nextReward?.name).toBe('Lele');
    expect(progress.nextReward?.pointsRemaining).toBe(25);
  });

  it('skips sold_out for next nomination when available alternative exists', () => {
    const rewards = [
      {
        rewardCode: 'REWARD_A',
        name: 'Ayam Dada',
        pointsRequired: 100,
        sortOrder: 60,
        status: 'active',
        menuStatus: 'sold_out',
      },
      {
        rewardCode: 'REWARD_B',
        name: 'Ayam Paha',
        pointsRequired: 100,
        sortOrder: 70,
        status: 'active',
        menuStatus: 'available',
      },
    ];
    const progress = buildLoyaltyReceiptProgress(90, rewards);
    expect(progress.nextReward?.name).toBe('Ayam Paha');
  });

  it('negative balance: no eligible, exact remaining, recovery message', () => {
    const progress = buildLoyaltyReceiptProgress(-7, catalog);
    expect(progress.eligibleRewardCount).toBe(0);
    expect(progress.hasRedeemableThreshold).toBe(false);
    expect(progress.nextReward?.pointsRemaining).toBe(22);
    expect(progress.progressMessage).toContain('bertambah kembali');
  });
});

describe('buildMemberPortalUrl', () => {
  it('builds opaque HTTPS path without PII', () => {
    const token = generatePublicMemberId();
    const url = buildMemberPortalUrl('https://pos.example.com', token);
    expect(url).toBe(`https://pos.example.com/rewards/member/${token}`);
    expect(url).not.toMatch(/phone|customerId|ObjectId|\?/i);
  });

  it('rejects non-HTTPS production hosts', () => {
    expect(() =>
      buildMemberPortalUrl('http://pos.example.com', generatePublicMemberId()),
    ).toThrow(/HTTPS/);
  });
});
