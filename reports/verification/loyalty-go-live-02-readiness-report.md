# LOYALTY-GO-LIVE-02 — Readiness Report

**Document ID:** WN-LOYALTY-GO-LIVE-02-VER  
**Date:** 2026-09-09  
**Mode:** Operational verification / evidence closure (no production deploy, no production gate enable)

## Final status

| Key | Value |
|-----|-------|
| **LOYALTY_GO_LIVE_02_STATUS** | **NOT_READY** |
| **LOYALTY_CORE_GO_LIVE_READINESS** | **NOT_READY** |
| **LOYALTY_RECEIPT_QR_GO_LIVE_READINESS** | **NOT_READY** |
| **PHYSICAL_BP_ECO58_QR_VERIFICATION** | **PENDING** |
| **TRUST_PROXY_STATUS** | **UNVERIFIED** |
| **NGINX_MEMBER_TOKEN_LOGGING** | **UNVERIFIED** |
| **PRODUCTION_MENU_PRECHECK** | **BLOCKED_MANUAL** |
| **STAGING_UAT** | **BLOCKED_MANUAL** |

## Why NOT_READY (this sprint)

1. **No isolated staging identity confirmed.** Agent-local `backend/.env` is `NODE_ENV=development` + CORS localhost, but Mongo classifies as **Atlas remote** with DB name `warung_nafisah` (production-like). Per safety rule: **STOP all staging mutations** when identity is ambiguous.
2. **No VPS/Nginx access** from this agent → trust proxy hop count and access-log token exposure remain **UNVERIFIED**.
3. **No physical BP-ECO58** attached → QR hardware **PENDING**.
4. **Production menu / gates / installer dry-run** not executed against a confirmed production target from this agent (read-only ops require owner/operator).

Automated regression remains green and does **not** substitute for staging UAT.

## Environment discovery (non-secret)

| Area | Finding |
|------|---------|
| Frontend deploy (docs) | Vercel (`warung-nafisah.vercel.app` / architecture also cites `app.warungnafisah.id`) |
| Backend deploy (docs) | Nevacloud / VPS + PM2; architecture cites `api.warungnafisah.id` → Nginx → Express |
| Staging URLs in repo | **None dedicated** — no `staging.*` host documented |
| Agent local Mongo | Atlas remote, DB `warung_nafisah` — **ambiguous vs production** |
| Agent local Redis | Managed remote |
| Agent loyalty gates | Unset → defaults **false** |
| Nginx config in repo | **Absent** (historical docker nginx removed; no live conf checked in) |
| PM2 repo config | `instances: 1`, `exec_mode: fork` — **live match UNVERIFIED** |

## Safety decision

| Question | Answer |
|----------|--------|
| Is agent DB confirmed staging? | **NO** |
| May agent enable loyalty / create UAT member / pay / adjust? | **NO** |
| May agent run production installer (write)? | **NO** |
| May agent claim staging UAT PASS from unit tests? | **NO** |

## Locked decisions (unchanged)

| Key | Value |
|-----|-------|
| POINT_EXPIRY_DECISION | OPEN |
| V1_RUNTIME_EXPIRY | NONE |
| REFUND_AFTER_REDEEM_DECISION | RESOLVED |
| NEGATIVE_BALANCE_POLICY | ALLOWED |
| CLAIM_UX | CASHIER_CONTROLLED_NO_CLAIM_CODE |
| OPERATIONAL_PAID_REFUND | NOT_AVAILABLE |
| SOFTWARE_QR_VERIFICATION | PASS (prior) |

## Automated regression (this sprint)

| Suite | Result |
|-------|--------|
| Backend tests | **285 PASS** |
| Frontend tests | **48 PASS** |
| Backend `tsc` build | PASS |
| Frontend Next build | PASS |

## Path to READY

See operator checklists in:

- `loyalty-go-live-02-uat-report.md`
- `loyalty-go-live-02-proxy-logging-security.md`
- `loyalty-go-live-02-production-precheck.md`
- `loyalty-go-live-02-bp-eco58-physical-test.md`

After isolated staging UAT PASS + trust-proxy/logging acceptable + menu precheck PASS, core may become READY with QR still NOT_READY if physical PENDING and QR gate stays OFF.

**Do not start Prompt 32 production activation until CORE READY.**
