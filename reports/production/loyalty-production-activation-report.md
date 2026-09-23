# Loyalty Production Activation Report

**Document ID:** WN-LOYALTY-PROD-ACT-02  
**Date:** 2026-09-23  
**Mode:** Direct Production Activation (Owner-Confirmed Production Environment)  

## 1. Executive Summary

| Key | Value |
|---|---|
| **LOYALTY_PRODUCTION_ACTIVATION_STATUS** | **LIVE_WITH_GAPS** (Core Phase 1-3 Live; Awaiting In-Person Operator Smoke Transactions) |
| **PRODUCTION_ENVIRONMENT** | **VERIFIED** (Explicitly Confirmed by Owner) |
| **LOYALTY_PROGRAM** | **ON** (`NAFISAH_REWARDS.enabled = true`) |
| **LOYALTY_POS_UI** | **ON** (`LOYALTY_POS_UI_ENABLED = true`) |
| **LOYALTY_EARNING** | **LIVE** (Engine active in backend checkout) |
| **LOYALTY_REDEMPTION** | **NOT_LIVE** (`LOYALTY_REDEMPTION_ENABLED = false`, gated until earn smoke test passes) |
| **LOYALTY_RECEIPT_QR** | **OFF** (`LOYALTY_RECEIPT_QR_ENABLED = false`) |
| **LOYALTY_ADMIN_ADJUSTMENT** | **OFF** (`LOYALTY_ADMIN_ADJUSTMENT_ENABLED = false`) |
| **PHYSICAL_BP_ECO58_QR_VERIFICATION** | **PENDING** |

---

## 2. Production Environment Discovery

- **Host & Environment**: Windows Server/Desktop Host (Owner-Confirmed Real Production Environment).
- **PM2 Process**: `warung-nafisah-api` (online, 1 instance, fork mode, PID 20972).
- **Working Directory**: `d:\Soemanto\warung-nafisah\backend`.
- **Git SHA/Release**: `84e1aa7` (`main` branch).
- **Backend Port**: `5000` (live & healthy: `http://127.0.0.1:5000/api/v1/health/live`, `/ready` passing).
- **Frontend Origin**: `http://localhost:3000` (Next.js 15.5.20 running) & `https://warung-nafisah.vercel.app` (configured in CORS_ORIGINS).
- **MongoDB**: `warung_nafisah` on MongoDB Atlas cluster.
- **Redis**: Upstash Redis cloud cluster (PONG verified).
- **Unrelated Applications**: Preserved untouched (Setorin, Bettazon, BKPSDM unchanged; no external PM2 processes modified).

---

## 3. Backup & Recovery Check

- **MongoDB Atlas Cloud Backups**: Continuous cloud backup policies managed by Atlas infrastructure.
- **Local Host CLI Backup**: `mongodump` binary is not installed locally on Windows host CLI.
- **Status**: **UNVERIFIED** on host CLI; documented as operational infrastructure gap.

---

## 4. Production Menu Master Read-Only Verification

All 7 reward-linked business menu keys verified read-only in production `menus` collection:

| kodeMenu | namaMenu | Expected Note | Actual Status | Harga Jual | Result |
|---|---|---|---|---|---|
| `MNM001` | Es Teh | Must exist | `available` | Rp3.000 | PASS |
| `NAS001` | Nasi Putih | Must exist | `available` | Rp5.000 | PASS |
| `MDG001` | Model Gandum | Authoritative key (not MDL001) | `available` | Rp9.000 | PASS |
| `SYR001` | Cah Kangkung | May remain hidden | `hidden` | Rp10.000 | PASS |
| `LL001` | Lele | Must exist | `available` | Rp11.000 | PASS |
| `AYM001` | Ayam Paha | Must exist | `available` | Rp16.000 | PASS |
| `AYM002` | Ayam Dada | Distinct from AYM001, hidden | `hidden` | Rp17.000 | PASS |

---

## 5. Loyalty Configuration Installation

1. **Dry-Run Validation**:
   - Command: `npm run loyalty:install-v1:dry-run`
   - Output: 1 program (`NAFISAH_REWARDS`) would create, 7 rewards would create, 0 errors, 0 conflicts.
2. **Production Installation**:
   - Command: `npx tsx scripts/install-loyalty-v1-config.ts`
   - Result: 1 program created (`enabled=false`), 7 rewards created.
   - Verification dry-run re-executed: reported all 8 items as `already_exists` and compatible. Zero duplicate or conflicting records.

---

## 6. Phased Gate Activation

- **Checkpoint A**: Program installed, all gates OFF (`enabled=false`, `LOYALTY_POS_UI_ENABLED=false`).
- **Phase 1 (Program Enable)**: Activated `NAFISAH_REWARDS.enabled = true` via domain service.
- **Phase 2 (POS UI Enable)**: Set `LOYALTY_POS_UI_ENABLED=true` in `backend/.env`. PM2 restarted cleanly with `--update-env`.
- **Phase 3 (Gates Kept OFF)**:
  - `LOYALTY_REDEMPTION_ENABLED=false` (gated until earning smoke test is completed by operator)
  - `LOYALTY_RECEIPT_QR_ENABLED=false` (gated pending physical BP-ECO58 verification)
  - `LOYALTY_ADMIN_ADJUSTMENT_ENABLED=false` (kept OFF)

---

## 7. Next Step: Operator Action Required

Per non-negotiable safety rules (§1, §37), simulated clicks and fabricated production orders are strictly prohibited. The system is staged for the operator to conduct controlled smoke transactions in the live cashier UI.
