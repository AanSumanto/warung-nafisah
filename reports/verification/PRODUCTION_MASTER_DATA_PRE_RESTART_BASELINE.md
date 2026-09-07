# Production master data pre-restart baseline

Date: 2026-09-07

PROMPT_28D_STATUS = PASS_WITH_GAPS

## Objective and evidence boundary

Prepare complete read-only snapshots before any hotfix build/reload, for later
comparison after two separately authorized reloads. No production connection,
query, snapshot, build, deployment or restart was performed in this task.
User reports production checkout at hotfix commit
`9ef01e8761d37d535c37c57cc52cf91cfc6ecd6c`, pulled but not built/reloaded.
That production state is user-provided, not independently verified here.
Local HEAD independently matches that commit; this does not verify the VPS.
No established VPS shell or authenticated Mongo session is available to this task.

Production database verified: NO (access unavailable).
Production menu collection verified: NO; repository name verified: menus.
Production bootstrap collection verified: NO; repository name verified: system_bootstrap.
Menu count: NOT OBSERVED. Bootstrap count: NOT OBSERVED.
Expected marker presence: NOT OBSERVED, not evidence of absence.
Snapshot timestamp: NOT CAPTURED. Actual evidence location: NOT CREATED.
No complete menu data or credentials appear in this report.

## Repository findings

- `backend/src/config/env.ts`: dotenv configuration; required variable names
  MONGODB_URI and MONGODB_DB_NAME. No secret values were read or printed.
- `backend/src/infrastructure/database/MongoConnectionManager.ts`: mongoose.connect
  receives URI and explicit dbName from those settings (test overrides exist).
  Do not infer the production DB from a URI default. Do not import this module
  for snapshots: application connection/logging is unnecessary.
- `backend/src/infrastructure/pos/documents/MenuDocument.ts`: collection `menus`,
  string `_id`; unique business key `kodeMenu`; `namaMenu`, `hargaJual`,
  `kodeKategori`, `namaKategori`, `status`, `tipeMenu`, `sellingTime`,
  `bundleItems` with kodeMenu/qty, `createdAt`, `updatedAt`.
- `backend/src/domain/pos/PosTypes.ts`: status values available, sold_out, hidden;
  types ITEM/BUNDLE. No separate availability boolean is declared. HPP is not
  declared in MenuDocument, but may exist as an additional persisted field.
- `backend/src/infrastructure/database/bootstrap/bootstrapConstants.ts` and
  `SystemBootstrapDocument.ts`: collection `system_bootstrap`, expected `_id`
  `system`, fields version, seedVersion, installedAt. Capture every document.
- `runDatabaseBootstrap.ts`: absent marker allows initial insertion. Missing
  marker in an actual production query is BLOCKED; no automatic repair/reload.

These are repository definitions, not a claim that live documents conform.
Do not infer a Model Gandum code from seed definitions or prior planning.
No persisted menu codes were queried, changed or normalized in this task.

## Storage and pre-query safety gate

`git check-ignore production-evidence/menus-before.json` produced no match.
Do not create that directory in this checkout; .gitignore was not modified.
The operator script below uses a private random directory under /var/tmp on
the VPS, outside the documented /var/www checkout, with directory mode 0700
and files mode 0600. Keep the exact path for all three snapshots. Do not upload,
attach, commit or paste the files into reports. Move to approved secure local
storage if /var/tmp retention is unsuitable; no automatic upload or cleanup.

Before running, the operator must independently verify the actual production
cluster and database against the running deployment's configuration, without
printing its URI, credentials, complete .env or PM2 environment. Use the existing
approved authenticated mongosh connection; prefer an existing read-only account.
Do not change users, roles or environment. If such a connection is unavailable,
stop and arrange access; never put credentials into command history or this report.

The operator must replace EXPECTED_DATABASE_NAME below with the confirmed DB
name. An uncertain target means BLOCKED. Selecting a database does not establish
that the connected cluster is correct: verify both before pasting the script.
The only Mongo operations in this script are getName, getCollectionNames and find.
There is no application import, schema registration, index creation, bootstrap,
seed, migration or DB write. File writes are restricted evidence output only.

Use a short agreed window without menu administration or other menu writers.
The two collection reads are sequential, not a cross-collection atomic snapshot;
if edits occur during capture, stop and review timing before accepting evidence.

## Exact operator snapshot procedure (prepared, not executed)

In the existing authenticated mongosh session, paste this block after replacing
the database placeholder. Do not invoke application startup to obtain a session.
The first invocation uses phase before and an empty reuseDirectory. On subsequent,
separately authorized snapshot occasions, change phase to after-first or
after-second and reuseDirectory to the exact directory printed by the first run.
This block does NOT perform or authorize either reload.

```javascript
await (async () => {
  const expectedDatabase = 'EXPECTED_DATABASE_NAME';
  const phase = 'before'; // later: 'after-first' or 'after-second'
  const reuseDirectory = ''; // later: exact private baseline directory
  const fs = require('node:fs');
  const path = require('node:path');
  const crypto = require('node:crypto');
  let stage = 'target verification';
  try {
    if (expectedDatabase === 'EXPECTED_DATABASE_NAME' || !expectedDatabase) {
      throw new Error('Database must be independently confirmed');
    }
    if (!['before', 'after-first', 'after-second'].includes(phase)) {
      throw new Error('Invalid phase');
    }
    if (db.getName() !== expectedDatabase) throw new Error('Wrong database');
    const names = await db.getCollectionNames();
    if (!names.includes('menus') || !names.includes('system_bootstrap')) {
      throw new Error('Required collection missing');
    }
    stage = 'read-only capture';
    const startedAt = new Date().toISOString();
    const menus = await db.getCollection('menus').find({})
      .collation({locale:'simple'}).sort({kodeMenu:1,_id:1}).toArray();
    const markers = await db.getCollection('system_bootstrap').find({})
      .collation({locale:'simple'}).sort({_id:1}).toArray();
    const markerPresent = markers.some(x => x._id === 'system');
    const completedAt = new Date().toISOString();
    // Canonical Extended JSON preserves BSON types. Sort object keys only;
    // retain document order from Mongo and the order of every stored array.
    const sortKeys = value => {
      if (Array.isArray(value)) return value.map(sortKeys);
      if (value !== null && typeof value === 'object') {
        const result = Object.create(null);
        for (const key of Object.keys(value).sort()) result[key] = sortKeys(value[key]);
        return result;
      }
      return value;
    };
    const encode = value => JSON.stringify(sortKeys(JSON.parse(
      EJSON.stringify(value, null, 0, {relaxed:false})
    )), null, 2) + '\n';
    stage = 'restricted evidence storage';
    const root = fs.realpathSync('/var/tmp');
    let dir;
    if (phase === 'before') {
      if (reuseDirectory) throw new Error('Baseline must use a fresh directory');
      dir = fs.mkdtempSync(path.join(root, 'naf-master-baseline-'));
      fs.chmodSync(dir, 0o700);
    } else {
      if (!reuseDirectory) throw new Error('Baseline directory required');
      dir = fs.realpathSync(reuseDirectory);
      if (path.dirname(dir) !== root || !path.basename(dir).startsWith('naf-master-baseline-')) {
        throw new Error('Unexpected evidence directory');
      }
      const stat = fs.statSync(dir);
      if ((stat.mode & 0o077) !== 0 || stat.uid !== process.getuid()) {
        throw new Error('Evidence directory must be private and owned by operator');
      }
      const baseline = JSON.parse(fs.readFileSync(path.join(dir, 'summary-before.json'), 'utf8'));
      if (!baseline.expectedMarkerPresent || baseline.database !== expectedDatabase) {
        throw new Error('Baseline target or marker invalid');
      }
    }
    const outputs = [
      ['menus-' + phase + '.json', encode(menus)],
      ['bootstrap-' + phase + '.json', encode(markers)]
    ];
    const hashes = {};
    for (const [name, content] of outputs) {
      fs.writeFileSync(path.join(dir, name), content, {encoding:'utf8', mode:0o600, flag:'wx'});
      hashes[name] = crypto.createHash('sha256').update(content).digest('hex');
    }
    const summary = {
      database:expectedDatabase, phase, startedAt, completedAt,
      menuCount:menus.length, bootstrapCount:markers.length,
      expectedMarkerPresent:markerPresent, directory:dir, hashes
    };
    fs.writeFileSync(path.join(dir, 'summary-' + phase + '.json'),
      JSON.stringify(summary, null, 2) + '\n', {mode:0o600, flag:'wx'});
    print(JSON.stringify(summary, null, 2));
    print(markerPresent && markers.length === 1 && menus.length > 0
      ? 'CAPTURE COMPLETE: read-only evidence saved; no restart authorized.'
      : 'BLOCKED: marker/count anomaly; review production state before any restart.');
  } catch {
    // Never print driver errors: they may contain connection details.
    print('BLOCKED during ' + stage + '. No accepted baseline; inspect privately.');
  }
})();
```

This script is prepared for mongosh on the Linux VPS, not tested against live
MongoDB here. It requires access to read both collections and collection names.
Permission/read errors stop capture. Exclusive file creation prevents overwriting
a previous snapshot. A partially written capture is not accepted: keep it private
for review and use a fresh baseline directory if a recapture is required. Unknown
fields are preserved, not schema-cast or redacted in the snapshot; operator must
keep files private. Menu and marker schemas contain no credential fields; if
unexpected credentials exist in raw records, do not share that evidence.

## Future deterministic comparison (no restart in this task)

After each separately authorized reload, rerun the same snapshot block with the
matching phase and original directory, in the same verified cluster/database.
Record mongosh version and reuse it across captures. Compare data files only;
summary timestamps naturally differ. Run in the restricted evidence directory:

```bash
cmp --silent menus-before.json menus-after-first.json
cmp --silent bootstrap-before.json bootstrap-after-first.json
cmp --silent menus-before.json menus-after-second.json
cmp --silent bootstrap-before.json bootstrap-after-second.json
```

Record each exit status immediately: 0 equal, 1 different, 2 comparison error.
All four must return 0. Do not treat absent files as equal. SHA-256 values in the
summaries provide an additional integrity check. Whole-document comparison detects
any changed field, timestamp, BSON type, added/removed document or array ordering.
Object field ordering is deliberately normalized; no business field is omitted.
Inspect differences privately; report only necessary observations, not full dumps.
Any startup-caused difference is BLOCKED. Never automatically repair a difference.

## Baseline acceptance and next operational step

Operator must record only: verified DB/collection YES/NO, counts, expected marker
presence, capture time, private filenames/location, and comparison method/results.
Absence of marker system is BLOCKED. Unexpected extra markers, empty menus despite
known existing data, wrong cluster/DB, failed permissions or incomplete snapshots
require review before restart. No count of 13 is assumed from development seeds.

Next: operator verifies the target and runs only the baseline procedure above.
Then supply non-sensitive summary evidence. Wait for explicit authorization for
the production build/reload phase. No npm ci, build, deployment, PM2 operation,
Redis operation, index change, DB mutation or loyalty implementation was executed.
