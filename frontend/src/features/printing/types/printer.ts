import type { Receipt } from './receipt';

export type PrinterStatus = 'disconnected' | 'connecting' | 'ready' | 'printing' | 'error';

export type PrinterType = 'rawbt' | 'blueprint-eco58' | 'browser';

export type PrinterBridge = 'rawbt' | 'web-bluetooth' | 'browser';

export type PrinterConnectionMethod = 'bluetooth' | 'wifi' | 'usb' | 'lan';

/** Simple readiness states for printer configuration UI. */
export type PrinterReadiness = 'ready' | 'not_connected' | 'rawbt_not_installed' | 'unavailable';

export interface PrinterAdapter {
  readonly type: PrinterType;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  print(data: Uint8Array): Promise<void>;
  reprint(data: Uint8Array): Promise<void>;
  preview(data: Uint8Array): Promise<void>;
  isAvailable(): Promise<boolean>;
  getReadiness?(): Promise<PrinterReadiness>;
  getStatus(): PrinterStatus;
  isConnected(): boolean;
}

export type PrintJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

/** Print queue structure — worker not implemented in Sprint 4.5.2. */
export interface PrintJob {
  readonly id: string;
  readonly orderNumber: string;
  readonly receipt: Receipt;
  readonly status: PrintJobStatus;
  readonly createdAt: string;
  readonly attempts: number;
  readonly lastError?: string;
}

export interface PrintConfig {
  readonly printerType: PrinterType;
  readonly printerName: string;
  readonly connectionMethod: PrinterConnectionMethod;
  readonly bridge: PrinterBridge;
  readonly paperWidth: '58mm' | '80mm';
  readonly autoConnect: boolean;
  readonly autoPrint: boolean;
  /** User confirms printer is paired/connected in RawBT. */
  readonly printerConnected: boolean;
}

export class RawBtNotInstalledError extends Error {
  constructor() {
    super('RAWBT_NOT_INSTALLED');
    this.name = 'RawBtNotInstalledError';
  }
}

export function isRawBtNotInstalledError(error: unknown): boolean {
  return error instanceof RawBtNotInstalledError || (error instanceof Error && error.message === 'RAWBT_NOT_INSTALLED');
}
