import { describe, expect, it } from 'vitest';
import { ReceiptBuilder } from '@/features/printing/receipt/ReceiptBuilder';
import { EscPosRenderer } from '@/features/printing/renderers/EscPosRenderer';
import { HtmlReceiptRenderer } from '@/features/printing/renderers/HtmlReceiptRenderer';
import { buildReceiptLines } from '@/features/printing/renderers/receiptLayout';

const sampleOrder = {
  orderNumber: 'WN-20260711-000001',
  cashierName: 'Siti',
  diningType: 'dine_in' as const,
  paymentMethod: 'cash' as const,
  paidAt: '2026-07-11T14:30:00.000Z',
  createdAt: '2026-07-11T14:29:00.000Z',
  total: 22_000,
  paidAmount: 50_000,
  changeAmount: 28_000,
  items: [
    {
      kodeMenu: 'LL001',
      namaMenu: 'Lele',
      qty: 2,
      hargaJual: 11_000,
      subtotal: 22_000,
    },
  ],
};

describe('ReceiptBuilder', () => {
  it('builds receipt from order snapshot without menu master', () => {
    const receipt = ReceiptBuilder.build(sampleOrder);
    expect(receipt.grandTotal).toBe(22_000);
    expect(receipt.paidAmount).toBe(50_000);
    expect(receipt.changeAmount).toBe(28_000);
    expect(receipt.items[0]).toMatchObject({
      kodeMenu: 'LL001',
      namaMenu: 'Lele',
      qty: 2,
      hargaJual: 11_000,
      subtotal: 22_000,
    });
  });
});

describe('receipt layout', () => {
  it('renders tanggal on one line with colon after label', () => {
    const receipt = ReceiptBuilder.build(sampleOrder);
    const lines = buildReceiptLines(receipt);
    const tanggal = lines.find((line) => line.text.startsWith('Tanggal :'));
    expect(tanggal?.text).toMatch(/^Tanggal : .+ Pukul /);
  });
});

describe('HtmlReceiptRenderer', () => {
  it('renders thermal HTML from receipt object', () => {
    const receipt = ReceiptBuilder.build(sampleOrder);
    const output = new HtmlReceiptRenderer().render(receipt);
    expect(output.html).toContain('WARUNG NAFISAH');
    expect(output.html).toContain('WN-20260711-000001');
    expect(output.html).toContain('22.000');
    expect(output.html).toContain('28.000');
  });
});

describe('EscPosRenderer', () => {
  it('produces ESC/POS bytes with init and cut', () => {
    const receipt = ReceiptBuilder.build(sampleOrder);
    const bytes = new EscPosRenderer().render(receipt);
    expect(bytes[0]).toBe(0x1b);
    expect(bytes[1]).toBe(0x40);
    expect(bytes.includes(0x0a)).toBe(true);
  });
});
