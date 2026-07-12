# Non-Functional Requirements

**Project:** Warung Nafisah ERP  
**Document ID:** WN-NFR-001  
**Version:** 1.0.0  
**Status:** Draft — Awaiting Approval

---

## 1. Performance

| ID | Requirement | Target | Measurement |
|----|-------------|--------|-------------|
| NFR-PERF-001 | API response time (read) | < 200ms p95 | APM / load test |
| NFR-PERF-002 | API response time (write/transactions) | < 500ms p95 | APM / load test |
| NFR-PERF-003 | Dashboard initial load | < 3 seconds | Lighthouse / manual |
| NFR-PERF-004 | POS menu render | < 1 second | Manual on tablet |
| NFR-PERF-005 | Daily report generation | < 3 seconds | API benchmark |
| NFR-PERF-006 | Concurrent POS terminals per outlet | ≥ 3 simultaneous | Load test |
| NFR-PERF-007 | Database query with indexes | < 50ms p95 | MongoDB profiler |

### Scalability Targets (100-Outlet Test)

| Metric | Target |
|--------|--------|
| Total orders per day (all outlets) | 10,000 |
| Total inventory SKUs (all outlets) | 50,000 |
| Total users | 500 |
| API throughput | 500 req/sec aggregate |
| MongoDB storage (year 1) | < 50 GB |

---

## 2. Availability & Reliability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-AVAIL-001 | System uptime | 99.5% (excl. planned maintenance) |
| NFR-AVAIL-002 | Planned maintenance window | Max 2 hours/month, off-peak |
| NFR-AVAIL-003 | Database backup frequency | Daily automated + point-in-time |
| NFR-AVAIL-004 | Recovery Time Objective (RTO) | < 4 hours |
| NFR-AVAIL-005 | Recovery Point Objective (RPO) | < 1 hour |
| NFR-AVAIL-006 | Transaction atomicity | MongoDB multi-document ACID sessions |
| NFR-AVAIL-007 | Graceful degradation | Dashboard stale data OK; POS must work |

---

## 3. Security

| ID | Requirement | Detail |
|----|-------------|--------|
| NFR-SEC-001 | Authentication | JWT (HS256 or RS256) |
| NFR-SEC-002 | Password storage | bcrypt, cost factor ≥ 12 |
| NFR-SEC-003 | Token expiry | Access: 15 min; Refresh: 7 days |
| NFR-SEC-004 | Authorization | RBAC middleware on every protected route |
| NFR-SEC-005 | Input validation | Joi/Zod validator on all inputs |
| NFR-SEC-006 | Rate limiting | express-rate-limit: 100 req/min/IP |
| NFR-SEC-007 | HTTP security headers | Helmet.js |
| NFR-SEC-008 | CORS | Whitelist production domains only |
| NFR-SEC-009 | SQL/NoSQL injection | Parameterized queries via Mongoose |
| NFR-SEC-010 | XSS prevention | React auto-escape + CSP headers |
| NFR-SEC-011 | Audit trail | Immutable append-only audit collection |
| NFR-SEC-012 | Secrets management | Environment variables, never in code |
| NFR-SEC-013 | HTTPS | TLS 1.2+ enforced in production |
| NFR-SEC-014 | Investor isolation | Read-only API guard + UI route guard |

---

## 4. Maintainability

| ID | Requirement | Detail |
|----|-------------|--------|
| NFR-MAINT-001 | Architecture | Clean Architecture with clear layer boundaries |
| NFR-MAINT-002 | Code organization | Feature-based folder structure |
| NFR-MAINT-003 | Domain layer purity | No framework dependencies in domain |
| NFR-MAINT-004 | Test coverage | ≥ 80% on domain and service layers |
| NFR-MAINT-005 | API documentation | OpenAPI/Swagger auto-generated |
| NFR-MAINT-006 | Linting | ESLint + Prettier enforced in CI |
| NFR-MAINT-007 | Type safety | TypeScript on frontend; JSDoc or TS on backend |
| NFR-MAINT-008 | Logging | Structured JSON logs (Winston/Pino) |
| NFR-MAINT-009 | Error handling | Centralized error middleware with error codes |

---

## 5. Usability (UI/UX)

| ID | Requirement | Detail |
|----|-------------|--------|
| NFR-UX-001 | Device priority | Tablet-first (10" landscape) |
| NFR-UX-002 | Touch targets | Minimum 48×48px for interactive elements |
| NFR-UX-003 | POS speed | Complete sale in ≤ 4 taps after item selection |
| NFR-UX-004 | Training time | New cashier productive in < 30 minutes |
| NFR-UX-005 | Language | Indonesian UI labels |
| NFR-UX-006 | Visual design | Modern, minimalist, restaurant-friendly |
| NFR-UX-007 | Dark mode | System-wide toggle, persisted per user |
| NFR-UX-008 | Responsive | Works on desktop, tablet, mobile (degraded) |
| NFR-UX-009 | Feedback | Loading states, success/error toasts on all actions |
| NFR-UX-010 | Accessibility | WCAG 2.1 AA contrast ratios |

---

## 6. Portability & Deployment

> **ADR-001:** Multi-repository. Frontend → Vercel. Backend → Docker on Bettazon VPS.

| ID | Requirement | Detail |
|----|-------------|--------|
| NFR-DEPLOY-001 | Backend containerization | Docker + Docker Compose (backend repo only) |
| NFR-DEPLOY-002 | Frontend hosting | Vercel — no Docker |
| NFR-DEPLOY-003 | Reverse proxy | Nginx on VPS (backend production compose) |
| NFR-DEPLOY-004 | Environment config | `.env` per repository per environment |
| NFR-DEPLOY-005 | CI/CD | GitHub Actions per repo — see [07-cicd-strategy.md](../implementation/07-cicd-strategy.md) |
| NFR-DEPLOY-006 | Backend deploy | `docker compose up -d` on Bettazon VPS |
| NFR-DEPLOY-007 | Frontend deploy | Vercel auto-deploy on push to `main` |
| NFR-DEPLOY-008 | API contract | OpenAPI spec — not shared npm package |
| NFR-DEPLOY-009 | Dev ports | Frontend `:3000`, Backend `:5000` |

---

## 7. Data Integrity

| ID | Requirement | Detail |
|----|-------------|--------|
| NFR-DATA-001 | No orphaned records | Referential integrity via application layer + indexes |
| NFR-DATA-002 | Financial consistency | Ledger entries always balance per transaction |
| NFR-DATA-003 | Idempotency | Payment and stock operations idempotent (retry-safe) |
| NFR-DATA-004 | Soft delete | Master data never hard-deleted |
| NFR-DATA-005 | Timestamps | All documents have `createdAt`, `updatedAt` |
| NFR-DATA-006 | Outlet isolation | Queries always filtered by `outletId` |
| NFR-DATA-007 | Audit immutability | Audit collection: insert-only, no update/delete API |

---

## 8. Compatibility

| ID | Requirement | Detail |
|----|-------------|--------|
| NFR-COMPAT-001 | Browsers | Chrome 100+, Edge 100+, Safari 15+, Firefox 100+ |
| NFR-COMPAT-002 | Node.js | LTS version (20.x) |
| NFR-COMPAT-003 | MongoDB | 7.x |
| NFR-COMPAT-004 | Currency format | Indonesian Rupiah (Rp), no decimals |

---

## 9. Observability

| ID | Requirement | Detail |
|----|-------------|--------|
| NFR-OBS-001 | Health check endpoint | `GET /health` returns DB status |
| NFR-OBS-002 | Request logging | Method, path, status, duration per request |
| NFR-OBS-003 | Error tracking | Sentry integration (optional, recommended) |
| NFR-OBS-004 | Metrics | Request count, error rate (Prometheus-ready) |

---

## 10. Compliance & Legal

| ID | Requirement | Detail |
|----|-------------|--------|
| NFR-LEGAL-001 | Data privacy | Employee data access restricted by role |
| NFR-LEGAL-002 | Financial records | Retained minimum 5 years (configurable) |
| NFR-LEGAL-003 | Tax reporting | Export capability for accountant (CSV/PDF) |

---

## 11. Multi-Outlet NFR (Future-Proof)

| ID | Requirement | Detail |
|----|-------------|--------|
| NFR-MULTI-001 | Tenant model | `outletId` on every operational document from day one |
| NFR-MULTI-002 | Cross-outlet reports | Owner can aggregate without data leakage between outlets |
| NFR-MULTI-003 | Index strategy | Compound indexes leading with `outletId` |
| NFR-MULTI-004 | Sharding readiness | `outletId` as shard key candidate |
| NFR-MULTI-005 | Per-outlet config | Settings document per outlet |

---

## 12. NFR Verification Plan

| Category | Verification Method | Phase |
|----------|-------------------|-------|
| Performance | k6 load tests | Phase 2+ |
| Security | OWASP ZAP scan + manual pen test | Pre-production |
| Usability | Cashier UAT session | Phase 3 (POS) |
| Availability | Chaos testing (DB restart) | Pre-production |
| Data integrity | Reconciliation scripts | Ongoing |
