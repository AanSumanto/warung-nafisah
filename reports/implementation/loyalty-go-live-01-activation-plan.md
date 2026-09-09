# LOYALTY-GO-LIVE-01 — Activation Plan

**Document ID:** WN-LOYALTY-GO-LIVE-01-ACT  
**Date:** 2026-09-09  
**Rule:** Do **not** execute production activation in this sprint.

## Pre-activation checklist

1. Staging UAT matrix PASS (see UAT report)
2. Automated regression green (baseline 285 / 48)
3. Read-only production menu keys exist: `MNM001`, `NAS001`, `MDG001`, `SYR001`, `LL001`, `AYM001`, `AYM002`
4. Installer dry-run on target env
5. `PUBLIC_APP_URL` set only when enabling receipt QR
6. Confirm PM2 still single fork instance (or Redis limiter ready)
7. Confirm trust-proxy hop count with ops
8. Owner + kasir SOP trained
9. Kill-switch access verified (env + owner program disable)

## Production installer procedure (operator)

Working directory: `backend/` with production `.env` loaded carefully (never commit secrets).

```bash
# 1) Dry-run — expect 1 program + 7 rewards plan; fail-closed on conflict
npm run loyalty:install-v1:dry-run

# 2) Review output: compatible no-op vs create vs CONFLICT
# 3) Only if dry-run OK:
npm run loyalty:install-v1
```

Expected:

- One program `NAFISAH_REWARDS`
- Seven baseline rewards
- Compatible existing config → no-op / message, not overwrite
- Conflict → fail-closed (do not force)

**Do not run installer against production during GO-LIVE-01 readiness.**

## Feature-gate dependency graph (code-validated)

| Step | Action | Gate |
|------|--------|------|
| A | Install/verify loyalty configuration | Installer |
| B | Enable program | Owner `PUT` program `{ enabled: true }` |
| C | Enable cashier member UI | `LOYALTY_POS_UI_ENABLED=true` + restart/reload env |
| D | Observe earn / member attachment (first-day checkpoints) | — |
| E | Enable redemption | `LOYALTY_REDEMPTION_ENABLED=true` |
| F | Observe redemption | — |
| G | Enable receipt QR **only after** physical BP-ECO58 PASS | `LOYALTY_RECEIPT_QR_ENABLED=true` + valid `PUBLIC_APP_URL` |
| H | Enable admin adjustment after owner training | `LOYALTY_ADMIN_ADJUSTMENT_ENABLED=true` |

**Do not flip all switches simultaneously.**

### Program vs POS UI

- Program enable without POS UI: ordinary customers unaffected; attach APIs could still earn if misused — keep POS UI as deliberate cashier exposure.
- POS UI without program: UI may show members but earn skipped when program disabled.
- Recommended: **B then C**, not C alone expecting earn.

### Safe phased option if QR PENDING

| Phase | Enable | Keep OFF |
|-------|--------|----------|
| A — Core earn | program + `LOYALTY_POS_UI_ENABLED` | redemption, QR, adjustment (optional) |
| B — Redemption | + `LOYALTY_REDEMPTION_ENABLED` | QR until physical PASS |
| C — QR | + `LOYALTY_RECEIPT_QR_ENABLED` | — |
| D — Adjustment | + `LOYALTY_ADMIN_ADJUSTMENT_ENABLED` | — |

## Production menu precheck (read-only)

Verify live status of reward-linked keys without mutation. Cah Kangkung (`SYR001`) may remain hidden until business-ready — hidden rewards must not be offered.

## Post-activation first-day cadence

See rollback/monitoring sections and readiness report § first-day plan:

- First 10 txs
- First 25 member txs
- First redemption
- First 50 member txs
- End-of-day reconciliation

## Explicit non-goals

No point expiry, referral, tiers, WhatsApp automation, claim codes, paid refund subsystem, inventory.
