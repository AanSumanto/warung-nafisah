'use client';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import { RAWBT_PLAY_STORE_URL } from '../rawbt/rawbtBridge';

interface RawBtNotInstalledDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

export function RawBtNotInstalledDialog({ open, onClose }: RawBtNotInstalledDialogProps) {
  const handleInstall = () => {
    window.open(RAWBT_PLAY_STORE_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>RawBT Belum Terpasang</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          Aplikasi RawBT belum ditemukan. Silakan install terlebih dahulu untuk menggunakan printer
          Bluetooth.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, flexDirection: 'column', gap: 1 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<OpenInNewIcon />}
          onClick={handleInstall}
          sx={{ minHeight: 48, fontWeight: 700 }}
        >
          Install RawBT
        </Button>
        <Button variant="text" fullWidth onClick={onClose} sx={{ minHeight: 44 }}>
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
}
