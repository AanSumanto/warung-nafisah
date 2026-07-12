'use client';

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { formatIdr, getMenuEmoji } from '../constants';
import type { Menu } from '../types';

interface MenuCardProps {
  readonly menu: Menu;
  readonly onAdd: (menu: Menu) => void;
}

export function MenuCard({ menu, onAdd }: MenuCardProps) {
  const theme = useTheme();
  const isWide = useMediaQuery(theme.breakpoints.up('lg'));
  const isSoldOut = menu.status === 'sold_out';
  const emoji = getMenuEmoji(menu.kodeMenu, menu.kodeKategori);

  const handleAdd = () => {
    if (!isSoldOut) onAdd(menu);
  };

  if (isWide) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2.5,
          overflow: 'hidden',
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          boxShadow: '0 2px 8px rgba(26,26,26,0.05)',
          opacity: isSoldOut ? 0.6 : 1,
          height: '100%',
        }}
      >
        <Box
          sx={{
            aspectRatio: '4 / 3',
            maxHeight: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(145deg, #FFF4EC 0%, #FFE8D6 100%)',
            fontSize: '2.25rem',
          }}
          aria-hidden
        >
          {emoji}
        </Box>

        <Box sx={{ p: 1.25, flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{
              lineHeight: 1.25,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '2.5em',
            }}
          >
            {menu.namaMenu}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5, mt: 'auto' }}>
            <Typography variant="body2" color="primary.main" fontWeight={800} noWrap>
              {formatIdr(menu.hargaJual)}
            </Typography>
            <IconButton
              aria-label={`Tambah ${menu.namaMenu}`}
              disabled={isSoldOut}
              onClick={handleAdd}
              size="small"
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                flexShrink: 0,
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>

          {isSoldOut ? (
            <Chip label="Habis" size="small" color="error" sx={{ alignSelf: 'flex-start', height: 22 }} />
          ) : null}
        </Box>
      </Box>
    );
  }

  return (
    <Box
      component="button"
      type="button"
      disabled={isSoldOut}
      onClick={handleAdd}
      aria-label={`Tambah ${menu.namaMenu}`}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        minHeight: 72,
        p: 0.75,
        border: 1,
        borderColor: 'divider',
        borderRadius: 2.5,
        bgcolor: 'background.paper',
        boxShadow: '0 1px 6px rgba(26,26,26,0.05)',
        cursor: isSoldOut ? 'not-allowed' : 'pointer',
        opacity: isSoldOut ? 0.6 : 1,
        textAlign: 'left',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
        overflow: 'hidden',
        transition: 'box-shadow 0.1s ease',
        '&:active:not(:disabled)': { boxShadow: '0 1px 4px rgba(26,26,26,0.08)' },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.35rem',
          lineHeight: 1,
          background: 'linear-gradient(145deg, #FFF4EC 0%, #FFE8D6 100%)',
        }}
        aria-hidden
      >
        {emoji}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, py: 0.25 }}>
        <Typography
          variant="body2"
          fontWeight={700}
          sx={{
            lineHeight: 1.25,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            color: 'text.primary',
          }}
        >
          {menu.namaMenu}
        </Typography>
        <Typography
          variant="caption"
          color="primary.main"
          fontWeight={800}
          noWrap
          sx={{ display: 'block', mt: 0.25 }}
        >
          {formatIdr(menu.hargaJual)}
        </Typography>
        {isSoldOut ? (
          <Chip
            label="Habis"
            size="small"
            color="error"
            sx={{ mt: 0.5, height: 20, fontSize: '0.65rem', '& .MuiChip-label': { px: 0.75 } }}
          />
        ) : null}
      </Box>

      <Box
        aria-hidden
        sx={{
          width: 36,
          height: 36,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          boxShadow: '0 2px 8px rgba(196,92,38,0.3)',
        }}
      >
        <AddIcon sx={{ fontSize: '1.1rem' }} />
      </Box>
    </Box>
  );
}
