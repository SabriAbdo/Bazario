import { Container, Typography, Box, IconButton, Button, Divider, Paper } from '@mui/material';
import { Delete, Add, Remove, ShoppingCart } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/utils/formatCurrency';
import { useCartStore } from '@/store/useCartStore';
import { productApi } from '@/api/productApi';
import { useTranslation } from 'react-i18next';

export default function Cart() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { items, updateQty, removeItem, clearCart, totalPrice } = useCartStore();

  const total = totalPrice();

  if (items.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <ShoppingCart sx={{ fontSize: 72, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h5" fontWeight={700} gutterBottom>{t('cart.empty')}</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>{t('cart.empty_sub')}</Typography>
        <Button variant="contained" onClick={() => navigate('/products')}>{t('cart.continue')}</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h2" gutterBottom>{t('cart.title')}</Typography>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Items */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map((entry) => {
            const { product, quantite } = entry;
            const imageUrl = product.images?.[0] ? productApi.imageUrl(product.images[0]) : null;
            const hasPromo = product.prixPromo != null && product.prixPromo > 0 && product.prixActif;
            const unitPrice = hasPromo ? product.prixPromo! : product.prix;

            return (
              <Paper key={product.id} sx={{ p: 2, borderRadius: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                {imageUrl ? (
                  <Box component="img" src={imageUrl} alt={product.libelle}
                    sx={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 1.5, flexShrink: 0 }} />
                ) : (
                  <Box sx={{ width: 72, height: 72, bgcolor: 'grey.100', borderRadius: 1.5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShoppingCart sx={{ color: 'text.disabled', fontSize: 28 }} />
                  </Box>
                )}

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontWeight={600} noWrap>{product.libelle}</Typography>
                  {product.marque && (
                    <Typography variant="caption" color="text.secondary">{product.marque}</Typography>
                  )}
                  <Typography color="primary" fontWeight={700}>{formatCurrency(unitPrice)}</Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <IconButton size="small" onClick={() => updateQty(product.id, quantite - 1)} disabled={quantite <= (product.quantiteMin ?? 1)}>
                    <Remove fontSize="small" />
                  </IconButton>
                  <Typography sx={{ minWidth: 28, textAlign: 'center', fontWeight: 700 }}>{quantite}</Typography>
                  <IconButton size="small" onClick={() => updateQty(product.id, quantite + 1)}>
                    <Add fontSize="small" />
                  </IconButton>
                </Box>

                <Typography fontWeight={700} sx={{ minWidth: 80, textAlign: 'right' }}>
                  {formatCurrency(unitPrice * quantite)}
                </Typography>

                <IconButton color="error" size="small" onClick={() => removeItem(product.id)}>
                  <Delete />
                </IconButton>
              </Paper>
            );
          })}
        </Box>

        {/* Summary */}
        <Paper sx={{ p: 3, borderRadius: 3, alignSelf: 'flex-start', minWidth: 260 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>{t('cart.order_summary')}</Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography color="text.secondary">{t('cart.items_count', { count: items.reduce((s, i) => s + i.quantite, 0) })}</Typography>
            <Typography fontWeight={600}>{formatCurrency(total)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography color="text.secondary">{t('cart.delivery')}</Typography>
            <Typography color="success.main" fontWeight={600}>{t('cart.free')}</Typography>
          </Box>
          <Divider sx={{ my: 1.5 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
            <Typography fontWeight={700}>{t('cart.total')}</Typography>
            <Typography fontWeight={800} color="primary" fontSize="1.1rem">{formatCurrency(total)}</Typography>
          </Box>
          <Button fullWidth variant="contained" size="large" onClick={() => navigate('/checkout')}>
            {t('cart.checkout')}
          </Button>
          <Button fullWidth variant="text" size="small" sx={{ mt: 1 }} onClick={() => navigate('/products')}>
            {t('cart.continue')}
          </Button>
          <Button fullWidth variant="text" color="error" size="small" onClick={() => clearCart()} sx={{ mt: 0.5 }}>
            {t('cart.remove')} tout
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}