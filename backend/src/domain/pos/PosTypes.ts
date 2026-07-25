export const MENU_TYPES = ['ITEM', 'BUNDLE'] as const;
export type MenuType = (typeof MENU_TYPES)[number];

export const MENU_CATEGORY_CODES = ['MODEL', 'PECEL', 'MINUMAN', 'SIDE', 'RINGAN', 'ADDON'] as const;
export type MenuCategoryCode = (typeof MENU_CATEGORY_CODES)[number];

export const CATEGORY_LABELS: Record<MenuCategoryCode, string> = {
  MODEL: 'Model Gandum',
  PECEL: 'Pecel Lele',
  MINUMAN: 'Minuman',
  SIDE: 'Sayuran',
  RINGAN: 'Makanan Ringan',
  ADDON: 'Add On',
};

export type MenuStatus = 'available' | 'sold_out' | 'hidden';

export type OrderStatus = 'draft' | 'paid' | 'cancelled';

export type DiningType = 'dine_in' | 'take_away';

export type PaymentMethod = 'cash' | 'qris' | 'transfer';

export type UserRole = 'owner' | 'kasir';

export type ShiftStatus = 'open' | 'closed';

export interface BundleComponent {
  readonly kodeMenu: string;
  readonly qty: number;
}
