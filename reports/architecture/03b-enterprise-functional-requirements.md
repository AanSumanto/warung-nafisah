# Enterprise Functional Requirements (v1.1 Addendum)

**Project:** Warung Nafisah ERP  
**Document ID:** WN-FR-002  
**Version:** 1.1.0  
**Status:** Draft — Awaiting Approval  
**Parent:** [03-functional-requirements.md](./03-functional-requirements.md)

---

## 21. Organizational Hierarchy

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-HIER-001 | System shall support Business Group → Business → Outlet → Warehouse hierarchy | P0 |
| FR-HIER-002 | Owner shall manage multiple businesses under a group | P0 |
| FR-HIER-003 | Each outlet shall have one or more warehouses | P0 |
| FR-HIER-004 | Inventory operations shall be scoped to warehouse | P0 |
| FR-HIER-005 | User access shall be scoped to hierarchy levels | P0 |
| FR-HIER-006 | All business events shall carry full hierarchy scope | P0 |

---

## 22. Business Events (DNA)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-EVENT-001 | Every business action shall create immutable business_events record | P0 |
| FR-EVENT-002 | Events shall be idempotent via global eventId | P0 |
| FR-EVENT-003 | Downstream effects shall be triggered by event handlers only | P0 |
| FR-EVENT-004 | Event consumers shall be idempotent (event_consumer_log) | P0 |
| FR-EVENT-005 | Events shall be replayable to rebuild projections | P1 |
| FR-EVENT-006 | Events shall be exportable for AI/analytics | P2 |

---

## 23. Recipe Versioning

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-RVER-001 | Recipe changes shall create new immutable version | P0 |
| FR-RVER-002 | Order lines shall store recipeVersionId at sale time | P0 |
| FR-RVER-003 | Past order HPP shall not change when recipe updates | P0 |
| FR-RVER-004 | System shall emit RecipeVersionCreated event | P0 |
| FR-RVER-005 | Version history shall be viewable by Manager | P1 |

---

## 24. Purchase Price History

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-PPH-001 | Every purchase receipt shall record price in purchase_price_history | P1 |
| FR-PPH-002 | History shall include supplier, unit, unitPrice, date | P1 |
| FR-PPH-003 | Manager shall view price trend per item per supplier | P2 |
| FR-PPH-004 | PurchasePriceRecorded event on each receipt line | P1 |

---

## 25. Unit Conversion

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-UNIT-001 | System shall support units: kg, gram, liter, ml, pcs, pack, etc. | P0 |
| FR-UNIT-002 | Each inventory item shall have a base unit | P0 |
| FR-UNIT-003 | Recipes may specify ingredients in units different from base | P0 |
| FR-UNIT-004 | System shall auto-convert on consumption and receipt | P0 |
| FR-UNIT-005 | Conversion rules configurable per item or globally | P1 |
| FR-UNIT-006 | Conversion details logged in event payload | P0 |

---

## 26. Kitchen Display System (KDS)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-KDS-001 | Dedicated KDS screen at /kitchen route | P0 |
| FR-KDS-002 | Real-time order display via WebSocket | P0 |
| FR-KDS-003 | Kitchen staff shall mark items/orders preparing and ready | P0 |
| FR-KDS-004 | Orders color-coded by wait time | P1 |
| FR-KDS-005 | Station routing (grill, fryer, prep) configurable | P2 |
| FR-KDS-006 | KDS operates independently from POS receipt printing | P0 |

---

## 27. Offline-First POS

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-OFF-001 | POS shall queue business events locally when offline | P1 |
| FR-OFF-002 | Local storage via IndexedDB | P1 |
| FR-OFF-003 | Auto-sync events on reconnect | P1 |
| FR-OFF-004 | UI shall show online/offline/syncing status | P1 |
| FR-OFF-005 | Server shall deduplicate events by eventId | P1 |
| FR-OFF-006 | Sync conflicts flagged for Manager review | P1 |

---

## 28. Notification Engine

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-NENG-001 | Notifications triggered by business events | P1 |
| FR-NENG-002 | Alert types: low stock, expiry, gas, approval pending, health | P1 |
| FR-NENG-003 | Configurable rules per business/outlet | P1 |
| FR-NENG-004 | In-app notification center | P1 |
| FR-NENG-005 | WhatsApp delivery for critical alerts | P3 |
| FR-NENG-006 | Email delivery | P3 |

---

## 29. Daily Closing

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-CLOSE-001 | Manager shall perform daily closing per outlet | P0 |
| FR-CLOSE-002 | System shall auto-reconcile expected vs actual per payment method | P0 |
| FR-CLOSE-003 | Closing shall aggregate all shifts for the day | P0 |
| FR-CLOSE-004 | PDF report generated and stored on closing | P0 |
| FR-CLOSE-005 | DailyClosingCompleted event emitted | P0 |
| FR-CLOSE-006 | Day locked after closing; override requires Owner | P1 |

---

## 30. Approval Workflow

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-APPR-001 | Discount above threshold requires approval | P0 |
| FR-APPR-002 | Void requires Manager approval | P0 |
| FR-APPR-003 | Refund requires Manager approval | P0 |
| FR-APPR-004 | Purchase above threshold requires approval | P1 |
| FR-APPR-005 | Payroll requires Owner approval | P2 |
| FR-APPR-006 | ApprovalRequested/Granted/Rejected events emitted | P0 |
| FR-APPR-007 | Original action blocked until approval granted | P0 |

---

## 31. Shift Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-SHIFT-001 | Cashier shall open/close shift with cash float | P0 |
| FR-SHIFT-002 | Kitchen shall open/close kitchen shift | P0 |
| FR-SHIFT-003 | POS requires active cashier shift for sales | P0 |
| FR-SHIFT-004 | ShiftOpened/ShiftClosed events emitted | P0 |
| FR-SHIFT-005 | Shift reconciliation: expected vs actual cash | P0 |
| FR-SHIFT-006 | All sales linked to shiftId | P0 |

---

## 32. Digital Receipt

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-RCPT-001 | Thermal print receipt (ESC/POS) | P0 |
| FR-RCPT-002 | QR code linking to public receipt URL | P1 |
| FR-RCPT-003 | WhatsApp receipt delivery | P3 |
| FR-RCPT-004 | Email receipt delivery | P3 |
| FR-RCPT-005 | Receipt data from SaleCompleted event snapshot | P0 |

---

## 33. Audit Timeline

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AUDT-001 | Every business event generates audit_timeline entry | P0 |
| FR-AUDT-002 | Timeline human-readable with actor name | P0 |
| FR-AUDT-003 | Filterable by user, entity, date, outlet, event type | P0 |
| FR-AUDT-004 | Timeline is immutable (append-only) | P0 |
| FR-AUDT-005 | Linked to businessEventId | P0 |

---

## 34. Backup

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-BAK-001 | Daily automated local mongodump | P1 |
| FR-BAK-002 | Daily automated cloud upload | P1 |
| FR-BAK-003 | BackupCompleted/BackupFailed events | P1 |
| FR-BAK-004 | Notification on backup failure | P1 |
| FR-BAK-005 | Retention: local 7 days, cloud 90 days (configurable) | P1 |

---

## 35. System Health

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-HEALTH-001 | Health dashboard for Owner at /admin/health | P1 |
| FR-HEALTH-002 | Metrics: API latency, DB status, queue depth, disk, backup | P1 |
| FR-HEALTH-003 | SystemHealthAlert event on threshold breach | P1 |
| FR-HEALTH-004 | GET /health endpoint for load balancer | P0 |

---

## 36. AI / Analytics

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AI-001 | analytics_projections populated by event handlers | P2 |
| FR-AI-002 | Event stream export API (paginated) | P2 |
| FR-AI-003 | Projections: hourly sales, item demand, price trends | P2 |
| FR-AI-004 | Correlation IDs for causal chain analysis | P1 |

---

**Total enterprise addendum:** ~75 additional functional requirements
