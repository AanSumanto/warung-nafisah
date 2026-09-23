# LOYALTY-GO-LIVE-02 — Staging UAT Report

**Document ID:** WN-LOYALTY-GO-LIVE-02-UAT  
**Date:** 2026-09-09  
**STAGING_UAT:** **BLOCKED_MANUAL**

## Agent execution result

No live staging UAT was executed.

**Reason:** Local agent environment connects to **Atlas remote** database named `warung_nafisah` under `NODE_ENV=development` with localhost CORS. That is **not** a confirmed isolated staging identity. Mutating it risks production customer/order/ledger data.

Per GO-LIVE-02 §3: ambiguous identity → **STOP staging mutation** → cases = **BLOCKED_MANUAL**.

Automated Vitest results are **not** recorded as staging PASS.

---

## Staging identity checklist (owner — required before any UAT)

Confirm **all** of the following before enabling loyalty in staging:

| # | Check | Pass criteria |
|---|-------|---------------|
| S1 | Staging frontend hostname | Distinct from production Vercel/production custom domain |
| S2 | Staging backend hostname | Distinct from production API host |
| S3 | Staging Mongo | Separate DB name (e.g. `warung_nafisah_staging`) **or** clearly labelled non-prod Atlas cluster |
| S4 | Staging Redis | Non-prod instance / DB index |
| S5 | Screenshot/note of hostnames + DB name (no URI secrets) | Stored with UAT evidence |
| S6 | Production gates remain OFF | Verified separately |

If any check fails or is unclear: **do not proceed**.

---

## Staging feature gate plan (isolated staging only)

| Gate | BEFORE | TEMPORARY UAT | AFTER |
|------|--------|---------------|-------|
| `NAFISAH_REWARDS.enabled` | false (expected) | true when earn UAT starts | false **or** intentionally retained (document) |
| `LOYALTY_POS_UI_ENABLED` | false | true for cashier UAT | restore |
| `LOYALTY_REDEMPTION_ENABLED` | false | true only for redeem cases | restore |
| `LOYALTY_ADMIN_ADJUSTMENT_ENABLED` | false | true only for adjustment cases | restore |
| `LOYALTY_RECEIPT_QR_ENABLED` | false | true only for physical QR cases | restore |
| `PUBLIC_APP_URL` | — | staging HTTPS frontend origin | restore |

Do **not** flip all at once. Sequence: program → POS UI → (observe earn) → redemption → (QR if hardware) → adjustment for admin cases.

Production: **unchanged / all OFF**.

---

## Synthetic UAT member (staging only)

| Field | Value |
|-------|-------|
| Name | `UAT Nafisah Rewards` |
| Phone | Synthetic validator-compatible number that cannot message a real person |
| Messaging | Confirm no WhatsApp/SMS/email integration fires on register |
| Report | Masked phone only |

---

## UAT matrix (this agent session)

| Case | Title | Result | Evidence |
|------|-------|--------|----------|
| UAT-01 | Nonmember sale | **BLOCKED_MANUAL** | Not run |
| UAT-02 | Member registration | **BLOCKED_MANUAL** | Not run |
| UAT-03 | Member earn (e.g. Rp23.000 → +4) | **BLOCKED_MANUAL** | Not run |
| UAT-04 | Zero-point sale | **BLOCKED_MANUAL** | Not run |
| UAT-05 | Member receipt privacy | **BLOCKED_MANUAL** | Not run |
| UAT-06 | Public portal | **BLOCKED_MANUAL** | Not run |
| UAT-07 | Historical receipt vs live portal | **BLOCKED_MANUAL** | Not run |
| UAT-08 | Reward eligibility ≥15 | **BLOCKED_MANUAL** | Not run |
| UAT-09 | Redemption intent (no deduct before pay) | **BLOCKED_MANUAL** | Not run |
| UAT-10 | Redeem + earn (30→−30→+3=3) | **BLOCKED_MANUAL** | Not run |
| UAT-11 | Reward receipt + reprint | **BLOCKED_MANUAL** | Not run |
| UAT-12 | Sold_out (staging menu only) | **BLOCKED_MANUAL** | Not run |
| UAT-13 | Hidden | **BLOCKED_MANUAL** | Not run |
| UAT-14 | Duplicate 100-pt rewards | **BLOCKED_MANUAL** | Not run |
| UAT-15 | Negative balance | **BLOCKED_MANUAL** | Not run |
| UAT-16 | Admin dashboard vs known txs | **BLOCKED_MANUAL** | Not run |
| UAT-17 | Manual adjustment + kasir 403 | **BLOCKED_MANUAL** | Not run |
| UAT-18 | Balance reconciliation MATCH | **BLOCKED_MANUAL** | Not run |
| UAT-19 | Order/payment reconciliation | **BLOCKED_MANUAL** | Not run |
| UAT-20 | Idempotency retries | **BLOCKED_MANUAL** | Not run |
| UAT-21 | Failure / Lewati fallback | **BLOCKED_MANUAL** | Not run |

---

## Operator step pack (execute on confirmed staging)

### A. Baseline snapshot (non-secret counts)

Record: customer count, ledger count, order count, payment count. No PII dumps.

### B. UAT-01 Nonmember

1. POS → draft → pay cash without member / Lewati  
2. Confirm payment OK, no loyalty block on receipt, no EARN_SALE for order

### C. UAT-02 Register

1. Register `UAT Nafisah Rewards` + synthetic phone  
2. Confirm one customer, masked display, publicMemberId exists (do not paste full token in report)

### D. UAT-03 Earn

1. Attach member; sell eligible Rp23.000 merchandise; pay once  
2. Expect EARN_SALE delta **+4**, currentPoints **+4**, one payment

### E. UAT-04 Zero-point

1. Eligible &lt; Rp5.000; pay  
2. Expect delta 0 / no balance increase; payment OK

### F. UAT-05/06 Receipt + portal

1. Inspect receipt object/preview: no raw phone, Mongo ID, HPP, ledger IDs, token as text  
2. Open portal URL; check `Cache-Control: no-store`; masked identity; catalog/activity safe

### G. UAT-07 Old vs live

1. Note balance on first receipt; earn again; reopen old portal link  
2. Receipt historical; portal = latest

### H. UAT-08…11 Redeem path

1. Reach ≥15 (sales or labelled UAT adjustment)  
2. Intent before pay: no ledger REDEEM  
3. Prefer deterministic: start 30, Nasi Putih −30, paid Rp19.000 → +3 → final 3  
4. Reprint: no second redeem/earn

### I. UAT-12…14 Menu states

1. Staging-only sold_out toggle → restore  
2. Hidden not offered  
3. Ayam Paha vs Ayam Dada distinct

### J. UAT-15…17 Admin

1. Controlled negative adjustment; portal/cashier attach; earn lifts balance  
2. Dashboard matches known UAT numbers  
3. Owner ± adjustment; kasir 403; idempotent requestId; restore adjustment gate

### K. UAT-18…21 Integrity

1. `sum(ledger deltas) == currentPoints` → MATCH required  
2. One payment per paid order; expected earn/redeem counts  
3. Safe retries: one economic effect  
4. Lewati / program off / nonmember always payable; redeem fail ≠ free reward

### L. Cleanup

Restore sold_out menus and staging gates. Preserve UAT ledger/history. Do not rewrite ledger.

---

## Verdict

**STAGING_UAT = BLOCKED_MANUAL** until owner completes the checklist on a **confirmed** isolated staging stack and pastes redacted evidence into an updated UAT matrix.
