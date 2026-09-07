# LOYALTY-02 — Testing Report (Final)

**Document ID:** WN-LOYALTY-02-TEST  
**Date:** 2026-09-07  
**Status:** PASS

## Focused coverage added/updated

- Exactly 7 baseline rewards; keys MNM001…AYM002  
- No MDL001 / no generic REWARD_AYAM in baseline  
- Both 100-pt chicken rewards coexist; sortOrder Paha < Dada  
- Installer first run → 7 creates; second → no-op  
- Missing AYM002 → install fails with no partial writes  
- API lists 7 rewards in deterministic order  
- Indexes: rewardCode unique; pointsRequired not unique  

## Full suite

```
31 files / 169 tests — PASS
```

Includes LOYALTY-01, POS MVP, PROD-DATA-01 bootstrap (menu count expectations updated for 14 seed menus).
