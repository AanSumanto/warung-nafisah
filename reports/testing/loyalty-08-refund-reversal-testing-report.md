# LOYALTY-08 — Testing Report

**Document ID:** WN-LOYALTY-08-TEST  
**Date:** 2026-09-08  
**LOYALTY-08_STATUS:** PASS_WITH_GAPS

## Backend

| Suite | Result |
|-------|--------|
| Full `vitest run` | **265 PASS** / 40 files |
| `loyalty-reversal-service.test.ts` | 13 PASS |
| `error-handler-conflict.test.ts` | 3 PASS |
| Public activity + receipt progress unit | PASS |

### Reversal coverage

| Case | Status |
|------|--------|
| Simple full refund (+4 → balance −4) | PASS |
| Refund after spent → negative (−7) | PASS |
| Config rate change → historical −4 | PASS |
| Double refund idempotent | PASS |
| Concurrent refund one effect | PASS |
| Refund + earn concurrency → −3 | PASS |
| Zero-point earn → no reversal row | PASS |
| Redeem history retained; earn only reversed | PASS |
| Negative + earn | PASS |
| Negative cannot redeem | PASS |
| REVERSAL_VOID mapping | PASS |
| WriteConflict → 409 mapping | PASS |

### Not runnable E2E (platform gap)

- Operational paid refund HTTP flow  
- Refund receipt printing  
- Draft cancel service path (domain cancel unwired)  
- Failed payment reversal (N/A — mutations roll back with pay txn)

## Frontend

| Suite | Result |
|-------|--------|
| Full vitest | **48 PASS** |
| `next build` | PASS |
| Negative balance portal copy | Implemented (manual UX) |
| Cashier reward selector negative copy | Implemented |

## Backend / frontend builds

| Build | Result |
|-------|--------|
| `backend` `tsc` | PASS |
| `frontend` `next build` | PASS |

## Regressions retained

LOYALTY-01…07 + POS MVP + bootstrap suites all green; no assertions deleted.
