# Domain Services Catalog — Architecture Freeze

**Document ID:** WN-ARCH-020  
**Version:** 1.0.0 (Phase 0.5)  
**Status:** FROZEN

---

## 1. Principle

> All business logic lives in **Domain Services** and **Aggregates**.  
> Controllers and Command Handlers are **orchestrators only**.

---

## 2. Domain Service Catalog

| Service | Responsibility | Key Methods |
|---------|----------------|-------------|
| **OrderDomainService** | Order lifecycle, pricing, discounts | `createOrder()`, `applyDiscount()`, `complete()`, `void()`, `refund()` |
| **InventoryDomainService** | Stock rules, FIFO consumption | `receive()`, `consume()`, `adjust()`, `transfer()`, `waste()`, `checkAvailability()` |
| **LedgerDomainService** | Cashflow rules, double-entry inspired | `recordInflow()`, `recordOutflow()`, `reverse()`, `reconcile()` |
| **RecipeDomainService** | Recipe versioning, HPP | `createVersion()`, `publish()`, `calculateHpp()`, `getActiveVersion()` |
| **KitchenDomainService** | KOT routing, station assignment | `createTicket()`, `routeToStation()`, `markReady()` |
| **PricingDomainService** | Price, tax, discount rules | `calculateLineTotal()`, `applyTax()`, `validateDiscount()` |
| **ApprovalDomainService** | Approval rules, thresholds | `requiresApproval()`, `request()`, `grant()`, `reject()` |
| **ShiftDomainService** | Shift open/close rules | `openShift()`, `closeShift()`, `reconcileCash()` |
| **ProductionDomainService** | Batch production rules | `startBatch()`, `completeBatch()`, `calculateYield()` |
| **PurchaseDomainService** | PO lifecycle, GRN | `createPo()`, `submit()`, `receive()`, `recordPrice()` |
| **UnitConversionDomainService** | Unit math | `convert()`, `toBaseUnit()`, `fromBaseUnit()` |
| **DocumentNumberDomainService** | Doc numbering | `nextNumber()`, `validateFormat()` |
| **MoneyDomainService** | Money arithmetic | `add()`, `subtract()`, `multiply()`, `allocate()` |
| **CustomerDomainService** | CRM rules (feature-flagged) | `register()`, `identify()`, `awardPoints()` |
| **PayrollDomainService** | Salary calculation | `calculate()`, `approve()`, `disburse()` |
| **ClosingDomainService** | Daily closing rules | `startClosing()`, `reconcile()`, `complete()`, `lockDay()` |
| **TenantDomainService** | Settings validation | `getSettings()`, `validatePolicy()` |

---

## 3. Layer Interaction (Frozen)

```
Controller
  → CommandHandler.execute(command)
    → OrderDomainService.complete(order, context)
      → returns DomainEvent[]
    → EventStore.append(events)  // infrastructure
    → EventBus.dispatch(events)  // infrastructure
```

Controller **must not**:
- Calculate HPP
- Check stock levels
- Apply discount logic
- Generate document numbers directly

---

## 4. File Structure (Frozen)

```
backend/src/domain/
├── services/
│   ├── OrderDomainService.ts
│   ├── InventoryDomainService.ts
│   ├── LedgerDomainService.ts
│   ├── RecipeDomainService.ts
│   ├── KitchenDomainService.ts
│   ├── PricingDomainService.ts
│   ├── ApprovalDomainService.ts
│   ├── ShiftDomainService.ts
│   ├── ProductionDomainService.ts
│   ├── PurchaseDomainService.ts
│   ├── UnitConversionDomainService.ts
│   ├── DocumentNumberDomainService.ts
│   ├── MoneyDomainService.ts
│   ├── CustomerDomainService.ts
│   ├── PayrollDomainService.ts
│   ├── ClosingDomainService.ts
│   └── TenantDomainService.ts
├── aggregates/
├── value-objects/
│   └── Money.ts
└── events/
```

---

## 5. Domain Service Rules

| Rule | Detail |
|------|--------|
| No I/O | Domain services return events; no DB calls |
| Pure functions preferred | Deterministic given same inputs |
| Context injection | `TenantContext`, `ActorContext` passed as params |
| Money type | All amounts via `Money` value object |
| Throws domain errors | `DomainError` with error code (see API error catalog) |

---

## 6. Related

- [domain/01-money-value-object.md](../domain/01-money-value-object.md)
- [domain/02-document-number-service.md](../domain/02-document-number-service.md)
