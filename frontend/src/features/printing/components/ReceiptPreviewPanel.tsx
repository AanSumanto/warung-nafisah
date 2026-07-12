'use client';

import PrintIcon from '@mui/icons-material/Print';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { AppButton } from '@/shared/components/ui';
import { BOTTOM_NAV_HEIGHT } from '@/shared/theme/breakpoints';
import type { Receipt } from '../types/receipt';
import { ReceiptThermalView } from './ReceiptThermalView';

interface ReceiptPreviewPanelProps {
  readonly receipt: Receipt;
  readonly printing?: boolean;
  readonly printLabel?: string;
  readonly onPrint: () => void;
  readonly onBack: () => void;
  readonly variant?: 'drawer' | 'page';
  readonly open?: boolean;
}

export function ReceiptPreviewPanel({
  receipt,
  printing = false,
  printLabel = 'Cetak Struk',
  onPrint,
  onBack,
  variant = 'drawer',
  open = true,
}: ReceiptPreviewPanelProps) {
  const router = useRouter();

  const content = (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
        Pratinjau Struk
      </Typography>

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
        <ReceiptThermalView receipt={receipt} />
      </Box>

      <AppButton
        variant="contained"
        fullWidth
        loading={printing}
        startIcon={<PrintIcon />}
        onClick={onPrint}
        sx={{ minHeight: 52, fontWeight: 800, mb: 1 }}
      >
        {printLabel}
      </AppButton>
      <AppButton
        variant="outlined"
        fullWidth
        startIcon={<ArrowBackIcon />}
        onClick={() => {
          onBack();
          if (variant === 'page') router.push('/pos');
        }}
        sx={{ minHeight: 48, fontWeight: 700 }}
      >
        Kembali ke Kasir
      </AppButton>
    </Box>
  );

  if (variant === 'page') {
    return <Box sx={{ maxWidth: 480, mx: 'auto' }}>{content}</Box>;
  }

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onBack}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          pb: `${BOTTOM_NAV_HEIGHT}px`,
        },
      }}
    >
      {content}
    </Drawer>
  );
}
