'use client';

import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { formatIdr } from '../constants';

interface FloatingCartBarProps {
  readonly itemCount: number;
  readonly total: number;
  readonly disabled?: boolean;
  readonly onOpenCart: () => void;
  readonly onPay: () => void;
  readonly bottomOffset?: number;
}

export function FloatingCartBar({
  itemCount,
  total,
  disabled = false,
  onOpenCart,
  onPay,
  bottomOffset = 64,
}: FloatingCartBarProps) {
  if (itemCount === 0) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: bottomOffset,
        zIndex: 1100,
        px: 2,
        pb: 1,
        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1,
          pl: 1.5,
          borderRadius: 3,
          bgcolor: 'grey.900',
          color: 'common.white',
          boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
        }}
      >
        <Button
          onClick={onOpenCart}
          sx={{ color: 'inherit', minWidth: 0, minHeight: 48, px: 1 }}
        >
          <Badge badgeContent={itemCount} color="primary">
            <ShoppingCartOutlinedIcon />
          </Badge>
        </Button>

        <Box sx={{ flex: 1, minWidth: 0 }} onClick={onOpenCart} role="button">
          <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
            {itemCount} item
          </Typography>
          <Typography variant="subtitle1" fontWeight={800} noWrap>
            {formatIdr(total)}
          </Typography>
        </Box>

        <Button
          variant="contained"
          disabled={disabled}
          onClick={onPay}
          sx={{
            minHeight: 48,
            minWidth: 96,
            fontWeight: 800,
            borderRadius: 2.5,
            bgcolor: 'primary.main',
          }}
        >
          Bayar
        </Button>
      </Box>
    </Box>
  );
}
