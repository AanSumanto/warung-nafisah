# LOYALTY-08 — Refund / Reversal Implementation Report

**Document ID:** WN-LOYALTY-08-IMP  
**Date:** 2026-09-08  
**LOYALTY-08_STATUS:** PASS_WITH_GAPS

## Executive summary

Audit-first: the ERP has **no operational paid refund/void** (money, payment reverse, cashflow, inventory). LOYALTY-08 therefore delivered an **internal LoyaltyReversalService foundation**, negative-balance policy, portal/cashier UX, and WriteConflict→409 mapping — **without** inventing a loyalty-only refund API or cashier refund button.

## Existing refund/void capability audit

| Capability | Present? | Evidence |
|------------|----------|----------|
| Draft → paid | Yes | `Order.pay` / `PosService.payOrder` |
| Draft cancel | Domain only | `Order.cancel()` — **not wired** to service/route |
| Paid void | **No** | No transition from `paid` |
| Full/partial refund | **No** | No routes, payment refund fields, or UI |
| Payment reversal | **No** | `PaymentWriter` creates sale only |
| Inventory restore | **N/A** | No stock subsystem |
| Financial/cashflow reverse | **No** | Not implemented |
| Events | SaleCompleted only | No Refund/Void events |

**`DOES_OPERATIONAL_PAID_REFUND_EXIST = no`**

Platform status vocabulary: `draft | paid | cancelled` — `cancelled` is draft-only and unused operationally.

## What was implemented

1. **`LoyaltyReversalService`** (`reverseEarnForRefund` / `reverseEarnForVoid`) — internal only  
2. Append-only `REVERSAL_REFUND` / `REVERSAL_VOID` ledger creators  
3. Idempotency keys: `LOYALTY:REVERSAL_REFUND:<earnLedgerId>[:refundRef]`, `LOYALTY:REVERSAL_VOID:<earnLedgerId>`  
4. Atomic `$inc currentPoints: -originalEarnPoints` (**allows negative**)  
5. Negative-balance portal + cashier UX  
6. Public activity labels for reversals  
7. Pay-path WriteConflict retry + HTTP **409** mapping  

## Explicit non-goals (this sprint)

- No public/cashier refund endpoint  
- No fake loyalty-only point undo  
- No automatic `REDEEM_REWARD` restoration  
- No partial-refund point math  
- No EXPIRY runtime  
- No gate enablement / production deploy  

## Business policy (locked)

**BUSINESS DECISION #2 = RESOLVED**

Refund reverses original `EARN_SALE.pointsDelta` exactly. If balance insufficient → **negative currentPoints allowed**. Monetary refund must never be blocked solely by loyalty balance (when a real refund UoW exists).

## Wiring note

When a real refund/void UoW is built later, call `LoyaltyReversalService` **inside the same MongoUnitOfWork** as money/status/accounting. Do not expose as a standalone mutation API.
