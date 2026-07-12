'use client';

import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HistoryIcon from '@mui/icons-material/History';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getClientEnv } from '@/shared/lib/env';
import { useAuth, usePermission } from '@/shared/providers';
import { SIDEBAR_WIDTH, TOPBAR_HEIGHT } from '@/shared/theme/breakpoints';

interface SidebarProps {
  readonly mobileOpen?: boolean;
  readonly onMobileClose?: () => void;
}

interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly icon: React.ReactNode;
  readonly ownerOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Kasir', href: '/pos', icon: <PointOfSaleIcon /> },
  { label: 'Riwayat', href: '/pos/history', icon: <HistoryIcon /> },
  { label: 'Shift', href: '/shift', icon: <WorkOutlineIcon /> },
  { label: 'Ringkasan', href: '/owner', icon: <DashboardIcon />, ownerOnly: true },
];

function SidebarContent({ onNavigate }: { readonly onNavigate?: () => void }) {
  const appName = getClientEnv().NEXT_PUBLIC_APP_NAME;
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { hasRole } = usePermission();

  const visibleItems = NAV_ITEMS.filter((item) => !item.ownerOnly || hasRole('owner'));

  const handleLogout = () => {
    logout();
    onNavigate?.();
    router.replace('/login');
  };

  return (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Toolbar sx={{ minHeight: TOPBAR_HEIGHT }}>
        <Typography variant="h6" color="primary" noWrap>
          {appName}
        </Typography>
      </Toolbar>

      <List sx={{ flex: 1, px: 1 }}>
        {visibleItems.map((item) => {
          const selected = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              selected={selected}
              onClick={onNavigate}
              sx={{ minHeight: 48, borderRadius: 1, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        {user ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {user.name}
          </Typography>
        ) : null}
        <ListItemButton onClick={handleLogout} sx={{ borderRadius: 1, minHeight: 44 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Keluar" />
        </ListItemButton>
      </Box>
    </Box>
  );
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  if (isDesktop) {
    return (
      <Box
        component="nav"
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
        }}
      >
        <SidebarContent />
      </Box>
    );
  }

  return (
    <Drawer
      variant="temporary"
      open={mobileOpen}
      onClose={onMobileClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': {
          width: SIDEBAR_WIDTH,
        },
      }}
    >
      <SidebarContent onNavigate={onMobileClose} />
    </Drawer>
  );
}

export { SidebarContent };
