# Collections Final Registry — Architecture Freeze

**Document ID:** WN-DB-003  
**Version:** 1.0.0 (Phase 0.5)  
**Status:** FROZEN  
**Total Collections:** 45

---

## Classification Key

| Symbol | Meaning |
|--------|---------|
| 🔒 | Immutable (append-only) |
| 📝 | Transactional (aggregate) |
| 📊 | Projection |
| 📖 | Read Model |
| ⚙️ | System / Config |

---

## 1. Hierarchy & Tenant (5)

| # | Collection | Type | Scope |
|---|------------|------|-------|
| 1 | `business_groups` | ⚙️ | Global |
| 2 | `businesses` | ⚙️ | Group |
| 3 | `outlets` | ⚙️ | Business |
| 4 | `warehouses` | ⚙️ | Outlet |
| 5 | `tenant_settings` | ⚙️ | Business |
| 6 | `outlet_settings` | ⚙️ | Outlet |

---

## 2. Event Store & CQRS (6)

| # | Collection | Type |
|---|------------|------|
| 7 | `business_events` | 🔒 Event Store |
| 8 | `event_consumer_log` | 🔒 System |
| 9 | `event_dead_letter` | 🔒 System |
| 10 | `outlet_sequences` | ⚙️ System |
| 11 | `document_sequences` | ⚙️ System |
| 12 | `saga_processes` | ⚙️ Saga |

---

## 3. Transactional / Aggregates (14)

| # | Collection | Aggregate |
|---|------------|-----------|
| 13 | `users` | User |
| 14 | `menu_items` | MenuItem |
| 15 | `recipe_versions` | 🔒 RecipeVersion |
| 16 | `inventory_items` | InventoryItem |
| 17 | `stock_batches` | StockBatch |
| 18 | `stock_history` | 🔒 StockHistory |
| 19 | `purchase_price_history` | 🔒 PriceHistory |
| 20 | `orders` | Order |
| 21 | `payments` | Payment |
| 22 | `purchase_orders` | PurchaseOrder |
| 23 | `production_batches` | ProductionBatch |
| 24 | `expenses` | Expense |
| 25 | `suppliers` | Supplier |
| 26 | `approval_requests` | ApprovalRequest |

---

## 4. Operations (6)

| # | Collection | Type |
|---|------------|------|
| 27 | `shifts` | 📝 |
| 28 | `daily_closings` | 📝 |
| 29 | `digital_receipts` | 📝 |
| 30 | `cashflow_entries` | 🔒 Ledger |
| 31 | `employees` | 📝 |
| 32 | `attendances` | 📝 |
| 33 | `salary_records` | 📝 |
| 34 | `assets` | 📝 |

---

## 5. Projections (12)

| # | Collection | Domain |
|---|------------|--------|
| 35 | `projection_sales_daily` | Sales |
| 36 | `projection_sales_hourly` | Sales |
| 37 | `projection_sales_by_item` | Sales |
| 38 | `projection_inventory_snapshot` | Inventory |
| 39 | `projection_finance_daily` | Finance |
| 40 | `projection_finance_cashflow` | Finance |
| 41 | `projection_kitchen_queue` | Kitchen |
| 42 | `projection_dashboard_outlet_today` | Dashboard |
| 43 | `projection_analytics_demand` | Analytics |
| 44 | `projection_ai_features` | AI |
| 45 | `projection_customer_spend` | CRM |

---

## 6. Read Models (8)

| # | Collection | Screen |
|---|------------|--------|
| 46 | `read_dashboard_outlet_today` | Dashboard |
| 47 | `read_pos_menu` | POS |
| 48 | `read_kds_board` | KDS |
| 49 | `read_inventory_list` | Inventory UI |
| 50 | `read_approval_inbox` | Approvals |
| 51 | `read_audit_timeline` | Audit |
| 52 | `read_investor_summary` | Investor |
| 53 | `read_notification_inbox` | Notifications |

---

## 7. System & Support (8)

| # | Collection | Type |
|---|------------|------|
| 54 | `audit_timeline` | 🔒 (source for read_audit_timeline) |
| 55 | `audit_logs` | 🔒 Security |
| 56 | `notification_rules` | ⚙️ |
| 57 | `notification_deliveries` | 📝 |
| 58 | `sync_devices` | ⚙️ |
| 59 | `sync_conflicts` | 📝 |
| 60 | `backup_jobs` | 🔒 |
| 61 | `system_health_metrics` | ⚙️ TTL |
| 62 | `unit_definitions` | ⚙️ Master |
| 63 | `unit_conversions` | ⚙️ Config |
| 64 | `expense_categories` | ⚙️ |

**Revised total: 64 collections** (includes projections + read models + support)

---

## 8. Write/Read Rules (Frozen)

| Type | Written By | Read By |
|------|------------|---------|
| business_events | Command Handler | Replay, Analytics, Audit |
| Transactional | Command Handler | Command Handler (load) |
| Projections | Event Handlers | Query Handlers |
| Read Models | Event Handlers | Query Handlers, UI |
| Dashboard | — | **Read Models ONLY** |

---

## 9. Related

- [01-entity-relationship-diagram.md](./01-entity-relationship-diagram.md)
- [02-index-strategy.md](./02-index-strategy.md)
