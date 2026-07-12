import type { PrinterAdapter, PrinterReadiness, PrinterStatus } from '../types/printer';
import { RawBtNotInstalledError } from '../types/printer';
import type { PrinterProfile } from '../profiles/printerProfile';
import type { Receipt } from '../types/receipt';
import { isActivityNotFoundError, rawbtLog, summarizeReceiptForLog, RAWBT_MIME_TYPE } from '../rawbt/rawbtLogger';
import {
  dispatchRawBtPrint,
  isAndroidDevice,
  RAWBT_RENDERER,
} from '../rawbt/rawbtBridge';

export interface RawBtPrintContext {
  readonly receipt?: Receipt;
}

/**
 * RawBT print bridge for Blueprint BP-ECO58 (Bluetooth Classic via SPP).
 * Sends ESC/POS bytes only — never HTML, JSON, or React output.
 */
export class RawBtPrinterAdapter implements PrinterAdapter {
  readonly type = 'rawbt' as const;

  private status: PrinterStatus = 'disconnected';
  private lastReceiptContext: RawBtPrintContext = {};

  constructor(private readonly profile: PrinterProfile) {}

  get profileId(): string {
    return `${this.profile.brand}-${this.profile.model}`.toLowerCase();
  }

  setPrintContext(context: RawBtPrintContext): void {
    this.lastReceiptContext = context;
  }

  isConnected(): boolean {
    return this.status === 'ready' || this.status === 'printing';
  }

  getStatus(): PrinterStatus {
    return this.status;
  }

  async isAvailable(): Promise<boolean> {
    return isAndroidDevice();
  }

  async getReadiness(): Promise<PrinterReadiness> {
    if (!isAndroidDevice()) return 'unavailable';

    if (typeof window !== 'undefined') {
      try {
        const connected = localStorage.getItem('wn_rawbt_printer_connected') === 'true';
        if (!connected) return 'not_connected';
      } catch {
        return 'not_connected';
      }
    }

    return 'ready';
  }

  async connect(): Promise<void> {
    if (!isAndroidDevice()) {
      throw new Error('RawBT hanya tersedia di perangkat Android');
    }

    this.status = 'ready';
    rawbtLog.info('adapter:connect', { status: 'ready', profile: this.profileId });
  }

  async disconnect(): Promise<void> {
    this.status = 'disconnected';
  }

  async preview(data: Uint8Array): Promise<void> {
    if (data.length === 0) {
      throw new Error('Data ESC/POS kosong');
    }
    if (data[0] !== 0x1b || data[1] !== 0x40) {
      throw new Error('Data bukan ESC/POS valid');
    }
  }

  async print(data: Uint8Array): Promise<void> {
    await this.sendToRawBt(data, 'print');
  }

  async reprint(data: Uint8Array): Promise<void> {
    await this.sendToRawBt(data, 'reprint');
  }

  private async sendToRawBt(data: Uint8Array, action: 'print' | 'reprint'): Promise<void> {
    if (!isAndroidDevice()) {
      throw new Error('RawBT hanya tersedia di perangkat Android');
    }

    this.status = 'printing';

    const receipt = this.lastReceiptContext.receipt;
    const receiptSummary = receipt ? summarizeReceiptForLog(receipt) : undefined;

    try {
      rawbtLog.info('adapter:send', {
        action,
        renderer: RAWBT_RENDERER,
        mimeType: RAWBT_MIME_TYPE,
        profile: this.profileId,
        payloadLength: data.length,
        orderNumber: receipt?.orderNumber,
        receiptSummary,
      });

      dispatchRawBtPrint(data, {
        renderer: RAWBT_RENDERER,
        mimeType: RAWBT_MIME_TYPE,
        orderNumber: receipt?.orderNumber,
        receiptSummary,
      });

      this.status = 'ready';
    } catch (error) {
      this.status = 'error';
      rawbtLog.error('adapter:error', {
        action,
        error: error instanceof Error ? error.message : String(error),
        orderNumber: receipt?.orderNumber,
      });

      if (error instanceof RawBtNotInstalledError || isActivityNotFoundError(error)) {
        throw new RawBtNotInstalledError();
      }

      throw error;
    }
  }
}
