import { Container, Box, Paper, Typography, TextField, Button, Link as MuiLink, Divider, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '@/api/authApi';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function Register() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { t } = useTranslation();

  const schema = z.object({
    fullName: z.string().min(2, t('auth.full_name') + ' requis'),
    email: z.string().email('Email invalide'),
    password: z.string().min(6, 'Minimum 6 caracteres'),
    confirmPassword: z.string(),
    role: z.enum(['BUYER', 'SELLER']),
  }).refine((d) => d.password === d.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });
  type FormData = z.infer<typeof schema>;

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'BUYER' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await (authApi as any).register({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        role: data.role,
      });
      setAuth(res.user, res.accessToken);
      toast.success(t('auth.welcome', { name: res.user.fullName }));
      navigate('/');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erreur lors de l\'inscription');
    }
  };

  return (
    <Container maxWidth="xs" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h2" gutterBottom textAlign="center">{t('auth.register_title')}</Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
          {t('auth.register_subtitle')}
        </Typography>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label={t('auth.full_name')}
            {...register('fullName')}
            error={!!errors.fullName}
            helperText={errors.fullName?.message}
          />
          <TextField
            label={t('auth.email')}
            type="email"
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
          <TextField
            label={t('auth.password')}
            type="password"
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
          <TextField
            label={t('auth.password') + ' (confirmation)'}
            type="password"
            {...register('confirmPassword')}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
          />
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <FormControl>
                <InputLabel>Je suis</InputLabel>
                <Select {...field} label="Je suis">
                  <MenuItem value="BUYER">Acheteur</MenuItem>
                  <MenuItem value="SELLER">Vendeur</MenuItem>
                </Select>
              </FormControl>
            )}
          />
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
            {isSubmitting ? t('common.loading') : t('auth.register_btn')}
          </Button>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography textAlign="center" variant="body2">
          {t('auth.have_account')}{' '}
          <MuiLink component={Link} to="/login">{t('auth.login_link')}</MuiLink>
        </Typography>
      </Paper>
    </Container>
  );
}