# Production startup master data testing

Date: 2026-09-06. No new dependencies, production environment changes or live DB
operations. Commands below run from backend unless stated otherwise.

## Final results

- `node ../node_modules/vitest/vitest.mjs run --maxWorkers 1 --minWorkers 1`:
  22 files, 117 tests passed, exit 0 (23.94 seconds).
- Bootstrap suite: 7 tests passed. Covers all menu preservation requirements
  through whole-document comparison, production-mode initialization, repeated
  boots, concurrency, absent baselines, error handling and index preservation.
- Existing POS API suite: 12 passed, covering authentication/password handling,
  menu list/create/update, create order, items, payment, receipt-facing monetary
  fields and order numbers, business events, shifts, dashboard and RBAC.
- Existing persistence, event platform, health, CORS and remaining backend suites
  passed in the full run.
- `node ../node_modules/typescript/bin/tsc -p tsconfig.json --ignoreDeprecations 6.0`:
  exit 0, backend build emitted locally. Same options with --noEmit also passed.
- Backend ESLint on all six changed/new TypeScript files: exit 0, no diagnostics.
- `git diff --check`: passed.

## Failures and limitations retained

Initial sandbox Vitest invocation failed before test execution: Windows
uv_os_get_passwd ENOMEM from tsx. Retried with approved execution outside the
sandbox and one worker, using only isolated test databases.

First full run: 116 passed, 1 failed. The new production-mode fixture inherited
localhost CORS from test setup, correctly rejected by existing validation.
Fixed only the fixture with vi.stubEnv('CORS_ORIGINS', 'https://pos.example.test');
cleanup restores environment/cache. Focused rerun passed 7/7, then final full run
passed 117/117. Production CORS and environment files are untouched.

Plain `tsc -p tsconfig.json --noEmit` fails TS5101 because installed TypeScript 6
deprecates existing baseUrl. The CLI-only ignoreDeprecations override passes;
package files, lockfile and tsconfig were not changed. Verify the normal build
under the project's intended installed compiler before deployment.

Root ESLint invocation ignored backend files; rerunning from backend loaded its
actual config and passed. No ignored-file result is counted as lint proof.

Supplemental frontend command:
`node ../node_modules/vitest/vitest.mjs run tests/printing/printing.test.ts --maxWorkers 1 --minWorkers 1`
fails collection at line 237: navigator is not defined. A --pool forks retry
has the same result. Zero printing tests ran; this is not reported as passing.
Existing frontend configuration selects Node, while that suite expects navigator.
Frontend files were not modified. Backend receipt-facing contract assertions pass,
but printer rendering/hardware regression remains unverified by this run.

No tests touched production MongoDB. New startup tests mock only Redis and queue
setup, keeping Mongo connection, index creation and bootstrap real. Tests with
database deletes use the memory-server connection override established beforeEach
operations. No PM2 process, live server or deployment was started.
