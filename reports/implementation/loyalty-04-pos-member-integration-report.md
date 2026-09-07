# LOYALTY-04 — POS Member Integration Implementation Report

**Document ID:** WN-LOYALTY-04-IMP  
**Date:** 2026-09-07  
**Status:** COMPLETE  
**LOYALTY-04_STATUS:** PASS

---

## 1. Summary

Optional member attachment on POS Order + atomic `LoyaltyEarnService` inside `payOrder` UoW. Non-member and disabled-program sales never fail. Program baseline remains `enabled=false`. Cashier member UI gated by `LOYALTY_POS_UI_ENABLED` (default false). Receipt/printer unchanged.

---

## 2. Existing POS Flow (revalidated)

```
createDraft → updateItems → [optional attach customer] → payOrder(UoW) →
  Order.pay → save order → PaymentWriter → loyalty orchestration → outbox → commit → dispatch
```

Frontend still creates draft at pay time; member is selected in cart local state, then attached after items before pay when UI gate is on.

---

## 3. Order Member Model

Optional fields:

- `customerId?: string`
- `customerSnapshot?: { customerId, phoneMasked, name? }`

Domain methods: `attachCustomer`, `clearCustomer` (draft-only). Paid orders immutable for member changes.

---

## 4. Eligible Paid Amount

```
eligiblePaidAmount = order.total  // sum of item subtotals
```

Not tender `paidAmount` (cash overpay). Future: exclude `lineKind=REWARD` without double-subtracting.

---

## 5. Program Disabled Behavior

Orchestration checks `program.enabled` **before** calling `EarnService`.  
Disabled → pay succeeds, `loyalty.reason=PROGRAM_DISABLED`, no ledger/stats.  
**Never** surfaces `LOYALTY_PROGRAM_DISABLED` into payment failure.

---

## 6. Enabled Member Pay

Same Mongo session as payment: earn joins active UoW. Fatal earn errors abort whole txn.

Non-fatal at pay: blocked / missing customer → sale succeeds, `awarded=false`.

---

## 7. Feature Gate

- Backend env `LOYALTY_POS_UI_ENABLED` default `false`
- `GET /api/v1/loyalty/pos-ui` → `{ memberUiEnabled }`
- Frontend hides member UI when false

Earn still controlled solely by DB `loyalty_program.enabled`.

---

## 8. Why No SaleCompleted Consumer

Primary path is synchronous in `payOrder`. Secondary reconciliation deferred.
