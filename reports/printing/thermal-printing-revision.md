# Thermal Printing Revision — Sprint 4.5.2 Revision

**Version:** 0.11.4  
**Status:** Complete — awaiting approval

## Problem (Root Cause)

Printing incorrectly used:

```
React Page → window.print() → Browser → RawBT → Printer
```

This printed the **entire browser page** (buttons, navigation, margins, preview chrome) instead of a thermal receipt.

## Fix

Removed browser print path entirely. All printing now uses:

```
Order Aggregate
        ↓
  ReceiptBuilder
        ↓
   Receipt Object          ← Single Source of Truth
        ↓
    ┌───┴────┐
    ↓        ↓
Preview   ESC/POS
Renderer  Renderer
(UI only)     ↓
         Printer Adapter
              ↓
            RawBT
              ↓
      Blueprint BP-ECO58
```

## Renderer Separation

| Renderer | Purpose | Output |
|----------|---------|--------|
| `PreviewRenderer` | On-screen preview (card, shadow, orange theme) | React UI lines |
| `EscPosRenderer` | Thermal printer | `Uint8Array` ESC/POS commands |

Both consume the same **Receipt Object**. No duplicate templates tied to Order.

## Printer Profile

`BLUEPRINT_BP_ECO58` in `profiles/printerProfile.ts`:

| Field | Value |
|-------|-------|
| brand | Blueprint |
| model | BP-ECO58 |
| paperWidth | 58 |
| charsPerLine | 32 |
| protocol | ESC_POS |
| connection | Bluetooth |
| supportsCut | false |
| supportsDrawer | false |
| supportsQr | true |
| supportsLogo | true |

`EscPosRenderer` and `RawBtPrinterAdapter` use this profile. No cut command sent (BP-ECO58 does not support cut).

## Thermal Layout

`receiptThermalLayout.ts` — POS struk format:

- Header/footer: `================================` (32 chars)
- Inner separators: `--------------------------------`
- Fields: label on one line, value on next (`No` / `WN-…`)
- Items: name → qty line → subtotal
- Totals: stacked label + amount
- Left-aligned body, centered header
- Monospace fixed width (32 chars)

## Print API

POS calls only:

```typescript
printReceipt(receiptObject)
reprintReceipt(receiptObject)
```

`PrintService` never calls `window.print()`, never sends HTML to the adapter.

## Removed

- `BrowserPrintAdapter` (deleted)
- `HtmlReceiptRenderer` (deleted)
- `window.print()` flow
- `printerType: 'browser'` config option (migrated to `rawbt`)

## Print Rules Enforced

Never printed:

- Buttons, navigation, cards, shadows
- HTML layout, browser margins/headers/footers
- React page chrome

## Future Ready

Extension points unchanged:

- Kitchen ticket → new renderer + adapter
- PDF / WhatsApp / Email → new renderers from Receipt Object
- Native Android bridge → swap adapter only

## Files

| Path | Role |
|------|------|
| `profiles/printerProfile.ts` | Printer profile SSOT |
| `renderers/receiptThermalLayout.ts` | Thermal line model |
| `renderers/receiptPreviewLayout.ts` | UI preview lines |
| `renderers/PreviewRenderer.ts` | Preview only |
| `renderers/EscPosRenderer.ts` | ESC/POS only |
| `services/PrintService.ts` | `printReceipt()` orchestration |
