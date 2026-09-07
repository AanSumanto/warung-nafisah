# LOYALTY-04 — Todo

**Document ID:** WN-LOYALTY-04-TODO  
**Date:** 2026-09-07

## Done

- [x] Optional Order customer + snapshot
- [x] Attach/clear APIs
- [x] Atomic pay earn when program enabled
- [x] Non-fatal disabled/blocked/missing
- [x] Cashier UX + UI gate default off
- [x] Tests + builds + reports

## Out of scope (do not auto-start)

- LOYALTY-05 receipt points / QR
- SaleCompleted reconciliation consumer
- Production program enable
- Redemption

## Production rollout (document only — not executed)

A hide UI + program disabled → B verify nonmember → C install config if needed → D enable UI internally → E attach without earn → F enable program controlled → G monitor

## BUSINESS_DECISION_REQUIRED

1. Point expiry  
2. Refund after redeem  
3. Claim-code / QR UX  
