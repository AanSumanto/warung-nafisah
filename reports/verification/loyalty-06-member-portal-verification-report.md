# LOYALTY-06 — Verification Report

**Document ID:** WN-LOYALTY-06-VER  
**Date:** 2026-09-07  
**LOYALTY-06_STATUS:** PASS_WITH_GAPS

## Evidence

| Check | Result |
|-------|--------|
| Backend build | PASS |
| Frontend build | PASS |
| Backend tests | 236 PASS |
| Frontend tests | 48 PASS |
| Public API focused | PASS |
| Rate limit 429 | PASS (isolated) |
| Token rotation | PASS |
| Invalid / blocked token | PASS |
| Current balance | PASS |
| Hidden / sold_out / duplicate 100 | PASS |
| Activity privacy | PASS |
| Program disabled | PASS |
| Cache-Control no-store | PASS |
| No redemption / claim / public search | PASS |
| Program / POS UI / receipt QR defaults | OFF |
| Production deploy | **Not performed** |

## QR status (unchanged)

| Flag | Value |
|------|-------|
| SOFTWARE_QR_VERIFICATION | **PASS** |
| PHYSICAL_BP_ECO58_QR_VERIFICATION | **PENDING** |

Portal software ready does **not** close hardware gap. Do not enable `LOYALTY_RECEIPT_QR_ENABLED`.

## Gaps

1. Physical BP-ECO58 QR still PENDING.
2. Public route rate limit skipped in `NODE_ENV=test` (same pattern as login); 429 proven on isolated Express app.
3. Multi-instance rate limit remains in-memory (no Redis store) — document for horizontal scale.
