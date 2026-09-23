# Loyalty Production Rollback State

**Document ID:** WN-LOYALTY-PROD-RB-02  
**Date:** 2026-09-23  

## 1. Current Live Mutation State

| Control / Gate | Current Value | Mutation Done in This Session |
|---|---|---|
| `NAFISAH_REWARDS` installed | YES (7 rewards) | Installed via standard installer |
| `NAFISAH_REWARDS.enabled` | **true** | Enabled via domain service |
| `LOYALTY_POS_UI_ENABLED` | **true** | Updated in `backend/.env` + PM2 reload |
| `LOYALTY_REDEMPTION_ENABLED` | **false** | Unchanged (OFF) |
| `LOYALTY_RECEIPT_QR_ENABLED` | **false** | Unchanged (OFF) |
| `LOYALTY_ADMIN_ADJUSTMENT_ENABLED` | **false** | Unchanged (OFF) |

---

## 2. Emergency Rollback Procedures

If any unexpected error, UI block, or reconciliation mismatch occurs during cashier operation:

### Level 1: Hide Cashier Loyalty UI (Immediate Customer Protection)
Leave program enabled in database, but hide member UI from cashiers so normal nonmember sales continue without disruption:
```bash
# In backend/.env:
LOYALTY_POS_UI_ENABLED=false
# Reload:
npx pm2 restart warung-nafisah-api --update-env
```

### Level 2: Disable Point Earning Engine
If calculation or ledger writing fails:
```bash
# In backend/.env:
LOYALTY_POS_UI_ENABLED=false
# And update program via API or script:
# NAFISAH_REWARDS.enabled = false
```

### Invariant Rules
- **NEVER** delete customers, orders, payments, or loyalty ledger entries.
- Rollback strictly means disabling feature gates, preserving complete audit history.
