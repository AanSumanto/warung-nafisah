# Testing Strategy — Architecture Freeze

**Document ID:** WN-TEST-001  
**Version:** 1.0.0 (Phase 0.5)  
**Status:** FROZEN

---

## 1. Test Pyramid

```
        ┌─────────┐
        │  E2E    │  Few — critical paths
        ├─────────┤
        │  API    │  Command/Query endpoints
        ├─────────┤
        │ Integr. │  Event handlers, repos, sagas
        ├─────────┤
        │  Unit   │  Domain services, value objects
        └─────────┘
```

**Coverage targets:**
| Layer | Target |
|-------|--------|
| Domain | ≥ 90% |
| Application | ≥ 85% |
| Event Handlers | ≥ 85% |
| API | ≥ 75% |
| Overall | ≥ 80% |

---

## 2. Test Types

### Unit Test
| Target | Tools | Examples |
|--------|-------|----------|
| Domain Services | Jest | `OrderDomainService.complete()` |
| Value Objects | Jest | `Money.add()`, rounding |
| Unit Conversion | Jest | kg → gram |
| Document Number | Jest | format, daily reset |
| Event payload validation | Jest + AJV | Schema compliance |

### Integration Test
| Target | Tools | Examples |
|--------|-------|----------|
| Event Store append | Jest + MongoDB Memory Server | Idempotent append |
| Event Handlers | Jest + MongoDB | SaleCompleted → inventory |
| Saga / Process Manager | Jest + MongoDB | Full sale saga |
| Repositories | Jest + MongoDB | FIFO consumption |
| Transaction boundaries | Jest + MongoDB | Rollback on failure |

### Contract Test
| Target | Tools | Examples |
|--------|-------|----------|
| Event schemas | AJV | All 62 events validate |
| API request/response | OpenAPI validator | Command DTOs match `openapi.yaml` |
| Frontend ↔ Backend | openapi-typescript + compile | Generated types match backend spec |
| Cross-repo contract | CI pinned OpenAPI hash | Frontend build fails on drift |

### Repository Test
| Target | Examples |
|--------|----------|
| EventStore | append, duplicate eventId rejected |
| DocumentSequence | concurrent increment |
| Projection repos | upsert idempotency |

### API Test
| Target | Tools | Examples |
|--------|-------|----------|
| Commands | Supertest | POST complete-sale |
| Queries | Supertest | GET dashboard (read model) |
| RBAC | Supertest | 403 for wrong role |
| Error codes | Supertest | ORDER_004 returned |

### Performance Test
| Target | Tools | SLA |
|--------|-------|-----|
| Event append | k6 | < 50ms p95 |
| Query read models | k6 | < 100ms p95 |
| Handler throughput | k6 | 100 events/sec |

### Security Test
| Target | Tools |
|--------|-------|
| OWASP Top 10 | OWASP ZAP |
| JWT tampering | Custom |
| RBAC bypass | API tests |
| Rate limiting | k6 |

### Offline Sync Test
| Target | Tools |
|--------|-------|
| Event queue | Playwright + IndexedDB |
| Sync upload | API integration |
| Conflict resolution | Integration |
| Idempotent replay | Integration |

### Load Test
| Scenario | Target |
|----------|--------|
| 3 concurrent POS | 50 orders/min total |
| KDS WebSocket | 100 concurrent connections |
| Event bus | 500 events/min sustained |

---

## 3. Event Replay Test (Critical)

```
1. Seed 1000 events
2. Build projections
3. Snapshot projection state
4. Truncate projections
5. Replay all events
6. Assert snapshot === replayed state
```

Run in CI on every merge to main.

---

## 4. Financial Reconciliation Test

```
For each SaleCompleted event:
  assert cashflow.in == order.total
  assert inventory.consumed == recipe.quantities
  assert order.hpp == sum(fifo costs)
  assert dashboard.sales += order.total
```

---

## 5. CI Pipeline

```yaml
jobs:
  unit:          # every PR
  integration:   # every PR (MongoDB service)
  contract:      # every PR
  api:           # every PR
  event-replay:  # every PR
  security:      # weekly
  load:          # pre-release
  offline-sync:  # pre-release
```

---

## 6. Test Data

See [02-seed-strategy.md](./02-seed-strategy.md)

---

## 7. Related

- [verification/01-architecture-freeze-checklist.md](../verification/01-architecture-freeze-checklist.md)
