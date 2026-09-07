/**
 * Derives loyalty-eligible paid amount from an authoritative Order.
 *
 * V1 (LOYALTY-07):
 *   eligiblePaidAmount = sum of PAID line subtotals
 *   (= order.total when REWARD lines are Rp0)
 *
 * Do NOT use tender paidAmount (cash overpay would inflate points).
 */
export function deriveEligiblePaidAmount(order: {
  readonly total: number;
  readonly paidMerchandiseTotal?: number;
  readonly items?: ReadonlyArray<{ readonly lineKind?: string; readonly subtotal: number }>;
}): number {
  let amount: number;
  if (typeof order.paidMerchandiseTotal === 'number') {
    amount = order.paidMerchandiseTotal;
  } else if (order.items) {
    amount = order.items
      .filter((item) => (item.lineKind ?? 'PAID') !== 'REWARD')
      .reduce((sum, item) => sum + item.subtotal, 0);
  } else {
    amount = order.total;
  }

  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error('ORDER_TOTAL_INVALID_FOR_LOYALTY');
  }
  return amount;
}
