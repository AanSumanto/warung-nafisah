# Loyalty POS UI Integration Implementation Report

**Document ID:** WN-LOYALTY-IMP-POS-UI-01  
**Date:** 2026-09-23  
**Sprint:** Prompt 33 — POS UI Integration Audit & Fix  
**Status:** COMPLETE  
**LOYALTY_POS_UI_INTEGRATION_STATUS:** PASS  

---

## 1. Executive Summary

Following the production activation of Nafisah Rewards V1 (`NAFISAH_REWARDS.enabled=true`, `LOYALTY_POS_UI_ENABLED=true`), the cashier POS UI on `http://localhost:3000` was audited and updated. The previous UI did not surface the member selection flow due to missing local proxy environment configurations and an architectural placement gap where mobile layouts bypassed the cart drawer.

The POS interface has been updated with a frictionless inline **"Member?"** section across both desktop and mobile viewports, including phone search (`Cari nomor HP`), member card display with masked phone and real-time points balance (`Saldo: XX poin`), inline registration flow, and an explicit **"Lewati"** skip button. The final payment confirmation button **"Selesaikan & Cetak"** remains the payment trigger, and non-member checkout remains completely unaffected.

---

## 2. Architecture & Placement Implementation

### 2.1 Checkout Placement
- **Component:** `src/features/pos/components/PaymentBottomSheet.tsx`
- **Location:** Mounted directly inside `PaymentBottomSheet` via `memberSlot` prop above payment method selection (`Metode Pembayaran`).
- **Rationale:** Ensures every cashier checkout on both desktop and mobile layouts encounters the "Member?" checkpoint before the final "Selesaikan & Cetak" button is pressed.
- **Drawer SSR Fix:** Added `ModalProps={{ disablePortal: true }}` to MUI `Drawer` to maintain complete DOM rendering in test/SSR contexts.

### 2.2 Inline Member Section
- **Component:** `src/features/pos/components/MemberSection.tsx`
- **States Handled:**
  1. **Unselected Member:** Displays "Member?", phone input field (`Cari nomor HP`), "Cari" button, "Daftar Member" expansion, and a prominent "Lewati" button.
  2. **Active Member Card:** Displays masked phone (e.g. `08******7890`), customer name (if registered), points badge (`Saldo: XX poin`), and a "Ganti / Hapus" button to detach.
  3. **Inline Quick Registration:** If lookup returns no member, an inline registration card opens allowing instant registration without navigating away from checkout.
  4. **Flag Disabled:** When `memberUiEnabled` is `false`, renders `null` to ensure zero footprint on POS.

### 2.3 Cart & Payment State Coordination
- **Page Container:** `src/app/(shell)/pos/page.tsx`
- **State Management:**
  - Passes `memberSlot` to `PaymentBottomSheet` as well as `CartPanel` (desktop) and `CartBottomSheet` (mobile drawer).
  - Maintains `member: PosMemberSelection | null` across cart modifications, dining type changes, and drawer toggles.
  - Automatically attaches `customerId` to the order via `PUT /api/v1/orders/:id/customer` before calling `POST /api/v1/orders/:id/pay`.

---

## 3. Files Modified & Created

| File | Status | Description |
|---|---|---|
| `frontend/.env.local` | NEW | Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000` and `API_PROXY_TARGET=http://localhost:5000` |
| `frontend/src/features/pos/loyaltyTypes.ts` | MODIFIED | Added `currentPoints?: number` to `PosMemberSelection` |
| `frontend/src/features/pos/components/MemberSection.tsx` | MODIFIED | Implemented inline "Member?", search, card with `Saldo: XX poin`, inline register, and "Lewati" |
| `frontend/src/features/pos/components/MemberLookupSheet.tsx` | MODIFIED | Populates `currentPoints` on lookup/registration |
| `frontend/src/features/pos/components/PaymentBottomSheet.tsx` | MODIFIED | Mounted `memberSlot` before payment options; added `disablePortal` |
| `frontend/src/app/(shell)/pos/page.tsx` | MODIFIED | Wired `memberSlot` to `PaymentBottomSheet` |
| `frontend/tests/unit/loyalty-pos-ui.test.ts` | NEW | 9 end-to-end integration and unit test scenarios |
| `backend/tests/setup.ts` | MODIFIED | Defaulted loyalty flags to `false` in test isolation setup |
| `frontend/vitest.config.ts` | MODIFIED | Included `tests/unit/**/*.test.ts` |

---

## 4. Invariants Maintained

1. **Non-Member Checkout:** Clicking "Lewati" or omitting member selection allows standard "Selesaikan & Cetak" payment flow with zero errors or extra prompts.
2. **Atomic Earning:** Frontend only attaches customer ID. Backend `payOrder` inside MongoDB transaction computes and awards points atomically.
3. **Redemption Dormancy:** `LOYALTY_REDEMPTION_ENABLED = false` strictly enforced. No redemption UI is mounted.
4. **QR Receipt Dormancy:** `LOYALTY_RECEIPT_QR_ENABLED = false` strictly enforced. Receipts do not generate QR codes.
5. **Production Safety:** Zero destructive operations, mutations, or mock records injected into MongoDB Atlas production database.
