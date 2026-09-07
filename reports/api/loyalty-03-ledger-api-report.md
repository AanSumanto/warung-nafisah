# LOYALTY-03 — Ledger API Report

**Document ID:** WN-LOYALTY-03-API  
**Date:** 2026-09-07  
**Status:** COMPLETE

---

## NO PUBLIC EARN API IMPLEMENTED

There is **no** `POST /api/v1/loyalty/earn` (or equivalent) for owner/kasir/public clients.

Existing loyalty HTTP routes remain LOYALTY-02 config only (`/loyalty/program`, `/loyalty/rewards`).

---

## Internal Application Contract

### `LoyaltyEarnInput`

```ts
{
  customerId: string;
  orderId: string;                 // authoritative POS order business id
  eligiblePaidAmount: number;      // integer Rupiah >= 0 (caller-authoritative)
  occurredAt: Date;                // business completion time
  actorUserId?: string;            // future cashier id
  paymentId?: string;
  programCode?: string;            // default NAFISAH_REWARDS
}
```

Caller never supplies `pointsEarned` / `balanceAfter` / program snapshot.

### `LoyaltyEarnResult`

```ts
{
  customerId: string;
  sourceOrderId: string;
  eligiblePaidAmount: number;
  pointsEarned: number;
  balanceAfter: number;
  programCode: string;
  programVersion: number;
  pointEarnRate: number;
  processedAt: string;             // ISO
  alreadyProcessed: boolean;
  ledgerEntryId: string;
}
```

### Business error codes (in exception `details.code`)

| Code | Meaning |
|------|---------|
| `LOYALTY_PROGRAM_NOT_FOUND` | missing program |
| `LOYALTY_PROGRAM_DISABLED` | enabled=false |
| `LOYALTY_CUSTOMER_NOT_FOUND` | unknown customer |
| `LOYALTY_CUSTOMER_BLOCKED` | status blocked |
| `LOYALTY_INVALID_ELIGIBLE_AMOUNT` | invalid amount/inputs |
| `LOYALTY_EARN_CONFLICT` | same order, material input mismatch |

### Internal helpers

- `LoyaltyEarnService.reconcileBalance(customerId)` — detection only  
- `ILoyaltyLedgerRepository.sumPointsDelta` — ledger sum  

No public ledger read API (LOYALTY-06 later).
