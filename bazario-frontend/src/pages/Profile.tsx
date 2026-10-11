import { Typography, Box, Avatar, Paper, Chip, Divider, Grid, Skeleton } from '@mui/material';
import { useQueries } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { productApi } from '@/api/productApi';
import { getRecentlyViewed } from '@/utils/recentlyViewed';
import { formatCurrency } from '@/utils/formatCurrency';

export default function Profile() {
  const { user, token } = useAuthStore();
  const recentlyViewed = getRecentlyViewed().slice(0, 8);

  const productQueries = useQueries({
    queries: recentlyViewed.map((entry) => ({
      queryKey: ['product', entry.productId],
      queryFn: () => productApi.getById(entry.productId),
      enabled: user?.role === 'CLIENT',
    })),
  });

  if (!token || !user) return null;

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h2" gutterBottom>Mon profil</Typography>
      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
          <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}>
            {user.fullName?.[0]?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>{user.fullName}</Typography>
            <Typography color="text.secondary" sx={{ mb: 0.5 }}>@{user.username}</Typography>
            <Chip label={user.role} color="primary" size="small" />
          </Box>
        </Box>
        <Divider sx={{ mb: 3 }} />
        <Typography color="text.secondary" variant="body2">
          La modification du profil sera disponible prochainement.
        </Typography>
      </Paper>

      {user.role === 'CLIENT' && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>Produits récemment consultés</Typography>
          {recentlyViewed.length === 0 ? (
            <Typography color="text.secondary">Vous n'avez pas encore consulté de produit.</Typography>
          ) : (
            <Grid container spacing={2}>
              {productQueries.map((q, i) => {
                const product = q.data;
                if (q.isLoading) {
                  return (
                    <Grid item xs={6} sm={4} md={3} key={recentlyViewed[i].productId}>
                      <Skeleton variant="rounded" height={180} sx={{ borderRadius: 2 }} />
                    </Grid>
                  );
                }
                if (!product) return null;
                return (
                  <Grid item xs={6} sm={4} md={3} key={product.id}>
                    <Paper
                      component={Link}
                      to={`/products/${product.id}`}
                      sx={{ p: 1.5, borderRadius: 2, display: 'block', textDecoration: 'none', color: 'inherit' }}
                    >
                      <Box
                        component="img"
                        src={product.images?.[0]}
                        alt={product.libelle}
                        sx={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 1.5, mb: 1, bgcolor: 'action.hover' }}
                      />
                      <Typography variant="body2" fontWeight={600} noWrap>{product.libelle}</Typography>
                      <Typography variant="body2" color="primary.main">{formatCurrency(product.prix)}</Typography>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      )}
      </Box>
    </Box>
  );
}
