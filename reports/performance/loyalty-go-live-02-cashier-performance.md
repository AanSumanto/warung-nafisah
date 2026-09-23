# LOYALTY-GO-LIVE-02 — Cashier Performance

**Document ID:** WN-LOYALTY-GO-LIVE-02-PERF  
**Date:** 2026-09-09

## Status

**Live staging latency samples:** **BLOCKED_MANUAL** (no confirmed staging; no mutation).

No SLA invented.

## Planned measurements (operator on staging POS)

| Flow | How to measure | Record |
|------|----------------|--------|
| A. Nonmember pay | Stopwatch or network timing from Pay click → success | approx ms |
| B. Member earn pay | Same with member attached | approx ms |
| C. Member redeem+earn pay | Same with reward intent | approx ms |

Capture 3–5 samples each; note median / range. Wi‑Fi quality matters.

## Classification guide

| Observation | Class |
|-------------|-------|
| Loyalty adds negligible delay vs nonmember | Acceptable |
| Noticeable but usable | P2 / investigate queries |
| Cashier considers flow unusable | **P1** |

## Automated / design notes (not live timing)

- Loyalty earn/redeem inside pay UoW (Mongo) — covered by integration tests, not latency SLA.
- Owner analytics not on cashier hot path.
- Public portal rate limits should not block POS if separate routes.

## Watch if slow

1. WriteConflict / 409 rates  
2. Extra menu/reward lookups  
3. Network FE↔API  

## Verdict

Performance track **open**. Does not alone set GO_LIVE status without staging samples; absence is **not** automatic P0.
