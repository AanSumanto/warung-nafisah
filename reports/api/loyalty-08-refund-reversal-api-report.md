# LOYALTY-08 — API Report

**Document ID:** WN-LOYALTY-08-API  
**Date:** 2026-09-08

## Operational refund / void API

**NONE.**  

No `POST /orders/:id/refund`, `/void`, `/cancel` for paid orders.  
Draft `Order.cancel()` exists in domain only — not exposed.

## Loyalty reversal API

**NONE public.**  

`LoyaltyReversalService` is an application-layer internal service registered on `LoyaltyModule` for future financial UoW integration only.

## Portal

Unchanged surface: `GET /api/v1/public/rewards/member/:token` only.

Activity labels added for:

- `REVERSAL_REFUND` → "Penyesuaian poin refund"  
- `REVERSAL_VOID` → "Pembatalan transaksi"

## Pay concurrency HTTP

Exhausted transient Mongo WriteConflict / aborted txn after retry → **HTTP 409** `POS_TRANSACTION_CONFLICT` (also via global error handler). Domain errors → 400.
