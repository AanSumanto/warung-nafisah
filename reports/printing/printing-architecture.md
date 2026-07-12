# Printing Architecture — Warung Nafisah ERP

## Overview

Sprint 4.5.2 introduces a layered printing stack. **Receipt Object** is the single source of truth. HTML and ESC/POS are render targets only.

```
Order Aggregate (snapshot)
        ↓
  ReceiptBuilder
        ↓
   Receipt Object  ←── SSOT
        ↓
    ┌───┴───┐
    ↓       ↓
 HTML     ESC/POS
Renderer  Renderer
    ↓       ↓
 Preview  Bluetooth
          Printer
```

## Receipt Object

| Field | Source |
|-------|--------|
| businessName, logo, address, phone, footerMessage | Print config |
| orderNumber, transactionDate, cashierName | Order |
| paymentMethod, diningType | Order (display labels) |
| items[] | OrderItem snapshot (kodeMenu, namaMenu, qty, hargaJual, subtotal) |
| subtotal, discount, tax, grandTotal | Order (integers) |
| paidAmount, changeAmount | Order payment tender |
| paperWidth | Config (`58mm` \| `80mm`) |

## Receipt Builder Flow

1. `ReceiptBuilder.build(order, businessConfig)` reads paid order only.
2. No access to Master Menu, HTML, Bluetooth, or ESC/POS.
3. All money values remain integers; formatting happens in renderers.

## ESC/POS Flow

1. `EscPosRenderer.render(receipt)` → `Uint8Array`
2. Commands: INIT, ALIGN CENTER/LEFT, BOLD ON/OFF, separator lines, FEED, CUT
3. Text encoded as UTF-8 lines

## Bluetooth Flow

1. `PrintService.print(receipt)`
2. Auto-connect via `BlueprintEco58BluetoothAdapter` (Web Bluetooth)
3. Chunked write to GATT characteristic
4. Fallback: `BrowserPrintAdapter` + `HtmlReceiptRenderer`

## Printer Adapter Diagram

```
        PrintService
             │
    ┌────────┴────────┐
    ↓                 ↓
BlueprintEco58    BrowserPrint
BluetoothAdapter   Adapter
    │                 │
 Web Bluetooth    window.print()
```

Interface: `connect()`, `disconnect()`, `print()`, `reprint()`, `getStatus()`

## Print Queue

Structure-only (`PrintQueue` class): jobs stored in memory + localStorage. No worker in Sprint 4.5.2.

## Future Expansion

| Feature | Extension point |
|---------|-----------------|
| Kitchen Printer | New adapter + ticket renderer; same ReceiptBuilder |
| Kitchen Ticket | Separate renderer from Receipt Object |
| Customer Copy | `PrintService.printCopy(receipt, 'customer')` |
| PDF Receipt | `PdfReceiptRenderer.render(receipt)` |
| WhatsApp / Email | `ReceiptSerializer.toText(receipt)` |
| 80mm paper | `printConfig.paperWidth` |

ReceiptBuilder unchanged for all future channels.

## Code Locations

- `frontend/src/features/printing/` — full module
- `frontend/src/app/(shell)/pos/receipt/` — preview page
- Backend: `paidAmount` / `changeAmount` on Order + Payment
