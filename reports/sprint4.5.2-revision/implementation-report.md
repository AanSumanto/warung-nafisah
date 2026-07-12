# Sprint 4.5.2 Revision — Thermal Printing Infrastructure

**Version:** 0.11.4  
**Status:** Complete — awaiting approval

## Delivered

- Removed `window.print()` / browser print path entirely
- `PreviewRenderer` (UI only) separated from `EscPosRenderer` (thermal only)
- `receiptThermalLayout.ts` — POS struk format (32-char, stacked fields, separators)
- `receiptPreviewLayout.ts` — responsive preview layout
- `PrinterProfile` — Blueprint BP-ECO58 with `supportsCut: false`
- `printReceipt()` / `reprintReceipt()` as POS-facing API
- Legacy `browser` config auto-migrated to `rawbt`
- Deleted `BrowserPrintAdapter`, `HtmlReceiptRenderer`
- `reports/printing/thermal-printing-revision.md`

## Architecture

Receipt Object → ESC/POS → RawBT → BP-ECO58. HTML never sent to printer.

## Not in scope

Inventory, Recipe, kitchen printer, PDF, WhatsApp.
