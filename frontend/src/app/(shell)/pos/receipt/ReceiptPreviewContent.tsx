'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  ReceiptBuilder,
  ReceiptPreviewPanel,
  RawBtNotInstalledDialog,
  printReceipt,
  getReceiptBusinessConfig,
  isRawBtNotInstalledError,
} from '@/features/printing';
import { useOrder } from '@/features/pos';
import { useSnackbar } from '@/shared/hooks';

export function ReceiptPreviewContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') ?? '';
  const { data: order, isLoading, isError } = useOrder(orderId || null);
  const [printing, setPrinting] = useState(false);
  const [rawBtDialogOpen, setRawBtDialogOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const receipt = useMemo(
    () => (order ? ReceiptBuilder.build(order, getReceiptBusinessConfig()) : null),
    [order],
  );

  if (!orderId) {
    return <Typography color="error">Order tidak ditemukan.</Typography>;
  }

  if (isLoading) {
    return <Typography>Memuat struk...</Typography>;
  }

  if (isError || !order || !receipt) {
    return <Typography color="error">Gagal memuat data struk.</Typography>;
  }

  const handlePrint = async () => {
    setPrinting(true);
    enqueueSnackbar('Mengirim ke printer…', { variant: 'info', preventDuplicate: true });
    try {
      await printReceipt(receipt);
      enqueueSnackbar('Struk dikirim ke printer', { variant: 'success' });
    } catch (error) {
      if (isRawBtNotInstalledError(error)) {
        setRawBtDialogOpen(true);
        enqueueSnackbar('RawBT belum terpasang', { variant: 'warning' });
      } else {
        const message = error instanceof Error ? error.message : 'Gagal mencetak struk';
        enqueueSnackbar(message, { variant: 'error' });
      }
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Preview Struk
      </Typography>
      <ReceiptPreviewPanel
        receipt={receipt}
        variant="page"
        printing={printing}
        onPrint={() => void handlePrint()}
        onBack={() => undefined}
      />
      <RawBtNotInstalledDialog open={rawBtDialogOpen} onClose={() => setRawBtDialogOpen(false)} />
    </Box>
  );
}
