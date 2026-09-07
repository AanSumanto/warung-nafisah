# LOYALTY-02 — API Report

**Document ID:** WN-LOYALTY-02-API  
**Date:** 2026-09-07

| Method | Path | Roles | Notes |
|--------|------|-------|-------|
| GET | `/api/v1/loyalty/program` | owner, kasir | 404 if not installed |
| PUT | `/api/v1/loyalty/program` | owner | rate/name; `enabled:true` blocked |
| GET | `/api/v1/loyalty/rewards` | owner, kasir | sorted by sortOrder |
| GET | `/api/v1/loyalty/rewards/:rewardCode` | owner, kasir | |
| POST | `/api/v1/loyalty/rewards` | owner | validates menu exists |
| PUT | `/api/v1/loyalty/rewards/:rewardCode` | owner | deactivate via status |

No public/unauthenticated endpoints. No delete endpoint (use inactive).
