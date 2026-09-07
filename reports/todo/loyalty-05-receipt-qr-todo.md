# LOYALTY-05 — TODO / Follow-ups

**Document ID:** WN-LOYALTY-05-TODO  
**Date:** 2026-09-07

## Before enabling receipt QR in production

1. Complete LOYALTY-06 public read-only portal.
2. Set `PUBLIC_APP_URL` to HTTPS frontend origin.
3. Physical BP-ECO58 QR print verification → PASS.
4. Flip `LOYALTY_RECEIPT_QR_ENABLED=true` deliberately (separate from POS UI / program enable).

## Soft gaps

- Persist full `eligibleRewardCount` / `hasRedeemableThreshold` on `loyaltyReceipt` for richer reprint DTO.
- Optional: regenerate portal URL on reprint from current `publicMemberId` (document security vs historical fidelity).
- Observability: ensure any debug logs redact portal token.

## Out of scope (owned elsewhere)

| Item | Owner |
|------|-------|
| Member portal UI + API | LOYALTY-06 |
| Redemption | LOYALTY-07 |
| Enable NAFISAH_REWARDS program | Business decision |
| Enable POS member UI | Business decision |

**Do not start LOYALTY-06 automatically from this sprint.**
