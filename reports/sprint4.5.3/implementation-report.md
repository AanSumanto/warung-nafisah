# Sprint 4.5.3 — Bluetooth Printing Bridge (RawBT)

**Version:** 0.11.3  
**Status:** Complete — awaiting approval

## Delivered

- `RawBtPrinterAdapter` implementing extended `PrinterAdapter` (`print`, `reprint`, `preview`, `isAvailable`)
- `rawbt/rawbtBridge.ts` — base64 encoding, Android intent dispatch, install probe
- `PrintService` — RawBT path via ESC/POS; config-aware singleton reset
- `RawBtNotInstalledDialog` — friendly message + Play Store link
- `PrinterConfigPanel` + `PrinterStatusChip` on `/profil`
- `ReceiptPreviewSheet` — snackbar feedback, reprint mode, RawBT error handling
- Riwayat transaksi → `reprint()` flow
- Tests: ReceiptBuilder, EscPos, RawBT bridge, adapters, PrintService (22 Vitest total frontend)
- `reports/printing/rawbt-bridge.md`

## Architecture preserved

```
Order → ReceiptBuilder → Receipt Object → EscPosRenderer → PrinterAdapter → RawBT → BP-ECO58
```

Receipt Builder remains SSOT. ESC/POS Renderer unchanged.

## Not in scope

Inventory, Recipe, Web Bluetooth SPP, native Android bridge, kitchen printer, print queue worker, offline printing.
