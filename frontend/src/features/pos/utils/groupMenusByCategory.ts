import { MENU_CATEGORY_CODES } from '../constants';
import type { Menu, MenuCategoryCode } from '../types';

export function groupMenusByCategory(
  menus: readonly Menu[],
): Array<{ category: MenuCategoryCode; items: Menu[] }> {
  const map = new Map<MenuCategoryCode, Menu[]>();

  for (const menu of menus) {
    const category = menu.kodeKategori as MenuCategoryCode;
    const bucket = map.get(category);
    if (bucket) {
      bucket.push(menu);
    } else {
      map.set(category, [menu]);
    }
  }

  for (const items of map.values()) {
    items.sort((a, b) => a.namaMenu.localeCompare(b.namaMenu, 'id'));
  }

  const ordered: Array<{ category: MenuCategoryCode; items: Menu[] }> = [];
  for (const category of MENU_CATEGORY_CODES) {
    const items = map.get(category);
    if (items?.length) {
      ordered.push({ category, items });
      map.delete(category);
    }
  }

  for (const [category, items] of map.entries()) {
    if (items.length) {
      ordered.push({ category, items });
    }
  }

  return ordered;
}
