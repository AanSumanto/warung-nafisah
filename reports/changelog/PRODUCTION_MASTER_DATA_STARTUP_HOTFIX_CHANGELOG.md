# Production master data startup hotfix changelog

2026-09-06 — targeted Prompt 28B; PASS_WITH_GAPS.

- `backend/src/infrastructure/auth/seedPosData.ts`: removed historical catalog
  patch data/function and its initial-install invocation. Retained 13 baseline
  definitions and production user-seed exclusion. Initial inserts use helper.
- `backend/src/infrastructure/database/bootstrap/runDatabaseBootstrap.ts`:
  removed pre-marker patch call; marker uses insert-only race-safe helper;
  technical indexes created additively.
- `backend/src/infrastructure/database/bootstrap/insertBootstrapRecord.ts`:
  new shared `$setOnInsert` helper with verified duplicate-key handling.
- `backend/src/infrastructure/pos/PosModule.ts` and
  `backend/src/infrastructure/events/EventPlatformFactory.ts`:
  createIndexes replaces startup syncIndexes, retaining extra existing indexes.
- `backend/tests/integration/infrastructure/database-bootstrap.test.ts`:
  added production preservation, concurrency, deletion persistence, extra-index
  preservation and duplicate/non-duplicate error tests; retained existing test.
- Added incident, verification, testing and changelog reports for this hotfix.

Previously: each boot overwrote category/timestamp on MNM003 and ADD001 plus
ADD001 name. Now: existing records are authoritative, including fields outside
the current schema. Initialization is gated by the existing marker and inserts
only missing business keys. Concurrent initializations preserve the winner.

No historical data repair or manual migration is required. Patch definitions
were removed because enforcing catalog defaults is outside this fix, not because
production values were inspected. No seed values were applied to production.

Validation: 117 backend tests passed; backend build with documented compiler
override and scoped lint passed. Printing test collection and default local
compiler configuration gaps are documented in the testing report.

Rollback: code only; do not restore DB values from seed. Reverting revives unsafe
startup patching, so any reverted release must keep those calls disabled before
restart. No loyalty, payment, receipt, inventory, cashflow, dependency, deployment
or production environment changes are included.
