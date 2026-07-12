import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ReceiptBuilder } from '@/features/printing/receipt/ReceiptBuilder';
import { EscPosRenderer } from '@/features/printing/renderers/EscPosRenderer';
import { HtmlReceiptRenderer } from '@/features/printing/renderers/HtmlReceiptRenderer';
import { buildReceiptLines } from '@/features/printing/renderers/receiptLayout';
import { RawBtPrinterAdapter } from '@/features/printing/adapters/RawBtPrinterAdapter';
import { BrowserPrintAdapter, createPrinterAdapter } from '@/features/printing/adapters/PrinterAdapters';
import { PrintService, resetPrintService } from '@/features/printing/services/PrintService';
import {
  bytesToBase64,
  buildRawBtIntentUrl,
  isAndroidDevice,
} from '@/features/printing/rawbt/rawbtBridge';
import { RawBtNotInstalledError } from '@/features/printing/types/printer';
import type { PrintConfig } from '@/features/printing/types/printer';

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

const rawbtConfig: PrintConfig = {
  printerType: 'rawbt',
  printerName: 'Blueprint BP-ECO58',
  connectionMethod: 'bluetooth',
  bridge: 'rawbt',
  paperWidth: '58mm',
  autoConnect: true,
  autoPrint: false,
  printerConnected: true,
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

describe('rawbt bridge', () => {
  it('encodes ESC/POS bytes to base64', () => {
    const bytes = new Uint8Array([0x1b, 0x40, 0x0a]);
    const encoded = bytesToBase64(bytes);
    expect(encoded).toBe('G0AK');
  });

  it('builds Android intent URL with RawBT package', () => {
    const url = buildRawBtIntentUrl('G0AK');
    expect(url).toContain('intent:rawbt:base64,G0AK');
    expect(url).toContain('package=ru.a402d.rawbtprinter');
  });

  it('detects Android user agent', () => {
    const original = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36',
      configurable: true,
    });
    expect(isAndroidDevice()).toBe(true);
    Object.defineProperty(navigator, 'userAgent', { value: original, configurable: true });
  });
});

describe('PrinterAdapter factory', () => {
  it('creates RawBT adapter for rawbt config', () => {
    const adapter = createPrinterAdapter(rawbtConfig);
    expect(adapter.type).toBe('rawbt');
  });

  it('creates browser adapter for browser config', () => {
    const adapter = createPrinterAdapter({ ...rawbtConfig, printerType: 'browser', bridge: 'browser' });
    expect(adapter.type).toBe('browser');
  });
});

describe('RawBtPrinterAdapter', () => {
  const originalUa = navigator.userAgent;

  beforeEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36',
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', { value: originalUa, configurable: true });
    vi.restoreAllMocks();
  });

  it('preview validates non-empty ESC/POS data', async () => {
    const adapter = new RawBtPrinterAdapter();
    await expect(adapter.preview(new Uint8Array())).rejects.toThrow('Data ESC/POS kosong');
    await expect(adapter.preview(new Uint8Array([0x1b, 0x40]))).resolves.toBeUndefined();
  });

  it('throws RawBtNotInstalledError when RawBT probe fails', async () => {
    vi.spyOn(await import('@/features/printing/rawbt/rawbtBridge'), 'probeRawBtInstalled').mockResolvedValue(false);

    const adapter = new RawBtPrinterAdapter();
    await expect(adapter.connect()).rejects.toBeInstanceOf(RawBtNotInstalledError);
  });

  it('dispatches print via RawBT bridge when installed', async () => {
    const dispatch = vi
      .spyOn(await import('@/features/printing/rawbt/rawbtBridge'), 'dispatchRawBtPrint')
      .mockResolvedValue({ opened: true });
    vi.spyOn(await import('@/features/printing/rawbt/rawbtBridge'), 'probeRawBtInstalled').mockResolvedValue(true);

    const adapter = new RawBtPrinterAdapter();
    await adapter.connect();
    await adapter.print(new Uint8Array([0x1b, 0x40]));

    expect(dispatch).toHaveBeenCalledOnce();
  });
});

describe('PrintService', () => {
  beforeEach(() => {
    resetPrintService();
  });

  it('renders receipt through ESC/POS and RawBT adapter on print', async () => {
    vi.spyOn(await import('@/features/printing/rawbt/rawbtBridge'), 'isAndroidDevice').mockReturnValue(true);
    vi.spyOn(await import('@/features/printing/rawbt/rawbtBridge'), 'probeRawBtInstalled').mockResolvedValue(true);
    vi.spyOn(await import('@/features/printing/rawbt/rawbtBridge'), 'dispatchRawBtPrint').mockResolvedValue({
      opened: true,
    });

    const receipt = ReceiptBuilder.build(sampleOrder);
    const service = new PrintService(rawbtConfig);

    await service.print(receipt);
    expect(service.getAdapter().type).toBe('rawbt');
  });

  it('reprint uses adapter reprint path', async () => {
    const reprint = vi.fn().mockResolvedValue(undefined);
    const service = new PrintService(rawbtConfig);
    const adapter = service.getAdapter();
    adapter.reprint = reprint;
    adapter.connect = vi.fn().mockResolvedValue(undefined);
    adapter.isConnected = () => true;

    const receipt = ReceiptBuilder.build(sampleOrder);
    await service.reprint(receipt);

    expect(reprint).toHaveBeenCalledOnce();
    expect(reprint.mock.calls[0]?.[0]).toBeInstanceOf(Uint8Array);
  });

  it('browser adapter preview prepares HTML without printing', async () => {
    const browserConfig: PrintConfig = { ...rawbtConfig, printerType: 'browser', bridge: 'browser' };
    const service = new PrintService(browserConfig);
    const receipt = ReceiptBuilder.build(sampleOrder);

    await service.preview(receipt);
    const adapter = service.getAdapter() as BrowserPrintAdapter;
    expect(adapter.getStatus()).toBe('ready');
  });
});

describe('RawBT not installed error', () => {
  it('is identifiable for UI handling', async () => {
    vi.spyOn(await import('@/features/printing/rawbt/rawbtBridge'), 'probeRawBtInstalled').mockResolvedValue(false);
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 14)',
      configurable: true,
    });

    const adapter = new RawBtPrinterAdapter();
    await expect(adapter.connect()).rejects.toMatchObject({ name: 'RawBtNotInstalledError' });
  });
});
