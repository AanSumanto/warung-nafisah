# LOYALTY-09 — Testing Report

**Document ID:** WN-LOYALTY-09-TEST  
**Date:** 2026-09-08

## Results

| Suite | Result |
|-------|--------|
| Backend vitest | **285 PASS** / 42 files |
| Backend `tsc` | PASS |
| Frontend vitest | **48 PASS** |
| Frontend `next build` | PASS (includes `/owner/loyalty`) |

## Focused coverage (`loyalty-09-admin-analytics.test.ts`)

| Case | Status |
|------|--------|
| Positive +10 | PASS |
| Negative → −5 | PASS |
| Idempotency same requestId | PASS |
| Two intentional identical deltas | PASS |
| No reason reject | PASS |
| Kasir 403 | PASS |
| Gate off reject | PASS |
| Concurrent +10/−5 → 25 | PASS |
| Ledger append fail rollback | PASS |
| Dashboard earn/redeem/reverse/manual | PASS |
| Outstanding / deficit split | PASS |
| Reward HPP cost 11500 | PASS |
| Member vs nonmember + draft excluded | PASS |
| Repeat rate 66.67 | PASS |
| Zero-data null-safe | PASS |
| Program disabled analytics readable | PASS |
| Public unauthorized | PASS |
| Member detail / ledger / verify | PASS |

## Portal privacy

Unit: MANUAL_ADJUSTMENT activity label only — no reason/actor/note.
