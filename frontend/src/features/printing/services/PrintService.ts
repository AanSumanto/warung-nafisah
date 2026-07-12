import type { PrintConfig, PrinterAdapter } from '../types/printer';
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

  async ensureConnected(): Promise<void> {
    if (this.adapter.isConnected()) return;
    if (this.config.autoConnect || this.config.printerType === 'blueprint-eco58') {
      await this.adapter.connect();
      this.connected = true;
    }
  }

  async print(receipt: Receipt): Promise<void> {
    const job = this.queue.enqueue(receipt);
    this.queue.markStatus(job.id, 'processing');

    try {
      if (this.config.printerType === 'browser') {
        const htmlOutput = this.htmlRenderer.render(receipt);
        const browserAdapter = this.adapter as BrowserPrintAdapter;
        browserAdapter.setHtmlPayload(htmlOutput.html, htmlOutput.printStyles);
        await browserAdapter.print(new Uint8Array());
      } else {
        await this.ensureConnected();
        const escPosData = this.escPosRenderer.render(receipt);
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
    const escPosData = this.escPosRenderer.render(receipt);
    if (this.config.printerType === 'browser') {
      const htmlOutput = this.htmlRenderer.render(receipt);
      const browserAdapter = this.adapter as BrowserPrintAdapter;
      browserAdapter.setHtmlPayload(htmlOutput.html, htmlOutput.printStyles);
      await browserAdapter.reprint(new Uint8Array());
      return;
    }
    await this.ensureConnected();
    await this.adapter.reprint(escPosData);
  }

  renderHtmlPreview(receipt: Receipt) {
    return this.htmlRenderer.render(receipt);
  }
}

let singleton: PrintService | null = null;

export function getPrintService(config?: PrintConfig): PrintService {
  if (!singleton) {
    singleton = new PrintService(config ?? getPrintConfig());
  }
  return singleton;
}

export function resetPrintService(): void {
  singleton = null;
}
