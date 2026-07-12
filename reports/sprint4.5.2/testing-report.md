# Sprint 4.5.2 — Testing

## Frontend (`npm test`)

- ReceiptBuilder snapshot
- HtmlReceiptRenderer output
- EscPosRenderer byte output

## Backend (`npm test`)

- Pay with `paidAmount` / `changeAmount`
- Order item snapshot unchanged

## Manual

1. Pay cash with kembalian → preview shows Tunai + Kembali
2. Cetak Struk → browser print dialog (default adapter)
3. Riwayat → icon cetak ulang → preview → cetak
4. `/pos/receipt?orderId=<id>` standalone preview
