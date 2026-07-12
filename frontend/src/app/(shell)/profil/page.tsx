'use client';

import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useAuth, usePermission } from '@/shared/providers';
import { isFavoriteMenu, resolveFavoriteMenus, toggleFavoriteKodeMenu, useMenus } from '@/features/pos';

export default function ProfilPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { hasRole } = usePermission();
  const { data: menus = [] } = useMenus();

  const [favVersion, setFavVersion] = useState(0);

  const favoriteMenus = useMemo(() => resolveFavoriteMenus(menus), [menus, favVersion]);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Profil
      </Typography>

      {user ? (
        <Box sx={{ p: 2, mb: 2, borderRadius: 3, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={700}>
            {user.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user.email}
          </Typography>
          <Chip
            label={user.role === 'owner' ? 'Pemilik' : 'Kasir'}
            color="primary"
            size="small"
            sx={{ mt: 1, fontWeight: 700 }}
          />
        </Box>
      ) : null}

      {hasRole('owner') ? (
        <>
          <Button
            component={Link}
            href="/owner"
            variant="outlined"
            fullWidth
            startIcon={<DashboardIcon />}
            sx={{ mb: 2, minHeight: 52, fontWeight: 700, justifyContent: 'flex-start', px: 2 }}
          >
            Ringkasan Omset Hari Ini
          </Button>

          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
            Menu Favorit
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Ketuk untuk menambah / menghapus favorit.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {menus
              .filter((m) => m.status !== 'hidden')
              .map((menu) => {
                const fav = isFavoriteMenu(menu.kodeMenu);
                return (
                  <Chip
                    key={menu.kodeMenu}
                    icon={<StarOutlineIcon />}
                    label={menu.namaMenu}
                    color={fav ? 'primary' : 'default'}
                    variant={fav ? 'filled' : 'outlined'}
                    onClick={() => {
                      toggleFavoriteKodeMenu(menu.kodeMenu);
                      setFavVersion((v) => v + 1);
                    }}
                    sx={{ minHeight: 40 }}
                  />
                );
              })}
          </Box>
          {favoriteMenus.length > 0 ? (
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              Favorit aktif: {favoriteMenus.map((m) => m.namaMenu).join(', ')}
            </Typography>
          ) : null}
        </>
      ) : null}

      <Button
        variant="contained"
        color="error"
        fullWidth
        startIcon={<LogoutIcon />}
        onClick={handleLogout}
        sx={{ minHeight: 52, fontWeight: 700 }}
      >
        Keluar
      </Button>
    </Box>
  );
}
