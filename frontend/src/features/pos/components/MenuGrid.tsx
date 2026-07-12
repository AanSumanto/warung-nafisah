'use client';

import Box from '@mui/material/Box';
import { useMemo } from 'react';
import type { Menu, MenuCategoryCode } from '../types';
import { EmptyState } from './EmptyState';
import { MenuCard } from './MenuCard';

interface MenuGridProps {
  readonly menus: readonly Menu[];
  readonly activeCategory: MenuCategoryCode | 'all';
  readonly searchQuery: string;
  readonly onAddMenu: (menu: Menu) => void;
}

export function MenuGrid({ menus, activeCategory, searchQuery, onAddMenu }: MenuGridProps) {
  const filteredMenus = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return menus.filter((menu) => {
      if (menu.status === 'hidden') return false;
      if (activeCategory !== 'all' && menu.kodeKategori !== activeCategory) return false;
      if (query && !menu.namaMenu.toLowerCase().includes(query) && !menu.kodeMenu.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [menus, activeCategory, searchQuery]);

  if (filteredMenus.length === 0) {
    return (
      <EmptyState
        emoji="🔍"
        title="Menu tidak ditemukan"
        description="Coba kategori lain atau ubah kata kunci pencarian."
      />
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))',
          sm: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(3, minmax(0, 1fr))',
          lg: 'repeat(3, minmax(0, 1fr))',
          xl: 'repeat(4, minmax(0, 1fr))',
        },
        gap: { xs: 1, sm: 1.25, lg: 1.5 },
        alignItems: 'stretch',
        '& > *': {
          minWidth: 0,
          maxWidth: '100%',
        },
      }}
    >
      {filteredMenus.map((menu) => (
        <MenuCard key={menu.id} menu={menu} onAdd={onAddMenu} />
      ))}
    </Box>
  );
}
