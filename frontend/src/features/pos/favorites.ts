import { DEFAULT_FAVORITE_KODE_MENUS } from './constants';
import type { Menu } from './types';

const STORAGE_KEY = 'wn_favorite_kode_menus';
const LEGACY_STORAGE_KEY = 'wn_favorite_menu_ids';

export function getStoredFavoriteKodeMenus(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
    }
    return [];
  } catch {
    return [];
  }
}

export function setStoredFavoriteKodeMenus(kodeMenus: string[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(kodeMenus));
}

export function resolveFavoriteMenus(menus: readonly Menu[]): Menu[] {
  const storedKodes = getStoredFavoriteKodeMenus();
  if (storedKodes.length > 0) {
    const byKode = new Map(menus.map((m) => [m.kodeMenu, m]));
    return storedKodes
      .map((kode) => byKode.get(kode))
      .filter((m): m is Menu => Boolean(m && m.status !== 'hidden'));
  }

  const byKode = new Map(menus.map((m) => [m.kodeMenu, m]));
  return DEFAULT_FAVORITE_KODE_MENUS.map((kode) => byKode.get(kode)).filter(
    (m): m is Menu => Boolean(m && m.status !== 'hidden'),
  );
}

export function toggleFavoriteKodeMenu(kodeMenu: string): string[] {
  const current = getStoredFavoriteKodeMenus();
  const next = current.includes(kodeMenu)
    ? current.filter((kode) => kode !== kodeMenu)
    : [...current, kodeMenu];
  setStoredFavoriteKodeMenus(next);
  return next;
}

export function isFavoriteMenu(kodeMenu: string): boolean {
  return getStoredFavoriteKodeMenus().includes(kodeMenu);
}

/** @deprecated Use toggleFavoriteKodeMenu */
export function toggleFavoriteMenuId(menuId: string): string[] {
  void menuId;
  return getStoredFavoriteKodeMenus();
}

/** @deprecated Use getStoredFavoriteKodeMenus */
export function getStoredFavoriteIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) return [];
  } catch {
    // ignore
  }
  return getStoredFavoriteKodeMenus();
}

/** @deprecated Use setStoredFavoriteKodeMenus */
export function setStoredFavoriteIds(ids: string[]): void {
  setStoredFavoriteKodeMenus(ids);
}
