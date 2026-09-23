# Loyalty POS UI Integration Follow-up & Next Steps

**Document ID:** WN-LOYALTY-TODO-POS-UI-01  
**Date:** 2026-09-23  
**Sprint:** Prompt 33 — POS UI Integration Audit & Fix  

---

## 1. Completed in Prompt 33
- [x] Identified actual POS route (`/pos`) and cashier page component (`src/app/(shell)/pos/page.tsx`).
- [x] Diagnosed dual root causes: missing frontend environment proxy configuration and payment drawer component placement gap.
- [x] Created `frontend/.env.local` pointing API proxy to port 5000.
- [x] Upgraded `MemberSection.tsx` with inline phone search, member card with balance (`Saldo: XX poin`), inline registration, and "Lewati".
- [x] Mounted `memberSlot` inside `PaymentBottomSheet.tsx` directly above payment method selector before "Selesaikan & Cetak".
- [x] Added automated unit and integration tests (`frontend/tests/unit/loyalty-pos-ui.test.ts`).
- [x] Verified full regression (Frontend 57 PASS, Backend 285 PASS, Next.js build PASS).

---

## 2. Follow-Up Items for Future Sprints (Pending Owner Instructions)
- [ ] **Vercel / Remote Production Frontend Sync:** Update remote Vercel environment variables or deploy latest frontend build so remote domain points to the active API server.
- [ ] **Physical Cashier Live Trial:** Conduct observational trial with cashier on physical BP-ECO58 printer and touchscreen terminal.
- [ ] **Redemption Activation (Future Gate):** When owner directs, enable `LOYALTY_REDEMPTION_ENABLED` with catalogue validation and security PIN/OTP.
- [ ] **Receipt QR Activation (Future Gate):** When owner directs, enable `LOYALTY_RECEIPT_QR_ENABLED` with signed member portal URLs.
