# RBAC Permission Matrix — Architecture Freeze

**Document ID:** WN-SEC-001  
**Version:** 1.0.0 (Phase 0.5)  
**Status:** FROZEN

---

## 1. Roles (Frozen — 12 roles)

| Role | Code | Scope | Description |
|------|------|-------|-------------|
| Owner | `owner` | Business Group | Full access, all businesses |
| General Manager | `general_manager` | Business / Outlets | Operations + reports |
| Finance | `finance` | Business | Financial modules, closing, reports |
| Purchasing | `purchasing` | Outlet | PO, suppliers, GRN |
| Warehouse | `warehouse` | Outlet + Warehouse | Inventory, stock, production |
| Kitchen | `kitchen` | Outlet | KDS only, order status |
| Cashier | `cashier` | Outlet | POS, payments, shift |
| Waiter | `waiter` | Outlet | Order create (no payment) — future |
| Admin | `admin` | Business Group | User mgmt, settings, health |
| Auditor | `auditor` | Business Group | Read-only all + audit timeline |
| Investor | `investor` | Business | Read-only financial |
| System | `system` | Global | Internal jobs, integrations |

---

## 2. Permission Format

```
{module}:{action}
```

Actions: `create`, `read`, `update`, `delete`, `approve`, `export`, `admin`

---

## 3. Module Permission Matrix

Legend: ✅ = allowed | 👁️ = read-only | 🔒 = own shift/device only | ❌ = denied

| Module | Owner | Gen Mgr | Finance | Purchasing | Warehouse | Kitchen | Cashier | Waiter | Admin | Auditor | Investor | System |
|--------|-------|---------|---------|------------|-----------|---------|---------|--------|-------|---------|----------|--------|
| **Hierarchy** | ✅ | 👁️ | 👁️ | 👁️ | 👁️ | ❌ | ❌ | ❌ | ✅ | 👁️ | ❌ | ❌ |
| **Dashboard** | ✅ | ✅ | ✅ | 👁️ | 👁️ | ❌ | ❌ | ❌ | 👁️ | 👁️ | ❌ | ❌ |
| **POS** | ✅ | ✅ | 👁️ | ❌ | ❌ | ❌ | ✅ | 🔒 | ❌ | 👁️ | ❌ | ❌ |
| **KDS** | ✅ | ✅ | ❌ | ❌ | 👁️ | ✅ | ❌ | ❌ | ❌ | 👁️ | ❌ | ❌ |
| **Orders** | ✅ | ✅ | 👁️ | ❌ | ❌ | 👁️ | ✅ | ✅ | ❌ | 👁️ | ❌ | ❌ |
| **Payments** | ✅ | ✅ | ✅ | ❌ | ❌ | 🔒 | ✅ | ❌ | ❌ | 👁️ | ❌ | ❌ |
| **Inventory** | ✅ | ✅ | 👁️ | 👁️ | ✅ | 👁️ | ❌ | ❌ | ❌ | 👁️ | ❌ | ❌ |
| **Recipes** | ✅ | ✅ | 👁️ | ❌ | 👁️ | 👁️ | ❌ | ❌ | ❌ | 👁️ | ❌ | ❌ |
| **Production** | ✅ | ✅ | 👁️ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | 👁️ | ❌ | ❌ |
| **Purchasing** | ✅ | ✅ | 👁️ | ✅ | 👁️ | ❌ | ❌ | ❌ | ❌ | 👁️ | ❌ | ❌ |
| **Suppliers** | ✅ | ✅ | 👁️ | ✅ | 👁️ | ❌ | ❌ | ❌ | ❌ | 👁️ | ❌ | ❌ |
| **Expenses** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 👁️ | ❌ | ❌ |
| **Shifts** | ✅ | ✅ | 👁️ | ❌ | ❌ | 🔒 | 🔒 | ❌ | ❌ | 👁️ | ❌ | ❌ |
| **Daily Closing** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 👁️ | 👁️ | ❌ |
| **Approvals** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | 👁️ | ❌ | ❌ |
| **Reports** | ✅ | ✅ | ✅ | 👁️ | 👁️ | ❌ | ❌ | ❌ | 👁️ | 👁️ | 👁️ | ❌ |
| **Investor View** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 👁️ | ✅ | ❌ |
| **HR / Payroll** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | 👁️ | ❌ | ❌ |
| **Audit Timeline** | ✅ | ✅ | 👁️ | 👁️ | 👁️ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Settings** | ✅ | ✅ | 👁️ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | 👁️ | ❌ | ❌ |
| **System Health** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | 👁️ | ❌ | ✅ |
| **Analytics/AI** | ✅ | 👁️ | 👁️ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | 👁️ | 👁️ | ✅ |
| **Backup Admin** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | 👁️ | ❌ | ✅ |
| **Event Replay** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |

---

## 4. Approval Authority Matrix

| Action | Cashier | Kitchen | Warehouse | Purchasing | Finance | Gen Mgr | Owner |
|--------|---------|---------|-----------|------------|---------|---------|-------|
| Discount < threshold | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Discount > threshold | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Void order | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Refund | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Purchase < threshold | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| Purchase > threshold | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Stock adjustment (large) | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Payroll | ❌ | ❌ | ❌ | ❌ | 👁️ | 👁️ | ✅ |
| Daily closing variance | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |

---

## 5. Scope Enforcement (Middleware Chain)

```
1. authenticate (JWT)
2. resolveScope (businessGroupId, businessId, outletId, warehouseId)
3. checkPermission(module, action)
4. checkFeatureFlag(module)
5. attachActorContext → event metadata
```

---

## 6. Investor Hard Rules

| Rule | Enforcement |
|------|-------------|
| No POST/PUT/PATCH/DELETE on any command | API middleware |
| Only `/api/v1/queries/investor/*` routes | Route guard |
| No access to operational modules | RBAC |
| No PII of employees | Query projection filter |

---

## 7. Related

- [03-feature-flags.md](./03-feature-flags.md)
- [04-tenant-settings.md](./04-tenant-settings.md)
