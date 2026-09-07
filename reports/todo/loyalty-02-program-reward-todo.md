# LOYALTY-02 — TODO (Final)

**Document ID:** WN-LOYALTY-02-TODO  
**Date:** 2026-09-07

## Closed

- [x] Production menu keys verified (owner-supplied)
- [x] Model Gandum = MDG001
- [x] Seven-reward catalog with Ayam Paha + Ayam Dada
- [x] Installer + tests + reports aligned

## Before production installer run

- [ ] Staging dry-run with live menus
- [ ] Confirm AYM002 exists in production menus
- [ ] Confirm loyalty collections empty / no conflicting REWARD_AYAM
- [ ] Run installer with `--i-understand-production` only after approval
- [ ] Keep `enabled=false`

## Operational (outside LOYALTY-02)

- [ ] When Ayam Dada ingredients unavailable: set status `sold_out` (not `hidden`) via normal menu management — **not done in this sprint**
- [ ] When Cah Kangkung ready: unhide SYR001 via normal menu management

## Next

LOYALTY-03 may begin after review — earn engine must use paid eligible amount, **not** reward catalog whitelist.

## BUSINESS_DECISION_REQUIRED (unchanged)

1. Point expiry period  
2. Refund when points already redeemed  
3. Redemption claim-code / QR UX  
