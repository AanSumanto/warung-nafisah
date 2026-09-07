# LOYALTY-07 — API Report

| Method | Path | Notes |
|--------|------|-------|
| GET | `/orders/:id/rewards` | Order-scoped selector |
| GET | `/loyalty/member-rewards/:customerId` | Pre-pay cashier selector |
| PUT | `/orders/:id/reward` | Draft intent only |
| DELETE | `/orders/:id/reward` | Clear intent |
| POST | `/orders/:id/pay` | Redeem+earn when intent present |

`GET /loyalty/pos-ui` → `{ memberUiEnabled, receiptQrEnabled, redemptionEnabled }`  

**No public mutation.**
