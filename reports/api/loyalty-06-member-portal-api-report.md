# LOYALTY-06 — API Report

**Document ID:** WN-LOYALTY-06-API  
**Date:** 2026-09-07

## Endpoint

`GET /api/v1/public/rewards/member/:token`

- Auth: none (opaque token)
- Rate limit: 60 / minute / IP (`PUBLIC_429`)
- Headers: `Cache-Control: no-store`, `Referrer-Policy: no-referrer`

### Success (program active)

`PublicMemberRewardsDTO` with `programStatus: "ACTIVE"`, member (masked), points.current, progress, rewards[], recentActivity[], redemptionHint.

### Success (program disabled)

`programStatus: "UNAVAILABLE"`, message, optional member — no points/rewards/CTA.

### Errors

| Case | Status | Message |
|------|--------|---------|
| Bad / unknown / blocked token | 404 | Member tidak ditemukan |
| Over limit | 429 | Terlalu banyak permintaan… |
| Non-GET | 405 | Metode tidak diizinkan |

## NO PUBLIC MUTATION API

No POST/PUT/PATCH/DELETE redeem, claim, adjust, or token search.
