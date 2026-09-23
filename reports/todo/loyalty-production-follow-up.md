# Loyalty Production Follow-up

**Document ID:** WN-LOYALTY-PROD-FU-02  
**Date:** 2026-09-23  
**Activation Status:** LIVE_WITH_GAPS (Phases 1-3 Live, Waiting for Operator In-Person Smoke Test)

## 1. Immediate Next Steps

| Step | Action | Owner |
|---|---|---|
| 1 | Test Nonmember Checkout ([Lewati]) in Cashier UI | Operator |
| 2 | Register 1 Test Member with internal phone number | Operator |
| 3 | Execute 1 Controlled Earn Purchase (e.g. Model Gandum + Es Teh = Rp12.000) | Operator |
| 4 | Run Ledger Reconciliation ($\sum \Delta == \text{currentPoints}$) | Agent |
| 5 | Enable Redemption gate (`LOYALTY_REDEMPTION_ENABLED=true`) | Agent |
| 6 | Execute 1 Controlled Redemption Transaction | Operator |
| 7 | Run Redemption Reconciliation & Receipt Reprint Check | Agent |

---

## 2. Post-Activation Monitoring Plan

1. **First 10 Member Transactions**: Track and verify each order, payment, and ledger delta.
2. **First Real Customer Redemption**: Mandatory reconciliation verification.
3. **End of Day Reconciliation**: Validate total EARN, REDEEM, and customer balances.

---

## 3. Explicit Non-Goals & Locked Decisions

- **POINT_EXPIRY_DECISION**: OPEN (`V1_RUNTIME_EXPIRY = NONE`).
- **REFUND_AFTER_REDEEM_DECISION**: RESOLVED (`NEGATIVE_BALANCE_POLICY = ALLOWED`).
- **CLAIM_UX_DECISION**: RESOLVED (`CLAIM_UX = CASHIER_CONTROLLED_NO_CLAIM_CODE`).
- **OPERATIONAL_PAID_REFUND**: NOT_AVAILABLE.
- **PHYSICAL_BP_ECO58_QR_VERIFICATION**: PENDING (Receipt QR remains OFF).
- **ADMIN_ADJUSTMENT**: Kept OFF.
