# Database Bootstrap Hotfix — Test Results

**Date:** 2026-07-13

---

## New tests

| Test | File | Result |
|------|------|--------|
| Bootstrap installs once, skips on restart, preserves menu edits | `database-bootstrap.test.ts` | PASS |

## Regression

| Suite | Result |
|-------|--------|
| POS MVP integration (`pos-mvp.test.ts`) | PASS |
| Full backend test suite | PASS |

## Scenarios covered

1. **First startup** — 13 menus + 2 dev users + bootstrap record created
2. **Second startup** — seed skipped, `installedAt` unchanged
3. **Menu edit survival** — `LL001` price/name change preserved
4. **Custom menu survival** — `CUSTOM001` not deleted on restart

## Commands

```bash
cd backend
npm test
```
