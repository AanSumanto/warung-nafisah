# LOYALTY-04 — Verification Report

**Document ID:** WN-LOYALTY-04-VER  
**Date:** 2026-09-07  
**LOYALTY-04_STATUS:** PASS

## Evidence

| Check | Result |
|-------|--------|
| Backend `tsc` | PASS |
| Frontend `next build` | PASS |
| Focused LOYALTY-04 | 15 PASS |
| Full backend | 217 PASS |
| Nonmember pay | PASS |
| Member + disabled | PASS (no earn, no payment failure) |
| Member + enabled | PASS (atomic) |
| Zero-point | PASS |
| Retry / concurrent | PASS |
| Rollback on fatal earn | PASS |
| Blocked / missing at pay | PASS (sale continues) |
| Non-reward menu earns | PASS |
| Same UoW session | Earn joins `getActiveSession()` — proven by rollback coupling |
| ReceiptBuilder | Unchanged |
| No QR/portal/redemption | Confirmed |
| Program baseline disabled | Confirmed |
| Production deploy | **Not performed** |

## Static scope

Present: Order customer fields, attach APIs, pay loyalty result, cashier member UI (gated).  
Absent: redemption, receipt points, SaleCompleted loyalty consumer, program enablement, frontend earn formula (`Math.ceil(/5000)` in POS is cash quick-amount only).
