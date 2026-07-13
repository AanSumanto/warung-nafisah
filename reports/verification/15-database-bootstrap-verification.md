# Database Bootstrap Hotfix — Verification

**Date:** 2026-07-13  
**Status:** Verified

---

## Checklist

- [x] `system_bootstrap` collection created on first startup
- [x] Bootstrap record fields: `version`, `installedAt`, `seedVersion`
- [x] Second startup skips all seeders
- [x] Operator menu edits preserved after restart
- [x] Custom menus (not in catalog) preserved after restart
- [x] `deleteMany` removed from menu seeder
- [x] `insertMany` replaced with upsert `$setOnInsert` in user seeder
- [x] `bootstrap.ts` calls `runDatabaseBootstrap()` not `seedPosData()`
- [x] POS integration tests pass with new bootstrap flow
- [x] Bootstrap idempotency integration test added

## Manual verification (production)

1. Deploy hotfix
2. Restart backend twice
3. Confirm log: `Bootstrap already completed. Skipping Initial Seed.`
4. Edit menu price in DB or via future admin UI
5. Restart again — price unchanged
6. Add custom menu with new `kodeMenu`
7. Restart again — custom menu still present

## Regression risks

| Area | Risk | Mitigation |
|------|------|------------|
| Fresh install | No users in production | Dev users skipped in `NODE_ENV=production` (unchanged) |
| Existing DB without bootstrap record | One-time seed on next start | Upsert `$setOnInsert` — no overwrite of existing menus |
| Tests | Need bootstrap on empty DB | Tests call `runDatabaseBootstrap()` explicitly |
