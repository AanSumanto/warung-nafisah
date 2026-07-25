'use client';

import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableFooter from '@mui/material/TableFooter';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import PrintIcon from '@mui/icons-material/Print';
import { AppCard, AppTable } from '@/shared/components/ui';
import {
  ReceiptPreviewSheet,
  DINING_TYPE_LABELS,
  EmptyState,
  formatDateTime,
  formatIdr,
  HistoryTableSkeleton,
  PAYMENT_METHOD_LABELS,
  useTodayOrders,
  type Order,
} from '@/features/pos';

function SummaryCard({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        {label}
      </Typography>
      <Typography variant="h6" fontWeight={900} color="primary.main">
        {value}
      </Typography>
    </Box>
  );
}

export default function PosHistoryPage() {
  const { data: orders = [], isLoading, isError } = useTodayOrders();
  const [reprintOrder, setReprintOrder] = useState<Order | null>(null);

  const { totalOmset, transactionCount } = useMemo(() => {
    const totalOmset = orders.reduce((sum, order) => sum + order.total, 0);
    return { totalOmset, transactionCount: orders.length };
  }, [orders]);

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Riwayat Hari Ini
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Semua pesanan yang sudah dibayar hari ini.
      </Typography>

      {!isLoading && !isError && orders.length > 0 ? (
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid size={{ xs: 6, sm: 4 }}>
            <SummaryCard label="Transaksi" value={String(transactionCount)} />
          </Grid>
          <Grid size={{ xs: 6, sm: 8 }}>
            <SummaryCard label="Total Omset Hari Ini" value={formatIdr(totalOmset)} />
          </Grid>
        </Grid>
      ) : null}

      <ReceiptPreviewSheet
        open={Boolean(reprintOrder)}
        order={reprintOrder}
        mode="reprint"
        onClose={() => setReprintOrder(null)}
      />

      <AppCard contentProps={{ sx: { p: { xs: 1, sm: 2 } } }}>
        {isLoading ? (
          <HistoryTableSkeleton />
        ) : isError ? (
          <Typography color="error">Gagal memuat riwayat transaksi.</Typography>
        ) : orders.length === 0 ? (
          <EmptyState
            emoji="📭"
            title="Belum ada transaksi"
            description="Transaksi yang sudah dibayar akan muncul di sini."
          />
        ) : (
          <AppTable>
            <TableHead>
              <TableRow>
                <TableCell>No. Pesanan</TableCell>
                <TableCell>Waktu</TableCell>
                <TableCell>Tipe</TableCell>
                <TableCell>Kasir</TableCell>
                <TableCell>Bayar</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="center">Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>
                      {order.orderNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDateTime(order.paidAt ?? order.createdAt)}</TableCell>
                  <TableCell>
                    <Chip size="small" label={DINING_TYPE_LABELS[order.diningType]} />
                  </TableCell>
                  <TableCell>{order.cashierName}</TableCell>
                  <TableCell>
                    {order.paymentMethod ? PAYMENT_METHOD_LABELS[order.paymentMethod] : '-'}
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={800}>{formatIdr(order.total)}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      aria-label={`Cetak ulang ${order.orderNumber}`}
                      onClick={() => setReprintOrder(order)}
                      size="small"
                    >
                      <PrintIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography fontWeight={800}>Total</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={900} color="primary.main">
                    {formatIdr(totalOmset)}
                  </Typography>
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </AppTable>
        )}
      </AppCard>
    </Box>
  );
}
