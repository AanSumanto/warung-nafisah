'use client';

import { useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { AppCard, AppTable } from '@/shared/components/ui';
import { useSnackbar } from '@/shared/hooks';
import { isApiNotFound } from '@/shared/lib/api';
import { usePermission } from '@/shared/providers';
import {
  CATEGORY_LABELS,
  CATEGORY_SHORT_LABELS,
  EmptyState,
  formatIdr,
  formatIdrPlain,
  HistoryTableSkeleton,
  MENU_CATEGORY_CODES,
  type Menu,
  type MenuCategoryCode,
  useCreateMenu,
  useManageMenus,
  useUpdateMenuPrice,
} from '@/features/pos';

const EMPTY_CREATE_FORM = {
  kodeMenu: '',
  namaMenu: '',
  kodeKategori: 'MODEL' as MenuCategoryCode,
  hargaJual: '',
  sellingTime: '',
};

export default function OwnerMenusPage() {
  const router = useRouter();
  const { hasRole } = usePermission();
  const { enqueueSnackbar } = useSnackbar();
  const { data: menus = [], isLoading, isError } = useManageMenus();
  const updatePrice = useUpdateMenuPrice();
  const createMenu = useCreateMenu();

  const [editing, setEditing] = useState<Menu | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);

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

  const openCreate = () => {
    setCreateForm(EMPTY_CREATE_FORM);
    setCreateOpen(true);
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
        onError: (error) => {
          if (isApiNotFound(error)) {
            enqueueSnackbar('Server API belum di-update — deploy backend terbaru untuk edit harga', {
              variant: 'warning',
            });
            return;
          }
          enqueueSnackbar('Gagal memperbarui harga', { variant: 'error' });
        },
      },
    );
  };

  const handleCreate = () => {
    const kodeMenu = createForm.kodeMenu.trim().toUpperCase();
    const namaMenu = createForm.namaMenu.trim();
    const hargaJual = Number(createForm.hargaJual.replace(/\D/g, ''));
    const sellingTime = createForm.sellingTime.trim();

    if (!kodeMenu) {
      enqueueSnackbar('Kode menu wajib diisi', { variant: 'warning' });
      return;
    }
    if (!namaMenu) {
      enqueueSnackbar('Nama menu wajib diisi', { variant: 'warning' });
      return;
    }
    if (!Number.isFinite(hargaJual) || hargaJual <= 0) {
      enqueueSnackbar('Harga jual tidak valid', { variant: 'warning' });
      return;
    }

    createMenu.mutate(
      {
        kodeMenu,
        namaMenu,
        kodeKategori: createForm.kodeKategori,
        hargaJual,
        tipeMenu: 'ITEM',
        sellingTime: sellingTime || undefined,
      },
      {
        onSuccess: (menu) => {
          enqueueSnackbar(`Menu ${menu.namaMenu} ditambahkan`, { variant: 'success' });
          setCreateOpen(false);
        },
        onError: (error) => {
          if (isApiNotFound(error)) {
            enqueueSnackbar('Server API belum di-update — deploy backend terbaru untuk tambah menu', {
              variant: 'warning',
            });
            return;
          }
          enqueueSnackbar('Gagal menambahkan menu', { variant: 'error' });
        },
      },
    );
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { sm: 'center' },
          justifyContent: 'space-between',
          gap: 1.5,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={800} gutterBottom>
            Profil Menu
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Kelola daftar menu, tambah item baru, dan sesuaikan harga jual.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ flexShrink: 0 }}>
          Tambah Menu
        </Button>
      </Box>

      <AppCard contentProps={{ sx: { p: { xs: 1, sm: 2 } } }}>
        {isLoading ? (
          <HistoryTableSkeleton />
        ) : isError ? (
          <Typography color="error">Gagal memuat daftar menu.</Typography>
        ) : menus.length === 0 ? (
          <EmptyState emoji="📋" title="Belum ada menu" description="Tambahkan menu pertama lewat tombol di atas." />
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

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Tambah Menu</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Kode menu"
              value={createForm.kodeMenu}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, kodeMenu: event.target.value.toUpperCase() }))
              }
              placeholder="Contoh: MNM004"
              fullWidth
              helperText="Unik, huruf besar. Contoh: LL002, RGN001"
            />
            <TextField
              label="Nama menu"
              value={createForm.namaMenu}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, namaMenu: event.target.value }))}
              placeholder="Contoh: Es Jeruk"
              fullWidth
            />
            <TextField
              select
              label="Kategori"
              value={createForm.kodeKategori}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  kodeKategori: event.target.value as MenuCategoryCode,
                }))
              }
              fullWidth
            >
              {MENU_CATEGORY_CODES.map((code) => (
                <MenuItem key={code} value={code}>
                  {CATEGORY_LABELS[code]}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Harga jual (Rp)"
              value={createForm.hargaJual}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, hargaJual: event.target.value }))}
              inputMode="numeric"
              fullWidth
              helperText={
                createForm.hargaJual
                  ? `Preview: Rp ${formatIdrPlain(Number(createForm.hargaJual.replace(/\D/g, '') || 0))}`
                  : undefined
              }
            />
            <TextField
              label="Jam jual (opsional)"
              value={createForm.sellingTime}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, sellingTime: event.target.value }))}
              placeholder="07:00 - 14:00"
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleCreate} disabled={createMenu.isPending}>
            Simpan
          </Button>
        </DialogActions>
      </Dialog>

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
