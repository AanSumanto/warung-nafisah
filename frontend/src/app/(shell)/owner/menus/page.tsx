'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { AppCard, AppTable } from '@/shared/components/ui';
import { useSnackbar } from '@/shared/hooks';
import { usePermission } from '@/shared/providers';
import {
  CATEGORY_SHORT_LABELS,
  EmptyState,
  formatIdr,
  formatIdrPlain,
  HistoryTableSkeleton,
  type Menu,
  useManageMenus,
  useUpdateMenuPrice,
} from '@/features/pos';

export default function OwnerMenusPage() {
  const router = useRouter();
  const { hasRole } = usePermission();
  const { enqueueSnackbar } = useSnackbar();
  const { data: menus = [], isLoading, isError } = useManageMenus();
  const updatePrice = useUpdateMenuPrice();

  const [editing, setEditing] = useState<Menu | null>(null);
  const [priceInput, setPriceInput] = useState('');

  useEffect(() => {
    if (!hasRole('owner')) {
      router.replace('/pos');
    }
  }, [hasRole, router]);

  if (!hasRole('owner')) {
    return null;
  }

  const openEdit = (menu: Menu) => {
    setEditing(menu);
    setPriceInput(String(menu.hargaJual));
  };

  const handleSave = () => {
    if (!editing) return;
    const hargaJual = Number(priceInput.replace(/\D/g, ''));
    if (!Number.isFinite(hargaJual) || hargaJual <= 0) {
      enqueueSnackbar('Harga jual tidak valid', { variant: 'warning' });
      return;
    }

    updatePrice.mutate(
      { kodeMenu: editing.kodeMenu, hargaJual },
      {
        onSuccess: () => {
          enqueueSnackbar(`Harga ${editing.namaMenu} diperbarui`, { variant: 'success' });
          setEditing(null);
        },
        onError: () => {
          enqueueSnackbar('Gagal memperbarui harga', { variant: 'error' });
        },
      },
    );
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Profil Menu
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Sesuaikan harga jual saat biaya bahan baku berubah. Perubahan berlaku untuk transaksi baru.
      </Typography>

      <AppCard contentProps={{ sx: { p: { xs: 1, sm: 2 } } }}>
        {isLoading ? (
          <HistoryTableSkeleton />
        ) : isError ? (
          <Typography color="error">Gagal memuat daftar menu.</Typography>
        ) : menus.length === 0 ? (
          <EmptyState emoji="📋" title="Belum ada menu" description="Menu master belum tersedia." />
        ) : (
          <AppTable>
            <TableHead>
              <TableRow>
                <TableCell>Kode</TableCell>
                <TableCell>Nama</TableCell>
                <TableCell>Kategori</TableCell>
                <TableCell align="right">Harga Jual</TableCell>
                <TableCell align="center">Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {menus.map((menu) => (
                <TableRow key={menu.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{menu.kodeMenu}</TableCell>
                  <TableCell>{menu.namaMenu}</TableCell>
                  <TableCell>{CATEGORY_SHORT_LABELS[menu.kodeKategori]}</TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={800}>{formatIdr(menu.hargaJual)}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Button size="small" variant="outlined" onClick={() => openEdit(menu)}>
                      Edit Harga
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </AppTable>
        )}
      </AppCard>

      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} fullWidth maxWidth="xs">
        <DialogTitle>Edit Harga Jual</DialogTitle>
        <DialogContent>
          {editing ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {editing.kodeMenu} · {editing.namaMenu}
              </Typography>
              <TextField
                label="Harga jual (Rp)"
                value={priceInput}
                onChange={(event) => setPriceInput(event.target.value)}
                inputMode="numeric"
                fullWidth
                helperText={
                  priceInput
                    ? `Preview: Rp ${formatIdrPlain(Number(priceInput.replace(/\D/g, '') || 0))}`
                    : undefined
                }
              />
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Batal</Button>
          <Button variant="contained" onClick={handleSave} disabled={updatePrice.isPending}>
            Simpan
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
