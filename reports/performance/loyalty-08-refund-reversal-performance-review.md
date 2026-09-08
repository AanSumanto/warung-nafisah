# LOYALTY-08 — Performance Review

**Document ID:** WN-LOYALTY-08-PERF  
**Date:** 2026-09-08

## Original earn lookup plan

1. `findByIdempotencyKey(LOYALTY:EARN_SALE:<orderId>)` — unique index on `idempotencyKey`  
2. Optional `findById(originalEarnLedgerId)` available for audit  
3. Reversal append uses unique `idempotencyKey`  
4. No full-customer ledger scan for reversal

## Customer mutation

- Single `findOneAndUpdate` `$inc currentPoints` (no `$gte` guard — intentional)  
- Concurrent refund/earn/redeem serialize via Mongo transactions + retry

## Indexes used

Existing:

- `loyalty_ledger.idempotencyKey` unique  
- `{ sourceType, sourceId }`  
- `{ customerId, occurredAt }`

No destructive index changes. No additive index required for V1 full-refund keying.
