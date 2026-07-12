export const DINING_TYPE_LABELS = {
  dine_in: 'Makan di Tempat',
  take_away: 'Bungkus',
} as const;

export const PAYMENT_METHOD_LABELS = {
  cash: 'Tunai',
  qris: 'QRIS',
  transfer: 'Transfer',
} as const;

export const PAYMENT_METHOD_EMOJI = {
  cash: '💵',
  qris: '📱',
  transfer: '🏦',
} as const;

export const DEFAULT_FAVORITE_KODE_MENUS = ['LL001', 'PKT001', 'AYM001', 'MNM001', 'MDG001'] as const;

export const QUICK_NOTE_OPTIONS = [
  'Tanpa sambal',
  'Pedas',
  'Tidak pedas',
  'Nasi tambahan',
] as const;

export const MENU_CATEGORY_CODES = ['PECEL', 'MODEL', 'MINUMAN', 'ADDON', 'SIDE'] as const;

export const CATEGORY_LABELS: Record<(typeof MENU_CATEGORY_CODES)[number], string> = {
  PECEL: 'Pecel Lele',
  MODEL: 'Model Gandum',
  MINUMAN: 'Minuman',
  ADDON: 'Add On',
  SIDE: 'Sayuran',
};

export const CATEGORY_SHORT_LABELS: Record<(typeof MENU_CATEGORY_CODES)[number], string> = {
  PECEL: 'Pecel',
  MODEL: 'Model',
  MINUMAN: 'Minuman',
  ADDON: 'Addon',
  SIDE: 'Sayur',
};

export const MENU_EMOJI: Record<string, string> = {
  MNM001: '🧊',
  MNM003: '🥥',
  MDG001: '🍚',
  AYM001: '🍗',
  LL001: '🐟',
  NAS001: '🍚',
  NAS002: '🍚',
  SYR001: '🥬',
  ADD001: '🐟',
  PKT001: '🍱',
  PKT002: '🍱',
  PKT003: '🍱',
  PKT004: '🍱',
};

export const CATEGORY_EMOJI: Record<(typeof MENU_CATEGORY_CODES)[number], string> = {
  PECEL: '🐟',
  MODEL: '🍚',
  MINUMAN: '🥤',
  ADDON: '➕',
  SIDE: '🥬',
};

export function getMenuEmoji(kodeMenu: string, kodeKategori: string): string {
  return (
    MENU_EMOJI[kodeMenu] ??
    CATEGORY_EMOJI[kodeKategori as (typeof MENU_CATEGORY_CODES)[number]] ??
    '🍽️'
  );
}

export function formatIdr(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

/** Quick cash suggestions based on transaction total */
export function getQuickCashAmounts(total: number): number[] {
  const candidates = new Set<number>([total]);

  const roundUp1k = Math.ceil(total / 1000) * 1000;
  const roundUp5k = Math.ceil(total / 5000) * 5000;
  [roundUp1k, roundUp5k, 50_000, 100_000, 150_000, 200_000].forEach((amount) => {
    if (amount >= total) candidates.add(amount);
  });

  return [...candidates].sort((a, b) => a - b).slice(0, 5);
}

export function formatIdrPlain(amount: number): string {
  return new Intl.NumberFormat('id-ID').format(amount);
}
