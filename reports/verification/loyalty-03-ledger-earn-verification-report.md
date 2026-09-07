# LOYALTY-03 — Ledger Earn Verification Report

**Document ID:** WN-LOYALTY-03-VER  
**Date:** 2026-09-07  
**Status:** COMPLETE  
**LOYALTY-03_STATUS:** PASS

---

## 1. Evidence Summary

| Check | Evidence |
|-------|----------|
| TypeScript build | `npm run build` → exit 0 |
| Focused LOYALTY-03 | 33 tests PASS |
| Full backend regression | **202 tests / 33 files PASS** |
| Same-order concurrency | 8× same order → 1 ledger |
| Different-order concurrency | 8× orders → balance 8, balanceAfter 1..8 |
| Rollback | Injected post-mutation / post-append failures → empty ledger + unchanged customer |
| Idempotent retry | `alreadyProcessed: true` |
| Conflicting retry | `LOYALTY_EARN_CONFLICT` |
| Zero-point sale | delta 0 ledger + stats |
| Disabled program | `LOYALTY_PROGRAM_DISABLED` |
| Blocked customer | `LOYALTY_CUSTOMER_BLOCKED` |
| Program snapshot | v1/5000 preserved after v2/10000 |
| Ledger reconciliation | sum == cached |
| PROD-DATA-01 | bootstrap suite PASS; seed still `$setOnInsert` only |
| LOYALTY-01 / LOYALTY-02 | API suites PASS |

---

## 2. Static Scope Verification

| Surface | Status |
|---------|--------|
| `Order.pay` | unchanged (no loyalty) |
| `PosService.payOrder` | unchanged (no earn call) |
| SaleCompleted **consumer** | **absent** (event name still emitted by Order only) |
| ReceiptBuilder | unchanged / not touched |
| Frontend | unchanged (no loyalty references) |
| Public `POST /loyalty/earn` | **not implemented** |
| Redemption / portal / QR | not implemented |
| Program enabled baseline | remains `false` |

Platform-only changes for concurrency safety:

- `MongoUnitOfWork` (AsyncLocalStorage sessions)
- `MongoTransactionManager.rollback` resilience
- `transaction-retry` Write conflict detection

---

## 3. PROD-DATA-01 Recheck

`seedPosData.seedInitialMenus` uses `insertBootstrapRecord` → `$setOnInsert` only.  
Bootstrap tests still prove operator menu documents unchanged across repeated startups.

---

## 4. Production Access

**Not claimed.** No production deploy, no production installer run, no program enablement.
