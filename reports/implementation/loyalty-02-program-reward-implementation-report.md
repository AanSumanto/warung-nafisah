# LOYALTY-02 — Program + Reward Implementation Report (Final Alignment)

**Document ID:** WN-LOYALTY-02-IMP  
**Date:** 2026-09-07 (final alignment)  
**Status:** COMPLETE

---

## 1. Summary

LOYALTY-02 final alignment:

- Production menu keys owner-verified and locked
- Model Gandum = **MDG001** (MDL001 discarded)
- Baseline catalog revised from **6 → 7** rewards
- Generic `REWARD_AYAM` replaced by `REWARD_AYAM_PAHA` + `REWARD_AYAM_DADA`
- Installer expects 1 program + 7 rewards
- Local seed aligned for AYM001/AYM002 (insert-only on first bootstrap)

Still **no** earning, ledger, POS payment changes, redemption, QR, or portal.

---

## 2. Final Seven-Reward Catalog

| sortOrder | Points | rewardCode | menuKode | HPP |
|-----------|--------|------------|----------|-----|
| 10 | 15 | REWARD_ES_TEH | MNM001 | 1500 |
| 20 | 30 | REWARD_NASI_PUTIH | NAS001 | 3000 |
| 30 | 45 | REWARD_MODEL_GANDUM | MDG001 | 4500 |
| 40 | 60 | REWARD_CAH_KANGKUNG | SYR001 | 5000 |
| 50 | 75 | REWARD_LELE | LL001 | 7000 |
| 60 | 100 | REWARD_AYAM_PAHA | AYM001 | 9000 |
| 70 | 100 | REWARD_AYAM_DADA | AYM002 | 9000 |

Two distinct 100-point chicken rewards — no silent substitution.

---

## 3. Chicken Variant Design

- `REWARD_AYAM_PAHA` → AYM001 only  
- `REWARD_AYAM_DADA` → AYM002 only  
- Same `pointsRequired` allowed (`rewardCode` remains unique identity)  
- Future redemption: if chosen variant sold_out/hidden → unavailable; do not swap variants  

---

## 4. Future Earn Eligibility (LOYALTY-03 guidance — not implemented)

- Earn from **eligible paid amount**, not reward-catalog whitelist  
- `pointsEarned = floor(eligiblePaidAmount / pointEarnRate)` with rate from config (5000)  
- Paid menu lines eligible; future Rp0 reward lines not eligible  
- Do **not** use `order.total - rewardCatalogSellingValue` if total already excludes Rp0 lines  
- Historical earning never rewritten by later menu status changes  

Examples (document only):

| Purchase | Eligible | Future points |
|----------|----------|---------------|
| Ayam Paha 16_000 | 16000 | 3 |
| Ayam Dada 17_000 | 17000 | 3 |
| Ayam Dada + Es Teh 20_000 | 20000 | 4 |

---

## 5. Program Config (unchanged)

`NAFISAH_REWARDS` · `pointEarnRate=5000` · **`enabled=false`** · activation API blocked

---

## 6. Installer

Still manual (`scripts/install-loyalty-v1-config.ts`), not startup-connected.  
Expects **7** rewards. Idempotent without silent overwrite. Validates all menus before write.

**Production installer:** not executed. Prior verification indicated installer was never run on production; no REWARD_AYAM migration required. Uncertainty if production ever ran an older installer cannot be proven without production access — report as low risk given prior PASS_WITH_GAPS stance and no production deploy.

---

## 7. Files Changed (this alignment)

- `baselineRewardCatalog.ts` — 7 rewards  
- `seedPosData.ts` — AYM001 rename/price + AYM002  
- `loyalty-program-reward.test.ts` — 7-reward assertions  
- Bootstrap/POS tests — menu count 14  
- Reports updated  

---

## 8. Redemption Availability (LOYALTY-07 lock — not implemented)

redeemable iff reward active **and** menu available.  
sold_out / hidden → not currently redeemable.  
No silent Paha↔Dada substitution.
