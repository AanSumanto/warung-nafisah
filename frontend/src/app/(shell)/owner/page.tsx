'use client';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  DashboardSkeleton,
  EmptyState,
  formatIdr,
  PAYMENT_METHOD_LABELS,
  useOwnerDashboard,
} from '@/features/pos';
import { usePermission } from '@/shared/providers';

function StatCard({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 3,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        boxShadow: '0 2px 12px rgba(26,26,26,0.06)',
      }}
    >
      <Typography variant="body2" color="text.secondary" fontWeight={600}>
        {label}
      </Typography>
      <Typography variant="h5" color="primary.main" fontWeight={900} sx={{ mt: 0.5 }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function OwnerDashboardPage() {
  const router = useRouter();
  const { hasRole } = usePermission();
  const { data, isLoading, isError } = useOwnerDashboard();

  useEffect(() => {
    if (!hasRole('owner')) {
      router.replace('/pos');
    }
  }, [hasRole, router]);

  if (!hasRole('owner')) {
    return null;
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Ringkasan Hari Ini
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Omset dan pembayaran warung hari ini.
      </Typography>

      {isLoading ? (
        <DashboardSkeleton />
      ) : isError || !data ? (
        <EmptyState emoji="⚠️" title="Gagal memuat ringkasan" description="Periksa koneksi lalu coba lagi." />
      ) : data.transactionCount === 0 ? (
        <EmptyState emoji="📊" title="Belum ada penjualan" description="Data omset akan muncul setelah ada transaksi." />
      ) : (
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <StatCard label="Jumlah Transaksi" value={String(data.transactionCount)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <StatCard label="Total Omset" value={formatIdr(data.revenue)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <StatCard label={PAYMENT_METHOD_LABELS.cash} value={formatIdr(data.paymentBreakdown.cash)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <StatCard label={PAYMENT_METHOD_LABELS.qris} value={formatIdr(data.paymentBreakdown.qris)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <StatCard label={PAYMENT_METHOD_LABELS.transfer} value={formatIdr(data.paymentBreakdown.transfer)} />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
