'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import {
  CATEGORY_EMOJI,
  CATEGORY_SHORT_LABELS,
  getMenuEmoji,
  MENU_CATEGORY_CODES,
} from '../constants';
import type { Menu, MenuCategoryCode } from '../types';

interface CategoryChipsProps {
  readonly activeCategory: MenuCategoryCode | 'all';
  readonly onCategoryChange: (category: MenuCategoryCode | 'all') => void;
}

export function CategoryChips({ activeCategory, onCategoryChange }: CategoryChipsProps) {
  const categories: Array<MenuCategoryCode | 'all'> = ['all', ...MENU_CATEGORY_CODES];

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', minWidth: 0, overflow: 'hidden' }}>
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          pb: 0.5,
          mx: { xs: -2, md: 0 },
          px: { xs: 2, md: 0 },
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
      {categories.map((category) => {
        const isActive = category === activeCategory;
        const label = category === 'all' ? 'Semua' : CATEGORY_SHORT_LABELS[category];
        const emoji = category === 'all' ? '🍽️' : CATEGORY_EMOJI[category];

        return (
          <Chip
            key={category}
            label={
              <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <span aria-hidden>{emoji}</span>
                {label}
              </Box>
            }
            onClick={() => onCategoryChange(category)}
            color={isActive ? 'primary' : 'default'}
            variant={isActive ? 'filled' : 'outlined'}
            sx={{
              flexShrink: 0,
              minHeight: 44,
              px: 0.5,
              fontWeight: 700,
              borderWidth: isActive ? 0 : 1,
            }}
          />
        );
      })}
      </Box>
    </Box>
  );
}

interface FavoriteMenuRowProps {
  readonly menus: readonly Menu[];
  readonly onAdd: (menu: Menu) => void;
}

export function FavoriteMenuRow({ menus, onAdd }: FavoriteMenuRowProps) {
  if (menus.length === 0) return null;

  return (
    <Box sx={{ mb: 2, width: '100%', maxWidth: '100%', minWidth: 0 }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
        ⭐ Favorit
      </Typography>
      <Box sx={{ width: '100%', maxWidth: '100%', minWidth: 0, overflow: 'hidden' }}>
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            pb: 0.5,
            mx: { xs: -2, md: 0 },
            px: { xs: 2, md: 0 },
            WebkitOverflowScrolling: 'touch',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
        {menus.map((menu) => (
          <Chip
            key={menu.kodeMenu}
            label={`${getMenuEmoji(menu.kodeMenu, menu.kodeKategori)} ${menu.namaMenu}`}
            onClick={() => onAdd(menu)}
            disabled={menu.status === 'sold_out'}
            sx={{ flexShrink: 0, minHeight: 44, fontWeight: 600, fontSize: '0.85rem' }}
          />
        ))}
        </Box>
      </Box>
    </Box>
  );
}
