# LOYALTY-06 — Database Report

**Document ID:** WN-LOYALTY-06-DB  
**Date:** 2026-09-07

## Indexes used

| Collection | Index | Use |
|------------|-------|-----|
| customers | unique `publicMemberId` | Token lookup |
| loyalty_program | programCode | Enable check |
| loyalty_rewards | status + sortOrder | Catalog |
| menus | kodeMenu | Batch availability |
| loyalty_ledger | `{ customerId, occurredAt: -1 }` | Recent activity |

No new destructive indexes. No syncIndexes. Added repository method `listRecentByCustomer` only.

## Visibility rule persistence

Menu `hidden` / `sold_out` read at request time — Cah Kangkung appears automatically when menu becomes available.
