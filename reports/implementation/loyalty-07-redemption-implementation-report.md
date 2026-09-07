# LOYALTY-07 — Redemption Implementation Report

**Document ID:** WN-LOYALTY-07-IMP  
**Date:** 2026-09-07  
**LOYALTY-07_STATUS:** PASS_WITH_GAPS

## Summary

Cashier-controlled redemption: draft stores **intent only** (no point deduction). At pay, one Mongo UoW: materialize Rp0 REWARD line → pay → REDEEM_REWARD ledger + atomic `$gte` deduction → EARN_SALE on merchandise total → loyalty receipt snapshot.

## UX decision (resolved)

- No claim code / public mutation / customer deduction  
- One reward per order  
- Cashier selects `rewardCode`; backend loads config  

## Gates (all default OFF)

| Gate | Default |
|------|---------|
| Program `enabled` | false |
| `LOYALTY_POS_UI_ENABLED` | false |
| `LOYALTY_RECEIPT_QR_ENABLED` | false |
| `LOYALTY_REDEMPTION_ENABLED` | false |

## Inventory

No inventory/stock subsystem in POS MVP — **NOT APPLICABLE**. Reward line still carries menu qty=1 + HPP snapshot for future COGS.
