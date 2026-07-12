# Software Requirements Specification (SRS)

**Project:** Warung Nafisah ERP  
**Document ID:** WN-SRS-001  
**Version:** 1.0.0  
**Status:** Draft — Awaiting Approval

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification defines the functional and non-functional requirements for the Warung Nafisah internal ERP system. It serves as the contract between stakeholders and the development team.

### 1.2 Scope

The system is an **internal enterprise resource planning application** for restaurant operations covering:

- Point of Sale (POS)
- Order & Payment Management
- Inventory & Recipe Management
- Production Management
- Purchasing & Supplier Management
- Expense Management
- Employee, Attendance & Salary Management
- Asset Management
- Financial Reporting & Dashboards
- Investor Read-Only Portal
- Notifications & Audit Logging
- System Settings & Configuration

### 1.3 Definitions

| Term | Definition |
|------|------------|
| ERP | Enterprise Resource Planning |
| POS | Point of Sale |
| HPP | Harga Pokok Penjualan (Cost of Goods Sold) |
| KOT | Kitchen Order Ticket |
| FIFO | First In, First Out (inventory costing) |
| BOM | Bill of Materials (recipe) |
| SKU | Stock Keeping Unit |
| Outlet | A physical restaurant location (tenant unit) |
| RBAC | Role-Based Access Control |

### 1.4 References

- [Business Analysis](./01-business-analysis.md)
- [Functional Requirements](./03-functional-requirements.md)
- [Non-Functional Requirements](./04-non-functional-requirements.md)

---

## 2. Overall Description

### 2.1 Product Perspective

Warung Nafisah ERP is a **standalone web application** with:

- **Frontend:** Next.js + React + Material UI (tablet-first)
- **Backend:** Node.js + Express.js REST API
- **Database:** MongoDB
- **Infrastructure:** Backend Docker (VPS) + Frontend Vercel — see [ADR-001](../architecture/ADR-001-multi-repository-strategy.md)

```
┌─────────────┐     HTTPS      ┌─────────────┐     ┌─────────────┐
│   Vercel    │───────────────►│  Nginx/VPS  │────►│  Express    │
│  (Next.js)  │◄───────────────│   (Proxy)   │◄────│   API :5000 │
└─────────────┘                └──────┬──────┘     └──────┬──────┘
                                      │            ┌──────▼──────┐
                                      │            │   MongoDB   │
                                      │            └─────────────┘
                                      │            ┌─────────────┐
                                      └───────────►│ Redis/BullMQ│
                                                   └─────────────┘
```

**Contract:** OpenAPI Specification — not shared source code.

### 2.2 Product Functions (Module Map)

| Module | Primary Function |
|--------|-----------------|
| Authentication | Login, JWT, RBAC |
| Dashboard | Real-time operational KPIs |
| POS | Sales checkout, payments, KOT |
| Orders | Order lifecycle management |
| Payments | Payment recording & reconciliation |
| Inventory | Stock levels, FIFO, adjustments |
| Recipes | Menu BOM, HPP calculation |
| Production | Raw → finished conversion |
| Purchasing | PO, goods receipt |
| Supplier | Supplier master & history |
| Expenses | Non-COGS expense tracking |
| Employees | Staff master data |
| Attendance | Clock in/out |
| Salary | Payroll calculation |
| Assets | Fixed asset register |
| Reports | Sales, expense, profit, inventory |
| Investor Dashboard | Read-only financial view |
| Notifications | Alerts (low stock, etc.) |
| Settings | System & outlet configuration |
| Audit Logs | Immutable action trail |

### 2.3 User Classes

| Role | Description | Access Level |
|------|-------------|--------------|
| Owner | Business proprietor | Full |
| Manager | Outlet manager | Operational + reports |
| Cashier | Front counter | POS, orders, payments |
| Kitchen | Food preparation | KOT, order status |
| Inventory | Stock management | Inventory, purchasing |
| Investor | Silent partner | Read-only financial |

### 2.4 Operating Environment

| Component | Requirement |
|-----------|-------------|
| Client | Modern browser (Chrome, Edge, Safari); tablet 10"+ recommended |
| Server | Linux container (Docker) |
| Network | Stable LAN/WiFi at outlet |
| Database | MongoDB 7.x |

### 2.5 Design & Implementation Constraints

| Constraint | Detail |
|------------|--------|
| Architecture | Clean Architecture, feature-based folders |
| API style | RESTful JSON |
| Auth | JWT (access + refresh tokens) |
| Currency | IDR only |
| Language | UI: Indonesian (primary), English (code/docs) |
| No duplicate input | Mandatory — all downstream effects automated |

### 2.6 Assumptions

See [Business Analysis §10](./01-business-analysis.md#10-assumptions--dependencies).

---

## 3. System Features (Summary)

Detailed requirements in [Functional Requirements](./03-functional-requirements.md).

### 3.1 Feature Priority Matrix

| Priority | Features |
|----------|----------|
| **P0 — MVP** | Auth, POS, Orders, Payments, Inventory, Recipes, Dashboard, Reports (daily) |
| **P1 — Core ERP** | Production, Purchasing, Supplier, Expenses, Audit Logs, Settings |
| **P2 — HR** | Employees, Attendance, Salary |
| **P3 — Advanced** | Assets, Investor Dashboard, Notifications, Advanced Reports |
| **P4 — Future** | Multi-outlet UI, mixed payment, delivery, offline mode |

---

## 4. External Interface Requirements

### 4.1 User Interfaces

- Tablet-first responsive layout
- Large touch targets (min 48px)
- Dark mode support
- Role-based navigation (sidebar)
- POS: grid menu, cart panel, payment modal

### 4.2 Hardware Interfaces

- Thermal receipt printer (ESC/POS) — future integration
- Kitchen display — browser-based initially

### 4.3 Software Interfaces

| Interface | Protocol | Purpose |
|-----------|----------|---------|
| REST API | HTTPS/JSON | Frontend ↔ Backend |
| MongoDB | Wire protocol | Data persistence |

### 4.4 Communications

- HTTPS enforced in production
- WebSocket for real-time KOT (Phase 4+ optional; polling acceptable for MVP)

---

## 5. Non-Functional Requirements

See [Non-Functional Requirements](./04-non-functional-requirements.md) for full detail.

Summary:

| Category | Target |
|----------|--------|
| Performance | API < 200ms p95; dashboard < 3s |
| Availability | 99.5% uptime |
| Security | JWT, RBAC, rate limiting, Helmet, CORS, audit |
| Scalability | 100 outlets, 10K orders/day aggregate |
| Maintainability | Clean Architecture, 80%+ test coverage on domain |
| Usability | Cashier trained in < 30 minutes |

---

## 6. Data Requirements

See [Entity Relationship Diagram](./07-entity-relationship-diagram.md).

Key principles:

- `outletId` on all operational documents
- No denormalized financial totals without source transactions
- Immutable audit log collection (append-only)
- Soft delete for master data

---

## 7. Security Requirements

| ID | Requirement |
|----|-------------|
| SEC-001 | Passwords hashed with bcrypt (cost ≥ 12) |
| SEC-002 | JWT access token TTL: 15 min; refresh: 7 days |
| SEC-003 | Role permissions enforced at API middleware layer |
| SEC-004 | Input validation on all endpoints (validator layer) |
| SEC-005 | Rate limiter: 100 req/min per IP (configurable) |
| SEC-006 | Helmet security headers |
| SEC-007 | CORS whitelist for known origins |
| SEC-008 | All mutations logged to audit collection |
| SEC-009 | Investor role cannot access mutation endpoints |
| SEC-010 | Sensitive fields excluded from API responses |

---

## 8. Quality Attributes

| Attribute | Measure |
|-----------|---------|
| Reliability | Transaction atomicity via MongoDB sessions |
| Traceability | Every financial figure traceable to source document |
| Portability | Dockerized — runs on any cloud/VPS |
| Extensibility | Feature modules independently deployable (multi-repository) |

---

## 9. Acceptance Criteria (System Level)

| # | Criterion |
|---|-----------|
| AC-001 | Cashier completes sale → inventory, cashflow, HPP, dashboard update without manual step |
| AC-002 | Purchase recorded → inventory IN, expense OUT, supplier history updated |
| AC-003 | Production batch → raw OUT, finished IN, cost calculated |
| AC-004 | Daily report matches sum of individual transactions |
| AC-005 | Investor cannot modify any data via API or UI |
| AC-006 | All roles see only permitted modules |
| AC-007 | Audit log captures who, what, when, before/after |
| AC-008 | System deployable via `docker compose up` |

---

## 10. Glossary

| Term | Indonesian | Meaning |
|------|------------|---------|
| Gendum Kuah Tetelan | — | Morning menu — soup dish |
| Pecel Lele | — | Evening menu — fried catfish |
| Ayam Penyet | — | Evening menu — smashed fried chicken |
| Warung | — | Small casual eatery |

---

## 11. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-07-01 | Architect | Initial SRS |

---

## 12. Approval

| Role | Name | Date | Approved |
|------|------|------|----------|
| Product Owner | | | ☐ |
| Technical Lead | | | ☐ |
| Business Owner | | | ☐ |
