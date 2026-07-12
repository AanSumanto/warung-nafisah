import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ReceiptBuilder } from '@/features/printing/receipt/ReceiptBuilder';
import { EscPosRenderer } from '@/features/printing/renderers/EscPosRenderer';
import { PreviewRenderer } from '@/features/printing/renderers/PreviewRenderer';
import { buildReceiptPreviewLines } from '@/features/printing/renderers/receiptPreviewLayout';
import { buildReceiptThermalLines } from '@/features/printing/renderers/receiptThermalLayout';
import { RawBtPrinterAdapter } from '@/features/printing/adapters/RawBtPrinterAdapter';
import { createPrinterAdapter } from '@/features/printing/adapters/PrinterAdapters';
import { PrintService, resetPrintService } from '@/features/printing/services/PrintService';
import { BLUEPRINT_BP_ECO58 } from '@/features/printing/profiles/printerProfile';
import {
  bytesToBase64,
  buildRawBtIntentUrl,
  isAndroidDevice,
} from '@/features/printing/rawbt/rawbtBridge';
import { RawBtNotInstalledError } from '@/features/printing/types/printer';
import type { PrintConfig } from '@/features/printing/types/printer';

const sampleOrder = {
  orderNumber: 'WN-20260712-000001',
  cashierName: 'Kasir Warung',
  diningType: 'dine_in' as const,
  paymentMethod: 'cash' as const,
  paidAt: '2026-07-12T10:30:00.000Z',
  createdAt: '2026-07-12T10:29:00.000Z',
  total: 27_000,
  paidAmount: 50_000,
  changeAmount: 23_000,
  items: [
    {
      kodeMenu: 'LL001',
      namaMenu: 'Lele',
      qty: 1,
      hargaJual: 11_000,
      subtotal: 11_000,
    },
    {
      kodeMenu: 'LL002',
      namaMenu: 'Lele + Nasi Uduk',
      qty: 1,
      hargaJual: 16_000,
      subtotal: 16_000,
    },
  ],
};

const rawbtConfig: PrintConfig = {
  printerType: 'rawbt',
  printerProfileId: 'blueprint-bp-eco58',
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
    expect(receipt.grandTotal).toBe(27_000);
    expect(receipt.paidAmount).toBe(50_000);
    expect(receipt.changeAmount).toBe(23_000);
    expect(receipt.items).toHaveLength(2);
  });
});

describe('preview layout', () => {
  it('renders field blocks for preview UI', () => {
    const receipt = ReceiptBuilder.build(sampleOrder);
    const lines = buildReceiptPreviewLines(receipt);
    const noField = lines.find((line) => line.kind === 'field-block' && line.label === 'No');
    expect(noField?.value).toBe('WN-20260712-000001');
  });
});

describe('thermal layout', () => {
  it('uses stacked label/value fields for thermal printer', () => {
    const receipt = ReceiptBuilder.build(sampleOrder);
    const lines = buildReceiptThermalLines(receipt, BLUEPRINT_BP_ECO58);
    const tanggal = lines.find((line) => line.kind === 'field-block' && line.label === 'Tanggal');
    expect(tanggal?.value).toMatch(/2026/);
    expect(tanggal?.value).not.toMatch(/Pukul/);
  });

  it('uses heavy separators for header and footer', () => {
    const receipt = ReceiptBuilder.build(sampleOrder);
    const lines = buildReceiptThermalLines(receipt, BLUEPRINT_BP_ECO58);
    expect(lines[0]?.kind).toBe('heavy-separator');
    expect(lines.at(-1)?.kind).toBe('heavy-separator');
    expect(lines[0]?.text).toBe('='.repeat(32));
  });

  it('renders item lines as name, qty, subtotal', () => {
    const receipt = ReceiptBuilder.build(sampleOrder);
    const lines = buildReceiptThermalLines(receipt, BLUEPRINT_BP_ECO58);
    expect(lines.some((l) => l.kind === 'item-name' && l.text === 'Lele')).toBe(true);
    expect(lines.some((l) => l.kind === 'item-qty' && l.text === '1 x 11.000')).toBe(true);
    expect(lines.some((l) => l.kind === 'item-subtotal' && l.text === '11.000')).toBe(true);
  });
});

describe('PreviewRenderer', () => {
  it('renders preview lines from receipt object only', () => {
    const receipt = ReceiptBuilder.build(sampleOrder);
    const output = new PreviewRenderer().render(receipt);
    expect(output.lines.length).toBeGreaterThan(5);
    expect(output.paperWidth).toBe('58mm');
  });
});

describe('EscPosRenderer', () => {
  it('produces ESC/POS bytes with init command', () => {
    const receipt = ReceiptBuilder.build(sampleOrder);
    const bytes = new EscPosRenderer(BLUEPRINT_BP_ECO58).render(receipt);
    expect(bytes[0]).toBe(0x1b);
    expect(bytes[1]).toBe(0x40);
    expect(bytes.includes(0x0a)).toBe(true);
  });

  it('does not send cut command when profile supportsCut is false', () => {
    const receipt = ReceiptBuilder.build(sampleOrder);
    const bytes = new EscPosRenderer(BLUEPRINT_BP_ECO58).render(receipt);
    const cutSequence = [0x1d, 0x56, 0];
    let hasCut = false;
    for (let i = 0; i < bytes.length - 2; i++) {
      if (bytes[i] === cutSequence[0] && bytes[i + 1] === cutSequence[1] && bytes[i + 2] === cutSequence[2]) {
        hasCut = true;
      }
    }
    expect(hasCut).toBe(false);
  });

  it('encodes receipt text as UTF-8 without HTML', () => {
    const receipt = ReceiptBuilder.build(sampleOrder);
    const bytes = new EscPosRenderer(BLUEPRINT_BP_ECO58).render(receipt);
    const decoded = new TextDecoder().decode(bytes);
    expect(decoded).toContain('WARUNG NAFISAH');
    expect(decoded).toContain('WN-20260712-000001');
    expect(decoded).not.toContain('<div');
    expect(decoded).not.toContain('window.print');
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
    const adapter = createPrinterAdapter(rawbtConfig, BLUEPRINT_BP_ECO58);
    expect(adapter.type).toBe('rawbt');
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
    const adapter = new RawBtPrinterAdapter(BLUEPRINT_BP_ECO58);
    await expect(adapter.preview(new Uint8Array())).rejects.toThrow('Data ESC/POS kosong');
    await expect(adapter.preview(new Uint8Array([0x1b, 0x40]))).resolves.toBeUndefined();
  });

  it('throws RawBtNotInstalledError when RawBT probe fails', async () => {
    vi.spyOn(await import('@/features/printing/rawbt/rawbtBridge'), 'probeRawBtInstalled').mockResolvedValue(false);

    const adapter = new RawBtPrinterAdapter(BLUEPRINT_BP_ECO58);
    await expect(adapter.connect()).rejects.toBeInstanceOf(RawBtNotInstalledError);
  });

  it('dispatches ESC/POS bytes via RawBT bridge when installed', async () => {
    const dispatch = vi
      .spyOn(await import('@/features/printing/rawbt/rawbtBridge'), 'dispatchRawBtPrint')
      .mockResolvedValue({ opened: true });
    vi.spyOn(await import('@/features/printing/rawbt/rawbtBridge'), 'probeRawBtInstalled').mockResolvedValue(true);

    const adapter = new RawBtPrinterAdapter(BLUEPRINT_BP_ECO58);
    await adapter.connect();
    await adapter.print(new Uint8Array([0x1b, 0x40]));

    expect(dispatch).toHaveBeenCalledOnce();
  });
});

describe('PrintService', () => {
  beforeEach(() => {
    resetPrintService();
  });

  it('printReceipt always uses ESC/POS renderer', async () => {
    vi.spyOn(await import('@/features/printing/rawbt/rawbtBridge'), 'isAndroidDevice').mockReturnValue(true);
    vi.spyOn(await import('@/features/printing/rawbt/rawbtBridge'), 'probeRawBtInstalled').mockResolvedValue(true);
    vi.spyOn(await import('@/features/printing/rawbt/rawbtBridge'), 'dispatchRawBtPrint').mockResolvedValue({
      opened: true,
    });

    const receipt = ReceiptBuilder.build(sampleOrder);
    const service = new PrintService(rawbtConfig);

    await service.printReceipt(receipt);
    expect(service.getAdapter().type).toBe('rawbt');
    const escPos = service.renderEscPos(receipt);
    expect(escPos).toBeInstanceOf(Uint8Array);
  });

  it('reprintReceipt uses adapter reprint with ESC/POS bytes', async () => {
    const reprint = vi.fn().mockResolvedValue(undefined);
    const service = new PrintService(rawbtConfig);
    const adapter = service.getAdapter();
    adapter.reprint = reprint;
    adapter.connect = vi.fn().mockResolvedValue(undefined);
    adapter.isConnected = () => true;

    const receipt = ReceiptBuilder.build(sampleOrder);
    await service.reprintReceipt(receipt);

    expect(reprint).toHaveBeenCalledOnce();
    expect(reprint.mock.calls[0]?.[0]).toBeInstanceOf(Uint8Array);
  });

  it('preview renderer is separate from print path', () => {
    const receipt = ReceiptBuilder.build(sampleOrder);
    const service = new PrintService(rawbtConfig);
    const preview = service.renderPreview(receipt);
    const escPos = service.renderEscPos(receipt);

    expect(preview.lines.length).toBeGreaterThan(0);
    expect(escPos).toBeInstanceOf(Uint8Array);
  });
});

describe('printer profile', () => {
  it('defines Blueprint BP-ECO58 thermal profile', () => {
    expect(BLUEPRINT_BP_ECO58.model).toBe('BP-ECO58');
    expect(BLUEPRINT_BP_ECO58.paperWidth).toBe(58);
    expect(BLUEPRINT_BP_ECO58.charsPerLine).toBe(32);
    expect(BLUEPRINT_BP_ECO58.supportsCut).toBe(false);
    expect(BLUEPRINT_BP_ECO58.protocol).toBe('ESC_POS');
  });
});
