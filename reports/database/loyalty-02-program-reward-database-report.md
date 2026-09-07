# LOYALTY-02 — Database Report (Final)

**Document ID:** WN-LOYALTY-02-DB  
**Date:** 2026-09-07

## Collections

### `loyalty_program`
- Unique index: `programCode`
- Startup: createIndexes only; no config seed

### `loyalty_rewards`
- Unique index: **`rewardCode` only**
- Non-unique: `menuKode`, `status`, `{ status, sortOrder }`
- **`pointsRequired` is NOT unique** — required so two 100-pt chicken rewards coexist

## Baseline documents (via installer only)

1 program + **7** rewards (not 6).

## Production menu keys

**VERIFIED** by owner (Atlas). See menu business key verification report.

## Seed note

Local `DEFAULT_MENUS` includes AYM002 for first-time bootstrap only. No restart mutation.
