# LOYALTY-09 — Database Report

**Document ID:** WN-LOYALTY-09-DB  
**Date:** 2026-09-08

## Ledger

- Append-only preserved  
- New writer: `MANUAL_ADJUSTMENT` / sourceType `MANUAL`  
- Idempotency: `LOYALTY:MANUAL_ADJUSTMENT:<requestId>` unique  
- No historical rewrite  

## Customer

- Adjustment: `$inc currentPoints` only (may go negative)  
- Does **not** change lifetimeEarned / lifetimeRedeemed / totalSpending / transactionCount  

## Labels for unresolved counters

- `totalSpending` → "Recorded eligible spending (not net after refunds)"  
- `transactionCount` → earn-linked purchase count (not refund-adjusted)  

## Indexes

Additive only via `createIndexes()`.
