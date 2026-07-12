# Business Flowcharts

**Project:** Warung Nafisah ERP  
**Document ID:** WN-FLOW-001  
**Version:** 1.1.0  
**Status:** Draft — Awaiting Re-Approval

---

## 1. System Context Flow

```mermaid
flowchart TB
    subgraph External
        Customer[Pelanggan]
        Supplier[Pemasok]
    end

    subgraph WarungNafisahERP
        POS[POS Module]
        Kitchen[Kitchen Module]
        Inventory[Inventory Module]
        Finance[Financial Ledger]
        Reports[Reports & Dashboard]
        HR[HR Module]
    end

    subgraph Users
        Cashier[Kasir]
        KitchenStaff[Staff Dapur]
        InvStaff[Staff Inventori]
        Manager[Manager]
        Owner[Pemilik]
        Investor[Investor]
    end

    Customer -->|Pesan| POS
    Cashier --> POS
    POS -->|KOT| Kitchen
    KitchenStaff --> Kitchen
    InvStaff --> Inventory
    Supplier -->|Kirim Bahan| Inventory
    Manager --> Inventory
    Manager --> Finance
    Owner --> Reports
    Investor -->|Read Only| Reports

    POS --> Finance
    Inventory --> Finance
    Finance --> Reports
    HR --> Finance
```

---

## 2. POS Sale Flow (Zero Duplicate Input)

```mermaid
flowchart TD
    A[Kasir Buka POS] --> B{Shift Aktif?}
    B -->|Tidak| B1[Tampilkan Menu Semua]
    B -->|Ya| B2[Filter Menu by Shift]
    B1 --> C[Pilih Item Menu]
    B2 --> C
    C --> D[Tambah ke Keranjang]
    D --> E{Selesai?}
    E -->|Tidak| C
    E -->|Ya| F[Hitung Subtotal]
    F --> G{Ada Diskon?}
    G -->|Ya| G1{Perlu Approval?}
    G1 -->|Ya| G2[Manager Approve]
    G1 -->|Tidak| H
    G2 --> H[Pilih Metode Bayar]
    G -->|Tidak| H
    H --> I{Stok Cukup?}
    I -->|Tidak| I1[Blok / Override Manager]
    I1 --> H
    I -->|Ya| J[Konfirmasi Pembayaran]

    J --> K["ATOMIC TRANSACTION"]
    K --> K1[Buat Order]
    K --> K2[Buat Payment]
    K --> K3[Konsumsi Bahan FIFO]
    K --> K4[Hitung HPP per Item]
    K --> K5[Hitung Profit]
    K --> K6[Catat Cashflow IN]
    K --> K7[Kirim KOT]
    K --> K8[Audit Log]

    K8 --> L[Cetak Struk]
    L --> M[Update Dashboard]
    M --> N[Selesai]
```

---

## 3. Purchase Flow

```mermaid
flowchart TD
    A[Staff Buat Purchase Order] --> B[Pilih Supplier]
    B --> C[Tambah Item + Qty + Harga]
    C --> D[Simpan PO - Status: Ordered]
    D --> E{Barang Datang?}
    E -->|Tidak| F[Tunggu]
    F --> E
    E -->|Ya| G[Konfirmasi Penerimaan]

    G --> H["ATOMIC TRANSACTION"]
    H --> H1[Buat Stock Batch FIFO]
    H --> H2[Update currentStock]
    H --> H3[Catat Stock History IN]
    H --> H4[Catat Expense COGS]
    H --> H5[Catat Cashflow OUT]
    H --> H6[Update Supplier History]
    H --> H7[PO Status: Received]
    H --> H8[Audit Log]

    H8 --> I[Refresh Low Stock Alert]
    I --> J[Update Dashboard]
```

---

## 4. Production Flow

```mermaid
flowchart TD
    A[Pilih Resep Produksi] --> B[Input Jumlah Hasil]
    B --> C[Sistem Hitung Bahan Diperlukan]
    C --> D{Stok Bahan Cukup?}
    D -->|Tidak| D1[Tampilkan Kekurangan]
    D1 --> A
    D -->|Ya| E[Konfirmasi Produksi]

    E --> F["ATOMIC TRANSACTION"]
    F --> F1[Kurangi Bahan Baku FIFO OUT]
    F --> F2[Hitung Total Biaya Produksi]
    F --> F3[Tambah Produk Jadi FIFO IN]
    F --> F4[Catat Stock History]
    F --> F5[Audit Log]

    F5 --> G[Selesai]
```

---

## 5. Recipe & HPP Calculation Flow

```mermaid
flowchart TD
    A[Manager Buka Resep] --> B[Pilih Menu Item]
    B --> C[Tambah Bahan + Qty + Unit]
    C --> D{Unit Valid?}
    D -->|Tidak| D1[Error: Unit Mismatch]
    D1 --> C
    D -->|Ya| E[Ambil Harga FIFO tiap Bahan]
    E --> F[HPP = Σ qty × unitCost]
    F --> G[Simpan Resep + HPP]
    G --> H[Simpan Version History]
    H --> I[HPP Tersedia untuk POS]
```

---

## 6. Refund Flow

```mermaid
flowchart TD
    A[Kasir Pilih Order Selesai] --> B[Klik Refund]
    B --> C[Input Alasan]
    C --> D{Perlu Approval?}
    D -->|Ya| E[Manager Approve]
    D -->|Tidak| F
    E --> F["ATOMIC TRANSACTION"]
    F --> F1[Order Status: Refunded]
    F --> F2[Payment Refund Record]
    F --> F3[Cashflow OUT]
    F --> F4{Kembalikan Stok?}
    F4 -->|Ya| F5[Stock IN - jika belum dikonsumsi]
    F4 -->|Tidak| F6
    F5 --> F6[Reverse Profit]
    F6 --> F7[Audit Log]
    F7 --> G[Update Dashboard]
```

---

## 7. End-of-Day Shift Close Flow

```mermaid
flowchart TD
    A[Manager/Kasir Tutup Shift] --> B[Generate Rekonsiliasi]
    B --> C[Tampilkan Total per Metode Bayar]
    C --> D[Input Hitungan Kas Fisik]
    D --> E{Ada Selisih?}
    E -->|Ya| F[Catat Selisih + Alasan]
    E -->|Tidak| G
    F --> G[Manager Konfirmasi Tutup Shift]
    G --> H[Simpan Shift Summary]
    H --> I[Audit Log]
    I --> J[Dashboard Final Hari Ini]
```

---

## 8. Authentication & Authorization Flow

```mermaid
flowchart TD
    A[User Login] --> B[Validasi Credentials]
    B -->|Gagal| B1[Increment Failed Attempts]
    B1 --> B2{Locked?}
    B2 -->|Ya| B3[Tampilkan Lockout]
    B2 -->|Tidak| A
    B -->|Berhasil| C[Generate JWT Access + Refresh]
    C --> D{Role?}
    D -->|Investor| E[Investor Dashboard - Read Only]
    D -->|Cashier| F[POS Screen]
    D -->|Kitchen| G[KOT Screen]
    D -->|Inventory| H[Inventory Module]
    D -->|Manager/Owner| I[Full Dashboard]

    I --> J[Setiap API Request]
    J --> K[Verify JWT]
    K --> L[Check RBAC Permission]
    L --> M[Check Outlet Scope]
    M --> N[Process Request]
```

---

## 9. Report Generation Flow

```mermaid
flowchart TD
    A[User Pilih Jenis Laporan] --> B[Pilih Periode]
    B --> C{Jenis?}
    C -->|Penjualan| D[Aggregate orders by period]
    C -->|Pengeluaran| E[Aggregate expenses + purchases]
    C -->|Profit| F[Revenue - HPP - Expenses]
    C -->|Inventori| G[Current stock + movements]
    C -->|Cashflow| H[Aggregate cashflow_entries]
    C -->|Best/Worst Seller| I[Aggregate order lines]

    D --> J[Tampilkan Chart + Tabel]
    E --> J
    F --> J
    G --> J
    H --> J
    I --> J
    J --> K{Export?}
    K -->|PDF| L[Generate PDF]
    K -->|CSV| M[Generate CSV]
    K -->|Tidak| N[Selesai]
```

---

## 10. Notification Flow

```mermaid
flowchart TD
    A[Event Trigger] --> B{Event Type?}
    B -->|Stock < Min| C[Low Stock Notification]
    B -->|Expiry < 7 days| D[Expiry Notification]
    B -->|Order Ready| E[Kitchen → Cashier Alert]
    B -->|Purchase Received| F[Stock Updated Alert]

    C --> G[Simpan ke notifications]
    D --> G
    E --> G
    F --> G
    G --> H[Tampilkan di Notification Center]
    H --> I[User Mark as Read]
```

---

## 11. Daily Operations Timeline

```
05:00 ─── Staff datang, clock in
05:30 ─── Cek stok bahan pagi
06:00 ─── Produksi batch (Gendum kuah) jika perlu
07:00 ─── SHIFT PAGI BUKA — POS aktif (Gendum Kuah Tetelan)
14:00 ─── SHIFT PAGI TUTUP — rekonsiliasi
15:00 ─── Persiapan shift malam, produksi jika perlu
17:00 ─── SHIFT MALAM BUKA — POS aktif (Pecel Lele, Ayam Penyet)
22:00 ─── SHIFT MALAM TUTUP — rekonsiliasi
22:30 ─── Staff clock out
23:00 ─── Manager review dashboard harian
```

---

## 12. Event-Driven Flow (v1.1 — Business Event DNA)

```mermaid
flowchart TD
  A[User Action - e.g. Complete Sale] --> B[Command Handler]
  B --> C["MongoDB Transaction"]
  C --> D[Persist Aggregate - Order]
  C --> E["Append business_events - SaleCompleted"]
  C --> F[Commit]
  F --> G[Event Bus Dispatch]

  G --> H1[InventoryHandler]
  G --> H2[CashflowHandler]
  G --> H3[DashboardHandler]
  G --> H4[KDS WebSocket]
  G --> H5[NotificationHandler]
  G --> H6[AuditTimelineHandler]
  G --> H7[AnalyticsHandler]
  G --> H8[ReceiptHandler]

  H1 --> P1[stock_batches + stock_history]
  H2 --> P2[cashflow_entries]
  H3 --> P3[dashboard projection]
  H6 --> P4[audit_timeline]
  H7 --> P5[analytics_projections]
```

> **Business Event DNA:** Every action creates a permanent `business_events` record. Handlers produce all downstream effects — never duplicate input.

---

## 13. Approval Workflow Flow

```mermaid
flowchart TD
  A[Cashier: Apply Large Discount] --> B[Create ApprovalRequest]
  B --> C[ApprovalRequested Event]
  C --> D[Notification to Manager]
  D --> E{Manager Decision}
  E -->|Approve| F[ApprovalGranted Event]
  E -->|Reject| G[ApprovalRejected Event]
  F --> H[Original Action Executes]
  G --> I[Action Blocked - Notify Cashier]
  H --> J[SaleCompleted Event → Handlers]
```

---

## 14. Offline POS Sync Flow

```mermaid
flowchart TD
  A[POS Offline] --> B[SaleCompleted queued in IndexedDB]
  B --> C{Internet Restored?}
  C -->|No| B
  C -->|Yes| D[Sync Agent uploads event batch]
  D --> E{eventId exists?}
  E -->|Yes| F[Skip - Idempotent]
  E -->|No| G[Append to business_events]
  G --> H[Dispatch Handlers]
  D --> I{Conflict?}
  I -->|Yes| J[sync_conflicts + Manager review]
  I -->|No| K[Sync Complete]
```

---

## 15. Daily Closing Flow

```mermaid
flowchart TD
  A[Manager: Start Daily Closing] --> B[Aggregate ShiftClosed events]
  B --> C[Calculate Expected per Payment Method]
  C --> D[Input Actual Cash Count]
  D --> E{Variance?}
  E -->|Yes| F[Record Variance + Reason]
  E -->|No| G
  F --> G[Generate PDF Report]
  G --> H[DailyClosingCompleted Event]
  H --> I[Lock Day Transactions]
  H --> J[Update Dashboard + Investor View]
  H --> K[Audit Timeline Entry]
```
