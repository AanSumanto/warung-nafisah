# LOYALTY-03 — Append-Only Ledger + Earn Engine Implementation Report

**Document ID:** WN-LOYALTY-03-IMP  
**Date:** 2026-09-07  
**Status:** COMPLETE  
**LOYALTY-03_STATUS:** PASS

---

## 1. Summary

LOYALTY-03 delivers the financial-grade loyalty ledger foundation and `EARN_SALE` earn engine as an **internal application capability only**.

- Collection `loyalty_ledger` (append-only)
- Pure calculator `calculateEarnedPoints`
- `LoyaltyEarnService` with atomic ledger + customer mutation
- Deterministic idempotency `LOYALTY:EARN_SALE:<orderId>`
- Program snapshot on every earn
- Reconciliation helper `reconcileBalance`
- **No** public earn API, **no** POS/`payOrder` wiring, **no** `SaleCompleted` consumer
- Program remains `enabled=false` in baseline config

---

## 2. Ledger Architecture

| Concern | Design |
|---------|--------|
| Source of truth | `loyalty_ledger` |
| Cached balance | `Customer.currentPoints` (projection) |
| Mutation type (runtime) | `EARN_SALE` only |
| Forward-compatible enums | `REDEEM_REWARD`, `REVERSAL_*`, `EXPIRY`, `MANUAL_ADJUSTMENT` |
| Repository | `append`, `find*`, `sumPointsDelta` — **no** update/delete |

Corrections in future sprints use compensating entries, never historical edits.

---

## 3. Append-Only Guarantees

1. Narrow `ILoyaltyLedgerRepository` (no mutation methods)
2. Mongoose pre-hooks reject update/delete/replace query helpers
3. Residual risk: direct DB operator access can still mutate MongoDB without DB roles

Not cryptographic immutability.

---

## 4. Idempotency Strategy

- Key: `LOYALTY:EARN_SALE:<orderId>` (deterministic; never random)
- Unique index on `idempotencyKey`
- Exact retry → `alreadyProcessed: true` + original result
- Conflicting retry (different customerId / eligiblePaidAmount) → `LOYALTY_EARN_CONFLICT`
- Same-order races: unique key + txn rollback + recover from committed entry
- E11000 never leaked to callers

---

## 5. Transaction Boundary (LOYALTY-04 ready)

`LoyaltyEarnService.earn`:

- If `unitOfWork.getActiveSession()` is already active → **join** that session (no nested txn)
- Else → open own Mongo transaction via `unitOfWork.execute` + `withTransactionRetry`

Orchestration owns the boundary. LOYALTY-04 can call earn inside `payOrder`'s existing UoW.

---

## 6. Concurrency Strategy

| Scenario | Mechanism |
|----------|-----------|
| Different orders / same customer | Atomic `$inc` + WriteConflict retry (ALS-scoped sessions) |
| Same order / concurrent callers | Unique idempotency + rollback loser `$inc` + recover |
| Shared UoW across requests | `AsyncLocalStorage` for active Mongo session (fixed in this sprint) |

`balanceAfter` comes from post-`$inc` document, not a stale pre-read.

---

## 7. Customer Cache Balance Strategy

`applyEarnMutation`:

```
$inc currentPoints, lifetimeEarnedPoints, totalSpending, transactionCount
$set lastTransactionAt, updatedAt
```

Only for `status: 'active'`. Same session as ledger append.

---

## 8. Zero-Point Sale Behavior

Eligible amount below `pointEarnRate` still creates `EARN_SALE` with `pointsDelta=0`, updates spending/count/timestamp, and remains idempotent. Prevents “silent skip + later reprocess” gaps.

---

## 9. Program Snapshot

Each ledger entry stores `{ programCode, programVersion, pointEarnRate }` used at earn time. Later rate/version changes never rewrite history.

---

## 10. Why No SaleCompleted Handler

LOYALTY-03 only builds the earn capability. Future LOYALTY-04 plan:

1. **Primary:** synchronous earn inside `payOrder` Mongo transaction  
2. **Secondary:** idempotent `SaleCompleted` reconciliation safety net  

Neither wired now.

---

## 11. Why Program Remains Disabled

Baseline `NAFISAH_REWARDS` stays `enabled=false`. Earn service **rejects** disabled program (`LOYALTY_PROGRAM_DISABLED`). Tests use an explicitly enabled fixture. Protects accidental production invocation before LOYALTY-04 activation.

---

## 12. Platform Fixes Included

- `MongoUnitOfWork`: ALS-scoped active transaction (concurrency-safe shared module)
- `MongoTransactionManager.rollback`: swallow already-aborted txn
- `withTransactionRetry`: recognize `Write conflict` (spaced) and duplicate-key races
