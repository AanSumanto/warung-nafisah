# System Bootstrap Collection

**Document ID:** WN-DB-004  
**Version:** 1.0.0  
**Date:** 2026-07-13

---

## Purpose

Tracks whether the database has completed its one-time initial data installation. Prevents seeders from running on every application restart.

## Collection: `system_bootstrap`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | string | yes | Singleton key: `system` |
| `version` | string | yes | Bootstrap mechanism version (e.g. `1.0.0`) |
| `installedAt` | Date | yes | UTC timestamp of first install |
| `seedVersion` | string | yes | Initial catalog version (e.g. `pos-v1`) |

## Indexes

- Primary key: `_id`

## Lifecycle

| Event | Action |
|-------|--------|
| Application start, no document | Run `installInitialData()`, create record |
| Application start, document exists | Skip all seeders |
| Backend restart | No change to bootstrap record or seeded data |

## Related collections (initial seed targets)

| Collection | Seed behavior |
|------------|---------------|
| `menus` | Upsert by `kodeMenu`, `$setOnInsert` only — first bootstrap |
| `users` | Upsert by `email`, `$setOnInsert` only — first bootstrap (dev/test only) |

## Implementation

- Model: `backend/src/infrastructure/database/bootstrap/SystemBootstrapDocument.ts`
- Runner: `backend/src/infrastructure/database/bootstrap/runDatabaseBootstrap.ts`
- Constants: `backend/src/infrastructure/database/bootstrap/bootstrapConstants.ts`

## Production notes

- Do **not** delete `system_bootstrap` in production unless intentionally re-bootstrapping a fresh database
- Bumping `SEED_VERSION` does **not** auto-re-seed; bootstrap gate is binary (exists / not exists)
- Future catalog migrations should use a dedicated migration runner, not startup seed
