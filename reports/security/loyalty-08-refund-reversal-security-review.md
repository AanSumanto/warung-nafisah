# LOYALTY-08 — Security Review

**Document ID:** WN-LOYALTY-08-SEC  
**Date:** 2026-09-08

## Findings

| Check | Result |
|-------|--------|
| No public reversal endpoint | PASS |
| Portal remains GET-only | PASS |
| Client cannot supply pointsToReverse | PASS — loaded from EARN_SALE |
| No MANUAL_ADJUSTMENT used for refund | PASS |
| No historical ledger delete/update | PASS |
| Negative balance does not unlock rewards | PASS — `currentPoints >= pointsRequired` |
| Portal activity omits actor / order / reason | PASS |
| WriteConflict no longer raw 500 with Mongo text | PASS → 409 |
| Auth for refund ops | **N/A** — no refund API; future must reuse ERP RBAC |
| Kasir refund authority not invented | PASS |

## Residual risks

1. Internal service could be mis-wired later without financial UoW — documented; do not expose HTTP.  
2. In-memory portal rate limit / trust proxy hop verification (LOYALTY-06) unchanged.
