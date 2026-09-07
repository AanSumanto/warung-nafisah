/**
 * Derives loyalty-eligible paid amount from an authoritative Order.
 *
 * V1 formula:
 *   eligiblePaidAmount = order.total
 *   (sum of item subtotals — merchandise sale amount)
 *
 * Do NOT use tender paidAmount (cash overpay would inflate points).
 * Equivalent after pay: paidAmount - changeAmount === total.
 *
 * Future LOYALTY-07:
 *   exclude lines with lineKind === 'REWARD' (Rp0) from the sum
 *   without subtracting catalog retail from a total that already excludes them.
 */
export function deriveEligiblePaidAmount(order: { readonly total: number }): number {
  const amount = order.total;
  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error('ORDER_TOTAL_INVALID_FOR_LOYALTY');
  }
  return amount;
}
