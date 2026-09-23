# LOYALTY-GO-LIVE-02 — Production Precheck

**Document ID:** WN-LOYALTY-GO-LIVE-02-PROD-PRE  
**Date:** 2026-09-09  
**PRODUCTION_MENU_PRECHECK:** **BLOCKED_MANUAL**

## Rules observed this sprint

- No production writes
- No production installer (write)
- No production gate flips
- No agent dry-run against ambiguous Atlas target (DB name `warung_nafisah` could be production)

## Menu keys (read-only operator checklist)

Verify **existence + status only** (no update):

| kodeMenu | Reward link | Expected note |
|----------|-------------|---------------|
| MNM001 | Es Teh 15 | must exist |
| NAS001 | Nasi Putih 30 | must exist |
| MDG001 | Model Gandum 45 | must exist (not MDL001) |
| SYR001 | Cah Kangkung 60 | may be **hidden** until business-ready |
| LL001 | Lele 75 | must exist |
| AYM001 | Ayam Paha 100 | must exist |
| AYM002 | Ayam Dada 100 | must exist; distinct from AYM001 |

**Historical (LOYALTY-02, owner-supplied):** keys verified; SYR001 hidden; AYM002 observed hidden at that time.  
**This sprint:** not re-queried live → **BLOCKED_MANUAL**, not PASS, not CONFLICT.

### Operator read-only example (adapt to your mongo shell / Compass)

```
// READ ONLY — do not update
db.menus.find(
  { kodeMenu: { $in: ['MNM001','NAS001','MDG001','SYR001','LL001','AYM001','AYM002'] } },
  { kodeMenu: 1, namaMenu: 1, status: 1, _id: 0 }
)
```

Record status table in evidence. Any missing key → **CONFLICT / P1**.

## Installer dry-run

**Implementation:** `--dry-run` performs **no creates** when `dryRun === true` (would_create / already_exists / conflict reporting only). Still **connects** to Mongo from current `.env`.

**Agent:** did **not** run dry-run (ambiguous Atlas may be production; connecting for inventory is operator-owned).

### Operator (confirmed production or staging)

```bash
cd backend
# Ensure .env points at INTENDED database (verify DB name first)
npm run loyalty:install-v1:dry-run
```

Expect: 1 program `NAFISAH_REWARDS`, 7 rewards, success or compatible no-op, fail-closed on conflict.

**Do NOT** run `npm run loyalty:install-v1` (write) in this readiness phase.  
Production write additionally requires `--i-understand-production` when `NODE_ENV=production`.

## Production feature gates (read-only)

Verify remain **OFF**:

| Gate | Required |
|------|----------|
| `NAFISAH_REWARDS.enabled` | false |
| `LOYALTY_POS_UI_ENABLED` | false |
| `LOYALTY_REDEMPTION_ENABLED` | false |
| `LOYALTY_RECEIPT_QR_ENABLED` | false |
| `LOYALTY_ADMIN_ADJUSTMENT_ENABLED` | false |

### Operator

```bash
# On production VPS — redact secrets when sharing
grep -E '^LOYALTY_|^PUBLIC_APP_URL|^NODE_ENV|^MONGODB_DB_NAME' backend/.env
pm2 show warung-nafisah-api | head
# Owner API GET program (auth) — confirm enabled=false
```

**Agent:** **BLOCKED_MANUAL**.

## PM2 topology

**Repo:** `ecosystem.config.cjs` → `instances: 1`, `exec_mode: 'fork'`.

**Live:** UNVERIFIED until operator runs:

```bash
pm2 jlist
# or: pm2 status
# Confirm instances === 1 and not cluster mode
```

If live is multi-instance/cluster → in-memory public rate limiter is **P1** before public portal/QR traffic.

## Verdict

Production precheck track **not closed** by this agent. Prior LOYALTY-02 menu evidence is historical only.
