# Performance Strategy — Architecture Freeze

**Document ID:** WN-PERF-001  
**Version:** 1.0.0 (Phase 0.5)  
**Status:** FROZEN

---

## 1. SLA Targets

| Operation | p50 | p95 | p99 |
|-----------|-----|-----|-----|
| Command (write) | 100ms | 300ms | 500ms |
| Query (read model) | 30ms | 100ms | 200ms |
| Event append | 20ms | 50ms | 100ms |
| Handler processing | 50ms | 200ms | 500ms |
| KDS push latency | — | 500ms | 1s |
| Dashboard load | 500ms | 2s | 3s |
| Daily report | 1s | 3s | 5s |

---

## 2. CQRS Performance Benefits

| Pattern | Benefit |
|---------|---------|
| Read models pre-computed | Dashboard O(1) lookup |
| Event handlers async | Write path not blocked |
| Projection sharding by outletId | Horizontal scale |
| No reporting on transactional | No table locks on orders |

---

## 3. Scaling Strategy

| Stage | Outlets | Architecture |
|-------|---------|--------------|
| 1 | 1-5 | Single MongoDB, Redis, 1 API instance |
| 2 | 5-20 | MongoDB replica set, 2 API instances |
| 3 | 20-100 | Read replicas, projection workers separate |
| 4 | 100+ | Shard `business_events` by businessGroupId |

---

## 4. Caching

| Layer | Technology | TTL |
|-------|------------|-----|
| Read model (API) | Redis (optional) | 30s dashboard |
| POS menu | IndexedDB local | Until sync |
| tenant_settings | In-memory per request | Request scope |
| Event handler registry | App startup | Until restart |

---

## 5. Queue Tuning (BullMQ)

| Queue | Concurrency | Priority |
|-------|-------------|----------|
| `event-handlers-critical` | 10 | Inventory, Ledger |
| `event-handlers-normal` | 5 | Dashboard, Analytics |
| `event-handlers-low` | 2 | AI, Reports |
| `notifications` | 3 | — |
| `integrations` | 2 | — |

---

## 6. MongoDB Optimization

- All queries use indexed fields (see index strategy)
- Projection queries: `projection_dashboard_outlet_today` — single doc read
- Event replay: batched cursor, 1000 events/batch
- Connection pool: min 10, max 50

---

## 7. Load Test Scenarios

| Scenario | Target |
|----------|--------|
| 3 POS × 20 orders/hour | Stable |
| 10 outlets simultaneous | p95 < SLA |
| 100K events replay | < 10 minutes |
| 100 KDS connections | No disconnect |

---

## 8. Monitoring

Metrics → `system_health_metrics` → Owner dashboard.

Alert via `SystemHealthAlert` event when SLA breached.
