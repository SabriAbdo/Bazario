import { Card, CardContent, Typography, Box, Chip, IconButton, Tooltip } from '@mui/material';
import { AddShoppingCart } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Product } from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';
import { useCartStore } from '@/store/useCartStore';
import { productApi } from '@/api/productApi';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface Props {
  product: Product;
  wishlisted?: boolean;
}

export default function ProductCard({ product }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const { t } = useTranslation();
  const hasPromo = product.prixPromo != null && product.prixPromo > 0 && product.prixActif;
  const displayPrice = hasPromo ? product.prixPromo! : product.prix;
  const image = product.images?.[0];
  const imageUrl = image ? productApi.imageUrl(image) : null;

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} style={{ height: '100%' }}>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {hasPromo && (
          <Chip label={t('product.promo')} size="small" color="error"
            sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1, fontWeight: 700, fontSize: '0.65rem' }} />
        )}

        <Box component={Link} to={`/products/${product.id}`} sx={{ display: 'block', textDecoration: 'none', flexShrink: 0 }}>
          {imageUrl ? (
            <Box component="img" src={imageUrl} alt={product.libelle}
              sx={{ width: '100%', height: 200, objectFit: 'cover' }} />
          ) : (
            <Box sx={{ width: '100%', height: 200, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="caption" color="text.secondary">{t('product.no_image')}</Typography>
            </Box>
          )}
        </Box>

        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5, p: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={600} noWrap title={product.libelle}
            sx={{ color: 'text.primary', lineHeight: 1.3 }}>
            {product.libelle}
          </Typography>
          {product.marque && (
            <Typography variant="caption" color="text.secondary" noWrap>{product.marque}</Typography>
          )}
          {product.categorie && (
            <Chip label={product.categorie} size="small"
              sx={{ width: 'fit-content', fontSize: '0.62rem', height: 18 }} />
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto', pt: 1 }}>
            <Box>
              <Typography variant="h6" color="primary" fontWeight={700} fontSize="0.95rem">
                {formatCurrency(displayPrice)}
              </Typography>
              {hasPromo && (
                <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                  {formatCurrency(product.prix)}
                </Typography>
              )}
            </Box>
            <Tooltip title={t('product.add_to_cart')}>
              <IconButton size="small" color="primary"
                onClick={() => { addItem(product, 1); toast.success(t('product.added_to_cart')); }}>
                <AddShoppingCart fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}
