# LOYALTY-GO-LIVE-01 — Readiness Report

**Document ID:** WN-LOYALTY-GO-LIVE-01-VER  
**Date:** 2026-09-09  
**Mode:** Audit + operational readiness (no production deploy / no production gate enable)

## Final readiness states

| Key | Value |
|-----|-------|
| **LOYALTY_GO_LIVE_01_STATUS** | **NOT_READY** |
| **LOYALTY_CORE_GO_LIVE_READINESS** | **NOT_READY** |
| **LOYALTY_RECEIPT_QR_GO_LIVE_READINESS** | **NOT_READY** |
| **PHYSICAL_BP_ECO58_QR_VERIFICATION** | **PENDING** |

### Why NOT_READY

1. **Isolated staging UAT matrix was not executed** in this readiness run (no staging env attached; must not use production).
2. **Physical BP-ECO58 QR verification remains PENDING** (no hardware evidence this session).
3. **Production reverse-proxy hop count** for `trust proxy = 1` is not verified against live Nginx/CDN topology (no nginx config in repo).
4. **Live production menu key precheck** (read-only) was not run against production Mongo in this sprint (by design: no prod mutation / no destructive access).

Software / automated regression is green and activation/rollback/SOP plans are complete. Core phone+cashier loyalty can proceed **after** operator staging UAT PASS; receipt QR remains separately gated.

## Locked business decisions (carry-forward)

| Decision | Status |
|----------|--------|
| POINT_EXPIRY_DECISION | OPEN |
| V1_RUNTIME_EXPIRY | NONE |
| REFUND_AFTER_REDEEM_DECISION | RESOLVED |
| NEGATIVE_BALANCE_POLICY | ALLOWED |
| CLAIM_UX_DECISION | RESOLVED |
| CLAIM_UX | CASHIER_CONTROLLED_NO_CLAIM_CODE |
| OPERATIONAL_PAID_REFUND | NOT_AVAILABLE |
| SOFTWARE_QR_VERIFICATION | PASS (prior LOYALTY-05) |
| PHYSICAL_BP_ECO58_QR_VERIFICATION | PENDING |

## Environment audited (code / repo / deploy docs)

| Area | Finding | Secrets |
|------|---------|---------|
| Frontend | Next.js App Router; portal route `/rewards/member/[token]` dynamic | No secrets printed |
| Backend | Express; PM2 `instances: 1`, `exec_mode: fork` (`ecosystem.config.cjs`) | — |
| Mongo | Used by loyalty customers/ledger/program/rewards | URI redacted |
| Redis | Present in `deployment/`; not used for public member rate limit | Password redacted |
| PUBLIC_APP_URL | Env optional; required only when `LOYALTY_RECEIPT_QR_ENABLED=true`; HTTPS enforced outside localhost | — |
| API URL | Deployed separately from Vercel FE (per prior deploy practice) | — |
| Feature gates | All default **false** in `env.ts` | — |
| Program | `NAFISAH_REWARDS` / DB `enabled` (default installer creates `enabled=false`) | — |
| Menu source | Live `menus` by `menuKode`; reward availability follows menu status | — |
| Printer | RawBT + Blueprint BP-ECO58 profile (software tests PASS; physical PENDING) | — |
| Reverse proxy | **No nginx config in repo**; `deployment/README.md` notes VPS stack TBD | — |
| Trust proxy | `app.set('trust proxy', 1)` | Hop count vs live chain **unverified** |

### Staging vs production mirror

| Item | Staging UAT this run | Production |
|------|----------------------|------------|
| Live UAT execution | **Not attached** | Must remain gates OFF |
| Physical printer | PENDING | Same hardware path expected |
| Rate limiter | In-memory 60/min/IP | Acceptable **only** while PM2 remains single fork instance |
| Program enable API | Unblocked in code (owner PUT) | Must stay disabled until deliberate activation |

## Feature gate matrix (defaults — production must stay OFF)

| Gate | Type | Default | Runtime effect |
|------|------|---------|----------------|
| `NAFISAH_REWARDS.enabled` | DB | `false` (installer) | Earn/redeem require enabled; POS skips earn non-fatally when disabled |
| `LOYALTY_POS_UI_ENABLED` | Env | `false` | Cashier member UI only (FE); attach APIs exist independently |
| `LOYALTY_REDEMPTION_ENABLED` | Env | `false` | Backend rejects redemption |
| `LOYALTY_RECEIPT_QR_ENABLED` | Env | `false` | No portal URL/QR on receipt |
| `LOYALTY_ADMIN_ADJUSTMENT_ENABLED` | Env | `false` | Analytics read OK; MANUAL_ADJUSTMENT blocked |

## Program enable vs POS UI (code-derived)

- `LOYALTY_POS_UI_ENABLED=false` → cashiers do not see member UI; ordinary nonmember sales unaffected.
- Program `enabled=true` while POS UI false: earn only runs if an order already has a member attached via API. Normal nonmember path does not earn.
- Safest sequence: install config → enable program → enable POS UI → observe earn → enable redemption → (QR only after physical PASS) → admin adjustment last.

## Readiness code fix this sprint (not a business feature)

Owner could not previously set `enabled: true` (stale activation block). Unblocked for phased go-live SOP:

- `LoyaltyProgram.updateConfig({ enabled })`
- `LoyaltyProgramService` allow enable/disable
- Installer compatibility no longer requires `enabled===false`

Full regression after fix: **285 / 48 PASS**.

## Automated regression

| Suite | Result |
|-------|--------|
| Backend build | PASS |
| Backend tests | **285 PASS** |
| Frontend build | PASS |
| Frontend tests | **48 PASS** |
| Printing / loyalty / portal / admin suites | Covered in above |

## Separate QR readiness

If core staging UAT later PASSes while physical QR remains PENDING:

- **Acceptable Phase A/B:** program + POS earn (+ redemption) with `LOYALTY_RECEIPT_QR_ENABLED=false`
- **Phase C:** QR only after `PHYSICAL_BP_ECO58_QR_VERIFICATION = PASS`

## Recommendation

1. Provision/attach isolated staging mirroring production topology.
2. Execute full UAT matrix (`loyalty-go-live-01-uat-report.md`).
3. On-site BP-ECO58 physical QR test.
4. Verify live trust-proxy hop count and Nginx access-log token exposure.
5. Read-only production menu key precheck + installer dry-run.
6. Then re-score: expected candidate **GO_LIVE_READY_WITH_ACCEPTED_RISKS** if only known platform gaps remain (no paid refund, no expiry, single-instance rate limit, draft cancel unwired).

**Do not deploy. Do not flip production gates.**
