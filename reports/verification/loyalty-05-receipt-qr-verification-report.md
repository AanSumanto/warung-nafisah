# LOYALTY-05 — Verification Report

**Document ID:** WN-LOYALTY-05-VER  
**Date:** 2026-09-07  
**LOYALTY-05_STATUS:** PASS_WITH_GAPS

## Checklist

| Item | Result |
|------|--------|
| Backend build | PASS |
| Frontend build | PASS |
| Backend regression | 224 PASS |
| Frontend tests | 46 PASS |
| Receipt tests | PASS |
| ESC/POS QR structural tests | PASS |
| Nonmember golden regression | PASS |
| Program-disabled receipt | PASS |
| Zero-point receipt | PASS |
| QR privacy | PASS |
| QR gate default | OFF (`false`) |
| supportsQr fallback | PASS |
| Reprint does not call EarnService | PASS (print path only rebuilds Receipt from order snapshot) |
| ReceiptBuilder authoritative source | PASS |
| No frontend points formula | PASS |
| No portal page/API | PASS |
| No redemption | PASS |
| Program disabled baseline | PASS |
| POS UI default off | PASS |
| Production deployment | **Not performed** |

## QR verification (separated)

| Flag | Value |
|------|-------|
| SOFTWARE_QR_VERIFICATION | **PASS** |
| PHYSICAL_BP_ECO58_QR_VERIFICATION | **PENDING** |

Physical printer not available in this environment. QR remains gated OFF — does not block software completion; **blocks enabling receipt QR in production**.

## Gaps (accepted)

1. Physical BP-ECO58 QR print not exercised.
2. Reprint `eligibleRewardCount` reconstructed loosely (0) from compact snapshot; `progressMessage` is authoritative for print text.
3. Token rotation history not modeled; snapshot may hold portal URL from pay-time token.
