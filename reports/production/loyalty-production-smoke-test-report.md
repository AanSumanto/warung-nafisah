# Loyalty Production Smoke Test Report

**Document ID:** WN-LOYALTY-PROD-SMOKE-02  
**Date:** 2026-09-23  

## 1. Automated Status

| Test / Gate | Current State | Notes |
|---|---|---|
| PRODUCTION_ENVIRONMENT | **VERIFIED** | Owner explicitly confirmed production |
| MENU_MASTER_VALIDATION | **PASS** | All 7 reward menu keys verified |
| CONFIG_DRY_RUN | **PASS** | 1 program, 7 rewards compatible |
| CONFIG_INSTALLATION | **PASS** | Created & idempotency verified |
| NAFISAH_REWARDS.enabled | **ON** | Enabled in MongoDB |
| LOYALTY_POS_UI_ENABLED | **ON** | Reloaded in backend runtime |
| LOYALTY_REDEMPTION_ENABLED | **OFF** | Awaiting earn smoke test pass |
| LOYALTY_RECEIPT_QR_ENABLED | **OFF** | Hardware verification pending |
| LOYALTY_ADMIN_ADJUSTMENT_ENABLED | **OFF** | Kept OFF |
| NORMAL_NONMEMBER_POS | **OPERATOR_ACTION_REQUIRED** | Operator to verify [Lewati] on cashier UI |
| PRODUCTION_MEMBER_SMOKE_TEST | **OPERATOR_ACTION_REQUIRED** | Operator to register safe internal phone |
| PRODUCTION_EARN_SMOKE_TEST | **OPERATOR_ACTION_REQUIRED** | Operator to complete 1 real purchase |
| PRODUCTION_REDEEM_SMOKE_TEST | **NOT_RUN** | Staged after earn checkpoint |
| LEDGER_RECONCILIATION | **NOT_RUN** | Staged immediately after earn order |

---

## 2. Operator Smoke Test Instructions

### Step 1: Normal Nonmember Checkout Verification
1. Open Cashier POS UI (`http://localhost:3000` or production POS terminal).
2. Add any menu item to an order.
3. Observe loyalty section: confirm **[Lewati]** button is available.
4. Click **[Lewati]** or proceed to payment without member.
5. Confirm checkout completes normally.

### Step 2: Owner-Controlled Member Registration
1. Start a new order.
2. In Member section: Click **Cari Member** → Enter an internal safe test phone number (e.g. `081234567890`).
3. If not found, select **Daftar Member**.
4. Enter Name (e.g., `Test Member Production`) and Phone number.
5. Click **Simpan**.
6. Verify:
   - Member is created.
   - Masked phone number is displayed.
   - Member attaches to current order.

### Step 3: Controlled Earn Transaction
1. Add deterministic menu items to the order:
   - Model Gandum (`MDG001`) = Rp9.000
   - Es Teh (`MNM001`) = Rp3.000
   - **Total**: Rp12.000.
2. Expected Points Earned: `floor(12000 / 5000) = 2 points`.
3. Complete cash/QRIS payment normally.
4. Note order ID.
5. Notify agent when completed so reconciliation verification can run.
