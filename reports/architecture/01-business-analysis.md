# Business Analysis — Warung Nafisah

**Document ID:** WN-BA-001  
**Version:** 1.1.0  
**Status:** Draft — Awaiting Re-Approval (Enterprise Revision)

---

## 1. Executive Summary

Warung Nafisah is a restaurant business operating on a **dual-shift model**: morning–afternoon service (Gendum Kuah Tetelan) and evening service (Pecel Lele, Ayam Penyet, and future menu items). The business requires an **internal ERP system** that automates all operational and financial processes — not merely a point-of-sale terminal.

The system's guiding principles are:

1. **Zero Duplicate Input** — every business action automatically propagates to inventory, cashflow, HPP, profit, dashboards, and reports without manual re-entry.
2. **Business Event DNA** — *"Every business action creates a permanent business event."* Every purchase, sale, production, stock movement, and expense produces an immutable record in the `business_events` stream. This is the differentiator from traditional POS and the shared architectural DNA across the Soemanto application ecosystem.

See [Event-Driven Architecture](./09-event-driven-architecture.md) and [Enterprise Requirements](./10-enterprise-requirements.md).

---

## 2. Business Context

### 2.1 Business Identity

| Attribute | Value |
|-----------|-------|
| Business Name | Warung Nafisah |
| Industry | Food & Beverage (Warung / Casual Dining) |
| Operating Model | Single outlet (Phase 1); multi-business / multi-outlet ready |
| Organizational Hierarchy | Business Group → Business → Outlet → Warehouse |
| Target Users | Owner, Manager, Cashier, Kitchen, Inventory Staff, Investor |

### 2.2 Operating Schedule

```
┌─────────────────────────────────────────────────────────────┐
│  MORNING – AFTERNOON SHIFT                                  │
│  Product: Gendum Kuah Tetelan                               │
│  Characteristics: Soup-based, batch production likely       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  EVENING SHIFT                                              │
│  Products: Pecel Lele, Ayam Penyet, + future menu           │
│  Characteristics: Grill/fry, per-order preparation          │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Revenue Streams

| Stream | Description |
|--------|-------------|
| Dine-in sales | Primary — counter/table orders |
| Takeaway | Packaged orders (future) |
| Delivery integration | Third-party or own delivery (future) |

### 2.4 Cost Structure

| Cost Category | Examples |
|---------------|----------|
| COGS (HPP) | Raw ingredients consumed per recipe |
| Operating expenses | Utilities, rent, supplies, maintenance |
| Labor | Salaries, allowances, overtime |
| Procurement | Ingredient purchases from suppliers |
| Waste & shrinkage | Spoilage, expired stock, kitchen waste |

---

## 3. Stakeholder Analysis

| Stakeholder | Interest | System Needs |
|-------------|----------|--------------|
| **Owner** | Profitability, growth, investor relations | Full access, investor dashboard, financial reports |
| **Manager** | Daily operations, staff, inventory | Dashboard, approvals, reports, employee management |
| **Cashier** | Fast, accurate checkout | POS, payments, receipts, refunds |
| **Kitchen** | Order fulfillment | Kitchen Order Ticket (KOT), order status |
| **Inventory Staff** | Stock accuracy | Purchasing, stock adjustment, expiry alerts |
| **Investor** | ROI visibility | Read-only financial dashboard |
| **System Admin** | Security, configuration | Settings, audit logs, user management |

---

## 4. Current State vs Target State

### 4.1 Assumed Current State (Manual)

- Sales recorded separately from inventory
- HPP calculated manually or estimated
- Cash reconciliation done at end of day
- Purchase records in notebooks/spreadsheets
- No real-time dashboard
- Investor reports compiled manually

### 4.2 Target State (Automated ERP)

```
                    ┌──────────────────┐
                    │  SINGLE INPUT    │
                    │  (Transaction)   │
                    └────────┬─────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   ┌───────────┐      ┌─────────────┐     ┌─────────────┐
   │ Inventory │      │  Financial  │     │  Reporting  │
   │  Ledger   │      │   Ledger    │     │  & Dashboard│
   └───────────┘      └─────────────┘     └─────────────┘
         │                   │                   │
         └───────────────────┴───────────────────┘
                             │
                    ┌────────▼─────────┐
                    │   Audit Log      │
                    │ (Immutable)      │
                    └──────────────────┘
```

---

## 5. Business Rules

### 5.1 Menu & Shift Rules

| Rule ID | Rule |
|---------|------|
| BR-001 | Menu items are assigned to a shift (morning, evening, or all-day) |
| BR-002 | Menu items can be activated/deactivated without deletion (soft delete) |
| BR-003 | New menu items require a recipe before they can be sold |
| BR-004 | Recipe changes do not retroactively alter past order HPP; only future orders |

### 5.2 Inventory Rules

| Rule ID | Rule |
|---------|------|
| BR-010 | All stock movements must be traceable (stock history) |
| BR-011 | FIFO costing applied per outlet per SKU |
| BR-012 | Expired stock must be written off via waste/expiry workflow |
| BR-013 | Negative stock is blocked at POS; override requires Manager approval |
| BR-014 | Production converts raw materials → finished goods atomically |

### 5.3 Financial Rules

| Rule ID | Rule |
|---------|------|
| BR-020 | Every monetary transaction creates a ledger entry |
| BR-021 | Payment methods tracked separately: Cash, QRIS, Transfer |
| BR-022 | HPP = sum(recipe ingredient qty × FIFO unit cost) at time of sale |
| BR-023 | Profit = Revenue − HPP − allocated expenses (per period) |
| BR-024 | Refunds reverse sales, inventory (if applicable), and cashflow |

### 5.4 Access Control Rules

| Rule ID | Rule |
|---------|------|
| BR-030 | Investor role is strictly read-only |
| BR-031 | Cashier cannot modify inventory or view investor data |
| BR-032 | All destructive actions require audit log entry |
| BR-033 | Manager+ can approve stock adjustments and refunds above threshold |

---

## 6. Zero Duplicate Input — Business Flows

### 6.1 Purchase Flow

```
Purchase Order Created
        │
        ├──► Inventory stock IN (FIFO batch created)
        ├──► Cash/QRIS/Transfer OUT (expense recorded)
        ├──► Supplier transaction history updated
        ├──► Purchase expense categorized
        ├──► Dashboard: expense + low-stock refresh
        └──► Audit log entry
```

### 6.2 POS Sale Flow

```
Order Completed + Payment
        │
        ├──► Sales record created
        ├──► Payment recorded (by method)
        ├──► Recipe ingredients consumed (inventory OUT)
        ├──► HPP calculated and stored on order line
        ├──► Profit = price − HPP (per line, aggregated)
        ├──► Cash/QRIS/Transfer IN
        ├──► KOT sent to kitchen
        ├──► Dashboard + Investor dashboard refresh
        └──► Audit log entry
```

### 6.3 Production Flow

```
Production Batch Created
        │
        ├──► Raw materials OUT (by recipe/BOM)
        ├──► Finished goods IN
        ├──► Production cost = consumed material cost
        ├──► Stock history entries
        └──► Audit log entry
```

---

## 7. Organizational Hierarchy & Scalability

```
Business Group (e.g. Soemanto F&B Group)
    └── Business (e.g. Warung Nafisah)
            └── Outlet (e.g. Cabang Sudirman)
                    └── Warehouse (e.g. Gudang Dapur, Gudang Kering, Kulkas)
```

Even though Warung Nafisah starts as a **single outlet**, the architecture must support:

| Concern | Design Approach |
|---------|-----------------|
| Data isolation | `businessGroupId` → `businessId` → `outletId` → `warehouseId` |
| Multi-business | Owner manages multiple brands under one group |
| Central reporting | Event stream aggregation across any scope |
| Per-warehouse inventory | Separate FIFO queues per warehouse |
| Per-outlet staff | Users scoped to hierarchy levels |
| Business events | Immutable stream enables replay, AI, offline sync at any scale |

**Scalability test:** "Will this work at 100 outlets?" — Yes. Events are scoped by hierarchy; projections rebuild from `business_events`; shard key candidate is `businessGroupId`.

---

## 8. Success Metrics (KPIs)

| KPI | Target |
|-----|--------|
| Data re-entry incidents | 0 per day |
| POS checkout time | < 30 seconds per order |
| End-of-day reconciliation | Automated, < 5 min review |
| Inventory accuracy | > 98% (cycle count) |
| System uptime | 99.5% |
| Report generation | < 3 seconds for daily reports |

---

## 9. Out of Scope (Phase 0)

| Item | Reason |
|------|--------|
| Customer loyalty program | Future phase |
| Online ordering / delivery app | Future phase |
| Full double-entry accounting (GL) | Simplified ledger sufficient for now |
| Payroll tax compliance automation | Manual export initially |
| Multi-currency | Single currency (IDR) |

---

## 10. Assumptions & Dependencies

| # | Assumption |
|---|------------|
| A1 | Single legal entity; one bank account per payment method initially |
| A2 | All prices in Indonesian Rupiah (IDR) |
| A3 | Internet available at outlet (offline mode is future enhancement) |
| A4 | Tablets available for POS and kitchen display |
| A5 | Owner provides initial menu, recipes, and supplier list |

---

## 11. Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Business Owner | | | |
| Technical Lead | | | |
