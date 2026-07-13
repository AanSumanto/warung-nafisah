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
  buildRawBtSchemeUrl,
  dispatchRawBtPrint,
  navigateRawBtIntent,
  isAndroidDevice,
} from '@/features/printing/rawbt/rawbtBridge';
import { isActivityNotFoundError } from '@/features/printing/rawbt/rawbtLogger';
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
  it('renders compact metadata and item rows', () => {
    const receipt = ReceiptBuilder.build(sampleOrder);
    const lines = buildReceiptPreviewLines(receipt);
    const meta = lines.find((line) => line.kind === 'text' && line.text?.includes('#000001'));
    expect(meta?.text).toMatch(/#000001/);
    expect(meta?.text).toMatch(/\d{2}\/\d{2}\/\d{2}/);
    const itemRow = lines.find((line) => line.kind === 'row' && line.left?.includes('Lele'));
    expect(itemRow?.right).toBe('11.000');
  });
});

describe('thermal layout', () => {
  it('uses compact two-line metadata instead of stacked fields', () => {
    const receipt = ReceiptBuilder.build(sampleOrder);
    const lines = buildReceiptThermalLines(receipt, BLUEPRINT_BP_ECO58);
    const fieldBlock = lines.find((line) => line.kind === 'text' && line.text?.startsWith('Tanggal'));
    expect(fieldBlock).toBeUndefined();
    const meta = lines.find((line) => line.kind === 'text' && line.text?.includes('#000001'));
    expect(meta?.text).toMatch(/#000001/);
    const context = lines.find((line) => line.kind === 'text' && line.text?.includes('Kasir Warung'));
    expect(context?.text).toContain('Ditempat');
  });

  it('uses one row per item and hides zero discount', () => {
    const receipt = ReceiptBuilder.build(sampleOrder);
    const lines = buildReceiptThermalLines(receipt, BLUEPRINT_BP_ECO58);
    const itemRows = lines.filter((line) => line.kind === 'row' && line.left?.includes('x '));
    expect(itemRows).toHaveLength(2);
    const diskon = lines.find((line) => line.kind === 'row' && line.left === 'Diskon');
    expect(diskon).toBeUndefined();
    const subtotal = lines.find((line) => line.kind === 'row' && line.left === 'Subtotal');
    expect(subtotal).toBeDefined();
  });

  it('uses fewer lines than legacy stacked layout', () => {
    const receipt = ReceiptBuilder.build(sampleOrder);
    const lines = buildReceiptThermalLines(receipt, BLUEPRINT_BP_ECO58);
    expect(lines.length).toBeLessThanOrEqual(18);
  });

  it('uses heavy separators for header and footer', () => {
    const receipt = ReceiptBuilder.build(sampleOrder);
    const lines = buildReceiptThermalLines(receipt, BLUEPRINT_BP_ECO58);
    expect(lines[0]?.kind).toBe('heavy-separator');
    expect(lines.at(-1)?.kind).toBe('heavy-separator');
    expect(lines[0]?.text).toBe('='.repeat(32));
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

  it('encodes receipt text as single-byte ESC/POS without HTML', () => {
    const receipt = ReceiptBuilder.build(sampleOrder);
    const bytes = new EscPosRenderer(BLUEPRINT_BP_ECO58).render(receipt);
    const decoded = Array.from(bytes)
      .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
      .join('');
    expect(decoded).toContain('WARUNG NAFISAH');
    expect(decoded).toContain('#000001');
    expect(decoded).toContain('TOTAL');
    expect(decoded).toContain('Bayar');
    expect(decoded).not.toContain('<div');
  });
});

describe('rawbt bridge', () => {
  it('encodes ESC/POS bytes to base64', () => {
    const bytes = new Uint8Array([0x1b, 0x40, 0x0a]);
    const encoded = bytesToBase64(bytes);
    expect(encoded).toBe('G0AK');
  });

  it('builds scheme URL for base64 ESC/POS', () => {
    expect(buildRawBtSchemeUrl('G0AK')).toBe('rawbt:base64,G0AK');
  });

  it('builds official intent URL with base64 prefix (not rawbt:base64)', () => {
    const url = buildRawBtIntentUrl('G0AK');
    expect(url.startsWith('intent:base64,')).toBe(true);
    expect(url).not.toContain('intent:rawbt:base64');
    expect(url).toContain('package=ru.a402d.rawbtprinter');
    expect(url).toContain('end;');
  });

  it('keeps raw base64 in intent URL (no URL encoding)', () => {
    const url = buildRawBtIntentUrl('a+b/c=');
    expect(url).toBe('intent:base64,a+b/c=#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;');
    expect(url).not.toContain('%');
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

  it('dispatches via Mike42 intent URL (window.location.href)', () => {
    const bytes = new Uint8Array([0x1b, 0x40, 0x0a]);
    const location = { href: '' };

    vi.stubGlobal('window', { location });
    vi.stubGlobal('document', {});

    dispatchRawBtPrint(bytes);

    expect(location.href).toBe('intent:base64,G0AK#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;');

    vi.unstubAllGlobals();
  });

  it('navigateRawBtIntent assigns window.location.href', () => {
    const location = { href: '' };
    vi.stubGlobal('window', { location });

    navigateRawBtIntent('intent:base64,TEST#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;');

    expect(location.href).toContain('intent:base64,TEST');

    vi.unstubAllGlobals();
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

  it('connect succeeds on Android without install probe', async () => {
    const adapter = new RawBtPrinterAdapter(BLUEPRINT_BP_ECO58);
    await expect(adapter.connect()).resolves.toBeUndefined();
    expect(adapter.getStatus()).toBe('ready');
  });

  it('dispatches ESC/POS bytes via RawBT bridge on print', async () => {
    const dispatch = vi
      .spyOn(await import('@/features/printing/rawbt/rawbtBridge'), 'dispatchRawBtPrint')
      .mockImplementation(() => undefined);

    const adapter = new RawBtPrinterAdapter(BLUEPRINT_BP_ECO58);
    await adapter.connect();
    await adapter.print(new Uint8Array([0x1b, 0x40, 0x0a]));

    expect(dispatch).toHaveBeenCalledOnce();
    expect(dispatch.mock.calls[0]?.[0]).toBeInstanceOf(Uint8Array);
  });

  it('throws RawBtNotInstalledError when dispatch reports Activity Not Found', async () => {
    vi.spyOn(await import('@/features/printing/rawbt/rawbtBridge'), 'dispatchRawBtPrint').mockImplementation(() => {
      throw new RawBtNotInstalledError();
    });

    const adapter = new RawBtPrinterAdapter(BLUEPRINT_BP_ECO58);
    await expect(adapter.print(new Uint8Array([0x1b, 0x40, 0x0a]))).rejects.toBeInstanceOf(RawBtNotInstalledError);
  });
});

describe('PrintService', () => {
  beforeEach(() => {
    resetPrintService();
  });

  it('printReceiptSync dispatches RawBT without await', async () => {
    vi.spyOn(await import('@/features/printing/rawbt/rawbtBridge'), 'isAndroidDevice').mockReturnValue(true);
    const dispatch = vi
      .spyOn(await import('@/features/printing/rawbt/rawbtBridge'), 'dispatchRawBtPrint')
      .mockImplementation(() => undefined);

    const receipt = ReceiptBuilder.build(sampleOrder);
    const service = new PrintService(rawbtConfig);

    service.printReceiptSync(receipt);

    expect(dispatch).toHaveBeenCalledOnce();
    const payload = dispatch.mock.calls[0]?.[0];
    expect(payload).toBeInstanceOf(Uint8Array);
    expect(payload?.[0]).toBe(0x1b);
    expect(payload?.[1]).toBe(0x40);
  });

  it('printReceipt always uses ESC/POS renderer', async () => {
    vi.spyOn(await import('@/features/printing/rawbt/rawbtBridge'), 'isAndroidDevice').mockReturnValue(true);
    vi.spyOn(await import('@/features/printing/rawbt/rawbtBridge'), 'dispatchRawBtPrint').mockImplementation(
      () => undefined,
    );

    const receipt = ReceiptBuilder.build(sampleOrder);
    const service = new PrintService(rawbtConfig);

    await service.printReceipt(receipt);
    expect(service.getAdapter().type).toBe('rawbt');
    const escPos = service.renderEscPos(receipt);
    expect(escPos).toBeInstanceOf(Uint8Array);
    expect(escPos[0]).toBe(0x1b);
    expect(escPos[1]).toBe(0x40);
  });

  it('reprintReceipt dispatches RawBT sync on Android', async () => {
    const dispatch = vi
      .spyOn(await import('@/features/printing/rawbt/rawbtBridge'), 'dispatchRawBtPrint')
      .mockImplementation(() => undefined);
    vi.spyOn(await import('@/features/printing/rawbt/rawbtBridge'), 'isAndroidDevice').mockReturnValue(true);

    const service = new PrintService(rawbtConfig);
    const receipt = ReceiptBuilder.build(sampleOrder);
    await service.reprintReceipt(receipt);

    expect(dispatch).toHaveBeenCalledOnce();
    expect(dispatch.mock.calls[0]?.[0]).toBeInstanceOf(Uint8Array);
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
