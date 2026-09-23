# Loyalty POS UI Integration Audit Report

**Document ID:** WN-LOYALTY-AUDIT-POS-UI-01  
**Date:** 2026-09-23  
**Sprint:** Prompt 33 — POS UI Integration Audit & Fix  

---

## 1. Actual POS Route & Component Identification

* **Actual POS Route:** `/pos` (root `/` redirects directly to `/pos` via `src/app/(shell)/page.tsx`).
* **Actual POS Component:** `src/app/(shell)/pos/page.tsx` (`PosPage`).
* **Cart State Owner:** `PosPage` component owns cart items, dining type, and order totals via the `usePosCart` hook (`src/app/(shell)/pos/page.tsx`, lines 42–114).
* **Payment State Owner:** `PosPage` manages `paymentOpen`, `paying`, `member`, `selectedRewardCode`, and delegates payment execution to `handlePay`.

---

## 2. Current Checkout Flow & "Selesaikan & Cetak" Implementation

### Desktop Flow (`isDesktop >= md`):
1. Cashier adds items to cart from `MenuList`.
2. Items appear in `CartPanel` (fixed sidebar on the right).
3. If `memberUiEnabled` were true, `MemberSection` and `RewardSection` would be rendered inside `CartPanel` above the Total.
4. Cashier clicks **"Bayar"** in `CartPanel`.
5. `openPayment()` is called, setting `paymentOpen = true`.
6. `PaymentBottomSheet` drawer opens at the bottom.
7. Cashier selects payment method (Cash, QRIS, Transfer), inputs cash amount, and sees change calculation.
8. Cashier clicks **"Selesaikan & Cetak"** (`src/features/pos/components/PaymentBottomSheet.tsx`, line 159).
9. `PaymentBottomSheet` triggers `onConfirm(method, paidAmount)` which calls `handlePay` in `PosPage`:
   - `createOrderMutation.mutateAsync({ diningType })` (`POST /api/v1/orders`)
   - `updateItemsMutation.mutateAsync({ orderId, items })` (`PUT /api/v1/orders/${id}/items`)
   - If `memberUiEnabled && member`: `attachOrderCustomer(updated.id, member.customerId)` (`PUT /api/v1/orders/${id}/customer`)
   - `payOrderMutation.mutateAsync({ orderId, paymentMethod, paidAmount })` (`POST /api/v1/orders/${id}/pay`)
   - Clears cart, resets member, opens `ReceiptPreviewSheet`.

### Mobile / Tablet Flow (`isDesktop < md`):
1. Cashier adds items from `MenuList`.
2. `CartPanel` is **not rendered at all** (`{isDesktop ? <CartPanel ... /> : null}`).
3. Only `FloatingCartBar` appears at the bottom.
4. `FloatingCartBar` has a direct **"Bayar"** button.
5. Clicking "Bayar" directly calls `onPay={openPayment}`, which opens `PaymentBottomSheet` immediately.
6. `CartBottomSheet` is completely bypassed unless the cashier specifically taps the small cart icon.
7. `PaymentBottomSheet` opens directly to "Selesaikan & Cetak" with **zero** member UI present.

---

## 3. Existing Loyalty Frontend Implementation Discovered

The following loyalty UI components and APIs were previously implemented in `src/features/pos`:
1. `MemberSection.tsx` (`src/features/pos/components/MemberSection.tsx`):
   - Props: `enabled: boolean`, `member: PosMemberSelection | null`, `onSearch`, `onClear`.
   - Returns `null` if `!enabled`.
   - When enabled and `member === null`, renders "Member Nafisah Rewards", "Belum pilih member", and two buttons: "Cari Member" and "Lewati".
2. `MemberLookupSheet.tsx` (`src/features/pos/components/MemberLookupSheet.tsx`):
   - Modal dialog for looking up member by phone number or registering a new member if not found.
3. `RewardSection.tsx` (`src/features/pos/components/RewardSection.tsx`):
   - Gated by `redemptionEnabled` (currently false).
4. `loyaltyApi.ts` (`src/features/pos/loyaltyApi.ts`):
   - `fetchLoyaltyPosUi()`: calls `GET /loyalty/pos-ui`.
   - `lookupCustomerByPhone(phone)`: calls `GET /customers/lookup?phone=...`.
   - `registerCustomer({ phone, name? })`: calls `POST /customers`.
   - `attachOrderCustomer(orderId, customerId)`: calls `PUT /orders/${orderId}/customer`.

---

## 4. Mounting Status & Component Audit

| Component | Found in Codebase? | Mounted in DOM? | Location / Issue |
|---|---|---|---|
| `PaymentBottomSheet` | YES | YES | Renders "Selesaikan & Cetak", but **does not contain any member UI**. |
| `MemberSection` | YES | **NO** (renders `null`) | Mounted in `memberSlot` inside `CartBottomSheet` and `CartPanel`, but returns `null` because `memberUiEnabled` resolved to `false`. Bypassed entirely on mobile. |
| `MemberLookupSheet` | YES | CONDITIONAL | Mounted in `PosPage`, but only opens when `memberSheetOpen` is true (triggered from `MemberSection.onSearch`). |
| `RewardSection` | YES | **NO** (renders `null`) | Properly gated OFF by `redemptionEnabled=false`. |

---

## 5. API Endpoints Called by POS

* `/api/v1/menus` (`GET`)
* `/api/v1/shifts/current` (`GET`)
* `/api/v1/loyalty/pos-ui` (`GET`)
* `/api/v1/customers/lookup` (`GET` — when searching member)
* `/api/v1/customers` (`POST` — when registering member)
* `/api/v1/orders` (`POST` — create draft)
* `/api/v1/orders/:id/items` (`PUT` — set items)
* `/api/v1/orders/:id/customer` (`PUT` — attach member)
* `/api/v1/orders/:id/pay` (`POST` — process payment & loyalty earn)

---

## 6. Root Cause Analysis: Why "Member?" Was Not Visible

There are two distinct root causes contributing to the issue:

### Root Cause 1: Environment & API Routing Gap in Frontend Runtime
1. In `src/shared/lib/api/client.ts`, `baseURL` is set to `NEXT_PUBLIC_API_BASE_URL ? ... : '/api/v1'`.
2. When running locally without `frontend/.env.local`, `NEXT_PUBLIC_API_BASE_URL` is empty string `""` and `API_PROXY_TARGET` is undefined.
3. In `frontend/next.config.ts`, `rewrites()` only proxies `/api/v1/*` if `process.env.API_PROXY_TARGET` is set. Since it was empty, `rewrites()` returned `[]`.
4. Browser calls to `/api/v1/loyalty/pos-ui` on `http://localhost:3000` returned Next.js 404.
5. In `src/features/pos/loyaltyApi.ts`, `fetchLoyaltyPosUi` catches any error or 404 and silently returns `{ memberUiEnabled: false }`.
6. Therefore `memberUiEnabled` was always evaluated as `false`, causing `MemberSection` to return `null`.
7. (Additionally, the remote Vercel deployment points to an older backend deployment that returns `SYS_002 Endpoint tidak ditemukan` for `/loyalty/pos-ui`).

### Root Cause 2: Architectural Placement Mismatch in POS Checkout UX
1. Even when `memberUiEnabled` is `true`, `MemberSection` was only placed in `CartPanel` (desktop sidebar) and `CartBottomSheet` (mobile drawer).
2. On mobile/touch layouts, cashiers use `FloatingCartBar` whose "Bayar" button opens `PaymentBottomSheet` directly, skipping `CartBottomSheet` completely.
3. In `PaymentBottomSheet`, where the cashier actually confirms payment and clicks **"Selesaikan & Cetak"**, there was **no member section at all**.
4. In `MemberSection`, instead of an immediate inline "Member? [ Cari nomor HP ] [ Lewati ]" checkout step, it was an auxiliary cart widget requiring opening a modal dialog.

---

## 7. Exact Files That Must Be Changed

1. `frontend/.env.local` [NEW]:
   - Configure `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000` and `API_PROXY_TARGET=http://localhost:5000` for development and local runtime so `/api/v1/*` calls reach the active backend.
2. `frontend/src/features/pos/components/MemberSection.tsx` [MODIFY]:
   - Update UX to match Prompt 33 specifications:
     - Prominent "Member?" section.
     - Inline phone input with "Cari nomor HP".
     - Display member card: masked phone (`08******7890`), name, and points balance (`Saldo: XX poin`).
     - "Gunakan Member", "Daftar Member" (with phone & optional name), and "Lewati" actions.
     - Non-member checkout immediately preserved on "Lewati".
3. `frontend/src/features/pos/components/PaymentBottomSheet.tsx` [MODIFY]:
   - Mount `memberSlot` inside `PaymentBottomSheet` right before payment confirmation / method selection, ensuring the cashier always sees the "Member?" checkpoint before the final "Selesaikan & Cetak" action, on both mobile and desktop.
4. `frontend/src/features/pos/loyaltyTypes.ts` [MODIFY]:
   - Ensure `currentPoints?: number` is available on `PosMemberSelection` so member balance can be displayed.
5. `frontend/src/app/(shell)/pos/page.tsx` [MODIFY]:
   - Pass `memberSlot` to `PaymentBottomSheet`.
   - Ensure member selection state synchronizes smoothly between cart and payment bottom sheet.

---

## 8. Minimal Implementation Plan

1. **Step 1: Configuration**: Create `frontend/.env.local` pointing to backend port 5000.
2. **Step 2: MemberSection Enhancement**: Upgrade `MemberSection.tsx` to include inline phone search, member card with balance display, inline quick registration, and prominent "Lewati".
3. **Step 3: Integration into PaymentBottomSheet**: Pass and render `memberSlot` in `PaymentBottomSheet` above the payment methods so it is impossible to miss before clicking "Selesaikan & Cetak".
4. **Step 4: Verification & Testing**: Run unit and integration tests verifying flag OFF (hidden) vs flag ON (visible), nonmember "Lewati" checkout, member search & attach, and payment contract preservation.

---

## 9. Risks & Regression Concerns

- **Normal POS Invariant**: Must guarantee that non-member sales are never blocked. If a cashier ignores or skips member, checkout with "Selesaikan & Cetak" must work with zero extra friction.
- **Cart State Preservation**: Searching, registering, or skipping members must never reset or modify items in `cartState`.
- **Atomic Backend Earning**: Frontend only attaches `customerId` to the order via `PUT /orders/:id/customer`. The backend `payOrder` remains the sole authority for earning points.
- **Redemption & QR Invariant**: `LOYALTY_REDEMPTION_ENABLED` and `LOYALTY_RECEIPT_QR_ENABLED` remain strictly false and dormant.
