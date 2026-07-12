'use client';

import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { AppButton, AppDialog } from '@/shared/components/ui';
import { useCloseShift, useOpenShift } from '../hooks';
import { NumericPad } from './NumericPad';

interface OpenShiftDialogProps {
  readonly open: boolean;
}

export function OpenShiftDialog({ open }: OpenShiftDialogProps) {
  const [openingCash, setOpeningCash] = useState('0');
  const openShiftMutation = useOpenShift();

  const handleOpen = async () => {
    const value = Number(openingCash || '0');
    if (Number.isNaN(value) || value < 0) return;
    await openShiftMutation.mutateAsync({ openingCash: value });
  };

  return (
    <AppDialog
      open={open}
      disableEscapeKeyDown
      title="Buka Shift"
      contentProps={{ sx: { pt: 1 } }}
      actionsContent={
        <AppButton
          variant="contained"
          loading={openShiftMutation.isPending}
          onClick={() => void handleOpen()}
          sx={{ minHeight: 48, fontWeight: 800 }}
        >
          Buka Shift
        </AppButton>
      }
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Buka shift terlebih dahulu sebelum menerima pesanan.
      </Typography>
      <NumericPad value={openingCash} onChange={setOpeningCash} label="Kas awal" />
    </AppDialog>
  );
}

interface CloseShiftDialogProps {
  readonly open: boolean;
  readonly shiftId: string;
  readonly onClose: () => void;
}

export function CloseShiftDialog({ open, shiftId, onClose }: CloseShiftDialogProps) {
  const [closingCash, setClosingCash] = useState('');
  const closeShiftMutation = useCloseShift();

  const handleClose = async () => {
    const value = Number(closingCash || '0');
    if (Number.isNaN(value) || value < 0) return;

    await closeShiftMutation.mutateAsync({
      shiftId,
      body: { closingCash: value },
    });
    setClosingCash('');
    onClose();
  };

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title="Tutup Shift"
      contentProps={{ sx: { pt: 1 } }}
      actionsContent={
        <>
          <AppButton variant="outlined" color="inherit" onClick={onClose}>
            Batal
          </AppButton>
          <AppButton
            variant="contained"
            color="secondary"
            loading={closeShiftMutation.isPending}
            onClick={() => void handleClose()}
          >
            Tutup Shift
          </AppButton>
        </>
      }
    >
      <NumericPad value={closingCash} onChange={setClosingCash} label="Kas akhir" />
    </AppDialog>
  );
}
