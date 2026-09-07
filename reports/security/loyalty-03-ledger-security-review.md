# LOYALTY-03 — Ledger Security Review

**Document ID:** WN-LOYALTY-03-SEC  
**Date:** 2026-09-07  
**Status:** COMPLETE

---

## Findings

| Control | Status |
|---------|--------|
| No public earn endpoint | PASS |
| No client-controlled `pointsDelta` / `balanceAfter` / snapshot | PASS |
| Points calculated server-side from `eligiblePaidAmount` + program rate | PASS |
| No arbitrary ledger insert API | PASS |
| No ledger update/delete API | PASS (+ schema pre-hook) |
| Mongo E11000 not leaked | PASS (mapped to idempotent success / conflict) |
| No raw customer phone in ledger | PASS |
| No reward public token | PASS |
| No production credentials added | PASS |
| Actor input is optional `actorUserId` for future POS; not a public trust boundary | PASS |
| Disabled program rejects earn | PASS |
| Blocked customer rejects earn | PASS |
| Unknown customer rejects (no implicit create) | PASS |

---

## Residual Risk

Direct MongoDB operator access can still mutate `loyalty_ledger` unless database roles forbid it. Application guarantees are primary.
