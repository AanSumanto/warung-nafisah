# LOYALTY-GO-LIVE-01 — Blockers and Backlog

**Document ID:** WN-LOYALTY-GO-LIVE-01-TODO  
**Date:** 2026-09-09  
**LOYALTY_GO_LIVE_01_STATUS:** NOT_READY

## P0 blockers (production activation)

None proven in automated suites. **Operational P0 until cleared:**

| ID | Blocker | Notes |
|----|---------|-------|
| GL-P0-01 | Staging UAT matrix not executed | Mandatory operational proof missing |
| GL-P0-02 | (Conditional) Any live UAT finding of double pay/points, free reward, accidental negative, PII leak | None observed this session — watch during staging |

## P1 blockers

| ID | Item | Notes |
|----|------|-------|
| GL-P1-01 | PHYSICAL_BP_ECO58_QR_VERIFICATION = PENDING | Blocks **QR gate only**; core phone loyalty may proceed with QR off |
| GL-P1-02 | Trust proxy hop count unverified vs live Nginx/CDN | IP rate-limit reliability |
| GL-P1-03 | Reverse-proxy access logs may retain full member token URI | App logs redact; proxy unknown |
| GL-P1-04 | Live production menu key read-only precheck not run this sprint | Required before activation day |

## P2 non-blockers

| ID | Item |
|----|------|
| GL-P2-01 | Minor receipt/portal wording polish |
| GL-P2-02 | Analytics presentation convenience |
| GL-P2-03 | Draft `Order.cancel()` domain-only / unwired — abandoned drafts appear handled; monitor if operational confusion |

## Accepted risks (if later GO_LIVE_READY_WITH_ACCEPTED_RISKS)

| Risk | Mitigation |
|------|------------|
| In-memory public rate limit | Accept while PM2 `instances: 1` fork; Redis limiter before scale-out |
| No operational paid refund | Owner SOP states ERP cannot refund; platform backlog |
| Point expiry OPEN / none | No customer wording of expiry |
| Draft cancel unwired | Non-blocking if drafts safe |
| Program enable API unlocked | Still requires deliberate owner action + env gates |

## Platform backlog (do not implement in GO-LIVE-01)

- Operational paid refund / void subsystem
- Wire draft order cancel if ops requires
- Point expiry policy + prospective scheduler (business decision first)
- Redis-backed public rate limiter for multi-instance
- Nginx token URI redaction
- WhatsApp/marketing consent product (explicitly out of scope)
- Referral / tier / birthday / claim code / member login / physical card

## First-day monitoring plan (after future activation)

| Checkpoint | Verify |
|------------|--------|
| First 10 transactions | pay + receipt OK |
| First 25 member | earn + balance |
| First redemption | redeem+earn + receipt |
| First 50 member | dashboard sanity |
| End of day | orders vs EARN/REDEEM vs ledger sum vs balances |

Mismatch → kill-switch affected gate (see rollback plan).

## Exit criteria to re-score READY

1. Staging UAT-01…25 PASS (manual evidence)
2. Physical UAT-P\* PASS **or** explicit decision to launch with QR gate OFF
3. Trust-proxy + menu precheck + installer dry-run documented for target env
4. Regression still green
