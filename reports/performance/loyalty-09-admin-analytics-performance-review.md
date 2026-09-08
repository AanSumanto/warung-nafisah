# LOYALTY-09 — Performance Review

**Document ID:** WN-LOYALTY-09-PERF  
**Date:** 2026-09-08

## Strategy

Dashboard uses **parallel Mongo aggregations** — no full ledger load into Node.

| Query | Filter / index |
|-------|----------------|
| Ledger by type in range | `{ type, occurredAt }` (+ new compound indexes) |
| Eligible sales | EARN_SALE + `metadata.eligiblePaidAmount` sum |
| Reward HPP | REDEEM_REWARD + `metadata.rewardHppSnapshot` |
| Outstanding | customers `$group` on `currentPoints` |
| Member/nonmember | orders `{ status: paid, paidAt }` |
| Repeat | paid orders with customerId → group by customerId |
| Member ledger page | `{ customerId, occurredAt, _id }` cursor, limit ≤50 |

## Additive indexes

- `{ type: 1, occurredAt: -1 }`
- `{ occurredAt: -1, type: 1 }`

`createIndexes` only — no `syncIndexes` / drops.
