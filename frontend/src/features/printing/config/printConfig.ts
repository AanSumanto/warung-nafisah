import type { PrintConfig, PrinterType } from '../types/printer';
import type { ReceiptBusinessConfig } from '../types/receipt';
import { getClientEnv } from '@/shared/lib/env';

const CONFIG_KEY = 'wn_print_config';

const DEFAULT_PRINT_CONFIG: PrintConfig = {
  printerType: 'rawbt',
  printerProfileId: 'blueprint-bp-eco58',
  printerName: 'Blueprint BP-ECO58',
  connectionMethod: 'bluetooth',
  bridge: 'rawbt',
  paperWidth: '58mm',
  autoConnect: true,
  autoPrint: false,
  printerConnected: false,
};

function migrateLegacyConfig(raw: Record<string, unknown>): Partial<PrintConfig> {
  const next = { ...(raw as Partial<PrintConfig>) };

  if (raw.printerType === 'browser') {
    next.printerType = 'rawbt';
    next.bridge = 'rawbt';
  }

  if (!next.printerProfileId) {
    next.printerProfileId = 'blueprint-bp-eco58';
  }

  return next;
}

export function getPrintConfig(): PrintConfig {
  if (typeof window === 'undefined') return DEFAULT_PRINT_CONFIG;
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return DEFAULT_PRINT_CONFIG;
    const parsed = migrateLegacyConfig(JSON.parse(raw) as Record<string, unknown>);
    return { ...DEFAULT_PRINT_CONFIG, ...parsed };
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
