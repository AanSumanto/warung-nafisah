import type { PrinterAdapter, PrinterReadiness, PrinterStatus } from '../types/printer';
import { RawBtNotInstalledError } from '../types/printer';
import type { PrinterProfile } from '../profiles/printerProfile';
import { bytesToBase64, dispatchRawBtPrint, isAndroidDevice } from '../rawbt/rawbtBridge';
import { isActivityNotFoundError, rawbtLog } from '../rawbt/rawbtLogger';

/**
 * RawBT print bridge for Blueprint BP-ECO58 (Bluetooth Classic via SPP).
 * Sends ESC/POS bytes via Android intent — no install pre-check.
 */
export class RawBtPrinterAdapter implements PrinterAdapter {
  readonly type = 'rawbt' as const;

  private status: PrinterStatus = 'disconnected';

  constructor(private readonly profile: PrinterProfile) {}

  get profileId(): string {
    return `${this.profile.brand}-${this.profile.model}`.toLowerCase();
  }

  isConnected(): boolean {
    return this.status === 'ready' || this.status === 'printing';
  }

  getStatus(): PrinterStatus {
    return this.status;
  }

  /** Android device can use RawBT — install is verified only on dispatch error. */
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
    rawbtLog.info('adapter:connect', { status: 'ready' });
  }

  async disconnect(): Promise<void> {
    this.status = 'disconnected';
  }

  async preview(data: Uint8Array): Promise<void> {
    if (data.length === 0) {
      throw new Error('Data ESC/POS kosong');
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

    try {
      const base64 = bytesToBase64(data);
      rawbtLog.info('adapter:send', {
        action,
        bytes: data.length,
        profile: this.profileId,
        payloadBase64Length: base64.length,
      });

      dispatchRawBtPrint(base64);
      this.status = 'ready';
    } catch (error) {
      this.status = 'error';
      rawbtLog.error('adapter:error', {
        action,
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof RawBtNotInstalledError || isActivityNotFoundError(error)) {
        throw new RawBtNotInstalledError();
      }

      throw error;
    }
  }
}
