'use client';

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';
import { AppTable } from '@/shared/components/ui';
import { CATEGORY_SHORT_LABELS, formatIdr } from '../constants';
import type { Menu, MenuCategoryCode } from '../types';
import { filterMenus } from '../utils/filterMenus';
import { EmptyState } from './EmptyState';

interface MenuListProps {
  readonly menus: readonly Menu[];
  readonly activeCategory: MenuCategoryCode | 'all';
  readonly searchQuery: string;
  readonly onAddMenu: (menu: Menu) => void;
}

export function MenuList({ menus, activeCategory, searchQuery, onAddMenu }: MenuListProps) {
  const filteredMenus = useMemo(
    () => filterMenus(menus, activeCategory, searchQuery),
    [menus, activeCategory, searchQuery],
  );

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
    <AppTable>
      <TableHead>
        <TableRow>
          <TableCell sx={{ width: 88 }}>Kode</TableCell>
          <TableCell>Nama Menu</TableCell>
          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Kategori</TableCell>
          <TableCell align="right" sx={{ width: 100 }}>
            Harga
          </TableCell>
          <TableCell align="center" sx={{ width: 72 }}>
            Tambah
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {filteredMenus.map((menu) => {
          const soldOut = menu.status === 'sold_out';
          return (
            <TableRow
              key={menu.id}
              hover={!soldOut}
              sx={{ opacity: soldOut ? 0.55 : 1 }}
            >
              <TableCell>
                <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                  {menu.kodeMenu}
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={700} noWrap>
                    {menu.namaMenu}
                  </Typography>
                  <Box sx={{ display: { xs: 'flex', sm: 'none' }, gap: 0.5 }}>
                    <Chip
                      size="small"
                      label={CATEGORY_SHORT_LABELS[menu.kodeKategori]}
                      sx={{ height: 20, fontSize: '0.65rem' }}
                    />
                    {soldOut ? (
                      <Chip size="small" color="warning" label="Habis" sx={{ height: 20, fontSize: '0.65rem' }} />
                    ) : null}
                  </Box>
                </Box>
              </TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                <Typography variant="body2" color="text.secondary">
                  {CATEGORY_SHORT_LABELS[menu.kodeKategori]}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" fontWeight={800}>
                  {formatIdr(menu.hargaJual)}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Button
                  variant="contained"
                  size="small"
                  disabled={soldOut}
                  onClick={() => onAddMenu(menu)}
                  aria-label={`Tambah ${menu.namaMenu}`}
                  sx={{ minWidth: 40, minHeight: 36, px: 1 }}
                >
                  <AddIcon fontSize="small" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </AppTable>
  );
}
