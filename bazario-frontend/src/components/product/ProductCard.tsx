import { Card, CardContent, Typography, Box, Chip, IconButton, Tooltip } from '@mui/material';
import { AddShoppingCart, Favorite, FavoriteBorder, BookmarkAdd, BookmarkAdded } from '@mui/icons-material';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Category, Product } from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';
import { useCartStore } from '@/store/useCartStore';
import { productApi } from '@/api/productApi';
import { categoryApi } from '@/api/miscApi';
import { buildCategoryDisplays, findCategoryDisplays } from '@/utils/categoryDisplay';
import ProductDetailDialog from '@/components/ProductDetailDialog';
import { useWishlist } from '@/hooks/useWishlist';
import { useLikes } from '@/hooks/useLikes';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface Props {
  product: Product;
  wishlisted?: boolean;
}

export default function ProductCard({ product }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isClient, ids: wishlistIds, toggle: toggleWishlist } = useWishlist();
  const { ids: likeIds, toggle: toggleLike } = useLikes();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
  });
  const productCat = findCategoryDisplays(buildCategoryDisplays(categories), product.categories)[0];
  const hasPromo = product.prixPromo != null && product.prixPromo > 0 && product.prixActif;
  const displayPrice = hasPromo ? product.prixPromo! : product.prix;
  const image = product.images?.[0];
  const imageUrl = image ? productApi.imageUrl(image) : null;

  const handleAdd = (qty = 1) => {
    addItem(product, qty);
    toast.success(t('product.added_to_cart'));
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const isWishlisted = wishlistIds.has(product.id);
  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isClient) {
      toast(t('product.wishlist_login_required'));
      navigate('/login');
      return;
    }
    toggleWishlist(product.id);
  };

  const isLiked = likeIds.has(product.id);
  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isClient) {
      toast(t('product.like_login_required'));
      navigate('/login');
      return;
    }
    toggleLike(product.id);
  };

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} style={{ height: '100%' }}>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {hasPromo && (
          <Chip label={t('product.promo')} size="small" color="error"
            sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1, fontWeight: 700, fontSize: '0.65rem' }} />
        )}

        <Box sx={{ position: 'absolute', top: 6, right: 6, zIndex: 1, display: 'flex', gap: 0.5 }}>
          <Tooltip title={isLiked ? t('product.unlike') : t('product.like')}>
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 0.25, borderRadius: 5,
              bgcolor: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: '#fff' }, pr: 0.75,
            }}>
              <IconButton size="small" onClick={handleLikeClick}>
                {isLiked ? <Favorite fontSize="small" color="error" /> : <FavoriteBorder fontSize="small" />}
              </IconButton>
              <Typography variant="caption" fontWeight={700} color="text.secondary">
                {product.likesCount ?? 0}
              </Typography>
            </Box>
          </Tooltip>
          <Tooltip title={isWishlisted ? t('product.remove_from_wishlist') : t('product.add_to_wishlist')}>
            <IconButton size="small" onClick={handleWishlistClick}
              sx={{
                bgcolor: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: '#fff' },
              }}>
              {isWishlisted ? <BookmarkAdded fontSize="small" color="primary" /> : <BookmarkAdd fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>

        <Box onClick={() => setDetailsOpen(true)} sx={{ display: 'block', cursor: 'pointer', flexShrink: 0 }}>
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
            onClick={() => setDetailsOpen(true)}
            sx={{ color: 'text.primary', lineHeight: 1.3, cursor: 'pointer' }}>
            {product.libelle}
          </Typography>
          {product.marque && (
            <Typography variant="caption" color="text.secondary" noWrap>{product.marque}</Typography>
          )}
          <Chip label={productCat.label} size="small"
            sx={{ width: 'fit-content', fontSize: '0.62rem', height: 18 }} />
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
                onClick={() => handleAdd(1)}>
                <AddShoppingCart fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      {detailsOpen && (
        <ProductDetailDialog
          product={product}
          added={justAdded}
          onAdd={(qty) => handleAdd(qty)}
          onClose={() => setDetailsOpen(false)}
        />
      )}
    </motion.div>
  );
}

