# LOYALTY-09 — API Report

**Document ID:** WN-LOYALTY-09-API  
**Date:** 2026-09-08

## Owner endpoints

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/v1/admin/loyalty/gates` | adjustment gate flag |
| GET | `/api/v1/admin/loyalty/dashboard?preset=` | today\|7d\|30d\|month\|custom |
| GET | `/api/v1/admin/loyalty/customers/search?q=` | phone/name/publicMemberId |
| GET | `/api/v1/admin/loyalty/customers/:id` | detail |
| GET | `/api/v1/admin/loyalty/customers/:id/ledger` | cursor page |
| POST | `/api/v1/admin/loyalty/customers/:id/verify-balance` | MATCH/MISMATCH |
| POST | `/api/v1/admin/loyalty/customers/:id/adjustments` | MANUAL_ADJUSTMENT |

Auth: Bearer + **owner**. Kasir → 403. Unauthenticated → 401.

## Adjustment body

```json
{
  "pointsDelta": 10,
  "reason": "Koreksi poin",
  "note": "optional",
  "requestId": "client-stable-id"
}
```

Forbidden client fields: `balanceAfter`, `actorUserId`, ledger type override.

## Public

No new public mutation routes.
