# LOYALTY-06 — Performance Review

**Document ID:** WN-LOYALTY-06-PERF  
**Date:** 2026-09-07

## Query plan (one public request)

1. Customer by `publicMemberId` (unique index)
2. Program by programCode
3. Rewards `listAll` (small catalog)
4. Menus batch `$in` kodeMenu (no N+1)
5. Ledger `listRecentByCustomer` limit 25, sort `{ customerId, occurredAt: -1 }`

No full ledger sum. No frontend waterfall (single aggregate DTO).

## Caching

API: no-store. Next.js route: `force-dynamic`. Client fetch: `cache: 'no-store'`.
