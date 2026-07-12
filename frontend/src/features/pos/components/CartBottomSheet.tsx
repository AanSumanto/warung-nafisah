'use client';

import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RemoveIcon from '@mui/icons-material/Remove';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { AppButton } from '@/shared/components/ui';
import { BOTTOM_NAV_HEIGHT } from '@/shared/theme/breakpoints';
import { DINING_TYPE_LABELS, formatIdr, QUICK_NOTE_OPTIONS } from '../constants';
import type { CartLine, DiningType } from '../types';
import { EmptyState } from './EmptyState';

interface CartBottomSheetProps {
  readonly open: boolean;
  readonly cart: readonly CartLine[];
  readonly diningType: DiningType;
  readonly total: number;
  readonly disabled?: boolean;
  readonly paying?: boolean;
  readonly onClose: () => void;
  readonly onDiningTypeChange: (type: DiningType) => void;
  readonly onIncrement: (kodeMenu: string) => void;
  readonly onDecrement: (kodeMenu: string) => void;
  readonly onAddQty: (kodeMenu: string, amount: number) => void;
  readonly onRemove: (kodeMenu: string) => void;
  readonly onNoteChange: (kodeMenu: string, note: string) => void;
  readonly onClear: () => void;
  readonly onPay: () => void;
}

export function CartBottomSheet({
  open,
  cart,
  diningType,
  total,
  disabled = false,
  paying = false,
  onClose,
  onDiningTypeChange,
  onIncrement,
  onDecrement,
  onAddQty,
  onRemove,
  onNoteChange,
  onClear,
  onPay,
}: CartBottomSheetProps) {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: '88vh',
          pb: `${BOTTOM_NAV_HEIGHT + 8}px`,
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={800}>
            Pesanan
          </Typography>
          <IconButton onClick={onClose} aria-label="Tutup pesanan">
            <CloseIcon />
          </IconButton>
        </Box>

        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          value={diningType}
          onChange={(_, value: DiningType | null) => {
            if (value) onDiningTypeChange(value);
          }}
          sx={{ mb: 2, '& .MuiToggleButton-root': { minHeight: 48, fontWeight: 700 } }}
        >
          <ToggleButton value="dine_in">{DINING_TYPE_LABELS.dine_in}</ToggleButton>
          <ToggleButton value="take_away">{DINING_TYPE_LABELS.take_away}</ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ maxHeight: '45vh', overflowY: 'auto', mb: 2 }}>
          {cart.length === 0 ? (
            <EmptyState
              emoji="🛒"
              title="Belum ada pesanan"
              description="Ketuk menu atau tombol + untuk mulai."
            />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {cart.map((line) => (
                <Box
                  key={line.kodeMenu}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.default',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box>
                      <Typography fontWeight={700}>{line.namaMenu}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatIdr(line.hargaJual)}
                      </Typography>
                    </Box>
                    <IconButton size="small" color="error" onClick={() => onRemove(line.kodeMenu)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <IconButton
                      onClick={() => onDecrement(line.kodeMenu)}
                      sx={{ border: 1, borderColor: 'divider', width: 44, height: 44 }}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ minWidth: 36, textAlign: 'center', fontWeight: 800 }}>
                      {line.qty}
                    </Typography>
                    <IconButton
                      onClick={() => onIncrement(line.kodeMenu)}
                      sx={{ border: 1, borderColor: 'divider', width: 44, height: 44 }}
                    >
                      <AddIcon />
                    </IconButton>
                    <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
                      {[1, 2, 5].map((n) => (
                        <Chip
                          key={n}
                          label={`+${n}`}
                          size="small"
                          onClick={() => onAddQty(line.kodeMenu, n)}
                          sx={{ minHeight: 36, fontWeight: 700 }}
                        />
                      ))}
                    </Box>
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

                  <Typography align="right" fontWeight={800} sx={{ mt: 1 }}>
                    {formatIdr(line.hargaJual * line.qty)}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            Total
          </Typography>
          <Typography variant="h5" color="primary.main" fontWeight={900}>
            {formatIdr(total)}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <AppButton
            variant="outlined"
            color="inherit"
            fullWidth
            disabled={cart.length === 0 || paying}
            onClick={onClear}
            sx={{ minHeight: 52 }}
          >
            Kosongkan
          </AppButton>
          <AppButton
            variant="contained"
            fullWidth
            disabled={cart.length === 0 || disabled || paying}
            loading={paying}
            onClick={onPay}
            sx={{ minHeight: 52, fontWeight: 800, fontSize: '1rem' }}
          >
            Bayar
          </AppButton>
        </Box>
      </Box>
    </Drawer>
  );
}
