# Error Code Catalog — Architecture Freeze

**Document ID:** WN-API-002  
**Version:** 1.0.0 (Phase 0.5)  
**Status:** FROZEN

---

## 1. Response Envelope (Frozen)

```json
{
  "success": false,
  "error": {
    "code": "ORDER_004",
    "message": "Stok bahan tidak mencukupi",
    "details": { "itemId": "...", "required": 500, "available": 200 },
    "requestId": "req_abc123",
    "timestamp": "2026-07-01T10:30:00Z"
  }
}
```

---

## 2. HTTP Status Mapping (Frozen)

| HTTP | Usage |
|------|-------|
| 400 | Validation error, bad request |
| 401 | Unauthenticated |
| 403 | Permission denied |
| 404 | Resource not found |
| 409 | Conflict (duplicate eventId, doc number, sync conflict) |
| 422 | Business rule violation |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
| 503 | Service unavailable (DB down) |

---

## 3. Error Code Catalog

### AUTH — Authentication (HTTP 401/403)

| Code | HTTP | Message (ID) |
|------|------|--------------|
| AUTH_001 | 401 | Kredensial tidak valid |
| AUTH_002 | 401 | Token kedaluwarsa |
| AUTH_003 | 401 | Token refresh tidak valid |
| AUTH_004 | 403 | Akun terkunci |
| AUTH_005 | 403 | Tidak memiliki akses ke outlet ini |
| AUTH_006 | 403 | Tidak memiliki akses ke bisnis ini |
| AUTH_007 | 403 | Role tidak diizinkan |
| AUTH_008 | 401 | Sesi telah berakhir |

### ORDER — Orders & POS (HTTP 422/409)

| Code | HTTP | Message (ID) |
|------|------|--------------|
| ORDER_001 | 422 | Shift belum dibuka |
| ORDER_002 | 422 | Keranjang kosong |
| ORDER_003 | 422 | Menu tidak aktif |
| ORDER_004 | 422 | Stok bahan tidak mencukupi |
| ORDER_005 | 409 | Order sudah diselesaikan |
| ORDER_006 | 422 | Order sudah dibatalkan |
| ORDER_007 | 422 | Persetujuan diskon diperlukan |
| ORDER_008 | 422 | Persetujuan void diperlukan |
| ORDER_009 | 422 | Persetujuan refund diperlukan |
| ORDER_010 | 422 | Hari sudah ditutup |

### PAYMENT — Payments (HTTP 422)

| Code | HTTP | Message (ID) |
|------|------|--------------|
| PAYMENT_001 | 422 | Metode pembayaran tidak valid |
| PAYMENT_002 | 422 | Jumlah pembayaran tidak sesuai |
| PAYMENT_003 | 422 | Referensi QRIS/transfer wajib |
| PAYMENT_004 | 409 | Pembayaran duplikat |
| PAYMENT_005 | 422 | Refund melebihi jumlah pembayaran |

### INVENTORY — Inventory (HTTP 422)

| Code | HTTP | Message (ID) |
|------|------|--------------|
| INVENTORY_001 | 404 | Item inventori tidak ditemukan |
| INVENTORY_002 | 422 | Stok tidak boleh negatif |
| INVENTORY_003 | 422 | Batch FIFO tidak tersedia |
| INVENTORY_004 | 422 | Konversi unit gagal |
| INVENTORY_005 | 422 | Gudang tidak valid |
| INVENTORY_006 | 422 | Persetujuan penyesuaian diperlukan |
| INVENTORY_007 | 422 | Item sudah kedaluwarsa |
| INVENTORY_008 | 409 | Transfer stok konflik |
| INVENTORY_009 | 422 | SKU duplikat |
| INVENTORY_010 | 422 | Unit dasar tidak valid |
| INVENTORY_011 | 422 | Jumlah waste tidak valid |
| INVENTORY_012 | 422 | Stok di bawah minimum — override diperlukan |

### LEDGER — Finance (HTTP 422)

| Code | HTTP | Message (ID) |
|------|------|--------------|
| LEDGER_001 | 422 | Entri kas tidak seimbang |
| LEDGER_002 | 422 | Mata uang tidak cocok |
| LEDGER_003 | 422 | Rekonsiliasi gagal |
| LEDGER_004 | 422 | Hari belum ditutup |
| LEDGER_005 | 422 | Hari sudah dikunci |

### KITCHEN — KDS (HTTP 422)

| Code | HTTP | Message (ID) |
|------|------|--------------|
| KITCHEN_001 | 404 | Tiket dapur tidak ditemukan |
| KITCHEN_002 | 422 | Item sudah siap |
| KITCHEN_003 | 422 | Stasiun dapur tidak valid |
| KITCHEN_004 | 422 | Shift dapur belum dibuka |
| KITCHEN_005 | 422 | Order belum dikonfirmasi |
| KITCHEN_006 | 422 | Status transisi tidak valid |
| KITCHEN_007 | 422 | Tiket sudah di-bump |

### APPROVAL — Workflow (HTTP 422)

| Code | HTTP | Message (ID) |
|------|------|--------------|
| APPROVAL_001 | 404 | Permintaan persetujuan tidak ditemukan |
| APPROVAL_002 | 422 | Permintaan sudah diproses |
| APPROVAL_003 | 422 | Permintaan kedaluwarsa |
| APPROVAL_004 | 403 | Tidak berwenang menyetujui |
| APPROVAL_005 | 422 | Level persetujuan tidak mencukupi |

### PURCHASE — Purchasing (HTTP 422)

| Code | HTTP | Message (ID) |
|------|------|--------------|
| PURCHASE_001 | 422 | PO sudah diterima |
| PURCHASE_002 | 422 | PO dibatalkan |
| PURCHASE_003 | 422 | Persetujuan pembelian diperlukan |
| PURCHASE_004 | 422 | Supplier tidak aktif |
| PURCHASE_005 | 422 | Jumlah penerimaan melebihi PO |

### RECIPE — Recipes (HTTP 422)

| Code | HTTP | Message (ID) |
|------|------|--------------|
| RECIPE_001 | 422 | Resep belum didefinisikan |
| RECIPE_002 | 422 | Bahan resep tidak valid |
| RECIPE_003 | 422 | Versi resep tidak ditemukan |

### SHIFT — Shifts (HTTP 422)

| Code | HTTP | Message (ID) |
|------|------|--------------|
| SHIFT_001 | 422 | Shift sudah dibuka |
| SHIFT_002 | 422 | Shift belum dibuka |
| SHIFT_003 | 422 | Shift sudah ditutup |
| SHIFT_004 | 422 | Selisih kas melebihi batas |

### SYNC — Offline (HTTP 409)

| Code | HTTP | Message (ID) |
|------|------|--------------|
| SYNC_001 | 409 | Event duplikat |
| SYNC_002 | 409 | Konflik sinkronisasi |
| SYNC_003 | 422 | Batch sync tidak valid |
| SYNC_004 | 422 | Device tidak terdaftar |

### EVENT — Event Store (HTTP 409/500)

| Code | HTTP | Message (ID) |
|------|------|--------------|
| EVENT_001 | 409 | Event duplikat (eventId) |
| EVENT_002 | 422 | Schema event tidak valid |
| EVENT_003 | 422 | Versi event tidak didukung |
| EVENT_004 | 500 | Gagal menyimpan event |

### SYSTEM — Infrastructure (HTTP 500/503)

| Code | HTTP | Message (ID) |
|------|------|--------------|
| SYSTEM_001 | 503 | Database tidak tersedia |
| SYSTEM_002 | 503 | Queue tidak tersedia |
| SYSTEM_003 | 500 | Kesalahan internal |
| SYSTEM_004 | 429 | Terlalu banyak permintaan |

---

## 4. Domain Error → API Error Mapping

```typescript
// Domain throws
throw new DomainError('ORDER_004', { itemId, required, available });

// Middleware maps to HTTP 422 + envelope
```

---

## 5. Shared Location

```
shared/constants/error-codes.ts   # source of truth
```

---

## 6. Total Codes: 72
