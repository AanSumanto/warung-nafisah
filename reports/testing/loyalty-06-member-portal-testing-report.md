# LOYALTY-06 — Testing Report

**Document ID:** WN-LOYALTY-06-TEST  
**Date:** 2026-09-07

## Backend

| Suite | Result |
|-------|--------|
| Full vitest | **236 PASS** / 37 files |
| `loyalty-06-public-portal.test.ts` | 10 PASS (incl. isolated 429) |
| Progress + activity unit | PASS |
| Prior LOYALTY-01…05 / POS / bootstrap | PASS |
| `tsc` build | PASS |

### Covered

- Current balance 35 ≠ historical 27
- Hidden Cah Kangkung omitted; Ayam Dada sold_out visible
- Duplicate 100 rewards; next at 27 → Nasi Putih; at 50 → Lele
- Zero activity omitted; no ledger internals
- Program UNAVAILABLE
- Invalid / unknown / blocked → generic 404
- Token rotation
- POST → 405
- Cache-Control no-store
- Rate limit 429 (isolated limiter)

## Frontend

| Suite | Result |
|-------|--------|
| Full vitest | **48 PASS** / 4 files |
| Portal format helpers | PASS |
| Printing / LOYALTY-05 | PASS |
| `next build` | PASS (includes `/rewards/member/[token]`) |
