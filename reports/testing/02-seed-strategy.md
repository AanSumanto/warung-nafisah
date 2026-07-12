# Seed Strategy — Architecture Freeze

**Document ID:** WN-TEST-002  
**Version:** 1.0.0 (Phase 0.5)  
**Status:** FROZEN

---

## 1. Seed Tiers

| Tier | Command | Purpose | Environment |
|------|---------|---------|-------------|
| **Master** | `npm run seed:master` | System-required reference data | all |
| **Demo** | `npm run seed:demo` | Full demo business | dev, staging |
| **Test** | `npm run seed:test` | Minimal for automated tests | test, CI |
| **Empty** | — | Production starts empty | production |

---

## 2. Master Data (Required)

| Collection | Data |
|------------|------|
| `unit_definitions` | kg, gram, liter, ml, pcs, pack, botol, ikat |
| `unit_conversions` | 1 kg = 1000 gram, 1 liter = 1000 ml |
| Event registry | Validate 62 event schemas loaded |

---

## 3. Demo Business Seed

### Hierarchy

| Entity | Value |
|--------|-------|
| Business Group | `Soemanto F&B Group` |
| Business | `Warung Nafisah` |
| Outlet | `Warung Nafisah Pusat` |
| Warehouses | `Gudang Dapur`, `Gudang Kering`, `Kulkas` |

### Users (password: `Demo@2026`)

| Email | Role |
|-------|------|
| owner@warungnafisah.id | owner |
| manager@warungnafisah.id | general_manager |
| finance@warungnafisah.id | finance |
| purchasing@warungnafisah.id | purchasing |
| warehouse@warungnafisah.id | warehouse |
| kitchen@warungnafisah.id | kitchen |
| cashier@warungnafisah.id | cashier |
| investor@warungnafisah.id | investor |
| admin@warungnafisah.id | admin |
| auditor@warungnafisah.id | auditor |

### Menu & Recipes

| Menu | Shift | Recipe Version |
|------|-------|----------------|
| Gendum Kuah Tetelan | morning | v1 |
| Pecel Lele | evening | v1 |
| Ayam Penyet | evening | v1 |
| Es Teh Manis | all | v1 |
| Nasi Putih | all | v1 |

### Inventory (sample)

| SKU | Type | Warehouse | Base Unit |
|-----|------|-----------|-----------|
| RM-BERAS | raw_material | Gudang Kering | kg |
| RM-LELE | raw_material | Kulkas | kg |
| RM-AYAM | raw_material | Kulkas | kg |
| RM-SAMBAL | raw_material | Gudang Dapur | gram |
| RM-MINYAK | raw_material | Gudang Kering | liter |
| FG-KUAH | finished_good | Gudang Dapur | liter |

### Suppliers

| Name | Items |
|------|-------|
| Pasar Induk | RM-BERAS, RM-LELE |
| Supplier Ayam Jaya | RM-AYAM |
| Toko Sembako | RM-MINYAK |

### Tenant Settings

- timezone: `Asia/Jakarta`
- currency: `IDR`
- All payment methods enabled
- KDS enabled
- Offline sync enabled

---

## 4. Test Seed (Minimal)

| Entity | Count |
|--------|-------|
| Business Group | 1 |
| Business | 1 |
| Outlet | 1 |
| Warehouse | 1 |
| User | 3 (owner, cashier, kitchen) |
| Menu items | 2 |
| Inventory items | 5 |
| Recipe versions | 2 |

Used by integration tests — created in `beforeAll`, torn down in `afterAll`.

---

## 5. Seed Implementation Rules

| Rule | Detail |
|------|--------|
| Idempotent | `upsert` by natural key |
| Uses Commands | Seed via command handlers (not raw insert) — generates proper events |
| Event history | Demo seed includes sample `business_events` for dashboard |
| No production | `seed:demo` blocked if `NODE_ENV=production` |

---

## 6. File Location

```
scripts/seed/
├── master.ts
├── demo.ts
├── test.ts
├── data/
│   ├── units.json
│   ├── demo-menu.json
│   ├── demo-recipes.json
│   └── demo-inventory.json
└── index.ts
```

---

## 7. Demo Scenario Scripts

| Script | Events Generated |
|--------|------------------|
| `seed:demo:day` | 1 day of sales, purchases, shifts |
| `seed:demo:week` | 7 days for report testing |
