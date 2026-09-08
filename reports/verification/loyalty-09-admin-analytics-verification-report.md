# LOYALTY-09 — Verification Report

**Document ID:** WN-LOYALTY-09-VER  
**Date:** 2026-09-08  
**LOYALTY-09_STATUS:** PASS_WITH_GAPS

## Builds / tests

- Backend build PASS  
- Frontend build PASS  
- Backend tests: **285**  
- Frontend tests: **48**

## DoD (abridged)

| Item | Status |
|------|--------|
| Metric definitions documented | PASS |
| Dashboard + date ranges (WIB) | PASS |
| Positive outstanding ≠ negative deficit | PASS |
| Reward HPP from snapshots | PASS |
| Member/nonmember paid orders | PASS |
| Repeat rate deterministic | PASS |
| Admin member detail + ledger page | PASS |
| MANUAL_ADJUSTMENT delta-only | PASS |
| Reason required, actor server-side | PASS |
| Owner only / kasir 403 / public 401 | PASS |
| Idempotency + atomic UoW | PASS |
| Negative adjustment allowed | PASS |
| No set-balance / no ledger edit-delete | PASS |
| Portal privacy | PASS |
| No point expiry / no production enable | PASS |
| Operational refund completeness | **GAP** (platform) |

## Decisions

| Key | Status |
|-----|--------|
| POINT_EXPIRY_DECISION | OPEN |
| REFUND_AFTER_REDEEM_DECISION | RESOLVED — negative balance allowed |
| CLAIM_UX_DECISION | RESOLVED — cashier-controlled |
| SOFTWARE_QR_VERIFICATION | PASS |
| PHYSICAL_BP_ECO58_QR_VERIFICATION | PENDING |
