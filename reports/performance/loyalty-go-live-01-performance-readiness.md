# LOYALTY-GO-LIVE-01 — Performance Readiness

**Document ID:** WN-LOYALTY-GO-LIVE-01-PERF  
**Date:** 2026-09-09

## Goal

Loyalty must not make cashier flow materially unusable. No arbitrary hard SLA without production baseline.

## Flows to compare (staging stopwatch / backend timing)

| Flow | Notes |
|------|-------|
| Nonmember pay | Baseline |
| Member earn pay | Extra loyalty UoW work inside pay |
| Member redeem + earn pay | Redeem then earn in same atomic pay |

**This run:** no live staging latency samples captured → mark **PENDING_OPERATOR**.

## Automated / design notes

- Loyalty earn/redeem run inside POS pay unit-of-work (Mongo transaction patterns covered by integration tests).
- Analytics aggregations are owner-only, not on cashier hot path.
- Public portal is read-only; rate-limited; should not affect cashier if backend remains up.
- Redis exists but is not on the public member rate-limit path today.

## Failure / fallback (performance + availability)

| Scenario | Expected behavior |
|----------|-------------------|
| Nonmember sale | Must not depend on loyalty / portal |
| Member + program disabled | Pay succeeds; earn skipped (non-fatal) |
| Member + active loyalty + fatal ledger invariant | May roll back payment (loyalty is part of atomic economic tx) |
| Redemption failure | Must not grant free reward |
| Lewati Member | Always available in POS UI when member UI shown; nonmember path always available when UI off |

## Bottleneck watchlist (if delay noticed)

1. Mongo write contention / WriteConflict → 409 rates
2. Extra program/reward/menu lookups on pay
3. Redis latency (if later used for limiter)
4. Network path FE → API under weak Wi‑Fi

## First-day monitoring (perf-related)

- Pay latency p50/p95 for member vs nonmember (if logs support)
- Loyalty earn/redeem failure rates
- 409 / WriteConflict rate
- Portal 429 rate (should not affect POS)

## Verdict

**Software:** no known cashier-blocking performance defect in automated suites.  
**Operational:** latency baseline **not measured** on staging hardware → not a P0 by itself; measure during staging UAT before claiming GO_LIVE_READY.
