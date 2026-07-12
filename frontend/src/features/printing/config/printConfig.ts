import type { PrintConfig } from '../types/printer';
import type { ReceiptBusinessConfig } from '../types/receipt';
import { getClientEnv } from '@/shared/lib/env';

const CONFIG_KEY = 'wn_print_config';

const DEFAULT_PRINT_CONFIG: PrintConfig = {
  printerType: 'browser',
  paperWidth: '58mm',
  autoConnect: true,
  autoPrint: false,
};

const DEFAULT_BUSINESS: ReceiptBusinessConfig = {
  businessName: 'WARUNG NAFISAH',
  logo: null,
  address: null,
  phone: null,
  footerMessage: 'Terima kasih.\nSelamat menikmati.',
  paperWidth: '58mm',
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

export function getReceiptBusinessConfig(): ReceiptBusinessConfig {
  const appName = getClientEnv().NEXT_PUBLIC_APP_NAME.replace(' ERP', '').toUpperCase();
  const printConfig = getPrintConfig();
  return {
    ...DEFAULT_BUSINESS,
    businessName: appName,
    paperWidth: printConfig.paperWidth,
  };
}
