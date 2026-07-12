# Sprint 4.5.2 — Printing Infrastructure

**Version:** 0.11.2  
**Status:** Complete — awaiting approval

## Delivered

- Receipt Object (SSOT)
- ReceiptBuilder from Order snapshot
- HtmlReceiptRenderer (preview + browser print)
- EscPosRenderer (INIT, align, bold, separator, feed, cut)
- PrinterAdapter + Blueprint ECO-58 Bluetooth + Browser fallback
- PrintService orchestration
- PrintQueue structure (no worker)
- Print config (58mm / 80mm, printer type)
- Thermal receipt preview UI
- Reprint from Riwayat Transaksi
- `/pos/receipt?orderId=` preview page
- Backend: `paidAmount`, `changeAmount` on pay API
- Tests: frontend printing + backend integration
- `reports/printing/printing-architecture.md`

## Not in scope

Inventory, Recipe, Purchase, Kitchen Display, PDF, WhatsApp, queue worker.
