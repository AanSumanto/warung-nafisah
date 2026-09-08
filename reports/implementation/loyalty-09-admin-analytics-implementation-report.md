# LOYALTY-09 — Admin Analytics Implementation Report

**Document ID:** WN-LOYALTY-09-IMP  
**Date:** 2026-09-08  
**LOYALTY-09_STATUS:** PASS_WITH_GAPS

## Summary

Owner-only Nafisah Rewards operational layer:

1. Dashboard analytics (Mongo aggregations, Asia/Jakarta ranges)
2. Member search / detail / paginated ledger
3. Balance verify (MATCH/MISMATCH, no auto-repair)
4. `MANUAL_ADJUSTMENT` delta-only append with gate `LOYALTY_ADMIN_ADJUSTMENT_ENABLED` (default **false**)

## RBAC

- Roles: `owner` | `kasir` (no separate admin)
- Manual adjustment + analytics admin APIs: **owner only**
- `requireRole` wrong-role → **HTTP 403** (authenticated but forbidden)

## Gates (all remain OFF by default)

| Gate | Default |
|------|---------|
| Program `enabled` | false |
| `LOYALTY_POS_UI_ENABLED` | false |
| `LOYALTY_REDEMPTION_ENABLED` | false |
| `LOYALTY_RECEIPT_QR_ENABLED` | false |
| `LOYALTY_ADMIN_ADJUSTMENT_ENABLED` | false |

Analytics read available to owner even when program disabled. Adjustment POST rejected when gate false.

## Explicit non-goals

- Point expiry runtime  
- Production enablement / deploy  
- Set-balance API  
- Public mutations  
- Fake refund completeness claims  
