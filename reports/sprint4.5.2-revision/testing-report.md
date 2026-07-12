# Sprint 4.5.2 Revision — Testing

## Frontend (`npm test`) — 24 passed

### Receipt Builder
- Order snapshot → Receipt

### Preview layout
- Field blocks for UI

### Thermal layout
- Stacked label/value fields
- Heavy separators (32× `=`)
- Item name / qty / subtotal lines
- Date without browser time suffix on thermal

### ESC/POS Renderer
- INIT bytes
- No cut command (BP-ECO58 profile)
- UTF-8 text, no HTML in output

### PrintService
- `printReceipt` always ESC/POS path
- `reprintReceipt` sends Uint8Array
- Preview separate from print

### RawBT adapter
- ESC/POS bytes only to bridge

## Manual

Physical print on Android — verify single thermal sheet, no UI artifacts.
