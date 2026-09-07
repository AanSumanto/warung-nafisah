# Production startup master data verification

Date: 2026-09-06. Status: PASS_WITH_GAPS.

The hotfix has been verified locally; no production deployment or restart was
performed. Evidence is in
`backend/tests/integration/infrastructure/database-bootstrap.test.ts`.

1. Existing records: insert raw operator records with different IDs for MNM003,
   ADD001 and PKT001, then compare entire BSON-derived documents after each of
   three calls to the real bootstrapInfrastructure entry. This includes name,
   price, category, status, type, bundle, sellingTime, timestamps and unknown
   HPP/operational fields. All values remain equal. HPP is not a current typed
   MenuDocument field; the raw fixture verifies unknown fields also survive.
2. Initialization: a missing marker allows insertion of missing baseline menus;
   existing kodeMenu records win even with different _id values. Count is 13.
   Production default-user insertion is skipped. An existing marker prevents
   restoration of intentionally removed baseline menus.
3. Concurrency: two full startup entries execute simultaneously against the
   isolated replica set. Exactly 13 menus, 2 test users and 1 marker exist.
   A second concurrent pair leaves menu snapshots and marker unchanged.
4. Error handling: forced duplicate-key errors succeed only with a verified
   matching business key. Missing-key and non-duplicate failures propagate.
5. Technical startup: extra operator index survives initialization. Startup uses
   createIndexes, not syncIndexes; no drop/delete/replacement was introduced.
6. Static search: no applyMenuCatalogPatches, MENU_CATALOG_PATCHES or syncIndexes
   remains in backend/src. The only seeding update is `$setOnInsert` in the helper.
7. Regression: existing authentication, menu API, create/update/pay, order number,
   paidAmount/changeAmount and permanent event assertions pass in POS API tests.

Test databases are temporary MongoMemoryReplSet instances selected explicitly
by the existing test connection override. Fixture deletes never target live DBs.
Redis and placeholder queue are mocked in the startup safety test; therefore
this proves the real Mongo bootstrap sequence, not a VPS/Redis/PM2 smoke test.

Acceptance: existing menu authority, safe initialization, no destructive operation,
unchanged POS flow, repeated startup and reports are satisfied. Backend tests
pass. Supplemental printing suite cannot collect because navigator is undefined;
normal local build has a pre-existing TypeScript deprecation error (override
build passes). These validation gaps prevent an unqualified PASS.

Deployment handoff: use the normal reviewed code deployment process. Do not run
any migration or seed command. Current production values remain authoritative.
If rolling back code, the old mutation risk returns; no DB rollback is appropriate.
