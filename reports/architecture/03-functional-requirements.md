# Functional Requirements

**Project:** Warung Nafisah ERP  
**Document ID:** WN-FR-001  
**Version:** 1.0.0  
**Status:** Draft — Awaiting Approval

---

## Notation

| Field | Description |
|-------|-------------|
| ID | Unique requirement identifier |
| Priority | P0 (MVP), P1 (Core), P2 (HR), P3 (Advanced), P4 (Future) |
| Module | System module |

---

## 1. Authentication & Authorization

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AUTH-001 | System shall allow users to log in with email/username and password | P0 |
| FR-AUTH-002 | System shall issue JWT access and refresh tokens on successful login | P0 |
| FR-AUTH-003 | System shall enforce role-based access control (Owner, Manager, Cashier, Kitchen, Inventory, Investor) | P0 |
| FR-AUTH-004 | System shall scope user permissions to assigned outlet(s) | P0 |
| FR-AUTH-005 | System shall allow password change by authenticated users | P1 |
| FR-AUTH-006 | System shall allow Owner/Manager to create, deactivate users | P1 |
| FR-AUTH-007 | Investor role shall have read-only access to financial data only | P1 |
| FR-AUTH-008 | System shall invalidate refresh token on logout | P0 |
| FR-AUTH-009 | System shall lock account after 5 failed login attempts (15 min) | P1 |

---

## 2. Dashboard

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-DASH-001 | Dashboard shall display today's total sales | P0 |
| FR-DASH-002 | Dashboard shall display today's profit (revenue − HPP) | P0 |
| FR-DASH-003 | Dashboard shall display today's expenses | P0 |
| FR-DASH-004 | Dashboard shall break down sales by payment method (Cash, QRIS, Transfer) | P0 |
| FR-DASH-005 | Dashboard shall show top 5 best-selling items today | P0 |
| FR-DASH-006 | Dashboard shall show items below minimum stock threshold | P0 |
| FR-DASH-007 | Dashboard shall show today's employee attendance summary | P2 |
| FR-DASH-008 | Dashboard data shall auto-refresh without page reload | P1 |
| FR-DASH-009 | Owner shall view aggregated dashboard across outlets (multi-outlet) | P4 |

---

## 3. POS (Point of Sale)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-POS-001 | Cashier shall create new order by selecting menu items | P0 |
| FR-POS-002 | POS shall filter menu by current shift (morning/evening) | P0 |
| FR-POS-003 | Cashier shall adjust item quantity in cart | P0 |
| FR-POS-004 | Cashier shall apply discount (percentage or fixed) with Manager approval if above threshold | P0 |
| FR-POS-005 | Cashier shall apply tax if configured | P1 |
| FR-POS-006 | Cashier shall select payment method: Cash, QRIS, Transfer | P0 |
| FR-POS-007 | On payment completion, system shall auto-update inventory, cashflow, HPP, profit | P0 |
| FR-POS-008 | System shall print/display receipt after payment | P0 |
| FR-POS-009 | System shall send Kitchen Order Ticket (KOT) to kitchen view | P0 |
| FR-POS-010 | Cashier shall void/cancel order before payment (with reason) | P0 |
| FR-POS-011 | Cashier shall process refund after payment (with reason, Manager approval) | P1 |
| FR-POS-012 | POS shall block sale if recipe ingredients insufficient (configurable override) | P0 |
| FR-POS-013 | POS UI shall use large buttons optimized for tablet | P0 |
| FR-POS-014 | Mixed payment (split across methods) | P4 |

---

## 4. Orders

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ORD-001 | System shall track order status: draft, pending, preparing, ready, completed, cancelled, refunded | P0 |
| FR-ORD-002 | Kitchen shall update order status to preparing/ready | P0 |
| FR-ORD-003 | System shall store order lines with menu item, qty, unit price, discount, HPP, profit | P0 |
| FR-ORD-004 | System shall generate unique order number per outlet per day | P0 |
| FR-ORD-005 | Manager shall view order history with filters (date, status, cashier) | P0 |
| FR-ORD-006 | Each order shall link to payment record(s) | P0 |

---

## 5. Payments

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-PAY-001 | System shall record payment with method, amount, reference number (QRIS/Transfer) | P0 |
| FR-PAY-002 | Payment shall auto-create cashflow ledger entry | P0 |
| FR-PAY-003 | System shall support partial payment tracking (future prepayment) | P4 |
| FR-PAY-004 | End-of-day payment reconciliation report by method | P1 |
| FR-PAY-005 | Refund shall create negative payment entry and reverse ledger | P1 |

---

## 6. Inventory

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-INV-001 | System shall maintain inventory for raw materials and finished goods | P0 |
| FR-INV-002 | Each item shall have: name, SKU, unit, category, min stock, outlet scope | P0 |
| FR-INV-003 | System shall apply FIFO costing on stock consumption | P0 |
| FR-INV-004 | System shall maintain stock history (in, out, adjustment, waste, expiry) | P0 |
| FR-INV-005 | Inventory staff shall perform stock adjustment with reason | P0 |
| FR-INV-006 | System shall record waste with reason and cost impact | P1 |
| FR-INV-007 | System shall record expired stock write-off | P1 |
| FR-INV-008 | System shall alert when stock falls below minimum threshold | P1 |
| FR-INV-009 | Stock batches shall track: qty, unit cost, received date, expiry date | P0 |
| FR-INV-010 | System shall prevent negative stock at POS (configurable) | P0 |

---

## 7. Recipes

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-REC-001 | Each menu item shall have one active recipe (BOM) | P0 |
| FR-REC-002 | Recipe shall list ingredients with quantity and unit | P0 |
| FR-REC-003 | System shall auto-calculate recipe cost (HPP) from FIFO ingredient costs | P0 |
| FR-REC-004 | HPP shall recalculate when ingredient costs change (for new orders only) | P0 |
| FR-REC-005 | Manager shall create/update recipes | P0 |
| FR-REC-006 | Recipe version history shall be retained | P1 |

---

## 8. Production

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-PROD-001 | User shall create production batch: raw materials → finished product | P1 |
| FR-PROD-002 | Production shall auto-deduct raw material stock (FIFO) | P1 |
| FR-PROD-003 | Production shall auto-add finished goods stock at calculated cost | P1 |
| FR-PROD-004 | Production shall record yield quantity and waste (if any) | P1 |
| FR-PROD-005 | Production cost = sum of consumed raw material FIFO costs | P1 |

---

## 9. Purchasing

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-PUR-001 | Inventory staff shall create purchase order with supplier, items, qty, unit price | P1 |
| FR-PUR-002 | On goods receipt, system shall increase inventory (FIFO batch) | P1 |
| FR-PUR-003 | Purchase shall auto-record expense and decrease cashflow | P1 |
| FR-PUR-004 | Purchase shall update supplier transaction history | P1 |
| FR-PUR-005 | Purchase order status: draft, ordered, received, cancelled | P1 |
| FR-PUR-006 | Partial receipt supported | P2 |

---

## 10. Supplier

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-SUP-001 | System shall maintain supplier master: name, contact, address, payment terms | P1 |
| FR-SUP-002 | System shall show supplier purchase history and total spend | P1 |
| FR-SUP-003 | Supplier can be deactivated (soft delete) | P1 |

---

## 11. Expenses

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-EXP-001 | Manager shall record non-COGS expenses with category, amount, date, payment method | P1 |
| FR-EXP-002 | Expense shall auto-create cashflow OUT entry | P1 |
| FR-EXP-003 | Expense categories configurable in settings | P1 |
| FR-EXP-004 | Purchase expenses auto-categorized as COGS/procurement | P1 |

---

## 12. Employees

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-EMP-001 | Manager shall manage employee records: name, role, contact, hire date, salary base | P2 |
| FR-EMP-002 | Employee linked to system user account (optional) | P2 |
| FR-EMP-003 | Employee assigned to outlet(s) | P2 |

---

## 13. Attendance

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ATT-001 | Employee shall clock in and clock out | P2 |
| FR-ATT-002 | System shall calculate hours worked per day | P2 |
| FR-ATT-003 | Manager shall view attendance report | P2 |
| FR-ATT-004 | Late/absent flagged on dashboard | P2 |

---

## 14. Salary

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-SAL-001 | System shall calculate monthly salary from base + attendance + overtime | P2 |
| FR-SAL-002 | Salary payment recorded as expense + cashflow OUT | P2 |
| FR-SAL-003 | Salary slip generation (PDF) | P3 |

---

## 15. Assets

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AST-001 | Register fixed assets: name, purchase date, value, depreciation period | P3 |
| FR-AST-002 | Track asset status: active, disposed | P3 |
| FR-AST-003 | Monthly depreciation expense (straight-line) | P3 |

---

## 16. Reports

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-RPT-001 | Sales report: daily, weekly, monthly, yearly | P0 |
| FR-RPT-002 | Expense report by category and period | P1 |
| FR-RPT-003 | Profit report (revenue − HPP − expenses) | P0 |
| FR-RPT-004 | Inventory report: current stock, valuation, movement | P1 |
| FR-RPT-005 | Best/worst selling items report | P0 |
| FR-RPT-006 | Cash flow report by payment method | P1 |
| FR-RPT-007 | Reports exportable to PDF/CSV | P2 |
| FR-RPT-008 | All report figures traceable to source transactions | P0 |

---

## 17. Investor Dashboard

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-INVST-001 | Investor shall view revenue, profit, expense charts | P3 |
| FR-INVST-002 | Investor shall view cashflow summary | P3 |
| FR-INVST-003 | Investor shall NOT have edit/delete/create permissions | P3 |
| FR-INVST-004 | Investor dashboard accessible via separate route with role guard | P3 |

---

## 18. Notifications

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-NOTIF-001 | Low stock alert to Inventory and Manager | P1 |
| FR-NOTIF-002 | Expiry alert (7 days before) | P2 |
| FR-NOTIF-003 | In-app notification center | P3 |
| FR-NOTIF-004 | Push/email notifications | P4 |

---

## 19. Settings

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-SET-001 | Configure outlet: name, address, operating hours, shifts | P0 |
| FR-SET-002 | Configure tax rate (if applicable) | P1 |
| FR-SET-003 | Configure discount approval threshold | P1 |
| FR-SET-004 | Configure payment methods enabled | P0 |
| FR-SET-005 | Configure expense categories | P1 |
| FR-SET-006 | Configure receipt header/footer | P1 |
| FR-SET-007 | Dark mode toggle (user preference) | P1 |

---

## 20. Audit Logs

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AUDIT-001 | All create/update/delete operations logged | P0 |
| FR-AUDIT-002 | Log entry: userId, action, entity, entityId, before, after, timestamp, IP | P0 |
| FR-AUDIT-003 | Audit logs are append-only (no update/delete) | P0 |
| FR-AUDIT-004 | Owner/Manager can search audit logs | P1 |

---

## 21. Cross-Cutting: Zero Duplicate Input

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ZERO-001 | No module shall require re-entry of data already captured in another module | P0 |
| FR-ZERO-002 | All financial aggregates derived from transaction ledger, not manually entered | P0 |
| FR-ZERO-003 | Dashboard and reports are read models — never manually edited | P0 |
| FR-ZERO-004 | Downstream effects executed atomically within database transaction | P0 |

---

## Requirement Traceability Matrix (Summary)

| Module | P0 Count | P1 Count | P2 Count | P3 Count | P4 Count |
|--------|----------|----------|----------|----------|----------|
| Auth | 5 | 4 | 0 | 0 | 0 |
| Dashboard | 6 | 1 | 1 | 0 | 1 |
| POS | 10 | 2 | 0 | 0 | 1 |
| Orders | 6 | 0 | 0 | 0 | 0 |
| Payments | 2 | 2 | 0 | 0 | 1 |
| Inventory | 7 | 3 | 0 | 0 | 0 |
| Recipes | 5 | 1 | 0 | 0 | 0 |
| Production | 0 | 5 | 0 | 0 | 0 |
| Purchasing | 0 | 5 | 1 | 0 | 0 |
| Supplier | 0 | 3 | 0 | 0 | 0 |
| Expenses | 0 | 4 | 0 | 0 | 0 |
| Employees | 0 | 0 | 3 | 0 | 0 |
| Attendance | 0 | 0 | 4 | 0 | 0 |
| Salary | 0 | 0 | 2 | 1 | 0 |
| Assets | 0 | 0 | 0 | 3 | 0 |
| Reports | 4 | 3 | 1 | 0 | 0 |
| Investor | 0 | 0 | 0 | 4 | 0 |
| Notifications | 0 | 1 | 1 | 1 | 1 |
| Settings | 2 | 5 | 0 | 0 | 0 |
| Audit | 3 | 1 | 0 | 0 | 0 |
| Cross-cutting | 4 | 0 | 0 | 0 | 0 |

**Total:** ~120 functional requirements
