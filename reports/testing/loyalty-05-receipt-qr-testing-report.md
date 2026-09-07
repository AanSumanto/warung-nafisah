# LOYALTY-05 — Testing Report

**Document ID:** WN-LOYALTY-05-TEST  
**Date:** 2026-09-07

## Frontend

| Suite | Result |
|-------|--------|
| `tests/printing/printing.test.ts` | 40 PASS (incl. LOYALTY-05 cases) |
| Full frontend vitest | 46 PASS / 3 files |
| `next build` | PASS |

### Receipt coverage

- Nonmember golden: no loyalty / QR
- Member awarded: Aan / masked / +4 / 27 / progress
- PROGRAM_DISABLED / BLOCKED / NOT_FOUND: no block
- Zero-point awarded: +0 + balance
- QR gate off: text CTA, no portal in ESC/POS
- QR privacy: opaque path only
- `supportsQr=false`: no GS ( k
- ESC/POS QR store/print structure when URL present
- Preview QR placeholder
- Long name wrap; reprint snapshot semantics
- No frontend earn formula

## Backend

| Suite | Result |
|-------|--------|
| `loyalty-receipt-progress.test.ts` | 7 PASS |
| LOYALTY-04 integration (extended) | 15 PASS |
| Full backend vitest | 224 PASS / 35 files |
| `tsc` build | PASS |

### Progress / URL coverage

- Balance 27 → Nasi Putih remaining 3
- Exact threshold wording
- Above max: no negative
- Duplicate 100-pt → generic threshold
- Hidden Cah Kangkung skipped
- Portal URL HTTPS + no PII; HTTP production rejected

## Retained prior sprints

LOYALTY-01…04 + PROD-DATA-01 still green in full backend regression.
