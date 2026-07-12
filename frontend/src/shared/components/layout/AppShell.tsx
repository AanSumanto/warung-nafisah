'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { BOTTOM_NAV_HEIGHT } from '@/shared/theme/breakpoints';
import { MobileBottomNav } from './MobileBottomNav';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface AppShellProps {
  readonly children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {isDesktop ? <Sidebar /> : null}

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            maxWidth: '100%',
            overflowX: 'hidden',
            py: { xs: 1.5, md: 3 },
            pb: { xs: `${BOTTOM_NAV_HEIGHT + 16}px`, md: 3 },
          }}
        >
          <Container
            maxWidth={isDesktop ? 'xl' : false}
            disableGutters={!isDesktop}
            sx={{
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              px: { xs: 2, md: 3 },
              boxSizing: 'border-box',
            }}
          >
            {children}
          </Container>
        </Box>
      </Box>

      {!isDesktop ? <MobileBottomNav /> : null}
    </Box>
  );
}
