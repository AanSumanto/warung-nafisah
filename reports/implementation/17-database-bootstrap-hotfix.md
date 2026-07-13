# Database Bootstrap Hotfix — Implementation Report

**Project:** Warung Nafisah ERP  
**Date:** 2026-07-13  
**Type:** Hotfix — Idempotent Startup

---

## Problem

Every backend restart re-ran `seedPosData()` from `bootstrapInfrastructure()`. Menu seeder:

- `deleteMany({ kodeMenu: { $nin: CATALOG } })` — removed operator-added menus
- `$set` upsert — overwrote catalog prices, names, and forced `status: 'available'`

## Solution

Introduced **`system_bootstrap`** collection as a one-time install gate.

### New files

| File | Purpose |
|------|---------|
| `infrastructure/database/bootstrap/bootstrapConstants.ts` | `BOOTSTRAP_VERSION`, `SEED_VERSION`, doc id |
| `infrastructure/database/bootstrap/SystemBootstrapDocument.ts` | Mongoose model for `system_bootstrap` |
| `infrastructure/database/bootstrap/runDatabaseBootstrap.ts` | Bootstrap gate + logging |

### Modified files

| File | Change |
|------|--------|
| `bootstrap.ts` | `seedPosData()` → `runDatabaseBootstrap()` |
| `infrastructure/auth/seedPosData.ts` | Renamed flow to `installInitialData()`; removed `deleteMany`; upsert `$setOnInsert` only |
| `infrastructure/pos/PosModule.ts` | Register `system_bootstrap` collection on init |
| `tests/integration/api/pos-mvp.test.ts` | Use `runDatabaseBootstrap()` |

## Bootstrap flow

```
Application Start
  → connectDatabase()
  → initializePosInfrastructure()
  → runDatabaseBootstrap()
       → system_bootstrap exists? → log "Skipping Initial Seed" → return
       → else installInitialData() → create bootstrap record
  → connectRedis()
```

## `system_bootstrap` schema

| Field | Type | Description |
|-------|------|-------------|
| `_id` | string | Fixed: `system` |
| `version` | string | Bootstrap flow version (`1.0.0`) |
| `installedAt` | Date | First install timestamp |
| `seedVersion` | string | Catalog version (`pos-v1`) |

## Seeder safety

| Rule | Status |
|------|--------|
| No `deleteMany()` in seeders | ✅ Removed |
| No `dropCollection()` / `dropDatabase()` | ✅ Never used |
| No `insertMany()` without check | ✅ Replaced with upsert `$setOnInsert` |
| Master menu upsert by `kodeMenu` | ✅ Insert-only on first bootstrap |
| Seed runs once | ✅ Gated by `system_bootstrap` |

## Logging

```
[Bootstrap] First startup detected. Installing initial data...
[Bootstrap] Initial data installed. Bootstrap record created (version=1.0.0, seedVersion=pos-v1).
[Bootstrap] Bootstrap already completed. Skipping Initial Seed.
```
