# LOYALTY-05 — Security Review

**Document ID:** WN-LOYALTY-05-SEC  
**Date:** 2026-09-07

## Findings

| Topic | Assessment |
|-------|------------|
| Portal URL | Opaque `publicMemberId` path only; no `?phone=` / `?customerId=` |
| Receipt identity | `phoneMasked` only; no raw phone / ObjectId / customerId on thermal |
| Token as bearer-like ID | Documented; do not log full URL/token at info |
| QR default OFF | Prevents production 404 / premature exposure |
| HTTPS | Required for non-localhost `PUBLIC_APP_URL` |
| Frontend earn calc | Absent |
| Portal / redemption endpoints | Absent |
| Rotation | Replacing `Customer.publicMemberId` invalidates old QR; no sequential enumeration |

## Residual risk

- Anyone with a valid printed QR URL can open future portal (LOYALTY-06 must rate-limit + read-only).
- Pay-time snapshot may embed portal URL; after rotation, old printed QR stays invalid if token replaced (desired). Reprint without stored URL will not invent QR while gate off.
