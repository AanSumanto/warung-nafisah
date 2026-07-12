import type { PrintConfig, PrinterType } from '../types/printer';
import type { ReceiptBusinessConfig } from '../types/receipt';
import { getClientEnv } from '@/shared/lib/env';
import { isAndroidDevice } from '../rawbt/rawbtBridge';

const CONFIG_KEY = 'wn_print_config';

function detectDefaultPrinterType(): PrinterType {
  if (typeof window !== 'undefined' && isAndroidDevice()) {
    return 'rawbt';
  }
  return 'browser';
}

const DEFAULT_PRINT_CONFIG: PrintConfig = {
  printerType: detectDefaultPrinterType(),
  printerName: 'Blueprint BP-ECO58',
  connectionMethod: 'bluetooth',
  bridge: 'rawbt',
  paperWidth: '58mm',
  autoConnect: true,
  autoPrint: false,
  printerConnected: false,
};

export function getPrintConfig(): PrintConfig {
  if (typeof window === 'undefined') return DEFAULT_PRINT_CONFIG;
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return DEFAULT_PRINT_CONFIG;
    return { ...DEFAULT_PRINT_CONFIG, ...(JSON.parse(raw) as Partial<PrintConfig>) };
  } catch {
    return DEFAULT_PRINT_CONFIG;
  }
}

export function savePrintConfig(config: Partial<PrintConfig>): PrintConfig {
  const next = { ...getPrintConfig(), ...config };
  if (typeof window !== 'undefined') {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
  }
  return next;
}

export function setRawBtPrinterConnected(connected: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('wn_rawbt_printer_connected', connected ? 'true' : 'false');
  }
  savePrintConfig({ printerConnected: connected });
}

export function getReceiptBusinessConfig(): ReceiptBusinessConfig {
  const appName = getClientEnv().NEXT_PUBLIC_APP_NAME.replace(' ERP', '').toUpperCase();
  const printConfig = getPrintConfig();
  return {
    ...DEFAULT_BUSINESS,
    businessName: appName,
    paperWidth: printConfig.paperWidth,
  };
}

const DEFAULT_BUSINESS: ReceiptBusinessConfig = {
  businessName: 'WARUNG NAFISAH',
  logo: null,
  address: null,
  phone: null,
  footerMessage: 'Terima kasih.\nSelamat menikmati.',
  paperWidth: '58mm',
};
