# LOYALTY-03 — Ledger Database Report

**Document ID:** WN-LOYALTY-03-DB  
**Date:** 2026-09-07  
**Status:** COMPLETE

---

## 1. Collection: `loyalty_ledger`

Immutable conceptual document:

| Field | Notes |
|-------|--------|
| `_id` | string UUID |
| `customerId` | string |
| `type` | ledger type (`EARN_SALE` at runtime) |
| `pointsDelta` | integer (EARN_SALE ≥ 0) |
| `balanceAfter` | integer ≥ 0 |
| `sourceType` | `SALE` |
| `sourceId` | authoritative order business id |
| `idempotencyKey` | unique deterministic key |
| `programSnapshot` | `{ programCode, programVersion, pointEarnRate }` |
| `metadata` | `{ eligiblePaidAmount, orderId, paymentId?, calculationVersion }` |
| `actor` | `{ type: SYSTEM\|USER, userId? }` |
| `occurredAt` | business sale completion time |
| `createdAt` / `updatedAt` | persistence timestamps (`updatedAt` = createdAt on append) |

---

## 2. Indexes (additive `createIndexes` only)

| Index | Purpose |
|-------|---------|
| `idempotencyKey` **UNIQUE** | Idempotent EARN_SALE |
| `{ customerId: 1, occurredAt: -1 }` | Customer history |
| `{ sourceType: 1, sourceId: 1 }` | Source order lookup |
| `{ customerId: 1, createdAt: -1 }` | Alternate history ordering |

**Not used:** `syncIndexes`, `dropIndexes`, destructive migrations.

---

## 3. Startup Behavior

`initializeLoyaltyInfrastructure()`:

- `createCollection()` + `createIndexes()` for customers, program, rewards, **ledger**
- Does **not** seed ledger rows, award points, backfill sales, or enable program

---

## 4. Transaction / Session Behavior

All earn persistence uses the active Mongo session from `MongoUnitOfWork` (ALS-scoped).

Atomic unit:

1. load program + customer  
2. validate  
3. calculate points  
4. `$inc` customer counters  
5. append ledger  
6. commit  

Abort ⇒ neither ledger nor customer mutation remains.

---

## 5. Customer Mutation Strategy

`MongoCustomerRepository.applyEarnMutation` — atomic `$inc`/`$set` with session. Avoids stale whole-document save under concurrency.

---

## 6. Reconciliation Invariant

`sumPointsDelta(customerId) === customer.currentPoints`

Exposed via `LoyaltyEarnService.reconcileBalance` (no public API). Detection only — no auto-repair in LOYALTY-03.

---

## 7. No Business Data Seed / Backfill

- No historical earning  
- No startup awards  
- Existing customers remain at zero until activation + future earn calls  
