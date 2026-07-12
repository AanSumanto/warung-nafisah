'use client';

import { useState } from 'react';
import type { Order } from '../types';
import {
  ReceiptBuilder,
  ReceiptPreviewPanel,
  RawBtNotInstalledDialog,
  printReceiptSync,
  getReceiptBusinessConfig,
  isRawBtNotInstalledError,
  type Receipt,
} from '@/features/printing';
import { useSnackbar } from '@/shared/hooks';

interface ReceiptPreviewSheetProps {
  readonly open: boolean;
  readonly order: Order | null;
  readonly onClose: () => void;
  readonly onPrinted?: () => void;
  readonly mode?: 'print' | 'reprint';
}

export function ReceiptPreviewSheet({
  open,
  order,
  onClose,
  onPrinted,
  mode = 'print',
}: ReceiptPreviewSheetProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [printing, setPrinting] = useState(false);
  const [rawBtDialogOpen, setRawBtDialogOpen] = useState(false);

  if (!order) return null;

  const receipt: Receipt = ReceiptBuilder.build(order, getReceiptBusinessConfig());
  const isReprint = mode === 'reprint';

  const handlePrint = () => {
    setPrinting(true);
    enqueueSnackbar(isReprint ? 'Mengirim cetak ulang…' : 'Mengirim ke printer…', {
      variant: 'info',
      preventDuplicate: true,
    });

    try {
      printReceiptSync(receipt);
      enqueueSnackbar(isReprint ? 'Cetak ulang dikirim ke RawBT' : 'Struk dikirim ke printer', {
        variant: 'success',
      });
      onPrinted?.();
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
    <>
      <ReceiptPreviewPanel
        receipt={receipt}
        open={open}
        variant="drawer"
        printing={printing}
        printLabel={isReprint ? 'Cetak Ulang' : 'Cetak Struk'}
        onPrint={handlePrint}
        onBack={onClose}
      />
      <RawBtNotInstalledDialog open={rawBtDialogOpen} onClose={() => setRawBtDialogOpen(false)} />
    </>
  );
}
