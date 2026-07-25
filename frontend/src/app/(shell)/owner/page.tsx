'use client';

import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  DashboardSkeleton,
  EmptyState,
  formatIdr,
  PAYMENT_METHOD_LABELS,
  useOwnerDashboard,
  useOwnerDashboardMonth,
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

function DashboardCards({
  transactionCount,
  revenue,
  paymentBreakdown,
}: {
  readonly transactionCount: number;
  readonly revenue: number;
  readonly paymentBreakdown: { cash: number; qris: number; transfer: number };
}) {
  if (transactionCount === 0) {
    return <EmptyState emoji="📊" title="Belum ada penjualan" description="Data omset akan muncul setelah ada transaksi." />;
  }

  return (
    <Grid container spacing={1.5}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <StatCard label="Jumlah Transaksi" value={String(transactionCount)} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <StatCard label="Total Omset" value={formatIdr(revenue)} />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <StatCard label={PAYMENT_METHOD_LABELS.cash} value={formatIdr(paymentBreakdown.cash)} />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <StatCard label={PAYMENT_METHOD_LABELS.qris} value={formatIdr(paymentBreakdown.qris)} />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <StatCard label={PAYMENT_METHOD_LABELS.transfer} value={formatIdr(paymentBreakdown.transfer)} />
      </Grid>
    </Grid>
  );
}

export default function OwnerDashboardPage() {
  const router = useRouter();
  const { hasRole } = usePermission();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: today, isLoading: todayLoading, isError: todayError } = useOwnerDashboard();
  const { data: monthly, isLoading: monthLoading, isError: monthError } = useOwnerDashboardMonth(year, month);

  useEffect(() => {
    if (!hasRole('owner')) {
      router.replace('/pos');
    }
  }, [hasRole, router]);

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => {
      const value = index + 1;
      const label = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date(2026, index, 1));
      return { value, label };
    });
  }, []);

  if (!hasRole('owner')) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h5" fontWeight={800} gutterBottom>
          Rekap Penjualan
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ringkasan harian dan bulanan omset warung.
        </Typography>
      </Box>

      <Box>
        <Typography variant="subtitle1" fontWeight={800} gutterBottom>
          Hari Ini
        </Typography>
        {todayLoading ? (
          <DashboardSkeleton />
        ) : todayError || !today ? (
          <EmptyState emoji="⚠️" title="Gagal memuat rekap harian" description="Periksa koneksi lalu coba lagi." />
        ) : (
          <DashboardCards {...today} />
        )}
      </Box>

      <Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1.5,
            alignItems: { sm: 'center' },
            justifyContent: 'space-between',
            mb: 1.5,
          }}
        >
          <Typography variant="subtitle1" fontWeight={800}>
            Bulanan
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <TextField
              select
              size="small"
              label="Bulan"
              value={month}
              onChange={(event) => setMonth(Number(event.target.value))}
              sx={{ minWidth: 140 }}
            >
              {monthOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              label="Tahun"
              type="number"
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              sx={{ width: 110 }}
              inputProps={{ min: 2000, max: 2100 }}
            />
          </Box>
        </Box>
        {monthLoading ? (
          <DashboardSkeleton />
        ) : monthError || !monthly ? (
          <EmptyState emoji="⚠️" title="Gagal memuat rekap bulanan" description="Periksa koneksi lalu coba lagi." />
        ) : (
          <DashboardCards {...monthly} />
        )}
      </Box>
    </Box>
  );
}
