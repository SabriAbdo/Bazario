import { useState } from 'react';
import {
  AppBar, Toolbar, Typography, IconButton, Badge, Box, Button,
  InputBase, Menu, MenuItem, Tooltip, useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  ShoppingCart, Search, Brightness4, Brightness7, AccountCircle,
  Store, AdminPanelSettings,
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { useThemeStore } from '@/store/useThemeStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function TopBar() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { mode, toggleMode } = useThemeStore();
  const { user, token, clearAuth } = useAuthStore();
  const isAuthenticated = !!token;
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantite, 0));
  const [q, setQ] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { t } = useTranslation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate(`/products?q=${encodeURIComponent(q.trim())}`);    
  };

  const handleLogout = async () => {
    clearAuth();
    navigate('/');
    toast.success(t('auth.logout_success'));
    setAnchorEl(null);
  };

  return (
    <AppBar position="sticky" elevation={0} sx={{ borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper', color: 'text.primary' }}>
      <Toolbar sx={{ gap: 1 }}>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{ fontWeight: 700, color: 'primary.main', textDecoration: 'none', mr: 2, flexShrink: 0 }}
        >
          Bazario
        </Typography>

        {/* Search */}
        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            bgcolor: alpha(theme.palette.primary.main, 0.07),
            borderRadius: 2,
            px: 2,
            py: 0.5,
            maxWidth: 480,
          }}
        >
          <Search sx={{ color: 'text.secondary', mr: 1 }} />
          <InputBase
            placeholder={t('nav.search_placeholder')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            sx={{ flex: 1, fontSize: '0.9375rem' }}
          />
        </Box>

        <Box sx={{ flex: 1 }} />

        {/* Theme toggle */}
        <Tooltip title={mode === 'light' ? t('nav.dark_mode') : t('nav.light_mode')}>
          <IconButton onClick={toggleMode} size="small">
            {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
          </IconButton>
        </Tooltip>

        {/* Language switcher */}
        <LanguageSwitcher />

        {/* Cart */}
        {isAuthenticated && (
          <IconButton component={Link} to="/panier" size="small">
            <Badge badgeContent={cartCount} color="secondary">
              <ShoppingCart />
            </Badge>
          </IconButton>
        )}

        {/* Auth */}
        {isAuthenticated ? (
          <>
            <Tooltip title={user?.fullName ?? ''}>
              <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
                <AccountCircle />
              </IconButton>
            </Tooltip>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
              <MenuItem onClick={() => { navigate('/profile'); setAnchorEl(null); }}>{t('nav.profile')}</MenuItem>
              <MenuItem onClick={() => { navigate('/orders'); setAnchorEl(null); }}>{t('nav.orders')}</MenuItem>
              <MenuItem onClick={() => { navigate('/wishlist'); setAnchorEl(null); }}>{t('nav.wishlist')}</MenuItem>
              {user?.role === 'ADMIN' && (
                <MenuItem onClick={() => { navigate('/seller/dashboard'); setAnchorEl(null); }}>
                  <Store fontSize="small" sx={{ mr: 1 }} /> {t('nav.seller')}
                </MenuItem>
              )}
              {user?.role === 'ADMIN' && (
                <MenuItem onClick={() => { navigate('/admin/dashboard'); setAnchorEl(null); }}>
                  <AdminPanelSettings fontSize="small" sx={{ mr: 1 }} /> {t('nav.admin')}
                </MenuItem>
              )}
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>{t('nav.logout')}</MenuItem>
            </Menu>
          </>
        ) : (
          <>
            <Button component={Link} to="/login" variant="outlined" size="small">{t('nav.login')}</Button>
            <Button component={Link} to="/register" variant="contained" size="small">{t('nav.register')}</Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
