import type { Menu, MenuCategoryCode } from '../types';

export function filterMenus(
  menus: readonly Menu[],
  activeCategory: MenuCategoryCode | 'all',
  searchQuery: string,
): Menu[] {
  const query = searchQuery.trim().toLowerCase();
  return menus.filter((menu) => {
    if (menu.status === 'hidden') return false;
    if (activeCategory !== 'all' && menu.kodeKategori !== activeCategory) return false;
    if (
      query &&
      !menu.namaMenu.toLowerCase().includes(query) &&
      !menu.kodeMenu.toLowerCase().includes(query)
    ) {
      return false;
    }
    return true;
  });
}
