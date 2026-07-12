import type { PrinterAdapter, PrinterReadiness, PrinterStatus } from '../types/printer';
import { RawBtNotInstalledError } from '../types/printer';
import type { PrinterProfile } from '../profiles/printerProfile';
import {
  bytesToBase64,
  dispatchRawBtPrint,
  isAndroidDevice,
  probeRawBtInstalled,
} from '../rawbt/rawbtBridge';

/**
 * RawBT print bridge for Blueprint BP-ECO58 (Bluetooth Classic via SPP).
 * Receives ESC/POS bytes only — never HTML or browser print.
 */
export class RawBtPrinterAdapter implements PrinterAdapter {
  readonly type = 'rawbt' as const;

  private status: PrinterStatus = 'disconnected';
  private rawBtInstalled: boolean | null = null;

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

  async isAvailable(): Promise<boolean> {
    if (!isAndroidDevice()) return false;
    if (this.rawBtInstalled !== null) return this.rawBtInstalled;
    this.rawBtInstalled = await probeRawBtInstalled();
    return this.rawBtInstalled;
  }

  async getReadiness(): Promise<PrinterReadiness> {
    if (!isAndroidDevice()) return 'unavailable';

    const installed = await this.isAvailable();
    if (!installed) return 'rawbt_not_installed';

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

    this.status = 'connecting';
    const installed = await this.isAvailable();
    if (!installed) {
      this.status = 'error';
      throw new RawBtNotInstalledError();
    }

    this.status = 'ready';
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
    await this.sendToRawBt(data);
  }

  async reprint(data: Uint8Array): Promise<void> {
    await this.sendToRawBt(data);
  }

  private async sendToRawBt(data: Uint8Array): Promise<void> {
    if (!isAndroidDevice()) {
      throw new Error('RawBT hanya tersedia di perangkat Android');
    }

    const installed = await this.isAvailable();
    if (!installed) {
      throw new RawBtNotInstalledError();
    }

    this.status = 'printing';
    try {
      const base64 = bytesToBase64(data);
      const result = await dispatchRawBtPrint(base64);

      if (!result.opened) {
        const recheck = await probeRawBtInstalled(800);
        if (!recheck) {
          this.rawBtInstalled = false;
          throw new RawBtNotInstalledError();
        }
      }

      this.status = 'ready';
    } catch (error) {
      this.status = 'error';
      throw error;
    }
  }
}
