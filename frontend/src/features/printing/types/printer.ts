import type { Receipt } from './receipt';

export type PrinterStatus = 'disconnected' | 'connecting' | 'ready' | 'printing' | 'error';

export type PrinterType = 'blueprint-eco58' | 'browser';

export interface PrinterAdapter {
  readonly type: PrinterType;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  print(data: Uint8Array): Promise<void>;
  reprint(data: Uint8Array): Promise<void>;
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
  readonly paperWidth: '58mm' | '80mm';
  readonly autoConnect: boolean;
  readonly autoPrint: boolean;
}
