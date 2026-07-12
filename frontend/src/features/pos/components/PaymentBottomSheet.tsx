'use client';

import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { AppButton } from '@/shared/components/ui';
import { BOTTOM_NAV_HEIGHT } from '@/shared/theme/breakpoints';
import {
  formatIdr,
  getQuickCashAmounts,
  PAYMENT_METHOD_EMOJI,
  PAYMENT_METHOD_LABELS,
} from '../constants';
import type { PaymentMethod } from '../types';
import { NumericPad } from './NumericPad';

interface PaymentBottomSheetProps {
  readonly open: boolean;
  readonly total: number;
  readonly loading?: boolean;
  readonly onClose: () => void;
  readonly onConfirm: (method: PaymentMethod, paidAmount: number) => void;
}

export function PaymentBottomSheet({
  open,
  total,
  loading = false,
  onClose,
  onConfirm,
}: PaymentBottomSheetProps) {
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [cashInput, setCashInput] = useState('');

  useEffect(() => {
    if (open) {
      setMethod('cash');
      setCashInput(String(total));
    }
  }, [open, total]);

  const cashReceived = Number(cashInput || '0');
  const change = Math.max(0, cashReceived - total);
  const canConfirmCash = cashReceived >= total;
  const quickAmounts = getQuickCashAmounts(total);

  const handleConfirm = () => {
    if (method === 'cash' && !canConfirmCash) return;
    onConfirm(method, method === 'cash' ? cashReceived : total);
  };

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={loading ? undefined : onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: '92vh',
          pb: `${BOTTOM_NAV_HEIGHT}px`,
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" fontWeight={800}>
            Pembayaran
          </Typography>
          <IconButton onClick={onClose} disabled={loading} aria-label="Tutup pembayaran">
            <CloseIcon />
          </IconButton>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          Total bayar
        </Typography>
        <Typography variant="h4" color="primary.main" fontWeight={900} sx={{ mb: 2 }}>
          {formatIdr(total)}
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 2 }}>
          {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((key) => {
            const selected = method === key;
            return (
              <Button
                key={key}
                variant={selected ? 'contained' : 'outlined'}
                onClick={() => setMethod(key)}
                sx={{
                  minHeight: 72,
                  flexDirection: 'column',
                  gap: 0.5,
                  fontWeight: 700,
                  borderRadius: 2.5,
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{PAYMENT_METHOD_EMOJI[key]}</span>
                {PAYMENT_METHOD_LABELS[key]}
              </Button>
            );
          })}
        </Box>

        {method === 'cash' ? (
          <>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              Uang diterima
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
              {quickAmounts.map((amount) => (
                <Chip
                  key={amount}
                  label={amount === total ? `Pas ${formatIdr(amount)}` : formatIdr(amount)}
                  onClick={() => setCashInput(String(amount))}
                  color={cashInput === String(amount) ? 'primary' : 'default'}
                  sx={{ minHeight: 40, fontWeight: 700 }}
                />
              ))}
            </Box>
            <NumericPad value={cashInput} onChange={setCashInput} />
            <Box
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: change > 0 ? 'success.50' : 'grey.50',
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Kembalian
              </Typography>
              <Typography variant="h3" fontWeight={900} color={change > 0 ? 'success.dark' : 'text.primary'}>
                {formatIdr(change)}
              </Typography>
            </Box>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Konfirmasi pembayaran {PAYMENT_METHOD_LABELS[method]} untuk menyelesaikan transaksi.
          </Typography>
        )}

        <AppButton
          variant="contained"
          fullWidth
          loading={loading}
          disabled={method === 'cash' && !canConfirmCash}
          onClick={handleConfirm}
          sx={{ mt: 2, minHeight: 56, fontWeight: 800, fontSize: '1.05rem' }}
        >
          Selesaikan & Cetak
        </AppButton>
      </Box>
    </Drawer>
  );
}
