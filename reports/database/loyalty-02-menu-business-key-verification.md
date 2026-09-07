# LOYALTY-02 — Menu Business Key Verification

**Document ID:** WN-LOYALTY-02-MENU-KEYS  
**Date:** 2026-09-07 (updated)  
**Status:** **PRODUCTION_VALUE = VERIFIED**

**SOURCE:** Production MongoDB Atlas menu values were manually verified and supplied by the owner.

Cursor did **not** connect to production MongoDB.

---

## 1. Model Gandum Discrepancy — RESOLVED

| Source | kodeMenu |
|--------|----------|
| Historical ERP notes | `MDL001` (obsolete) |
| Early Rewards proposal | `MDG001` |
| **Owner-verified production** | **`MDG001`** |

**Authoritative production value: Model Gandum = `MDG001`.**  
`MDL001` must not be used by Nafisah Rewards V1. Runtime baseline contains no `MDL001` reference (comment-only historical note allowed).

---

## 2. Production Menu Mapping Table

| Points | Reward | Production Menu | kodeMenu | Selling Price | Current Observed Status | Reward HPP* |
|--------|--------|-----------------|----------|---------------|-------------------------|-------------|
| 15 | Es Teh | Es Teh | **MNM001** | 3000 | available | 1500 |
| 30 | Nasi Putih | Nasi Putih | **NAS001** | 5000 | available | 3000 |
| 45 | Model Gandum | Model Gandum | **MDG001** | 9000 | available | 4500 |
| 60 | Cah Kangkung | Cah Kangkung | **SYR001** | 10000 | **hidden** | 5000 |
| 75 | Lele | Lele | **LL001** | 11000 | available | 7000 |
| 100 | Ayam Paha | Ayam Paha | **AYM001** | 16000 | available | 9000 |
| 100 | Ayam Dada | Ayam Dada | **AYM002** | 17000 | **hidden** (at evidence time) | 9000 |

\* Reward HPP estimate = approved loyalty business configuration.  
**Not** independently verified from production menu HPP fields.

---

## 3. Status Clarifications

### Cah Kangkung (SYR001) — `hidden`

Hidden intentionally because the menu is not ready for sale.  
May remain configured as a future reward. Catalog existence ≠ currently redeemable.

### Ayam Dada (AYM002) — observed `hidden` at verification time

Observed hidden at verification time because ingredients may temporarily be unavailable.  
**Intended operational state for temporary ingredient shortage is `sold_out`**; the menu remains part of the normal offering.  
This sprint does **not** mutate production status (`hidden` → `sold_out`).

---

## 4. Locked Menu Status Semantics

| Status | Meaning |
|--------|---------|
| `available` | Currently offered and can be sold |
| `sold_out` | Part of active offering; temporarily cannot sell (stock/ingredients) |
| `hidden` | Intentionally not offered/displayed |

Existing domain: `MenuStatus = 'available' | 'sold_out' | 'hidden'`; `isSellable()` = available only.  
**Gap (documented, not fixed):** POS UI sold_out visibility behavior not audited in this sprint — no POS refactor.

---

## 5. Local Seed Alignment

`seedPosData.ts` DEFAULT_MENUS updated for first-time installs only (`$setOnInsert`):

- AYM001 → Ayam Paha @ 16000  
- AYM002 → Ayam Dada @ 17000 (added)  

No production writes. Existing DBs with bootstrap marker are not mutated on restart.
