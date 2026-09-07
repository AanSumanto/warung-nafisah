/**
 * Pure point earn calculator.
 * pointEarnRate comes from Loyalty Program config — never hardcode 5000 here.
 */
export function calculateEarnedPoints(input: {
  readonly eligiblePaidAmount: number;
  readonly pointEarnRate: number;
}): number {
  const { eligiblePaidAmount, pointEarnRate } = input;

  if (!Number.isInteger(eligiblePaidAmount) || eligiblePaidAmount < 0) {
    throw new Error('eligiblePaidAmount must be a non-negative integer Rupiah');
  }
  if (!Number.isInteger(pointEarnRate) || pointEarnRate < 1) {
    throw new Error('pointEarnRate must be a positive integer Rupiah');
  }

  return Math.floor(eligiblePaidAmount / pointEarnRate);
}
