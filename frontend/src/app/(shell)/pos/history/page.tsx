'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
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

export default function PosHistoryPage() {
  const { data: orders = [], isLoading, isError } = useTodayOrders();
  const [reprintOrder, setReprintOrder] = useState<Order | null>(null);

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Riwayat Hari Ini
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Semua pesanan yang sudah dibayar hari ini.
      </Typography>

      <ReceiptPreviewSheet
        open={Boolean(reprintOrder)}
        order={reprintOrder}
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
          </AppTable>
        )}
      </AppCard>
    </Box>
  );
}
