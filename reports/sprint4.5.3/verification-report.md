# Sprint 4.5.3 — Verification

## Architecture

- [x] Receipt from `ReceiptBuilder` only
- [x] ESC/POS via `EscPosRenderer` (reusable)
- [x] RawBT logic isolated in `RawBtPrinterAdapter` + `rawbtBridge`
- [x] POS does not import RawBT APIs directly

## Printer Adapter

- [x] `print()`, `reprint()`, `preview()`, `isAvailable()`
- [x] `createPrinterAdapter()` routes `rawbt` type

## UI

- [x] Bottom sheet print (no browser `alert`)
- [x] Snackbar during print
- [x] RawBT not installed dialog + Play Store button
- [x] Printer config on `/profil`
- [x] Readiness states: Siap / Belum Terhubung / RawBT Belum Terpasang

## Flows

- [x] POS cetak struk
- [x] Riwayat cetak ulang via `reprint()`
- [x] `/pos/receipt?orderId=` preview + print

## Manual verification (Android device)

1. Install RawBT, pair Blueprint BP-ECO58 in RawBT
2. `/profil` → Konfigurasi Printer → RawBT → tandai printer terhubung
3. POS → bayar → Cetak Struk → RawBT opens → struk prints
4. Riwayat → cetak ulang → same flow
5. Uninstall RawBT → cetak → dialog Install RawBT appears
