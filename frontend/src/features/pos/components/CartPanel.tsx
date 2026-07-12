'use client';

import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RemoveIcon from '@mui/icons-material/Remove';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { AppButton } from '@/shared/components/ui';
import { DINING_TYPE_LABELS, formatIdr, QUICK_NOTE_OPTIONS } from '../constants';
import type { CartLine, DiningType } from '../types';

interface CartPanelProps {
  readonly cart: readonly CartLine[];
  readonly diningType: DiningType;
  readonly total: number;
  readonly disabled?: boolean;
  readonly paying?: boolean;
  readonly onDiningTypeChange: (type: DiningType) => void;
  readonly onIncrement: (kodeMenu: string) => void;
  readonly onDecrement: (kodeMenu: string) => void;
  readonly onRemove: (kodeMenu: string) => void;
  readonly onNoteChange: (kodeMenu: string, note: string) => void;
  readonly onClear: () => void;
  readonly onPay: () => void;
}

export function CartPanel({
  cart,
  diningType,
  total,
  disabled = false,
  paying = false,
  onDiningTypeChange,
  onIncrement,
  onDecrement,
  onRemove,
  onNoteChange,
  onClear,
  onPay,
}: CartPanelProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          Keranjang
        </Typography>
        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          value={diningType}
          onChange={(_, value: DiningType | null) => {
            if (value) onDiningTypeChange(value);
          }}
          sx={{ '& .MuiToggleButton-root': { minHeight: 44, fontWeight: 600 } }}
        >
          <ToggleButton value="dine_in">{DINING_TYPE_LABELS.dine_in}</ToggleButton>
          <ToggleButton value="take_away">{DINING_TYPE_LABELS.take_away}</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {cart.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            Belum ada item. Pilih menu untuk mulai.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {cart.map((line) => (
              <Box
                key={line.kodeMenu}
                sx={{
                  p: 1.5,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {line.namaMenu}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatIdr(line.hargaJual)}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label={`Hapus ${line.namaMenu}`}
                    onClick={() => onRemove(line.kodeMenu)}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <IconButton
                    size="small"
                    aria-label={`Kurangi ${line.namaMenu}`}
                    onClick={() => onDecrement(line.kodeMenu)}
                    sx={{ border: 1, borderColor: 'divider' }}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="h6" sx={{ minWidth: 32, textAlign: 'center' }}>
                    {line.qty}
                  </Typography>
                  <IconButton
                    size="small"
                    aria-label={`Tambah ${line.namaMenu}`}
                    onClick={() => onIncrement(line.kodeMenu)}
                    sx={{ border: 1, borderColor: 'divider' }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ ml: 'auto' }}>
                    {formatIdr(line.hargaJual * line.qty)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {QUICK_NOTE_OPTIONS.map((note) => (
                    <Chip
                      key={note}
                      label={note}
                      size="small"
                      variant={line.note === note ? 'filled' : 'outlined'}
                      color={line.note === note ? 'primary' : 'default'}
                      onClick={() => onNoteChange(line.kodeMenu, line.note === note ? '' : note)}
                      sx={{ minHeight: 32 }}
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Total
          </Typography>
          <Typography variant="h5" color="primary.main" fontWeight={800}>
            {formatIdr(total)}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <AppButton
            variant="outlined"
            color="inherit"
            fullWidth
            disabled={cart.length === 0 || disabled || paying}
            onClick={onClear}
            sx={{ minHeight: 48 }}
          >
            Kosongkan
          </AppButton>
          <AppButton
            variant="contained"
            fullWidth
            disabled={cart.length === 0 || disabled || paying}
            loading={paying}
            onClick={onPay}
            sx={{ minHeight: 48, fontWeight: 700 }}
          >
            Bayar
          </AppButton>
        </Box>
      </Box>
    </Box>
  );
}
