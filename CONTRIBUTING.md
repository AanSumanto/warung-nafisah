# Contributing to Warung Nafisah ERP

Thank you for contributing. This project follows enterprise conventions from Phase 0.5 Architecture Freeze.

## Before You Start

1. Read `reports/architecture/00-phase0.5-freeze-report.md`
2. Read `reports/architecture/21-folder-structure-final.md`
3. Check current phase in `reports/README.md` — do not implement out-of-phase features

## Development Setup

```bash
nvm use          # Node 20
npm install
npm run verify:repo
```

## Branch Strategy

| Branch      | Purpose          |
| ----------- | ---------------- |
| `main`      | Production-ready |
| `develop`   | Integration      |
| `feature/*` | New work         |
| `fix/*`     | Bug fixes        |

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `build`, `perf`, `revert`

**Examples:**

```
chore(repo): add eslint flat config
docs(reports): update phase 1.1 verification
feat(backend): add health check endpoint   # Phase 1.2+
```

Commitlint runs via Husky on `commit-msg`.

## Pre-commit

Husky runs `lint-staged` which applies Prettier to staged files.

## Code Quality Rules

- **Clean Architecture** — domain must not import infrastructure or presentation
- **No business logic** until the approved phase allows it
- **No direct dashboard reads** from transactional collections
- **Every business action** must emit a domain event (when business modules exist)
- Match existing naming and folder conventions

## Pull Requests

1. Branch from `develop`
2. Run `npm run verify:repo` locally
3. Update relevant reports under `reports/`
4. Add changelog entry in `reports/changelog/CHANGELOG.md`
5. Request review — architecture changes need ARB sign-off

## Phase Gates

| Phase | Allowed                                         |
| ----- | ----------------------------------------------- |
| 1.1   | Repository structure, tooling, DX only          |
| 1.2   | Foundation scaffold (core, config, health APIs) |
| 2+    | Auth, hierarchy, business modules               |

Do not skip phases without explicit approval.

## Questions

Refer to `reports/todo/` for upcoming work items.
