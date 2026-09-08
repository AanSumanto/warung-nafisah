# LOYALTY-08 — TODO / Carry-forward

**Document ID:** WN-LOYALTY-08-TODO  
**Date:** 2026-09-08

## Platform gaps (block E2E refund readiness)

1. Implement real paid refund/void (order status, payment reverse, cashflow)  
2. Wire `LoyaltyReversalService` into that same Mongo UoW  
3. Define RBAC for refund operators (do not invent kasir authority lightly)  
4. Refund receipt document (only if product needs it)  
5. `totalSpending` / `transactionCount` refund semantics decision  
6. Wire draft cancel service/route if product wants abandon-draft persistence  

## Carried from prior sprints

- LOYALTY-06: multi-instance rate limiter; trust-proxy hop verification  
- PHYSICAL_BP_ECO58_QR_VERIFICATION = PENDING  
- POINT_EXPIRY_DECISION = OPEN — do not implement EXPIRY runtime  

## Explicitly out of scope / do not start automatically

- LOYALTY-09 (manual adjustment admin tooling)  
- Partial refund loyalty math without approved rounding policy  
- Automatic REVERSAL_REDEEM / reward point restoration  
- Enabling program / POS UI / redemption / receipt QR  
- Production deployment  
