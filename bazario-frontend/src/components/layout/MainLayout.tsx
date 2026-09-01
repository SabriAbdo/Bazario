import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AppBar, Toolbar, Typography, Box, Button, Badge, IconButton, Chip,
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Divider, useMediaQuery, useTheme, alpha, Avatar, Tooltip, Link,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import BoltIcon from '@mui/icons-material/Bolt';
import AssignmentIcon from '@mui/icons-material/Assignment';
import InventoryIcon from '@mui/icons-material/Inventory';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import HistoryIcon from '@mui/icons-material/History';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import AddBoxIcon from '@mui/icons-material/AddBox';
import CloseIcon from '@mui/icons-material/Close';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import CategoryIcon from '@mui/icons-material/Category';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/adminApi';
import ContactExpertButton from '../ContactExpertButton';
import LanguageSwitcher from '../LanguageSwitcher';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  OPERATEUR: 'Opérateur',
  STOCK_OPERATEUR: 'Stock',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#E53935',
  OPERATEUR: '#1565C0',
  STOCK_OPERATEUR: '#6A1FAA',
};

const NAV_LINKS = {
  OPERATEUR: [
    { label: 'Commandes', path: '/operateur/commandes', icon: <AssignmentIcon fontSize="small" /> },
    { label: 'Historique', path: '/operateur/historique', icon: <HistoryIcon fontSize="small" /> },
  ],
  STOCK_OPERATEUR: [
    { label: 'Catalogue', path: '/', icon: <HomeIcon fontSize="small" /> },
    { label: 'Mes produits', path: '/stock/produits', icon: <InventoryIcon fontSize="small" /> },
    { label: 'Nouveau produit', path: '/stock/produits/nouveau', icon: <AddBoxIcon fontSize="small" /> },
    { label: 'Catégories', path: '/stock/categories', icon: <CategoryIcon fontSize="small" /> },
    { label: 'Historique', path: '/stock/historique', icon: <HistoryIcon fontSize="small" /> },
  ],
  ADMIN: [
    { label: 'Dashboard',     path: '/admin',                icon: <BarChartIcon fontSize="small" /> },
    { label: 'Utilisateurs',  path: '/admin/utilisateurs',   icon: <PeopleIcon fontSize="small" /> },
    { label: 'Commandes',     path: '/admin/commandes',      icon: <AssignmentIcon fontSize="small" /> },
    { label: 'Produits',      path: '/admin/produits',       icon: <InventoryIcon fontSize="small" /> },
    { label: 'Approbations',  path: '/admin/approbations',   icon: <PendingActionsIcon fontSize="small" /> },
    { label: 'Activité',      path: '/admin/activite',       icon: <HistoryIcon fontSize="small" /> },
  ],
};

export default function MainLayout() {
  const { user, clearAuth } = useAuthStore();
  const totalItems = useCartStore((s) => s.totalItems());
  const navigate = useNavigate();
  const location = useLocation();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  const roleLinks = user ? (NAV_LINKS[user.role as keyof typeof NAV_LINKS] ?? []) : [];
  const roleColor = user ? (ROLE_COLORS[user.role] ?? '#E8521A') : '#E8521A';

  const navLinks = user ? roleLinks : [];

  // Pending product count badge for admin nav
  const { data: adminStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.getStats,
    enabled: user?.role === 'ADMIN',
    refetchInterval: 60_000,
  });
  const pendingCount = adminStats?.pendingApprovalProducts ?? 0;

  const NavItem = ({ label, path, icon, badge }: { label: string; path: string; icon: React.ReactNode; badge?: number }) => {
    const exactNavMatch = navLinks.some((l) => location.pathname === l.path);
    const active = location.pathname === path || (!exactNavMatch && location.pathname.startsWith(path + '/'));
    return (
      <Box
        onClick={() => { navigate(path); setDrawerOpen(false); }}
        sx={{
          display: 'flex', alignItems: 'center', gap: 0.9,
          px: 1, py: 0.4, cursor: 'pointer', userSelect: 'none',
          borderRadius: 2,
          '&:hover .nav-icon': { transform: 'scale(1.12)' },
          '&:hover .nav-label': { color: '#fff' },
        }}
      >
        <Box
          className="nav-icon"
          sx={{
            width: 30, height: 30, borderRadius: 1.5,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: active ? '#E8521A' : 'rgba(255,255,255,0.12)',
            boxShadow: active ? '0 0 12px rgba(0,149,48,0.55)' : 'none',
            transition: 'all 0.2s ease',
            '& svg': { fontSize: '1rem !important', color: active ? '#fff' : 'rgba(255,255,255,0.7)' },
          }}
        >
          <Badge badgeContent={badge || 0} color="warning" max={99} overlap="circular"
            sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16, top: 2, right: 2 } }}>
            {icon}
          </Badge>
        </Box>
        <Typography
          className="nav-label"
          sx={{
            fontSize: '0.82rem',
            fontWeight: active ? 600 : 400,
            color: active ? '#fff' : 'rgba(255,255,255,0.75)',
            transition: 'color 0.18s',
          }}
        >
          {label}
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      {/* Top accent bar */}
      <Box sx={{ height: 3, background: 'linear-gradient(90deg, #E8521A 0%, #F0723D 50%, #FF6B35 100%)' }} />

      <AppBar position="sticky" elevation={0} sx={{ background: 'rgba(8, 18, 36, 0.97)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Toolbar sx={{ gap: 1.5, minHeight: { xs: 56, md: 64 }, px: { xs: 2, md: 3 } }}>
          {/* Hamburger for mobile */}
          {isMobile && navLinks.length > 0 && (
            <IconButton color="inherit" onClick={() => setDrawerOpen(true)} edge="start">
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', mr: 2 }}
            onClick={() => navigate('/')}
          >
            <Box sx={{
              background: 'linear-gradient(135deg, #E8521A 0%, #F0723D 100%)',
              borderRadius: 1.5, p: 0.5,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(0,149,48,0.4)',
            }}>
              <BoltIcon sx={{ fontSize: 22, color: '#fff' }} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                fontWeight={800}
                lineHeight={1}
                letterSpacing="0.06em"
                sx={{ color: '#fff', fontSize: '1.15rem' }}
              >
                BAZARIO
              </Typography>
              <Typography sx={{ fontSize: '0.6rem', color: alpha('#fff', 0.55), letterSpacing: '0.18em', lineHeight: 1 }}>
                MARKETPLACE
              </Typography>
            </Box>
          </Box>

          {/* Desktop nav */}
          {!isMobile && navLinks.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
              {navLinks.map((l) => <NavItem key={l.path} {...l} badge={l.path === '/admin/approbations' ? pendingCount : undefined} />)}
            </Box>
          )}

          <Box sx={{ flexGrow: 1 }} />

          {/* Language switcher */}
          <LanguageSwitcher />

          {/* Visitor actions */}
          {!user && (
            <>
              <Button
                color="inherit"
                startIcon={<HomeIcon fontSize="small" />}
                onClick={() => navigate('/')}
                sx={{ display: { xs: 'none', sm: 'flex' }, color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem' }}
              >
                Catalogue
              </Button>
              <Tooltip title="Mon panier">
                <IconButton onClick={() => navigate('/panier')} sx={{ mx: 0.5, color: 'rgba(255,255,255,0.85)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.08)' } }}>
                  <Badge badgeContent={totalItems} color="secondary" max={99}>
                    <ShoppingCartIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                size="small"
                startIcon={<PersonIcon fontSize="small" />}
                onClick={() => navigate('/login')}
                sx={{
                  background: 'linear-gradient(135deg, #E8521A 0%, #F0723D 100%)',
                  boxShadow: '0 2px 10px rgba(0,149,48,0.4)',
                  color: '#fff', borderRadius: 6, px: 2,
                  '&:hover': { background: 'linear-gradient(135deg, #007A27 0%, #00B33C 100%)' },
                }}
              >
                Connexion
              </Button>
            </>
          )}

          {/* Authenticated user */}
          {user && (
            <>
              <Chip
                label={ROLE_LABELS[user.role] ?? user.role}
                size="small"
                sx={{
                  bgcolor: alpha(roleColor, 0.2), color: '#fff',
                  border: `1px solid ${alpha(roleColor, 0.5)}`,
                  fontWeight: 700, fontSize: '0.72rem',
                  display: { xs: 'none', sm: 'flex' },
                }}
              />
              <Avatar
                sx={{ width: 30, height: 30, bgcolor: roleColor, fontSize: '0.75rem', fontWeight: 700, mx: 0.5 }}
              >
                {user.fullName.slice(0, 1).toUpperCase()}
              </Avatar>
              <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', display: { xs: 'none', md: 'block' } }}>
                {user.fullName}
              </Typography>
              <Tooltip title="Déconnexion">
                <IconButton size="small" onClick={() => { clearAuth(); navigate('/'); }} sx={{ color: 'rgba(255,255,255,0.85)', '&:hover': { color: '#ff7070', bgcolor: 'rgba(255,100,100,0.08)' } }}>
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { background: 'transparent', boxShadow: 'none' } }}>
        <Box sx={{ width: 280, bgcolor: '#07111E', height: '100%', color: '#fff', display: 'flex', flexDirection: 'column' }}>

          {/* Drawer header */}
          <Box sx={{
            background: 'linear-gradient(160deg, #0C2518 0%, #081018 100%)',
            p: 2.5, pb: user ? 2.5 : 1.5,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: user ? 2.5 : 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ background: 'linear-gradient(135deg, #E8521A 0%, #F0723D 100%)', borderRadius: 1.5, p: 0.55, display: 'flex', boxShadow: '0 2px 8px rgba(232,82,26,0.45)' }}>
                  <BoltIcon sx={{ fontSize: 20, color: '#fff' }} />
                </Box>
                <Box>
                  <Typography fontWeight={800} letterSpacing="0.06em" fontSize="1rem" lineHeight={1}>BAZARIO</Typography>
                  <Typography sx={{ fontSize: '0.58rem', color: alpha('#fff', 0.38), letterSpacing: '0.14em' }}>MARKETPLACE</Typography>
                </Box>
              </Box>
              <IconButton size="small" onClick={() => setDrawerOpen(false)} sx={{ color: 'rgba(255,255,255,0.35)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.08)' }, borderRadius: 1.5 }}>
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ width: 40, height: 40, bgcolor: roleColor, fontWeight: 700, fontSize: '1rem', boxShadow: `0 0 0 2.5px ${alpha(roleColor, 0.35)}` }}>
                  {user.fullName.slice(0, 1).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.2 }}>{user.fullName}</Typography>
                  <Typography sx={{ fontSize: '0.72rem', mt: 0.3, color: alpha('#F0723D', 0.85), fontWeight: 500 }}>
                    {ROLE_LABELS[user.role] ?? user.role}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          {/* Nav links */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {navLinks.map((link, i) => {
              const exactNavMatch = navLinks.some((l) => location.pathname === l.path);
              const active = location.pathname === link.path || (!exactNavMatch && location.pathname.startsWith(link.path + '/'));
              return (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2, ease: 'easeOut' }}
                >
                  <Box
                    onClick={() => { navigate(link.path); setDrawerOpen(false); }}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1.5,
                      px: 1.75, py: 1.1, borderRadius: 2.5, cursor: 'pointer',
                      bgcolor: active ? alpha('#E8521A', 0.15) : 'transparent',
                      borderLeft: `3px solid ${active ? '#F0723D' : 'transparent'}`,
                      color: active ? '#F0723D' : 'rgba(255,255,255,0.58)',
                      transition: 'all 0.16s',
                      '&:hover': { bgcolor: alpha('#fff', 0.05), color: '#fff', borderLeftColor: alpha('#F0723D', 0.35) },
                    }}
                  >
                    <Box sx={{ '& svg': { fontSize: '1.05rem !important', display: 'block' } }}>
                      <Badge badgeContent={link.path === '/admin/approbations' ? pendingCount : 0} color="warning" max={99}>
                        {link.icon}
                      </Badge>
                    </Box>
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: active ? 600 : 400 }}>{link.label}</Typography>
                  </Box>
                </motion.div>
              );
            })}
          </Box>

          {/* Logout */}
          {user && (
            <Box sx={{ p: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Box
                onClick={() => { clearAuth(); navigate('/'); setDrawerOpen(false); }}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  px: 1.75, py: 1.1, borderRadius: 2.5, cursor: 'pointer',
                  color: '#ff7070', transition: 'all 0.16s',
                  '&:hover': { bgcolor: alpha('#ff6b6b', 0.08), color: '#ff8888' },
                }}
              >
                <LogoutIcon sx={{ fontSize: '1.05rem !important' }} />
                <Typography sx={{ fontSize: '0.9rem' }}>Déconnexion</Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </Box>

      <ContactExpertButton />

      {/* Contact + Footer */}
      <Box sx={{ bgcolor: '#0D1E36', color: 'rgba(255,255,255,0.8)', mt: 'auto' }}>
        {/* Contact section */}
        <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)', px: { xs: 3, md: 8 }, py: 5 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'space-between' }}>
            {/* Brand */}
            <Box sx={{ minWidth: 200 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Box sx={{ bgcolor: '#E8521A', borderRadius: 1, p: 0.6, display: 'flex' }}>
                  <BoltIcon sx={{ fontSize: 18, color: '#fff' }} />
                </Box>
                <Typography fontWeight={800} fontSize="1.15rem" letterSpacing="0.06em" color="#fff">
                  BAZARIO
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, maxWidth: 220 }}>
                Votre marketplace de confiance au Maroc.
              </Typography>
            </Box>

            {/* Contact */}
            <Box>
              <Typography variant="overline" sx={{ color: '#F0723D', fontWeight: 700, letterSpacing: '0.12em', mb: 2, display: 'block' }}>
                Contact
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <PhoneIcon sx={{ fontSize: 16, color: '#F0723D', flexShrink: 0 }} />
                  <Link href="tel:+212522001234" underline="hover" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.88rem' }}>
                    +212 522 00 12 34
                  </Link>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <WhatsAppIcon sx={{ fontSize: 16, color: '#25D366', flexShrink: 0 }} />
                  <Link href="https://wa.me/212661001234" target="_blank" rel="noopener noreferrer" underline="hover" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.88rem' }}>
                    +212 661 00 12 34
                  </Link>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <EmailIcon sx={{ fontSize: 16, color: '#F0723D', flexShrink: 0 }} />
                  <Link href="mailto:contact@bazario.ma" underline="hover" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.88rem' }}>
                    contact@bazario.ma
                  </Link>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <LocationOnIcon sx={{ fontSize: 16, color: '#F0723D', flexShrink: 0 }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.88rem' }}>
                    Casablanca, Maroc
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Hours */}
            <Box>
              <Typography variant="overline" sx={{ color: '#F0723D', fontWeight: 700, letterSpacing: '0.12em', mb: 2, display: 'block' }}>
                Horaires
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {[
                  { day: 'Lun – Ven', hours: '08h00 – 17h30' },
                  { day: 'Samedi',    hours: '08h30 – 13h00' },
                  { day: 'Dimanche', hours: 'Fermé' },
                ].map(({ day, hours }) => (
                  <Box key={day} sx={{ display: 'flex', gap: 2, alignItems: 'baseline' }}>
                    <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', minWidth: 90 }}>{day}</Typography>
                    <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{hours}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Bottom bar */}
        <Box sx={{ px: { xs: 3, md: 8 }, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
            © {new Date().getFullYear()} Bazario. Tous droits réservés.
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
            Paiement sécurisé • Livraison rapide
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

