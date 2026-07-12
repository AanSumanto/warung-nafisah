# Domain Event Catalog — Architecture Freeze

**Document ID:** WN-ARCH-017  
**Version:** 1.0.0 (Phase 0.5)  
**Status:** FROZEN  
**Total Events:** 62

> Naming: **Past Tense PascalCase**. All events start at **v1**.

---

## POS & Orders (12)

| eventName | v | Trigger | Key Payload Fields |
|-----------|---|---------|-------------------|
| `OrderCreated` | 1 | New order at POS | orderId, orderNumber, lines[], shiftId |
| `OrderItemAdded` | 1 | Item added to cart | orderId, lineId, menuItemId, qty, price |
| `OrderItemRemoved` | 1 | Item removed | orderId, lineId |
| `OrderDiscountApplied` | 1 | Discount applied | orderId, discount, approvalId? |
| `OrderCancelled` | 1 | Pre-payment cancel | orderId, reason, approvalId? |
| `SaleCompleted` | 1 | Payment confirmed | orderId, payment, lines[], hpp, profit |
| `SaleVoided` | 1 | Void after issue | orderId, reason, approvalId |
| `SaleRefunded` | 1 | Refund processed | orderId, refundAmount, approvalId, restock |
| `PaymentReceived` | 1 | Payment recorded | paymentId, orderId, method, amount |
| `PaymentRefunded` | 1 | Refund payment | paymentId, originalPaymentId, amount |
| `ReceiptIssued` | 1 | Receipt generated | orderId, channels[], receiptNumber |
| `OrderNumberAssigned` | 1 | Doc number assigned | orderId, orderNumber |

---

## Inventory (11)

| eventName | v | Trigger | Key Payload Fields |
|-----------|---|---------|-------------------|
| `InventoryReceived` | 1 | Stock IN | itemId, warehouseId, qty, batch, unitCost |
| `InventoryConsumed` | 1 | Stock OUT (sale/prod) | itemId, warehouseId, qty, fifoBatches[] |
| `InventoryAdjusted` | 1 | Manual adjustment | itemId, delta, reason, approvalId? |
| `InventoryTransferred` | 1 | Warehouse transfer | fromWarehouse, toWarehouse, itemId, qty |
| `InventoryWasted` | 1 | Waste recorded | itemId, qty, reason, cost |
| `InventoryExpired` | 1 | Expiry write-off | itemId, batchId, qty |
| `LowStockDetected` | 1 | Below minimum | itemId, currentQty, minQty |
| `ExpiryApproaching` | 1 | Near expiry alert | itemId, batchId, expiryDate, daysLeft |
| `StockBatchCreated` | 1 | FIFO batch created | batchId, itemId, qty, unitCost |
| `InventoryItemCreated` | 1 | New SKU | itemId, sku, baseUnit |
| `InventoryItemUpdated` | 1 | SKU metadata change | itemId, changes |

---

## Purchase (7)

| eventName | v | Trigger | Key Payload Fields |
|-----------|---|---------|-------------------|
| `PurchaseOrderCreated` | 1 | PO drafted | poId, poNumber, supplierId, lines[] |
| `PurchaseOrderSubmitted` | 1 | PO sent to supplier | poId, approvalId? |
| `PurchaseOrderCancelled` | 1 | PO cancelled | poId, reason |
| `PurchaseReceived` | 1 | Goods receipt (GRN) | grnId, grnNumber, poId, lines[] |
| `PurchasePriceRecorded` | 1 | Price per line | itemId, supplierId, unitPrice, unit |
| `GoodsReceivedNoteCreated` | 1 | GRN document | grnId, poId |
| `SupplierInvoiceMatched` | 1 | 3-way match (future) | poId, invoiceId |

---

## Finance & Ledger (9)

| eventName | v | Trigger | Key Payload Fields |
|-----------|---|---------|-------------------|
| `CashflowRecorded` | 1 | Money movement | type, category, amount, method, ref |
| `ExpenseCreated` | 1 | Expense recorded | expenseId, category, amount |
| `ExpenseApproved` | 1 | Expense approved | expenseId, approverId |
| `LedgerEntryPosted` | 1 | Ledger line | entryId, debit, credit, account |
| `DailyClosingStarted` | 1 | Closing initiated | closingId, date |
| `DailyClosingCompleted` | 1 | Day closed | closingId, reconciliation, pdfUrl |
| `PaymentReconciled` | 1 | Method reconciled | closingId, method, variance |
| `TaxCalculated` | 1 | Tax on sale | orderId, taxAmount, rate |
| `InvoiceGenerated` | 1 | Tax invoice (future) | invoiceId, orderId |

---

## Kitchen & KDS (6)

| eventName | v | Trigger | Key Payload Fields |
|-----------|---|---------|-------------------|
| `KitchenTicketCreated` | 1 | KOT generated | orderId, ticketId, items[], station |
| `OrderItemPreparing` | 1 | Kitchen started item | orderId, lineId, station |
| `OrderItemReady` | 1 | Item ready | orderId, lineId |
| `OrderReady` | 1 | Full order ready | orderId |
| `KitchenTicketBumped` | 1 | Ticket cleared | ticketId |
| `KitchenStationAssigned` | 1 | Routing set | orderId, lineId, station |

---

## Recipe & Production (6)

| eventName | v | Trigger | Key Payload Fields |
|-----------|---|---------|-------------------|
| `RecipeVersionCreated` | 1 | New recipe version | recipeVersionId, menuItemId, version |
| `RecipePublished` | 1 | Version activated | recipeVersionId, menuItemId, hpp |
| `RecipeRetired` | 1 | Version deactivated | recipeVersionId |
| `ProductionStarted` | 1 | Batch started | batchId, recipeVersionId |
| `ProductionCompleted` | 1 | Batch finished | batchId, inputs[], output, cost |
| `ProductionWasteRecorded` | 1 | Production waste | batchId, wasteQty |

---

## Shift & Operations (5)

| eventName | v | Trigger | Key Payload Fields |
|-----------|---|---------|-------------------|
| `ShiftOpened` | 1 | Shift start | shiftId, type, openingCash? |
| `ShiftClosed` | 1 | Shift end | shiftId, reconciliation |
| `CashDrawerOpened` | 1 | No-sale open | shiftId, reason |
| `CashDeposited` | 1 | Cash drop | shiftId, amount |
| `CashWithdrawn` | 1 | Petty cash | shiftId, amount, reason |

---

## Approval (4)

| eventName | v | Trigger | Key Payload Fields |
|-----------|---|---------|-------------------|
| `ApprovalRequested` | 1 | Action needs approval | requestId, type, payload |
| `ApprovalGranted` | 1 | Approved | requestId, approverId |
| `ApprovalRejected` | 1 | Rejected | requestId, reason |
| `ApprovalExpired` | 1 | Timeout | requestId |

---

## CRM & Customer (3) — Feature-flagged

| eventName | v | Trigger | Key Payload Fields |
|-----------|---|---------|-------------------|
| `CustomerRegistered` | 1 | New customer | customerId, phone, name |
| `CustomerIdentified` | 1 | Linked to sale | orderId, customerId |
| `LoyaltyPointsEarned` | 1 | Points credited | customerId, points, orderId |

---

## Payroll & HR (4)

| eventName | v | Trigger | Key Payload Fields |
|-----------|---|---------|-------------------|
| `EmployeeHired` | 1 | New employee | employeeId, role |
| `AttendanceRecorded` | 1 | Clock in/out | employeeId, type, timestamp |
| `PayrollApproved` | 1 | Payroll approved | payrollId, approvalId |
| `PayrollPaid` | 1 | Salary disbursed | payrollId, amount, employees[] |

---

## Authentication & Security (3)

| eventName | v | Trigger | Key Payload Fields |
|-----------|---|---------|-------------------|
| `UserLoggedIn` | 1 | Successful login | userId, ipAddress |
| `UserLoggedOut` | 1 | Logout | userId |
| `UserPermissionDenied` | 1 | RBAC block | userId, resource, action |

---

## Notification (2)

| eventName | v | Trigger | Key Payload Fields |
|-----------|---|---------|-------------------|
| `NotificationSent` | 1 | Delivered | notificationId, channel, userId |
| `NotificationFailed` | 1 | Delivery failed | notificationId, error |

---

## Backup & System (4)

| eventName | v | Trigger | Key Payload Fields |
|-----------|---|---------|-------------------|
| `BackupStarted` | 1 | Backup job start | jobId, type |
| `BackupCompleted` | 1 | Backup success | jobId, location, sizeBytes |
| `BackupFailed` | 1 | Backup failure | jobId, error |
| `SystemHealthAlert` | 1 | Threshold breach | metric, value, severity |

---

## Sync & Offline (3)

| eventName | v | Trigger | Key Payload Fields |
|-----------|---|---------|-------------------|
| `SyncBatchUploaded` | 1 | Device sync | deviceId, eventCount, lastSequence |
| `SyncConflictDetected` | 1 | Conflict | deviceId, localEvent, serverState |
| `SyncCompleted` | 1 | Sync success | deviceId, eventsProcessed |

---

## Reporting (1)

| eventName | v | Trigger | Key Payload Fields |
|-----------|---|---------|-------------------|
| `ReportGenerated` | 1 | Report export | reportType, period, format, url |

---

## Hierarchy & Settings (2)

| eventName | v | Trigger | Key Payload Fields |
|-----------|---|---------|-------------------|
| `TenantSettingsUpdated` | 1 | Settings change | businessId, changes |
| `FeatureFlagToggled` | 1 | Feature on/off | businessId, flag, enabled |

---

## Event Count Summary

| Module | Count |
|--------|-------|
| POS & Orders | 12 |
| Inventory | 11 |
| Purchase | 7 |
| Finance | 9 |
| Kitchen | 6 |
| Recipe & Production | 6 |
| Shift & Operations | 5 |
| Approval | 4 |
| CRM | 3 |
| Payroll & HR | 4 |
| Auth | 3 |
| Notification | 2 |
| Backup & System | 4 |
| Sync | 3 |
| Reporting | 1 |
| Settings | 2 |
| **TOTAL** | **62** |

---

## Handler Subscription Matrix (Summary)

| Handler | Subscribes To |
|---------|---------------|
| InventoryProjectionHandler | Inventory*, PurchaseReceived, ProductionCompleted |
| FinanceProjectionHandler | Sale*, Payment*, Expense*, Payroll*, Cashflow* |
| DashboardProjectionHandler | Sale*, Expense*, Shift*, DailyClosing*, LowStock* |
| KitchenProjectionHandler | Sale*, OrderItem*, Kitchen* |
| SalesProjectionHandler | Sale*, Order*, Refund*, Payment* |
| AnalyticsProjectionHandler | Sale*, Inventory*, Purchase*, Production* |
| AIProjectionHandler | All (feature-flagged) |
| AuditTimelineHandler | **ALL** |
| NotificationHandler | LowStock*, Expiry*, Approval*, SystemHealth*, Backup* |

See [19-saga-process-manager.md](./19-saga-process-manager.md) for orchestration.
