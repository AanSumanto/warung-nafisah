# LOYALTY-03 — Todo / Follow-ups

**Document ID:** WN-LOYALTY-03-TODO  
**Date:** 2026-09-07

---

## Done in LOYALTY-03

- [x] Append-only `loyalty_ledger`
- [x] EARN_SALE earn engine
- [x] Pure calculator from `pointEarnRate`
- [x] Idempotency + conflict detection
- [x] Atomic customer earn mutation
- [x] Concurrency + rollback tests
- [x] Reports
- [x] Full regression green

---

## Explicitly Out of Scope (do not start automatically)

- LOYALTY-04: attach customer to POS order + invoke earn in `payOrder`
- SaleCompleted reconciliation consumer
- Redemption / QR / portal
- Expiry / refund reversal / manual adjustment workflows
- Enabling `NAFISAH_REWARDS` in production

---

## BUSINESS_DECISION_REQUIRED (still open)

1. Point expiry period  
2. Refund behavior when earned points already redeemed  
3. Redemption claim-code / QR UX  

These do **not** block LOYALTY-04 start once product approves POS integration.
