'use client';

import HistoryIcon from '@mui/icons-material/History';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import { usePathname, useRouter } from 'next/navigation';
import { BOTTOM_NAV_HEIGHT } from '@/shared/theme/breakpoints';

const NAV_ITEMS = [
  { label: 'Kasir', href: '/pos', icon: PointOfSaleIcon },
  { label: 'Riwayat', href: '/pos/history', icon: HistoryIcon },
  { label: 'Shift', href: '/shift', icon: WorkOutlineIcon },
  { label: 'Profil', href: '/profil', icon: PersonOutlineIcon },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const currentIndex = NAV_ITEMS.findIndex(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  const value = currentIndex >= 0 ? currentIndex : 0;

  return (
    <Paper
      component="nav"
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        display: { xs: 'block', md: 'none' },
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <BottomNavigation
        value={value}
        onChange={(_, newValue: number) => {
          const item = NAV_ITEMS[newValue];
          if (item) router.push(item.href);
        }}
        showLabels
        sx={{ height: BOTTOM_NAV_HEIGHT }}
      >
        {NAV_ITEMS.map((item) => (
          <BottomNavigationAction
            key={item.href}
            label={item.label}
            icon={<item.icon />}
            sx={{
              minWidth: 0,
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.7rem',
                fontWeight: 600,
              },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
