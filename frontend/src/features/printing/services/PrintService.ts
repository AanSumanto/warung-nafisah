import type { PrintConfig, PrinterAdapter, PrinterReadiness } from '../types/printer';
import type { Receipt } from '../types/receipt';
import type { PrinterProfile } from '../profiles/printerProfile';
import { getPrinterProfile } from '../profiles/printerProfile';
import { EscPosRenderer } from '../renderers/EscPosRenderer';
import { PreviewRenderer } from '../renderers/PreviewRenderer';
import { createPrinterAdapter } from '../adapters/PrinterAdapters';
import { RawBtPrinterAdapter } from '../adapters/RawBtPrinterAdapter';
import { getPrintConfig } from '../config/printConfig';
import { PrintQueue } from './PrintQueue';

/**
 * PrintService orchestrates: Receipt Object → ESC/POS Renderer → Printer Adapter
 *
 * HTML preview is separate. Printing never uses window.print() or browser layout.
 */
export class PrintService {
  private readonly profile: PrinterProfile;
  private readonly escPosRenderer: EscPosRenderer;
  private readonly previewRenderer = new PreviewRenderer();
  private readonly queue = new PrintQueue();
  private adapter: PrinterAdapter;

  constructor(private readonly config: PrintConfig) {
    this.profile = getPrinterProfile(config.printerProfileId);
    this.escPosRenderer = new EscPosRenderer(this.profile);
    this.adapter = createPrinterAdapter(config, this.profile);
  }

  getQueue(): PrintQueue {
    return this.queue;
  }

  getAdapter(): PrinterAdapter {
    return this.adapter;
  }

  getConfig(): PrintConfig {
    return this.config;
  }

  getProfile(): PrinterProfile {
    return this.profile;
  }

  async getReadiness(): Promise<PrinterReadiness> {
    if (this.adapter.getReadiness) {
      return this.adapter.getReadiness();
    }
    const available = await this.adapter.isAvailable();
    return available ? 'ready' : 'unavailable';
  }

  async ensureConnected(): Promise<void> {
    if (this.adapter.isConnected()) return;
    if (this.config.autoConnect) {
      await this.adapter.connect();
    }
  }

  renderPreview(receipt: Receipt) {
    return this.previewRenderer.render(receipt);
  }

  renderEscPos(receipt: Receipt): Uint8Array {
    return this.escPosRenderer.render(receipt);
  }

  private attachReceiptContext(receipt: Receipt): void {
    if (this.adapter instanceof RawBtPrinterAdapter) {
      this.adapter.setPrintContext({ receipt });
    }
  }

  private async sendEscPosToAdapter(receipt: Receipt, action: 'print' | 'reprint'): Promise<void> {
    await this.ensureConnected();
    const escPosData = this.renderEscPos(receipt);
    this.attachReceiptContext(receipt);
    if (action === 'print') {
      await this.adapter.print(escPosData);
    } else {
      await this.adapter.reprint(escPosData);
    }
  }

  /** Validate ESC/POS payload without sending to printer. */
  async previewReceipt(receipt: Receipt): Promise<void> {
    const escPosData = this.renderEscPos(receipt);
    await this.adapter.preview(escPosData);
  }

  /**
   * Primary print entry — POS calls this with Receipt Object only.
   * Flow: Receipt → ESC/POS → Printer Adapter → RawBT → Printer
   */
  async printReceipt(receipt: Receipt): Promise<void> {
    const job = this.queue.enqueue(receipt);
    this.queue.markStatus(job.id, 'processing');

    try {
      await this.sendEscPosToAdapter(receipt, 'print');
      this.queue.markStatus(job.id, 'completed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Print gagal';
      this.queue.markStatus(job.id, 'failed', message);
      throw error;
    }
  }

  /** Alias kept for internal callers migrating to printReceipt. */
  async print(receipt: Receipt): Promise<void> {
    return this.printReceipt(receipt);
  }

  async reprintReceipt(receipt: Receipt): Promise<void> {
    await this.sendEscPosToAdapter(receipt, 'reprint');
  }

  async reprint(receipt: Receipt): Promise<void> {
    return this.reprintReceipt(receipt);
  }
}

let singleton: PrintService | null = null;
let singletonConfigKey: string | null = null;

function configKey(config: PrintConfig): string {
  return JSON.stringify(config);
}

export function getPrintService(config?: PrintConfig): PrintService {
  const resolved = config ?? getPrintConfig();
  const key = configKey(resolved);

  if (!singleton || singletonConfigKey !== key) {
    singleton = new PrintService(resolved);
    singletonConfigKey = key;
  }

  return singleton;
}

export function resetPrintService(): void {
  singleton = null;
  singletonConfigKey = null;
}

/** POS-facing API — print from Receipt Object only. */
export async function printReceipt(receipt: Receipt): Promise<void> {
  return getPrintService().printReceipt(receipt);
}

export async function reprintReceipt(receipt: Receipt): Promise<void> {
  return getPrintService().reprintReceipt(receipt);
}
