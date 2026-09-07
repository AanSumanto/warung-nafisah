# Prompt 28C — Deployment verification

Date: 2026-09-06

PROMPT_28C_STATUS = PASS_WITH_GAPS

## Verified local evidence

Local HEAD: `3c12a999a4f8182311c6c85fc5af2e02a4ede50e`.
This is NOT a deployed hotfix commit. Prompt 28B changes remain uncommitted,
including the new insertBootstrapRecord.ts helper. Nothing is staged.
All five tracked file diffs and the new helper were reviewed. They cover seed
removal, insert-only initialization, additive indexes and safety tests only.
Untracked reports/loyalty belong to the earlier audit: exclude them from this
hotfix release. Include only the six 28B TypeScript files and relevant reports
when preparing the reviewed release; do not use an indiscriminate git add.

Package manifests, lockfile and environment files have no tracked modifications.
No payment, receipt, inventory or cashflow changes are present. Diff whitespace
check passed. Search of backend/src found no applyMenuCatalogPatches,
MENU_CATALOG_PATCHES or syncIndexes. Startup uses $setOnInsert for records only;
no existing menu update, replacement, delete or reset remains.

Tests are unchanged since the immediately preceding verified run: 117/117
backend tests across 22 files passed, including seven bootstrap tests and twelve
POS API tests. No redundant rerun was necessary for this documentation-only turn.
See PRODUCTION_STARTUP_MASTER_DATA_TESTING.md for the run and printing test gap.

## Build correction and production mechanism

`backend/README.md` documents the existing update process:
git pull, npm ci, then npm run deploy:pm2 --workspace=@warung-nafisah/backend.
The package script runs npm run build then npm run pm2:startOrReload.
Build is exactly `tsc -p tsconfig.json`. PM2 uses ecosystem.config.cjs,
process warung-nafisah-api, backend/dist/server.js, one fork instance,
production environment, wait_ready and 30-second listen timeout.

IMPORTANT correction to 28B: the workspace compiler is TypeScript 5.9.3,
both installed in backend/node_modules/typescript and recorded in package-lock.
The root compiler is 6.0.3. Invoking the root compiler reproduces TS5101,
but that is NOT the compiler resolved first by the backend npm script.
The backend .bin/tsc.cmd was executed with exactly `-p tsconfig.json`:
exit 0, no overrides, normal emitted build. No configuration change is needed.
The earlier 28B deprecation warning was a wrong-compiler invocation, not evidence
that the backend workspace build fails. Those earlier reports describe their
historical commands; this report supersedes their build-readiness conclusion.

The npm executable itself is unavailable in this local PATH, so the package
wrapper was not executed here; its exact underlying workspace compiler command
was. The actual VPS-installed compiler and full npm deployment must still be
verified on the VPS. No ad-hoc ignoreDeprecations option may be used there.

## Production evidence — not collected

No established VPS connection/SSH configuration or authenticated remote shell is
available in this task. No deployment, restart, production DB connection or
transaction was attempted. Deployed commit, actual live deployment method,
PM2 before/after state, health, menu before/after snapshots, startup logs,
first restart, second restart and POS smoke results are all NOT VERIFIED.
Repository deployment instructions do not establish the live VPS state.

## Operator procedure — pending, not executed

Use the existing deployment account, configured VPS checkout and existing DB
credentials; never paste credentials or complete PM2 environment dumps into a
report. The repository documents /var/www/warung-nafisah; verify the actual
checkout first. Complete the reviewed hotfix commit/push through the normal
release process before pulling it. Record the approved commit separately.

1. Before updating, from the verified checkout:

```bash
git status --short
git rev-parse HEAD
pm2 status warung-nafisah-api
pm2 describe warung-nafisah-api
node --version
npm --version
node backend/node_modules/typescript/bin/tsc --version
```

Record status, PID, uptime and restart counter without copying secrets. Stop on
unexpected checkout changes. Use the confirmed service URL/port for health; do
not assume the example port is the deployed port. Readiness is /api/v1/ready;
liveness is /api/v1/live. /api/v1/health is deliberately disabled in production.

```bash
read -r -p 'Confirmed backend base URL: ' API_BASE
curl --fail --silent --show-error "$API_BASE/api/v1/live"
curl --fail --silent --show-error "$API_BASE/api/v1/ready"
```

2. Capture the menu baseline using an existing authenticated read-only Mongo
shell targeting the confirmed production DB. This is a read query, not a seed
or application bootstrap. Save results in a restricted operator evidence file.
Take ALL menus, including inactive records and all stored fields, so HPP under
any field name, bundle definitions, manual fields and updatedAt are included.

```javascript
EJSON.stringify(db.getCollection('menus').find({}).sort({kodeMenu:1,_id:1}).toArray(), null, 2)
EJSON.stringify(db.getCollection('system_bootstrap').find({}).sort({_id:1}).toArray(), null, 2)
```

Record both as before snapshots. Confirm expected existing bootstrap marker.
If absent, stop for review: normal startup would perform first-install inserts.
Coordinate a window without menu edits; do not alter menu values to test this.

3. Execute the documented update, checking each command exits successfully:

```bash
git pull
git rev-parse HEAD
npm ci
node backend/node_modules/typescript/bin/tsc --version
npm run build --workspace=@warung-nafisah/backend
```

Verify the new HEAD is the approved hotfix commit, not merely the old local HEAD.
If the normal build fails, STOP, status BLOCKED; do not reload, change compiler
options, or deploy a stale dist directory. No seed or migration commands.
After a successful build and baseline, use the existing combined deployment:

```bash
npm run deploy:pm2 --workspace=@warung-nafisah/backend
pm2 status warung-nafisah-api
pm2 logs warung-nafisah-api --lines 200 --nostream
curl --fail --silent --show-error "$API_BASE/api/v1/ready"
```

4. Inspect only logs since the recorded restart time. Search seed, patch,
bootstrap, menu, index, duplicate, Mongo, Redis, error and exception. Expect
Mongo/Redis success, bootstrap skipping initial seed, HTTP started and online
PM2. 'Skipping Initial Seed' is informational, not a seeding operation. A warn
log level may suppress success messages: corroborate readiness and process state,
do not change production logging configuration. Confirm no index conflict,
duplicate-key failure, exception or increasing restart loop. Check status again
after an operationally appropriate observation interval.

5. Repeat the two Mongo queries, save after-first snapshots and compare with
before. With consistent EJSON formatting, use operator-local diff:

```bash
diff -u menus-before.json menus-after-first.json
diff -u bootstrap-before.json bootstrap-after-first.json
```

Both should be unchanged. Any startup-caused difference, including updatedAt,
means BLOCKED; record exact fields and stop. Do not repair data automatically.
Investigate legitimate concurrent operator edits separately rather than assuming
they are startup changes or ignoring the difference.

6. Open the actual production frontend login page and cashier POS using the
operator's existing account. Confirm the menu loads and matches DB values.
Do not create draft/payment/financial test transactions: no existing safe
production transaction procedure was established in this task. Record this
as read-only smoke coverage, backed by local POS integration tests.

7. If operationally safe, perform the required second controlled reload:

```bash
npm run pm2:reload --workspace=@warung-nafisah/backend
pm2 status warung-nafisah-api
pm2 logs warung-nafisah-api --lines 200 --nostream
curl --fail --silent --show-error "$API_BASE/api/v1/ready"
```

Repeat snapshots and compare before against after-second. Confirm unchanged
menu values/timestamps and singleton bootstrap record, healthy dependencies,
stable restart counter after the intentional reload, and operational POS.
If the second reload is deferred, retain PASS_WITH_GAPS. After successful checks,
use the documented pm2 save. Record deployed SHA and all evidence in this report.

## Rollback and outstanding gates

Rollback code only. Never restore seed values or execute database rollback.
Do not restart a reverted release containing catalog patches until those calls
are disabled. No rollback was performed.

Remaining gates: commit/publish the scoped hotfix, verify VPS build and deployed
SHA, collect both restart comparisons, service/log evidence and read-only POS
smoke evidence. Supplemental printing tests still have their pre-existing
navigator collection failure. PASS cannot be claimed without VPS evidence.
No loyalty work was started.
