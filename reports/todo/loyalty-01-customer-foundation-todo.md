# LOYALTY-01 — Customer Foundation TODO

**Document ID:** WN-LOYALTY-01-TODO  
**Date:** 2026-09-07

---

## Completed in LOYALTY-01

- [x] Phone normalize / mask
- [x] publicMemberId generation
- [x] Customer aggregate
- [x] Persistence + unique indexes
- [x] Register / lookup / read APIs
- [x] Auth + RBAC
- [x] Concurrency-safe duplicates
- [x] Tests + reports

---

## Explicitly Out of Scope (next sprints)

| Item | Sprint |
|------|--------|
| Loyalty program config (`pointEarnRate`) | LOYALTY-02 |
| Reward catalog | LOYALTY-02 |
| Loyalty ledger + earn engine | LOYALTY-03 |
| POS member attachment + pay integration | LOYALTY-04 |
| Receipt points + QR | LOYALTY-05 |
| Public member portal + rate limits | LOYALTY-06 |
| Reward redemption | LOYALTY-07 |
| Void/refund point reversal | LOYALTY-08 |
| Analytics / manual adjustment | LOYALTY-09 |

---

## Pre-LOYALTY-02 Checklist

- [ ] Code review / approval of LOYALTY-01
- [ ] Optional staging deploy smoke (customer register/lookup)
- [ ] Verify production `menus.kodeMenu` before hardcoding reward menu keys (MDG001 vs MDL001 — **do not guess**)
- [ ] Confirm no customer seed ever added to bootstrap

---

## BUSINESS_DECISION_REQUIRED (unchanged)

1. Point expiry period  
2. Refund when earned points already redeemed  
3. Redemption claim-code / QR UX  

Do not invent values in LOYALTY-02 unless product locks them.

---

## Minor Follow-ups (non-blocking)

- [ ] Consider rate limiting on `/customers` register before public exposure (P2)
- [ ] Owner admin UI for customers (optional; not required for LOYALTY-02)
- [ ] Token rotation table if multi-token history needed (P3 / later)
