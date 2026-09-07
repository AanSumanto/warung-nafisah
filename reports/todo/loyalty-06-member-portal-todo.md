# LOYALTY-06 — TODO

**Document ID:** WN-LOYALTY-06-TODO  
**Date:** 2026-09-07

## Before production QR activation

1. PHYSICAL_BP_ECO58_QR_VERIFICATION = PASS
2. Confirm portal live on `PUBLIC_APP_URL`
3. Deliberately set `LOYALTY_RECEIPT_QR_ENABLED=true` (separate from POS UI / program)

## Soft follow-ups

- Redis-backed rate limit if multi-instance API
- Confirm production `trust proxy` hop count
- Optional React component tests for portal states

## Still OPEN (do not resolve here)

1. Point expiry period  
2. Refund when redeemed points involved  
3. Exact redemption claim-code / QR UX → **LOYALTY-07**

**Do not start LOYALTY-07 automatically.**
