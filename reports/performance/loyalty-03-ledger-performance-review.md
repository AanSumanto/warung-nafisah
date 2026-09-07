# LOYALTY-03 — Ledger Performance Review

**Document ID:** WN-LOYALTY-03-PERF  
**Date:** 2026-09-07  
**Status:** COMPLETE

---

## Access Patterns → Indexes

| Pattern | Index |
|---------|-------|
| Idempotency lookup | unique `idempotencyKey` |
| Customer history by time | `{ customerId, occurredAt }` |
| Source order lookup | `{ sourceType, sourceId }` |
| Alternate history | `{ customerId, createdAt }` |

No premature ledger history caching beyond `Customer.currentPoints`.

---

## Concurrency Cost

- Same-customer different-order earns contend on the customer document (`$inc`) — expected; WriteConflict retry absorbs it.
- Same-order races resolve via unique key (cheap abort + recover).
- Retry budget for earn: maxAttempts 12, baseDelay 25ms.

---

## Not Done (intentionally)

- No aggregation materializations beyond `sumPointsDelta` for reconciliation
- No public history pagination API (LOYALTY-06)
