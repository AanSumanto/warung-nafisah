# LOYALTY-06 — Member Portal Implementation Report

**Document ID:** WN-LOYALTY-06-IMP  
**Date:** 2026-09-07  
**Status:** COMPLETE  
**LOYALTY-06_STATUS:** PASS_WITH_GAPS

---

## 1. Summary

Public read-only Member Rewards Portal:

- Frontend: `/rewards/member/[token]` (outside AuthGuard)
- Backend: `GET /api/v1/public/rewards/member/:token`
- Opaque `publicMemberId` as bearer-like capability
- Current `Customer.currentPoints` (not receipt snapshot)
- Reward catalog from DB + menu availability
- Bounded recent activity
- Rate-limited, `Cache-Control: no-store`

No login, no mutation, no redemption, no claim code.

---

## 2. Architecture

```
Phone QR scan → Next.js /rewards/member/[token]
  → fetch GET /api/v1/public/rewards/member/:token (no-store)
  → PublicMemberRewardsService
       Customer(publicMemberId) → program → rewards + batch menus → ledger recent
  → PublicMemberRewardsDTO
```

---

## 3. Token trust model

`publicMemberId` = high-entropy URL-safe token (LOYALTY-01). Possession grants read access. Surface intentionally minimal. Rotation = replace field; old token 404.

---

## 4. Current vs receipt snapshot

| Artifact | Meaning |
|----------|---------|
| `Order.loyaltyReceipt` | Immutable pay-time snapshot |
| Portal | Live `currentPoints` + catalog |

---

## 5. Reward visibility

| Menu status | Portal |
|-------------|--------|
| available | Show, AVAILABLE |
| sold_out | Show, TEMPORARILY_UNAVAILABLE |
| hidden | **Omit** from public catalog |

Next-reward nomination skips hidden and sold_out (prefer available).

---

## 6. Activity

Fetch 25 newest ledger rows → filter zero EARN_SALE → take 10 public items. No orderId/actor/idempotency.

---

## 7. Why read-only / cashier redemption

Portal CTA: informational “Tunjukkan halaman ini kepada kasir…”. Deduction/claim = LOYALTY-07.

---

## 8. Gates unchanged

- Program `enabled=false` baseline
- `LOYALTY_POS_UI_ENABLED=false`
- `LOYALTY_RECEIPT_QR_ENABLED=false` (physical QR still PENDING)
