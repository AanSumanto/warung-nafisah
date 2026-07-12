import type { PrintConfig, PrinterAdapter, PrinterReadiness } from '../types/printer';
import type { Receipt } from '../types/receipt';
import { EscPosRenderer } from '../renderers/EscPosRenderer';
import { HtmlReceiptRenderer } from '../renderers/HtmlReceiptRenderer';
import { BrowserPrintAdapter, createPrinterAdapter } from '../adapters/PrinterAdapters';
import { getPrintConfig } from '../config/printConfig';
import { PrintQueue } from './PrintQueue';

/**
 * PrintService orchestrates: Receipt → Renderer → Adapter → Print
 */
export class PrintService {
  private readonly escPosRenderer = new EscPosRenderer();
  private readonly htmlRenderer = new HtmlReceiptRenderer();
  private readonly queue = new PrintQueue();
  private adapter: PrinterAdapter;
  private connected = false;

  constructor(private readonly config: PrintConfig) {
    this.adapter = createPrinterAdapter(config);
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

  async getReadiness(): Promise<PrinterReadiness> {
    if (this.adapter.getReadiness) {
      return this.adapter.getReadiness();
    }
    const available = await this.adapter.isAvailable();
    return available ? 'ready' : 'unavailable';
  }

  async ensureConnected(): Promise<void> {
    if (this.adapter.isConnected()) return;
    if (this.config.autoConnect || this.config.printerType !== 'browser') {
      await this.adapter.connect();
      this.connected = true;
    }
  }

  private async renderEscPos(receipt: Receipt): Promise<Uint8Array> {
    return this.escPosRenderer.render(receipt);
  }

  private prepareBrowserAdapter(receipt: Receipt): BrowserPrintAdapter {
    const htmlOutput = this.htmlRenderer.render(receipt);
    const browserAdapter = this.adapter as BrowserPrintAdapter;
    browserAdapter.setHtmlPayload(htmlOutput.html, htmlOutput.printStyles);
    return browserAdapter;
  }

  async preview(receipt: Receipt): Promise<void> {
    if (this.config.printerType === 'browser') {
      this.prepareBrowserAdapter(receipt);
      await this.adapter.preview(new Uint8Array());
      return;
    }

    const escPosData = await this.renderEscPos(receipt);
    await this.adapter.preview(escPosData);
  }

  async print(receipt: Receipt): Promise<void> {
    const job = this.queue.enqueue(receipt);
    this.queue.markStatus(job.id, 'processing');

    try {
      if (this.config.printerType === 'browser') {
        const browserAdapter = this.prepareBrowserAdapter(receipt);
        await browserAdapter.print(new Uint8Array());
      } else {
        await this.ensureConnected();
        const escPosData = await this.renderEscPos(receipt);
        await this.adapter.print(escPosData);
      }
      this.queue.markStatus(job.id, 'completed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Print gagal';
      this.queue.markStatus(job.id, 'failed', message);
      throw error;
    }
  }

  async reprint(receipt: Receipt): Promise<void> {
    if (this.config.printerType === 'browser') {
      const browserAdapter = this.prepareBrowserAdapter(receipt);
      await browserAdapter.reprint(new Uint8Array());
      return;
    }

    await this.ensureConnected();
    const escPosData = await this.renderEscPos(receipt);
    await this.adapter.reprint(escPosData);
  }

  renderHtmlPreview(receipt: Receipt) {
    return this.htmlRenderer.render(receipt);
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
