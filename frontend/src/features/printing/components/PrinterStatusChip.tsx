'use client';

import BluetoothIcon from '@mui/icons-material/Bluetooth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { getPrintService } from '../services/PrintService';
import type { PrinterReadiness } from '../types/printer';

const READINESS_LABELS: Record<PrinterReadiness, string> = {
  ready: 'Printer Siap',
  not_connected: 'Printer Belum Terhubung',
  rawbt_not_installed: 'RawBT Belum Terpasang',
  unavailable: 'Printer Tidak Tersedia',
};

const READINESS_COLORS: Record<PrinterReadiness, 'success' | 'warning' | 'error' | 'default'> = {
  ready: 'success',
  not_connected: 'warning',
  rawbt_not_installed: 'error',
  unavailable: 'default',
};

function ReadinessIcon({ readiness }: { readonly readiness: PrinterReadiness }) {
  switch (readiness) {
    case 'ready':
      return <CheckCircleIcon fontSize="small" />;
    case 'not_connected':
      return <WarningAmberIcon fontSize="small" />;
    case 'rawbt_not_installed':
      return <ErrorOutlineIcon fontSize="small" />;
    default:
      return <BluetoothIcon fontSize="small" />;
  }
}

interface PrinterStatusChipProps {
  readonly refreshKey?: number;
}

export function PrinterStatusChip({ refreshKey = 0 }: PrinterStatusChipProps) {
  const [readiness, setReadiness] = useState<PrinterReadiness>('unavailable');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    void getPrintService()
      .getReadiness()
      .then((value) => {
        if (active) setReadiness(value);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  return (
    <Box>
      <Chip
        icon={<ReadinessIcon readiness={readiness} />}
        label={loading ? 'Memeriksa printer…' : READINESS_LABELS[readiness]}
        color={loading ? 'default' : READINESS_COLORS[readiness]}
        variant="outlined"
        sx={{ fontWeight: 700 }}
      />
      {readiness === 'not_connected' ? (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          Hubungkan Blueprint BP-ECO58 di aplikasi RawBT, lalu tandai printer siap di bawah.
        </Typography>
      ) : null}
    </Box>
  );
}
