# RawBT Bluetooth Printing Bridge

**Sprint:** 4.5.3  
**Version:** 0.11.3  
**Printer:** Blueprint BP-ECO58 (Bluetooth Classic / SPP)  
**Bridge:** [RawBT](https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter)

## Architecture Diagram

```
Order Aggregate (snapshot)
        ↓
  ReceiptBuilder          ← Single Source of Truth (unchanged)
        ↓
   Receipt Object
        ↓
  EscPosRenderer          ← Reusable (unchanged)
        ↓
   Uint8Array ESC/POS
        ↓
  PrinterAdapter          ← Abstraction boundary
        ↓
 RawBtPrinterAdapter      ← Sprint 4.5.3 only
        ↓
   RawBT (Android app)
        ↓
 Blueprint BP-ECO58
```

POS pages never import RawBT APIs. All bridge logic lives in `frontend/src/features/printing/adapters/RawBtPrinterAdapter.ts` and `rawbt/rawbtBridge.ts`.

## RawBT Flow

1. Kasir menekan **Cetak Struk** (bottom sheet) atau **Cetak Ulang** (riwayat).
2. `PrintService.print()` / `reprint()` membangun `Receipt` via `ReceiptBuilder`.
3. `EscPosRenderer.render(receipt)` → `Uint8Array`.
4. `RawBtPrinterAdapter` meng-encode bytes ke base64.
5. Intent URL dibuka:
   ```
   intent:rawbt:base64,<payload>#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end
   ```
6. RawBT menerima data ESC/POS dan mengirim ke printer via Bluetooth Classic.
7. Snackbar menampilkan status (bukan `alert()`).

## ESC/POS Flow

| Step | Component | Output |
|------|-----------|--------|
| 1 | `ReceiptBuilder.build(order)` | `Receipt` object |
| 2 | `EscPosRenderer.render(receipt)` | `Uint8Array` (INIT, align, bold, feed, cut) |
| 3 | `bytesToBase64(bytes)` | Base64 string |
| 4 | `dispatchRawBtPrint(base64)` | Android intent → RawBT |

Receipt Builder dan ESC/POS Renderer **tidak berubah** dari Sprint 4.5.2.

## Bluetooth Flow

| Layer | Technology | Notes |
|-------|------------|-------|
| Browser | Web app (Next.js) | Tidak akses Bluetooth Classic |
| Bridge | RawBT Android app | SPP proxy untuk thermal printer |
| Printer | Blueprint BP-ECO58 | 58mm thermal, ESC/POS |

Kasir menghubungkan printer di aplikasi RawBT (pairing Bluetooth). Aplikasi web hanya mengirim payload ESC/POS.

## Printer Adapter Interface

```typescript
interface PrinterAdapter {
  print(data: Uint8Array): Promise<void>;
  reprint(data: Uint8Array): Promise<void>;
  preview(data: Uint8Array): Promise<void>;
  isAvailable(): Promise<boolean>;
  // + connect, disconnect, getStatus, isConnected
}
```

Implementations:

| Adapter | Use case |
|---------|----------|
| `RawBtPrinterAdapter` | Production Android + Blueprint BP-ECO58 |
| `BrowserPrintAdapter` | Desktop fallback (`window.print`) |
| `BlueprintEco58BluetoothAdapter` | Legacy Web Bluetooth (not used for SPP) |

## Error Handling

| Condition | UI |
|-----------|-----|
| RawBT not installed | Dialog + tombol **Install RawBT** → Play Store |
| Print in progress | Snackbar info |
| Print success | Snackbar success |
| Other errors | Snackbar error |

`RawBtNotInstalledError` dipakai agar POS tidak perlu mengenal detail intent RawBT.

## Printer Readiness States

| State | Meaning |
|-------|---------|
| Printer Siap | Android + RawBT terpasang + user menandai printer terhubung |
| Printer Belum Terhubung | RawBT terpasang, belum dikonfirmasi di konfigurasi |
| RawBT Belum Terpasang | Probe intent gagal |
| Printer Tidak Tersedia | Non-Android / browser fallback |

Konfigurasi di `/profil` → **Konfigurasi Printer**.

## Reprint Flow

```
Riwayat Transaksi → icon cetak → ReceiptPreviewSheet (mode=reprint)
        ↓
PrintService.reprint(receipt)
        ↓
(same ESC/POS → RawBT path)
```

## Future Migration Plan

Jika dibuat **Android Native Print Bridge** sendiri:

| Layer | Change? |
|-------|---------|
| ReceiptBuilder | No |
| Receipt Object | No |
| EscPosRenderer | No |
| PrinterAdapter interface | Minimal (new native adapter) |
| RawBtPrinterAdapter | Replaced by `NativeBluetoothAdapter` |
| POS UI | No RawBT-specific code |

Hanya **Printer Adapter** yang diganti. Arsitektur Sprint 4.5.2–4.5.3 tetap valid.

### Future connection methods (config UI placeholders)

- WiFi
- USB
- LAN

## File Map

| Path | Role |
|------|------|
| `adapters/RawBtPrinterAdapter.ts` | RawBT adapter |
| `rawbt/rawbtBridge.ts` | Intent, base64, probe |
| `components/RawBtNotInstalledDialog.tsx` | Install dialog |
| `components/PrinterConfigPanel.tsx` | `/profil` config |
| `components/PrinterStatusChip.tsx` | Readiness indicator |
| `services/PrintService.ts` | Orchestration |

## Not Implemented (per sprint scope)

- Web Bluetooth for SPP
- Native Android module
- Kitchen printer / ticket
- Print queue worker
- Offline printing queue
