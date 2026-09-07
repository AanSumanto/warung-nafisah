/**
 * Approved Nafisah Rewards V1 baseline catalog (7 rewards).
 *
 * menuKode values aligned to production MongoDB Atlas `menus` as manually
 * verified and supplied by the owner (2026-09).
 *
 * Model Gandum historical discrepancy MDL001 vs MDG001 is RESOLVED:
 * authoritative production value = MDG001. MDL001 must not be used.
 *
 * HPP estimates are approved loyalty business configuration — not independently
 * verified from production menu HPP fields.
 *
 * Earning (LOYALTY-03) must NOT use this catalog as a product whitelist.
 * Reward catalog controls redemption options only.
 */

export interface BaselineRewardDefinition {
  readonly rewardCode: string;
  readonly name: string;
  readonly menuKode: string;
  readonly menuNameExpected: string;
  readonly pointsRequired: number;
  readonly hppEstimate: number;
  readonly sortOrder: number;
  readonly expectedSellingPrice: number;
}

export const BASELINE_REWARD_CATALOG: readonly BaselineRewardDefinition[] = [
  {
    rewardCode: 'REWARD_ES_TEH',
    name: 'Es Teh',
    menuKode: 'MNM001',
    menuNameExpected: 'Es Teh',
    pointsRequired: 15,
    hppEstimate: 1_500,
    sortOrder: 10,
    expectedSellingPrice: 3_000,
  },
  {
    rewardCode: 'REWARD_NASI_PUTIH',
    name: 'Nasi Putih',
    menuKode: 'NAS001',
    menuNameExpected: 'Nasi Putih',
    pointsRequired: 30,
    hppEstimate: 3_000,
    sortOrder: 20,
    expectedSellingPrice: 5_000,
  },
  {
    rewardCode: 'REWARD_MODEL_GANDUM',
    name: 'Model Gandum',
    menuKode: 'MDG001',
    menuNameExpected: 'Model Gandum',
    pointsRequired: 45,
    hppEstimate: 4_500,
    sortOrder: 30,
    expectedSellingPrice: 9_000,
  },
  {
    rewardCode: 'REWARD_CAH_KANGKUNG',
    name: 'Cah Kangkung',
    menuKode: 'SYR001',
    menuNameExpected: 'Cah Kangkung',
    pointsRequired: 60,
    hppEstimate: 5_000,
    sortOrder: 40,
    expectedSellingPrice: 10_000,
  },
  {
    rewardCode: 'REWARD_LELE',
    name: 'Lele',
    menuKode: 'LL001',
    menuNameExpected: 'Lele',
    pointsRequired: 75,
    hppEstimate: 7_000,
    sortOrder: 50,
    expectedSellingPrice: 11_000,
  },
  {
    rewardCode: 'REWARD_AYAM_PAHA',
    name: 'Ayam Paha',
    menuKode: 'AYM001',
    menuNameExpected: 'Ayam Paha',
    pointsRequired: 100,
    hppEstimate: 9_000,
    sortOrder: 60,
    expectedSellingPrice: 16_000,
  },
  {
    rewardCode: 'REWARD_AYAM_DADA',
    name: 'Ayam Dada',
    menuKode: 'AYM002',
    menuNameExpected: 'Ayam Dada',
    pointsRequired: 100,
    hppEstimate: 9_000,
    sortOrder: 70,
    expectedSellingPrice: 17_000,
  },
] as const;

/** Expected count for installer / tests. */
export const BASELINE_REWARD_COUNT = BASELINE_REWARD_CATALOG.length;
