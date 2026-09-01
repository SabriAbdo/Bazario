import { useState } from 'react';
import {
  Box, Paper, TextField, Button, Typography, CircularProgress, Alert, alpha, InputAdornment, IconButton,
} from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const ROLE_HOME: Record<string, string> = {
  ADMIN: '/admin',
  OPERATEUR: '/operateur/commandes',
  STOCK_OPERATEUR: '/stock/produits',
};

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(form);
      setAuth(res.accessToken, res.user);
      toast.success(t('auth.welcome', { name: res.user.fullName }));
      navigate(ROLE_HOME[res.user.role] ?? '/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? t('auth.wrong_credentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: 'calc(100vh - 200px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #F4F6F8 0%, #e8f5ec 100%)',
      px: 2, py: 4,
    }}>
      <Box sx={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: '#009530', borderRadius: 3, p: 1.5, mb: 2,
            boxShadow: '0 8px 24px rgba(0,149,48,0.35)',
          }}>
            <BoltIcon sx={{ fontSize: 36, color: '#fff' }} />
          </Box>
          <Typography variant="h4" sx={{ color: 'text.primary', mb: 0.5 }}>{t('auth.login_title')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('auth.login_subtitle')}</Typography>
        </Box>

        <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 8px 40px rgba(0,0,0,0.1)', border: '1px solid', borderColor: 'divider' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label={t('auth.email')} required fullWidth size="medium"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              autoComplete="username"
              InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutlineIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment> }}
            />
            <TextField
              label={t('auth.password')} type={showPass ? 'text' : 'password'} required fullWidth size="medium"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
              InputProps={{
                startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPass(!showPass)} aria-label={showPass ? t('auth.hide_password') : t('auth.show_password')}>
                      {showPass ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit" variant="contained" fullWidth size="large"
              disabled={loading}
              sx={{ py: 1.5, fontSize: '1rem', mt: 0.5 }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : t('auth.login_btn')}
            </Button>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('auth.no_account')}{' '}
              <Link to="/register" style={{ color: 'inherit', fontWeight: 600 }}>{t('auth.register_link')}</Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
