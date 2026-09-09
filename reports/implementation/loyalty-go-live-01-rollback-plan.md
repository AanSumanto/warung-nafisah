# LOYALTY-GO-LIVE-01 — Rollback Plan

**Document ID:** WN-LOYALTY-GO-LIVE-01-RB  
**Date:** 2026-09-09  
**Rule:** Document only — do not perform production rollback in this sprint.

## Rollback principle

Rollback does **not** mean:

- delete loyalty ledger
- reset customer points
- delete members
- rewrite orders

Rollback **does** mean:

- disable new loyalty operations via feature gates / program flag
- preserve historical state
- investigate
- deploy prior application release if code defect

Permanent business events remain.

## Incident kill switch (validated against code)

Prefer stopping **mutations** first, keep sales alive.

| Order | Action | Effect |
|-------|--------|--------|
| 1 | `LOYALTY_REDEMPTION_ENABLED=false` | Stop redeem; no free reward path via cashier |
| 2 | `LOYALTY_POS_UI_ENABLED=false` | Hide member UI; cashiers use nonmember path |
| 3 | Owner set `NAFISAH_REWARDS.enabled=false` | New earn skipped on pay (non-fatal); existing points retained |
| 4 | `LOYALTY_RECEIPT_QR_ENABLED=false` | Stop printing portal QR / URL |
| 5 | `LOYALTY_ADMIN_ADJUSTMENT_ENABLED=false` | Stop MANUAL_ADJUSTMENT |

Reload/restart backend after env changes (`pm2 reload warung-nafisah-api` or equivalent). Program disable via owner API does not require env restart.

**Do not clear ledger. Do not delete data.**

## Application / deploy rollback (reference strategy)

| Layer | Mechanism |
|-------|-----------|
| Backend | Redeploy previous git tag/commit or release artifact; `pm2 restart` / `reload` using `ecosystem.config.cjs` |
| Frontend (Vercel if used) | Vercel rollback to prior deployment |
| Feature gates | Independent of code rollback — can disable loyalty without redeploying old FE if gates are env/DB |

Record the **previous known-good** git SHA / image / Vercel deployment URL **before** any future activation (operator checklist).

## When to disable which gate

| Symptom | Disable |
|---------|---------|
| Double redeem / free reward | Redemption + investigate |
| Cashier blocked by member UI | POS UI |
| Double earn / ledger mismatch | Program enabled=false + POS UI |
| Portal/QR privacy or print failure | Receipt QR |
| Bad manual adjustments | Admin adjustment |
| Payment rollbacks tied to loyalty | Program + redemption; consider code rollback |

## First-day reconciliation trigger

Any unexplained mismatch among:

- member paid orders
- EARN_SALE count
- REDEEM_REWARD count
- customer balances vs ledger sum
- manual adjustments
- dashboard totals

→ disable the affected mutation gate immediately, preserve data, escalate.

## Observability checklist (existing logs)

Monitor: earn failures, redemption failures, idempotency conflicts, WriteConflict/409, member lookup failures, portal 404/429, payment rollback related to loyalty, negative balance count, ledger reconciliation mismatch, printing errors.
