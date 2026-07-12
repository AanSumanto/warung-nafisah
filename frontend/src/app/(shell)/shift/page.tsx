'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { AppButton } from '@/shared/components/ui';
import { useSnackbar } from '@/shared/hooks';
import {
  CloseShiftDialog,
  formatIdr,
  NumericPad,
  useCurrentShift,
  useOpenShift,
} from '@/features/pos';

export default function ShiftPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { data: shift, isLoading } = useCurrentShift();
  const openShiftMutation = useOpenShift();
  const [openingCash, setOpeningCash] = useState('0');
  const [closeOpen, setCloseOpen] = useState(false);

  const handleOpen = async () => {
    const value = Number(openingCash || '0');
    if (Number.isNaN(value) || value < 0) return;
    try {
      await openShiftMutation.mutateAsync({ openingCash: value });
      enqueueSnackbar('Shift berhasil dibuka', { variant: 'success' });
      setOpeningCash('0');
    } catch {
      enqueueSnackbar('Gagal membuka shift', { variant: 'error' });
    }
  };

  if (isLoading) {
    return <Typography color="text.secondary">Memuat data shift...</Typography>;
  }

  if (!shift) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={800} gutterBottom>
          Buka Shift
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Masukkan kas awal untuk mulai menerima pesanan.
        </Typography>
        <NumericPad value={openingCash} onChange={setOpeningCash} label="Kas awal" />
        <AppButton
          variant="contained"
          fullWidth
          loading={openShiftMutation.isPending}
          onClick={() => void handleOpen()}
          sx={{ mt: 2, minHeight: 52, fontWeight: 800 }}
        >
          Buka Shift
        </AppButton>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Shift Aktif
      </Typography>

      <Box
        sx={{
          p: 2,
          borderRadius: 3,
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          mb: 2,
          boxShadow: '0 2px 12px rgba(26,26,26,0.06)',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Kas awal
        </Typography>
        <Typography variant="h4" fontWeight={900} color="primary.main">
          {formatIdr(shift.openingCash)}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Dibuka: {new Date(shift.openedAt).toLocaleString('id-ID')}
        </Typography>
      </Box>

      <AppButton
        variant="contained"
        color="secondary"
        fullWidth
        onClick={() => setCloseOpen(true)}
        sx={{ minHeight: 52, fontWeight: 800 }}
      >
        Tutup Shift
      </AppButton>

      <CloseShiftDialog open={closeOpen} shiftId={shift.id} onClose={() => setCloseOpen(false)} />
    </Box>
  );
}
