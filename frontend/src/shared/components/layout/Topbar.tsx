'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { TOPBAR_HEIGHT } from '@/shared/theme/breakpoints';
import { getClientEnv } from '@/shared/lib/env';
import { useAuth } from '@/shared/providers';

interface TopbarProps {
  readonly title?: string;
}

export function Topbar({ title }: TopbarProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { user } = useAuth();
  const appName = getClientEnv().NEXT_PUBLIC_APP_NAME;

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        boxShadow: '0 1px 8px rgba(26,26,26,0.04)',
      }}
    >
      <Toolbar sx={{ minHeight: TOPBAR_HEIGHT, px: { xs: 2, md: 3 } }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1" fontWeight={800} color="primary.main">
            {title ?? appName}
          </Typography>
          {user && !isDesktop ? (
            <Typography variant="caption" color="text.secondary">
              Halo, {user.name.split(' ')[0]}
            </Typography>
          ) : null}
        </Box>
        {user ? (
          <Chip
            label={user.role === 'owner' ? 'Pemilik' : 'Kasir'}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
        ) : null}
      </Toolbar>
    </Box>
  );
}
