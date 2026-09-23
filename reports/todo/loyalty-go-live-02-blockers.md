# LOYALTY-GO-LIVE-02 — Blockers

**Document ID:** WN-LOYALTY-GO-LIVE-02-TODO  
**Date:** 2026-09-09  
**LOYALTY_GO_LIVE_02_STATUS:** NOT_READY

## P0

| ID | Item | Notes |
|----|------|-------|
| GL2-P0-01 | No confirmed isolated staging for mutation UAT | Agent stopped to protect possible production Atlas `warung_nafisah` |
| GL2-P0-02 | Staging UAT matrix not executed | All UAT-01…21 BLOCKED_MANUAL |

*(No ledger corruption / double-points observed — those failure modes were not exercised live.)*

## P1

| ID | Item | Notes |
|----|------|-------|
| GL2-P1-01 | TRUST_PROXY_STATUS = UNVERIFIED | Live hop count unknown |
| GL2-P1-02 | NGINX_MEMBER_TOKEN_LOGGING = UNVERIFIED | Likely TOKEN_LOGGED until proven SAFE |
| GL2-P1-03 | PRODUCTION_MENU_PRECHECK = BLOCKED_MANUAL | Must re-verify before activation day |
| GL2-P1-04 | Live PM2 instance count UNVERIFIED | Multi-instance → rate-limit P1 |
| GL2-P1-QR | PHYSICAL_BP_ECO58_QR_VERIFICATION = PENDING | Blocks **QR readiness only** |

## P2 / accepted risks (carry-forward)

| ID | Item |
|----|------|
| GL2-P2-01 | OPERATIONAL_PAID_REFUND = NOT_AVAILABLE |
| GL2-P2-02 | POINT_EXPIRY OPEN / V1 none |
| GL2-P2-03 | Draft cancel unwired |
| GL2-P2-04 | In-memory public limiter OK **only if** live PM2 remains single fork |
| GL2-P2-05 | QR disabled while physical PENDING (acceptable for core phone launch later) |

## Exit criteria (re-score)

### Core READY

- [ ] Staging identity verified  
- [ ] UAT-01…21 actual PASS (not unit tests)  
- [ ] Reconciliation MATCH  
- [ ] Trust proxy verified acceptable  
- [ ] Production menu precheck PASS  
- [ ] Production gates still OFF  
- [ ] No P0/P1 core blockers  
- [ ] Regression green  

### QR READY

- [ ] Physical P01–P06 PASS  
- [ ] Token logging acceptable for QR routes  
- [ ] HTTPS portal destination  

## Recommendation for Prompt 32

**Do not start Prompt 32 production activation.**  
First: provision/confirm staging → execute UAT matrix → close proxy/logging + menu precheck → optional physical QR.  
Then re-open readiness scoring.
