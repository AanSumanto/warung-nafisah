# LOYALTY-08 — Database Report

**Document ID:** WN-LOYALTY-08-DB  
**Date:** 2026-09-08

## Ledger

- Remains append-only (Mongoose pre-hooks block update/delete)  
- New types written: `REVERSAL_REFUND`, `REVERSAL_VOID`  
- Source types extended: `REFUND`, `VOID`  
- Zero-earn refund: **no** ledger row (deterministic policy)

## Customer projection

| Field | Reversal behavior |
|-------|-------------------|
| `currentPoints` | `$inc -pointsReversed` — **may go negative** |
| `lifetimeEarnedPoints` | **unchanged** (gross earned) |
| `totalSpending` | **unchanged** in V1 foundation |
| `transactionCount` | **unchanged** in V1 foundation |

**Rationale:** No operational refund amount/UoW yet. Analytics counter refund semantics deferred (`BUSINESS_DECISION_REQUIRED` below).

## Schema validators

- Customer schema: no `min: 0` on `currentPoints`  
- CustomerMapper: `currentPoints` now allows negative integers  
- No migration rewriting historical ledger

## Idempotency

Unique key prevents double reversal economic effect under concurrency.
