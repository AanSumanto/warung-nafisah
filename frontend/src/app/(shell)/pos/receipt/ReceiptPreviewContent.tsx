'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  ReceiptBuilder,
  ReceiptPreviewPanel,
  getPrintService,
  getReceiptBusinessConfig,
} from '@/features/printing';
import { useOrder } from '@/features/pos';

export function ReceiptPreviewContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') ?? '';
  const { data: order, isLoading, isError } = useOrder(orderId || null);
  const [printing, setPrinting] = useState(false);

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

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Preview Struk
      </Typography>
      <ReceiptPreviewPanel
        receipt={receipt}
        variant="page"
        printing={printing}
        onPrint={() => {
          setPrinting(true);
          void getPrintService()
            .print(receipt)
            .finally(() => setPrinting(false));
        }}
        onBack={() => undefined}
      />
    </Box>
  );
}
