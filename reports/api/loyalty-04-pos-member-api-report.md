# LOYALTY-04 — API Report

**Document ID:** WN-LOYALTY-04-API  
**Date:** 2026-09-07

## New / extended endpoints

| Method | Path | Notes |
|--------|------|-------|
| PUT | `/orders/:orderId/customer` | `{ customerId }` draft only |
| DELETE | `/orders/:orderId/customer` | draft only |
| POST | `/orders/:orderId/pay` | response adds optional `loyalty` |
| GET | `/loyalty/pos-ui` | `{ memberUiEnabled }` technical gate |

Pay response remains backward compatible: order fields at root + `loyalty` object.

### LoyaltyPayResult (authoritative)

```
memberAttached, awarded, reason?, customerId?, phoneMasked?, name?,
pointsEarned?, balanceAfter?, eligiblePaidAmount?, programVersion?,
pointEarnRate?, ledgerEntryId?, alreadyProcessed?
```

Reasons: `NO_MEMBER` | `PROGRAM_DISABLED` | `CUSTOMER_BLOCKED` | `CUSTOMER_NOT_FOUND`

No public earn API. Reuses `GET/POST /customers` for lookup/register.
