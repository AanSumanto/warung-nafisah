# Loyalty Production Reconciliation Report

**Document ID:** WN-LOYALTY-PROD-RECON-02  
**Date:** 2026-09-23  
**LEDGER_RECONCILIATION:** **PENDING_OPERATOR_TRANSACTION**

## 1. Baseline Pre-Activation Database Counts

| Metric | Baseline Count |
|---|---|
| Total Customers (`customers`) | 0 |
| Total Orders (`orders`) | 155 |
| Total Loyalty Ledger Entries (`loyalty_ledger`) | 0 |
| Loyalty Program Active | 1 (`NAFISAH_REWARDS`, enabled=true) |
| Active Baseline Rewards | 7 |

---

## 2. Integrity Checks to Execute Upon Operator Transaction

### Check A: Post-Earn Reconciliation (Immediate)
- **Order Payments**: Exactly 1 payment record per order.
- **Ledger Entries**: Exactly 1 `EARN_SALE` event.
- **Points Added**: Must equal `floor(total_eligible / 5000)`.
- **Customer Current Points**: Must equal initial balance + points added.
- **Reconciliation Formula**:
  $$\sum \text{ledger deltas} == \text{customer.currentPoints}$$
- **Status**: Will run automatically once operator reports completed test purchase.

### Check B: Post-Redemption Reconciliation
- **Ledger Entries**: Exactly 1 `REDEEM_REWARD` followed by `EARN_SALE` (if eligible paid amount > 0).
- **Price**: Reward line price = Rp0, lineKind = `REWARD`.
- **Reprint**: No additional ledger entries on receipt reprint.
- **Reconciliation Formula**:
  $$\sum \text{ledger deltas} == \text{customer.currentPoints}$$
