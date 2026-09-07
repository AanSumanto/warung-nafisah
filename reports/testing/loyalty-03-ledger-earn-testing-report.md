# LOYALTY-03 — Ledger Earn Testing Report

**Document ID:** WN-LOYALTY-03-TEST  
**Date:** 2026-09-07  
**Status:** COMPLETE

---

## 1. Focused Suites

| File | Coverage |
|------|----------|
| `tests/unit/domain/loyalty-calculate-earned-points.test.ts` | Pure calculator (rate 5000 cases + invalid inputs) |
| `tests/integration/infrastructure/loyalty-earn-service.test.ts` | Earn service end-to-end on MongoMemoryReplSet |

---

## 2. Cases Proven

- Basic earn 20000 → 4 pts  
- Sequential 7000/3000/17000/23000 → 8 pts, spending 50000, no remainder carry  
- Zero-point 3000 → ledger delta 0 + stats update + idempotent retry  
- Exact idempotent retry → `alreadyProcessed`  
- Conflicting amount / customer → `LOYALTY_EARN_CONFLICT`  
- Same-order ×8 concurrency → 1 ledger, 1 stats mutation  
- Different-order ×8 concurrency → 8 ledger, balance 8, balanceAfter `{1..8}`  
- Rollback after ledger failure / post-append failure  
- Disabled program / blocked / unknown customer  
- Program snapshot immutability across rate change  
- `reconcileBalance` match  
- Schema append-only guard  
- No E11000 leak under same-order races  

---

## 3. Results

| Suite | Result |
|-------|--------|
| Focused LOYALTY-03 | **33/33 PASS** |
| Full backend | **202/202 PASS** (33 files) |
| TypeScript build | **PASS** |

---

## 4. Regression Retention

PROD-DATA-01 bootstrap, LOYALTY-01, LOYALTY-02, POS MVP, event platform, auth/health — all retained and green. No assertions deleted.
