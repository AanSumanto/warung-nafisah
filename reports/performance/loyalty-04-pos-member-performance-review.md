# LOYALTY-04 — Performance Review

**Document ID:** WN-LOYALTY-04-PERF  
**Date:** 2026-09-07

## Query path

| Path | Extra DB work |
|------|----------------|
| Non-member pay | **None** (early return) |
| Member + disabled | 1 program read |
| Member + enabled + active | program + customer + `$inc` + ledger append (same txn) |

Sparse index on `orders.customerId` for future analytics. No redundant calls when no member attached.
