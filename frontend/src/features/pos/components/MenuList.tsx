'use client';

import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
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
import { CATEGORY_EMOJI, CATEGORY_LABELS, formatIdr } from '../constants';
import type { Menu, MenuCategoryCode } from '../types';
import { filterMenus } from '../utils/filterMenus';
import { groupMenusByCategory } from '../utils/groupMenusByCategory';
import { EmptyState } from './EmptyState';

interface MenuListProps {
  readonly menus: readonly Menu[];
  readonly activeCategory: MenuCategoryCode | 'all';
  readonly searchQuery: string;
  readonly onAddMenu: (menu: Menu) => void;
}

function MenuRows({
  items,
  onAddMenu,
}: {
  readonly items: readonly Menu[];
  readonly onAddMenu: (menu: Menu) => void;
}) {
  return (
    <AppTable>
      <TableHead>
        <TableRow>
          <TableCell>Nama Menu</TableCell>
          <TableCell align="right" sx={{ width: 110 }}>
            Harga
          </TableCell>
          <TableCell align="center" sx={{ width: 72 }}>
            Tambah
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((menu) => {
          const soldOut = menu.status === 'sold_out';
          return (
            <TableRow key={menu.id} hover={!soldOut} sx={{ opacity: soldOut ? 0.55 : 1 }}>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={700} noWrap>
                    {menu.namaMenu}
                  </Typography>
                  {soldOut ? (
                    <Chip size="small" color="warning" label="Habis" sx={{ height: 20, fontSize: '0.65rem' }} />
                  ) : null}
                </Box>
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

export function MenuList({ menus, activeCategory, searchQuery, onAddMenu }: MenuListProps) {
  const filteredMenus = useMemo(
    () => filterMenus(menus, activeCategory, searchQuery),
    [menus, activeCategory, searchQuery],
  );

  const groups = useMemo(() => groupMenusByCategory(filteredMenus), [filteredMenus]);

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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {groups.map(({ category, items }) => (
        <Accordion
          key={category}
          defaultExpanded
          disableGutters
          elevation={0}
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            overflow: 'hidden',
            '&:before': { display: 'none' },
            bgcolor: 'background.paper',
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              minHeight: 48,
              px: 2,
              '& .MuiAccordionSummary-content': { my: 1, alignItems: 'center', gap: 1 },
            }}
          >
            <Typography component="span" aria-hidden sx={{ fontSize: '1.1rem' }}>
              {CATEGORY_EMOJI[category]}
            </Typography>
            <Typography variant="subtitle2" fontWeight={800} sx={{ flex: 1 }}>
              {CATEGORY_LABELS[category]}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {items.length} menu
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0, borderTop: 1, borderColor: 'divider' }}>
            <MenuRows items={items} onAddMenu={onAddMenu} />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
