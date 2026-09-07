# LOYALTY-05 — Member Receipt + QR Printing Foundation

**Document ID:** WN-LOYALTY-05-IMP  
**Date:** 2026-09-07  
**Status:** COMPLETE  
**LOYALTY-05_STATUS:** PASS_WITH_GAPS

---

## 1. Summary

Loyalty-aware receipt foundation: backend-authoritative earn + reward progress snapshot on pay, optional Receipt Object loyalty section, ESC/POS QR via printer profile with text fallback, QR gate default OFF. No portal, no redemption, no production enablement.

---

## 2. Receipt Pipeline (preserved)

```
Order/payment (+ loyalty) → ReceiptBuilder → Receipt Object
  → PreviewRenderer / EscPosRenderer → RawBT bridge
```

POS UI never emits ESC/POS directly.

---

## 3. Receipt Loyalty Model

Optional `Receipt.loyalty`:

- `phoneMasked`, `memberName?`
- `pointsEarned`, `balanceAfter` (from backend only)
- `progressMessage` (backend Indonesian CTA)
- `memberPortalUrl?` (only when QR gate + PUBLIC_APP_URL)

Appears only when `loyalty.awarded === true`.

---

## 4. Authoritative Source

Forbidden: frontend `Math.floor(total / 5000)`.

Uses pay DTO: `pointsEarned`, `balanceAfter`, `receiptProgress`, masked snapshot.

Persisted on Order as `loyaltyReceipt` for reprint (immutable transaction snapshot).

---

## 5. Backend Progress

- `buildLoyaltyReceiptProgress(balance, catalog)` — pure
- `LoyaltyReceiptProgressService` — catalog + menu status
- Skips `menuStatus === 'hidden'` for next nomination
- Duplicate same `pointsRequired` → generic “reward N poin”
- Exact / above-max → no negative remaining wording

---

## 6. Portal URL

Centralized `buildMemberPortalUrl(origin, publicMemberId)` →  
`<origin>/rewards/member/<opaque>`  
HTTPS outside localhost; no query PII.

---

## 7. Gates (independent)

| Gate | Default | Purpose |
|------|---------|---------|
| Program `enabled` | false (DB) | Earn |
| `LOYALTY_POS_UI_ENABLED` | false | Cashier member UI |
| `LOYALTY_RECEIPT_QR_ENABLED` | false | Receipt QR |

---

## 8. ESC/POS QR

`buildEscPosQrCommands` — GS ( k model 2, module size 4, ECC M.  
`supportsQr=false` or missing URL → no QR bytes; member text remains.

Preview shows `[QR Nafisah Rewards]` placeholder (no QR npm dependency).

---

## 9. Explicit Non-Goals

- Public member portal page/API (LOYALTY-06)
- Redemption (LOYALTY-07)
- Enabling program / POS UI / QR in production
- Raster/image QR fallback
- Physical BP-ECO58 QR hardware PASS
