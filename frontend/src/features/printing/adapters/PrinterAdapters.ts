import type { PrintConfig, PrinterAdapter, PrinterReadiness, PrinterStatus } from '../types/printer';
import { RawBtPrinterAdapter } from './RawBtPrinterAdapter';

const CHUNK_SIZE = 512;

interface BluetoothGattCharacteristicLike {
  properties: { write?: boolean; writeWithoutResponse?: boolean };
  writeValue(data: BufferSource): Promise<void>;
  writeValueWithoutResponse(data: BufferSource): Promise<void>;
}

interface BluetoothGattServerLike {
  connect(): Promise<BluetoothGattServerLike>;
  connected: boolean;
  disconnect(): void;
  getPrimaryServices(): Promise<Array<{ getCharacteristics(): Promise<BluetoothGattCharacteristicLike[]> }>>;
}

interface BluetoothDeviceLike {
  id?: string;
  gatt?: BluetoothGattServerLike;
}

interface BluetoothNavigator {
  bluetooth: {
    requestDevice(options: Record<string, unknown>): Promise<BluetoothDeviceLike>;
  };
}

/** Generic ESC/POS Bluetooth adapter — Blueprint ECO-58 and compatible printers. */
export class BlueprintEco58BluetoothAdapter implements PrinterAdapter {
  readonly type = 'blueprint-eco58' as const;

  private status: PrinterStatus = 'disconnected';
  private device: BluetoothDeviceLike | null = null;
  private characteristic: BluetoothGattCharacteristicLike | null = null;

  isConnected(): boolean {
    return this.status === 'ready' || this.status === 'printing';
  }

  getStatus(): PrinterStatus {
    return this.status;
  }

  async connect(): Promise<void> {
    if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
      throw new Error('Web Bluetooth tidak tersedia di perangkat ini');
    }

    const btNav = navigator as Navigator & BluetoothNavigator;
    this.status = 'connecting';
    try {
      this.device = await btNav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          '49535343-fe7d-4ae5-8fa9-9fafcf205e55',
        ],
      });

      const server = await this.device.gatt?.connect();
      if (!server) throw new Error('Gagal terhubung ke printer');

      const services = await server.getPrimaryServices();
      let writeCharacteristic: BluetoothGattCharacteristicLike | null = null;

      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const characteristic of characteristics) {
          if (characteristic.properties.write || characteristic.properties.writeWithoutResponse) {
            writeCharacteristic = characteristic;
            break;
          }
        }
        if (writeCharacteristic) break;
      }

      if (!writeCharacteristic) {
        throw new Error('Karakteristik tulis printer tidak ditemukan');
      }

      this.characteristic = writeCharacteristic;
      this.status = 'ready';

      if (this.device.id) {
        localStorage.setItem('wn_printer_device_id', this.device.id);
      }
    } catch (error) {
      this.status = 'error';
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.characteristic = null;
    this.status = 'disconnected';
  }

  async print(data: Uint8Array): Promise<void> {
    await this.write(data);
  }

  async reprint(data: Uint8Array): Promise<void> {
    await this.write(data);
  }

  async preview(_data: Uint8Array): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Printer belum terhubung');
    }
  }

  async isAvailable(): Promise<boolean> {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  async getReadiness(): Promise<PrinterReadiness> {
    const available = await this.isAvailable();
    if (!available) return 'unavailable';
    return this.isConnected() ? 'ready' : 'not_connected';
  }

  private async write(data: Uint8Array): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Printer belum terhubung');
    }

    this.status = 'printing';
    try {
      for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
        const chunk = data.slice(offset, offset + CHUNK_SIZE);
        if (this.characteristic.properties.writeWithoutResponse) {
          await this.characteristic.writeValueWithoutResponse(chunk);
        } else {
          await this.characteristic.writeValue(chunk);
        }
      }
      this.status = 'ready';
    } catch (error) {
      this.status = 'error';
      throw error;
    }
  }
}

/** Browser print fallback via hidden HTML renderer output. */
export class BrowserPrintAdapter implements PrinterAdapter {
  readonly type = 'browser' as const;

  private status: PrinterStatus = 'ready';
  private pendingHtml: { html: string; styles: string } | null = null;

  isConnected(): boolean {
    return true;
  }

  getStatus(): PrinterStatus {
    return this.status;
  }

  async connect(): Promise<void> {
    this.status = 'ready';
  }

  async disconnect(): Promise<void> {
    this.status = 'disconnected';
  }

  setHtmlPayload(html: string, styles: string): void {
    this.pendingHtml = { html, styles };
  }

  async print(_data: Uint8Array): Promise<void> {
    if (!this.pendingHtml) {
      throw new Error('HTML receipt belum disiapkan');
    }
    await this.triggerBrowserPrint(this.pendingHtml.html, this.pendingHtml.styles);
  }

  async reprint(data: Uint8Array): Promise<void> {
    await this.print(data);
  }

  async preview(_data: Uint8Array): Promise<void> {
    if (!this.pendingHtml) {
      throw new Error('HTML receipt belum disiapkan');
    }
  }

  async isAvailable(): Promise<boolean> {
    return typeof window !== 'undefined';
  }

  async getReadiness(): Promise<PrinterReadiness> {
    return (await this.isAvailable()) ? 'ready' : 'unavailable';
  }

  private triggerBrowserPrint(html: string, styles: string): Promise<void> {
    return new Promise((resolve) => {
      const styleEl = document.createElement('style');
      styleEl.textContent = styles;
      document.head.appendChild(styleEl);

      const container = document.createElement('div');
      container.innerHTML = html;
      document.body.appendChild(container);

      window.setTimeout(() => {
        window.print();
        container.remove();
        styleEl.remove();
        resolve();
      }, 150);
    });
  }
}

export function createPrinterAdapter(config: PrintConfig): PrinterAdapter {
  if (config.printerType === 'rawbt') {
    return new RawBtPrinterAdapter();
  }
  if (config.printerType === 'blueprint-eco58') {
    return new BlueprintEco58BluetoothAdapter();
  }
  return new BrowserPrintAdapter();
}
