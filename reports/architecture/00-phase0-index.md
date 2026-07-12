# Phase 0 — Business Analysis & Requirements

**Project:** Warung Nafisah ERP  
**Phase:** 0 — Discovery & Requirements  
**Status:** Revision 1.1 — Awaiting Re-Approval  
**Date:** 2026-07-01  
**Author:** Principal Software Architect

---

## Purpose

Phase 0 establishes the business context, requirements baseline, and architectural constraints before any code is written. **Revision 1.1** incorporates 16 enterprise requirements and the Business Event DNA principle.

## Deliverables

| # | Document | Path |
|---|----------|------|
| 1 | Business Analysis | [01-business-analysis.md](./01-business-analysis.md) |
| 2 | Software Requirements Specification (SRS) | [02-software-requirements-specification.md](./02-software-requirements-specification.md) |
| 3 | Functional Requirements | [03-functional-requirements.md](./03-functional-requirements.md) |
| 3b | Enterprise Functional Requirements | [03b-enterprise-functional-requirements.md](./03b-enterprise-functional-requirements.md) |
| 4 | Non-Functional Requirements | [04-non-functional-requirements.md](./04-non-functional-requirements.md) |
| 5 | Risk Analysis | [05-risk-analysis.md](./05-risk-analysis.md) |
| 6 | Use Cases | [06-use-cases.md](./06-use-cases.md) |
| 7 | Entity Relationship Diagram | [../database/01-entity-relationship-diagram.md](../database/01-entity-relationship-diagram.md) |
| 8 | Business Flowcharts | [08-business-flowcharts.md](./08-business-flowcharts.md) |
| 9 | **Event-Driven Architecture** | [09-event-driven-architecture.md](./09-event-driven-architecture.md) |
| 10 | **Enterprise Requirements** | [10-enterprise-requirements.md](./10-enterprise-requirements.md) |
| 11 | **Folder Structure Preview** | [11-folder-structure-preview.md](./11-folder-structure-preview.md) |
| 12 | Development Roadmap | [../implementation/01-roadmap.md](../implementation/01-roadmap.md) |
| 13 | Project Timeline | [../implementation/02-timeline.md](../implementation/02-timeline.md) |
| 14 | Module Overview | [../modules/00-module-overview.md](../modules/00-module-overview.md) |

---

## ★ Core Architectural DNA

> **"Every business action creates a permanent business event."**

Every purchase, sale, production, stock movement, and expense produces an immutable `business_events` record. Downstream modules (Inventory, Cashflow, Dashboard, Notifications, AI) consume events — they do not duplicate business logic.

This principle is shared DNA across the Soemanto application ecosystem and is the primary differentiator from traditional POS systems.

---

## Key Architectural Decisions (v1.1)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Business Event DNA** | Immutable `business_events` stream | Audit, AI, offline sync, multi-outlet without foundation rewrite |
| **Internal event-driven** | Domain events + handlers in modular monolith | Zero duplicate input; replayable projections |
| **Organizational hierarchy** | Business Group → Business → Outlet → Warehouse | True multi-business ERP, not flat outlet model |
| **Recipe versioning** | Immutable `recipe_versions`; active pointer | HPP accuracy; historical orders unaffected |
| **Purchase price history** | Append-only per item per supplier | Analytics, AI forecasting, supplier comparison |
| **Unit conversion** | `unit_definitions` + `unit_conversions` engine | kg/gram/pack/pcs interoperability |
| **KDS** | First-class WebSocket module | Kitchen operations separate from POS |
| **Offline-first POS** | IndexedDB event queue; sync via business events | Resilient to internet outage |
| **Notification engine** | Event-triggered rules + multi-channel | Low stock, expiry, gas, approvals, health |
| **Daily closing** | Auto-reconciliation + PDF + day lock | End-of-day financial integrity |
| **Approval workflow** | Unified `approval_requests` for 5 action types | Governance without friction |
| **Shift management** | Cashier + kitchen shifts | Accountability and reconciliation |
| **Digital receipt** | Print + QR + WhatsApp + Email | Customer experience |
| **Audit timeline** | Human-readable event projection | Complete activity history |
| **Backup** | Local mongodump + cloud upload | Data protection |
| **System health** | Metrics dashboard for Owner | Operational visibility |
| **AI-ready** | `analytics_projections` + event export API | Future ML without ETL rework |
| System type | Internal ERP (not POS-only) | Full business management |
| Inventory costing | FIFO per warehouse per SKU | F&B standard |
| Auth model | JWT + RBAC with 4-level scope | Multi-business access control |
| Data store | MongoDB + Mongoose | Event store + document flexibility |

---

## Enterprise Requirements Checklist

| # | Requirement | Document |
|---|-------------|----------|
| 1 | Multi Business → Business → Outlet → Warehouse | [10-enterprise-requirements.md §1](./10-enterprise-requirements.md#1-organizational-hierarchy) |
| 2 | Recipe versioning (immutable) | [§2](./10-enterprise-requirements.md#2-recipe-versioning-immutable-history) |
| 3 | Purchase price history | [§3](./10-enterprise-requirements.md#3-purchase-price-history) |
| 4 | Dynamic unit conversion | [§4](./10-enterprise-requirements.md#4-dynamic-unit-conversion) |
| 5 | Kitchen Display System (KDS) | [§5](./10-enterprise-requirements.md#5-kitchen-display-system-kds) |
| 6 | Offline-first sync | [§6](./10-enterprise-requirements.md#6-offline-first-pos-synchronization) |
| 7 | Notification engine | [§7](./10-enterprise-requirements.md#7-notification-engine) |
| 8 | Daily closing + PDF | [§8](./10-enterprise-requirements.md#8-daily-closing-module) |
| 9 | Approval workflow | [§9](./10-enterprise-requirements.md#9-approval-workflow) |
| 10 | Shift management | [§10](./10-enterprise-requirements.md#10-shift-management) |
| 11 | Digital receipt | [§11](./10-enterprise-requirements.md#11-digital-receipt) |
| 12 | Audit timeline | [§12](./10-enterprise-requirements.md#12-complete-audit-timeline) |
| 13 | Automatic backup | [§13](./10-enterprise-requirements.md#13-automatic-backup-strategy) |
| 14 | System health monitoring | [§14](./10-enterprise-requirements.md#14-system-health-monitoring) |
| 15 | AI-ready architecture | [§15](./10-enterprise-requirements.md#15-ai-ready-architecture) |
| 16 | Domain event / event-driven | [09-event-driven-architecture.md](./09-event-driven-architecture.md) |

---

## Approval Gate (Re-Approval Required)

**Phase 0 v1.1 is complete when:**

- [ ] Enterprise requirements 1–16 reviewed
- [ ] Business Event DNA principle approved
- [ ] Organizational hierarchy approved
- [ ] ERD v1.1 (38 collections) approved
- [ ] Event catalog and handler mapping approved
- [ ] Folder structure preview approved
- [ ] Revised roadmap and timeline approved
- [ ] Written approval to proceed to Phase 1

**Next Phase:** [Phase 1 — System Architecture](../implementation/01-roadmap.md#phase-1--system-architecture)
