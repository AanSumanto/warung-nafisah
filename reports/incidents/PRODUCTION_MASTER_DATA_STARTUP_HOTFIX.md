# Production master data startup hotfix

## Pre-change analysis — 2026-09-06

Startup: `src/server.ts` (and `src/index.ts` lazy entry) ->
`bootstrapInfrastructure` -> Mongo connection -> `initializePosInfrastructure`
-> `runDatabaseBootstrap` -> Redis connection -> placeholder queue -> HTTP app.
Paths here are relative to `backend/`.

Unsafe: `runDatabaseBootstrap.ts` called `applyMenuCatalogPatches` before checking
the bootstrap marker. `installInitialData` called it again on first installation.
In `src/infrastructure/auth/seedPosData.ts`, MNM003 and ADD001 received
`kodeKategori=RINGAN`, `namaKategori=Makanan Ringan`, and a new `updatedAt`;
ADD001 also received `namaMenu=Pempek`. These are the complete patch targets.
Price, status/availability, HPP and bundle definitions were not directly patched.
This violates the existing-data authority rule and is a production data blocker.

Insert-only: initial menus use `kodeMenu` (unique), users use email (unique)
with `$setOnInsert`; production skips default users. Existing schema timestamps
are explicit, not automatic update middleware. The singleton bootstrap marker
used unconditional create and could fail during concurrent first startup.

Technical: Mongo/event/POS collection and index initialization, Redis connection,
and BullMQ placeholder setup. Existing `syncIndexes` can remove extra indexes;
replace startup calls with additive `createIndexes` to preserve operator indexes.
No application business worker is started by the placeholder queue.

Repository-wide mutation search also found request-driven AuthService updates,
POS payment item writes, order-number allocation, repository saves and event
processing writes. These are not invoked by normal startup and remain unchanged.
MongoIndexManager.dropIndex is an explicit utility, not a startup call.

Decision before edits: remove the historical patch implementation and both calls.
No migration or catalog correction is warranted: current database values win,
regardless of whether any earlier patch ran. Keep marker-gated insert-only
initialization, handle verified duplicate-key winners, and retain errors for
conflicting identities or other failures. No production database access.

## Implemented outcome

Both patch calls and the historical patch definitions/function were removed.
`insertBootstrapRecord.ts` centralizes `$setOnInsert` for menus, development
users and the technical marker. Error 11000 is accepted only when a follow-up
lookup verifies the requested business key exists. Other failures propagate.
The unique kodeMenu, email and marker _id indexes are unchanged.
An existing marker still skips all initial data; missing records are not
replenished after installation. An interrupted first installation can retry.
Concurrent marker writers preserve the first installedAt/version.

Changed files: `src/infrastructure/auth/seedPosData.ts`,
`src/infrastructure/database/bootstrap/runDatabaseBootstrap.ts`,
new `src/infrastructure/database/bootstrap/insertBootstrapRecord.ts`,
`src/infrastructure/pos/PosModule.ts`,
`src/infrastructure/events/EventPlatformFactory.ts`, and
`tests/integration/infrastructure/database-bootstrap.test.ts`.
Four reports accompany these changes; prior untracked loyalty reports were preserved.

Validation: all 117 backend tests pass across 22 files, including 7 bootstrap
and 12 POS API tests. Build passes with the local TypeScript 6 deprecation
override; changed backend files pass ESLint. See the testing report for initial
failures and the existing printing test environment gap.

Rollback is code-only. Reverting this patch restores the unsafe startup writes;
do not restart a reverted release without separately disabling the patch calls.
Never restore catalog values from seeds. No database rollback or migration is
needed because this work did not access or modify production data.

Remaining risks: deployment is not performed; already overwritten historical
values cannot be recovered by this fix. Existing duplicate business keys or
conflicting index definitions will fail index creation and require a separate
review, not automatic cleanup. Additive index creation retains stale indexes
until explicitly reviewed. Redis connectivity/PM2 startup on the VPS and real
printer hardware were not exercised. Status: PASS_WITH_GAPS (validation tooling).
