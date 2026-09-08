# LOYALTY-09 — Security Review

**Document ID:** WN-LOYALTY-09-SEC  
**Date:** 2026-09-08

| Check | Result |
|-------|--------|
| Owner-only adjustment | PASS |
| Kasir denied (403) | PASS |
| Public denied (401) | PASS |
| No set-balance endpoint | PASS |
| Delta only; balanceAfter server-computed | PASS |
| Reason required | PASS |
| Actor from JWT `sub` | PASS |
| Idempotency by requestId | PASS |
| Delta bound ±10000 | PASS |
| Gate backend-enforced | PASS |
| Admin reason not in public portal | PASS |
| No raw ledger dump in API | PASS |
| No HPP on public portal | PASS |
| Analytics owner auth | PASS |
| No production activation | PASS |

`requireRole` now returns **403 Forbidden** when authenticated user lacks role (was previously 401).
