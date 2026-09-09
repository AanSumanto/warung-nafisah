# LOYALTY-GO-LIVE-01 — UAT Report

**Document ID:** WN-LOYALTY-GO-LIVE-01-UAT  
**Date:** 2026-09-09  
**Environment:** Staging UAT **not attached** to this readiness run  
**Production:** Not used; gates not enabled

## UAT member (planned — staging only)

| Field | Value |
|-------|-------|
| Name | UAT Nafisah Rewards |
| Phone | Synthetic test number only (validator-compatible; must not contact a real person) |
| Messaging | No WhatsApp/SMS marketing triggered |

## Baseline snapshot (staging — operator to capture)

Before live UAT record (non-secret): customer count, loyalty ledger count, order count, payment count, UAT customer state. Do not dump PII into this report.

**This run:** baseline **NOT CAPTURED** (no staging DB access).

## Evidence legend

| Code | Meaning |
|------|---------|
| AUTO | Covered by automated integration/unit tests in repo |
| MANUAL | Requires staging operator execution |
| PHYSICAL | Requires BP-ECO58 + RawBT hardware |
| BLOCKED | Cannot execute in this session |

---

## Required UAT matrix

| Case | Title | Expected (abridged) | Actual this run | Result |
|------|-------|---------------------|-----------------|--------|
| UAT-01 | Nonmember sale | Pay OK; no EARN; no loyalty receipt block; cashier OK | AUTO: POS nonmember paths in loyalty-04/07 suites | **AUTO_PASS** / MANUAL **BLOCKED** |
| UAT-02 | Member registration | Phone normalized; one customer; publicMemberId; masked phone; no password/email | AUTO: customer foundation + POS register | **AUTO_PASS** / MANUAL **BLOCKED** |
| UAT-03 | Member earn | e.g. Rp23.000 → +4; one EARN_SALE | AUTO: earn engine + POS atomic earn | **AUTO_PASS** / MANUAL **BLOCKED** |
| UAT-04 | Zero-point earn | Eligible &lt; 5000 → delta 0; balance unchanged | AUTO: LOYALTY-03/04 | **AUTO_PASS** / MANUAL **BLOCKED** |
| UAT-05 | Member receipt | Masked member; points; total; progress; no raw phone/token/HPP/IDs | AUTO + prior LOYALTY-05 software | **AUTO_PASS** / MANUAL **BLOCKED** |
| UAT-06 | Portal | Masked identity; points; progress; catalog; activity; no HPP/raw phone/IDs/actor | AUTO: LOYALTY-06 | **AUTO_PASS** / MANUAL **BLOCKED** |
| UAT-07 | Old receipt / current portal | Old QR → live balance after new earn | Software design verified; staging scan **BLOCKED** | **BLOCKED** |
| UAT-08 | Reward eligibility ≥15 | Es Teh eligible if menu available; BE authoritative | AUTO: redemption eligibility | **AUTO_PASS** / MANUAL **BLOCKED** |
| UAT-09 | Redemption intent | Intent before pay; no REDEEM yet; points not deducted | AUTO: LOYALTY-07 | **AUTO_PASS** / MANUAL **BLOCKED** |
| UAT-10 | Redeem + earn | e.g. 30→−30+3=3; REDEEM then EARN; Rp0 reward line | AUTO: LOYALTY-07 | **AUTO_PASS** / MANUAL **BLOCKED** |
| UAT-11 | Reward receipt | Reward Rp0; poin used/tx/total wording | AUTO + printing software | **AUTO_PASS** / MANUAL **BLOCKED** |
| UAT-12 | Reprint | No second redeem/earn; historical unchanged | AUTO: receipt snapshot behavior | **AUTO_PASS** / MANUAL **BLOCKED** |
| UAT-13 | Sold_out reward | Portal unavailable; cashier blocked; BE rejects | AUTO: LOYALTY-07 unavailable | **AUTO_PASS** / MANUAL **BLOCKED** |
| UAT-14 | Hidden reward | Not offered; BE rejects | AUTO + baseline Cah Kangkung may be hidden | **AUTO_PASS** / MANUAL **BLOCKED** |
| UAT-15 | Duplicate 100-pt | Ayam Paha ≠ Ayam Dada; no silent substitute | Catalog + redemption tests | **AUTO_PASS** / MANUAL **BLOCKED** |
| UAT-16 | Negative balance | Portal safe; attach OK; no reward; pay OK | AUTO: LOYALTY-08/09 | **AUTO_PASS** / MANUAL **BLOCKED** |
| UAT-17 | Earn from negative | New EARN raises balance | AUTO | **AUTO_PASS** / MANUAL **BLOCKED** |
| UAT-18 | Admin dashboard | Totals match deterministic UAT txs | AUTO: LOYALTY-09 aggregations | **AUTO_PASS** / MANUAL **BLOCKED** |
| UAT-19 | Manual + adjustment | Owner; reason; ledger | AUTO | **AUTO_PASS** / MANUAL **BLOCKED** |
| UAT-20 | Manual − adjustment | Owner; negative allowed | AUTO | **AUTO_PASS** / MANUAL **BLOCKED** |
| UAT-21 | Adjustment idempotency | Same requestId no double; different ID separate | AUTO | **AUTO_PASS** / MANUAL **BLOCKED** |
| UAT-22 | Kasir adjustment forbidden | 403 | AUTO: RBAC | **AUTO_PASS** / MANUAL **BLOCKED** |
| UAT-23 | Balance reconciliation | sum(deltas) == currentPoints | Helper `LoyaltyEarnService.reconcileBalance` | **AUTO_PASS** / MANUAL **BLOCKED** |
| UAT-24 | Order/payment reconciliation | One payment; EARN/REDEEM counts match | AUTO idempotency suites | **AUTO_PASS** / MANUAL **BLOCKED** |
| UAT-25 | Loyalty disabled fallback | Lewati + nonmember pay; program off skip earn | AUTO + FE Lewati | **AUTO_PASS** / MANUAL **BLOCKED** |

### Physical matrix

| Case | Title | Result |
|------|-------|--------|
| UAT-P01 | Normal BP-ECO58 receipt | **PENDING** |
| UAT-P02 | Loyalty text receipt | **PENDING** |
| UAT-P03 | QR physical print | **PENDING** |
| UAT-P04 | QR scan → `/rewards/member/<opaque>` HTTPS | **PENDING** |
| UAT-P05 | Reward receipt physical | **PENDING** |
| UAT-P06 | Reprint physical | **PENDING** |

See `reports/testing/loyalty-go-live-01-bp-eco58-physical-test.md`.

## Staging gate values (temporary — if used)

Document exact values when staging is activated for UAT. Example template (do **not** apply to production):

```
NAFISAH_REWARDS.enabled = true   # via owner API after installer
LOYALTY_POS_UI_ENABLED=true
LOYALTY_REDEMPTION_ENABLED=true
LOYALTY_RECEIPT_QR_ENABLED=true  # only if testing QR on staging printer
LOYALTY_ADMIN_ADJUSTMENT_ENABLED=true  # only for adjustment UAT cases
PUBLIC_APP_URL=https://<staging-frontend>
```

After UAT: return staging gates to safe state **or** document intentional retain.

## UAT verdict this session

| Layer | Verdict |
|-------|---------|
| Automated regression evidence | PASS (285 / 48) |
| Staging operational UAT | **NOT EXECUTED → BLOCKER for GO_LIVE_READY** |
| Physical printer UAT | **PENDING** |

**Overall UAT:** NOT_READY for production activation claim.
