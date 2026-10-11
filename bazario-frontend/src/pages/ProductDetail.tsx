import { useState, useEffect } from 'react';
import {
  Grid, Box, Typography, Button, Rating, Chip,
  TextField, Divider, Alert, IconButton,
} from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '@/api/productApi';
import { reviewApi } from '@/api/miscApi';
import { categoryApi } from '@/api/miscApi';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { formatDate } from '@/utils/formatCurrency';
import { formatCurrency } from '@/utils/formatCurrency';
import { buildCategoryDisplays, findCategoryDisplays } from '@/utils/categoryDisplay';
import { recordProductView } from '@/utils/recentlyViewed';
import PageLoader from '@/components/common/PageLoader';
import { Category, Review } from '@/types';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const { token, user } = useAuthStore();
  const isAuthenticated = !!token;
  const { addItem } = useCartStore();
  const qc = useQueryClient();
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [reviewRating, setReviewRating] = useState<number | null>(5);
  const [reviewComment, setReviewComment] = useState('');

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productApi.getById(productId),
    enabled: !!productId,
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => reviewApi.getProductReviews(productId),
    enabled: !!productId,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
  });

  useEffect(() => {
    if (product) recordProductView(product);
  }, [product]);

  const submitReview = useMutation({
    mutationFn: () => reviewApi.createReview(productId, { rating: reviewRating!, comment: reviewComment }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', productId] });
      setReviewComment('');
      toast.success('Avis publié');
    },
    onError: () => toast.error("Impossible de publier l'avis"),
  });

  const images = product?.images ?? [];

  const goToPrevImage = () => setSelectedImage((i) => (i - 1 + images.length) % images.length);
  const goToNextImage = () => setSelectedImage((i) => (i + 1) % images.length);

  useEffect(() => {
    setIsZoomed(false);
    setZoomOrigin({ x: 50, y: 50 });
  }, [selectedImage, productId]);

  useEffect(() => {
    if (images.length <= 1) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) return;
      if (e.key === 'ArrowLeft') goToPrevImage();
      else if (e.key === 'ArrowRight') goToNextImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length]);

  if (isLoading) return <PageLoader />;
  if (!product) return <Alert severity="error">Produit non trouvé.</Alert>;

  const hasPromo = product.prixPromo != null && product.prixPromo > 0 && product.prixActif;
  const displayPrice = hasPromo ? product.prixPromo! : product.prix;
  const minQty = product.quantiteMin ?? 1;
  const productCats = findCategoryDisplays(buildCategoryDisplays(categories), product.categories);

  const handleAddToCart = () => {
    addItem(product, qty);
    toast.success('Ajouté au panier !');
  };

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
      <Grid container spacing={4}>
        {/* Images */}
        <Grid item xs={12} md={6}>
          {images.length > 0 ? (
            <Box sx={{ position: 'relative' }}>
              <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 3 }}>
                <Box
                  component="img"
                  src={productApi.imageUrl(images[selectedImage])}
                  alt={product.libelle}
                  sx={{
                    width: '100%', aspectRatio: '1', objectFit: 'contain', bgcolor: 'grey.100',
                    display: 'block',
                    transform: isZoomed ? 'scale(2.5)' : 'scale(1)',
                    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                    transition: isZoomed ? 'none' : 'transform 0.35s ease',
                    userSelect: 'none', pointerEvents: 'none',
                  }}
                />
                <Box
                  onMouseMove={(e) => {
                    if (!isZoomed) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    setZoomOrigin({
                      x: ((e.clientX - rect.left) / rect.width) * 100,
                      y: ((e.clientY - rect.top) / rect.height) * 100,
                    });
                  }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setZoomOrigin({
                      x: ((e.clientX - rect.left) / rect.width) * 100,
                      y: ((e.clientY - rect.top) / rect.height) * 100,
                    });
                    setIsZoomed((z) => !z);
                  }}
                  sx={{ position: 'absolute', inset: 0, zIndex: 1, cursor: isZoomed ? 'zoom-out' : 'zoom-in' }}
                />
                <IconButton
                  size="small"
                  onClick={() => {
                    setIsZoomed((z) => !z);
                    if (isZoomed) setZoomOrigin({ x: 50, y: 50 });
                  }}
                  sx={{
                    position: 'absolute', bottom: 8, right: 8, zIndex: 2,
                    bgcolor: '#fff', border: '1px solid', borderColor: 'divider', boxShadow: 2,
                    '&:hover': { bgcolor: '#f5f5f5' },
                  }}
                >
                  {isZoomed ? <ZoomOutIcon sx={{ fontSize: 17 }} /> : <ZoomInIcon sx={{ fontSize: 17 }} />}
                </IconButton>
              </Box>
              {images.length > 1 && (
                <>
                  <IconButton size="small" onClick={goToPrevImage}
                    sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                      bgcolor: '#fff', border: '1px solid', borderColor: 'divider', boxShadow: 2,
                      '&:hover': { bgcolor: '#f5f5f5' } }}>
                    <ArrowBackIosNewIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                  <IconButton size="small" onClick={goToNextImage}
                    sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                      bgcolor: '#fff', border: '1px solid', borderColor: 'divider', boxShadow: 2,
                      '&:hover': { bgcolor: '#f5f5f5' } }}>
                    <ArrowForwardIosIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </>
              )}
            </Box>
          ) : (
            <Box sx={{ width: '100%', aspectRatio: '1', bgcolor: 'grey.100', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingCart sx={{ fontSize: 64, color: 'text.disabled' }} />
            </Box>
          )}
          {images.length > 1 && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              {images.map((img, i) => (
                <Box
                  key={i}
                  component="img"
                  src={productApi.imageUrl(img)}
                  onClick={() => setSelectedImage(i)}
                  sx={{ width: 64, height: 64, borderRadius: 2, objectFit: 'cover', cursor: 'pointer', border: selectedImage === i ? '2px solid' : '2px solid transparent', borderColor: selectedImage === i ? 'primary.main' : 'transparent' }}
                />
              ))}
            </Box>
          )}
        </Grid>

        {/* Info */}
        <Grid item xs={12} md={6}>
          <Typography variant="h2" gutterBottom>{product.libelle}</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            {productCats.map((c) => <Chip key={c.key} label={c.label} size="small" />)}
            {product.marque && <Chip label={product.marque} size="small" variant="outlined" />}
            {product.createdByName && (
              <Chip label={`Vendeur: ${product.createdByName}`} size="small" variant="outlined" />
            )}
          </Box>

          {hasPromo ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Typography variant="h4" color="primary" fontWeight={700}>{formatCurrency(displayPrice)}</Typography>
              <Typography variant="body1" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>{formatCurrency(product.prix)}</Typography>
              <Chip label="Promo" color="error" size="small" />
            </Box>
          ) : (
            <Typography variant="h4" color="primary" fontWeight={700} gutterBottom>
              {formatCurrency(displayPrice)}
            </Typography>
          )}

          {product.unite && (
            <Typography color="text.secondary" variant="body2" gutterBottom>Unité: {product.unite}</Typography>
          )}

          {minQty > 1 && (
            <Typography color="warning.main" variant="body2" gutterBottom>
              Quantité minimale: {minQty}
            </Typography>
          )}

          {product.description && (
            <Typography color="text.secondary" sx={{ mb: 3 }}>{product.description}</Typography>
          )}

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <TextField
              type="number"
              label="Qté"
              value={qty}
              onChange={(e) => setQty(Math.max(minQty, Number(e.target.value)))}
              size="small"
              sx={{ width: 80 }}
              inputProps={{ min: minQty }}
            />
            <Button
              variant="contained"
              startIcon={<ShoppingCart />}
              onClick={handleAddToCart}
              size="large"
            >
              Ajouter au panier
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Reviews */}
      <Divider sx={{ my: 5 }} />
      <Typography variant="h2" gutterBottom>Avis clients</Typography>

      {isAuthenticated && user?.role !== 'ADMIN' && (
        <Box sx={{ mb: 4, p: 3, bgcolor: 'background.paper', borderRadius: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Laisser un avis</Typography>
          <Rating value={reviewRating} onChange={(_e, v) => setReviewRating(v)} sx={{ mb: 2 }} />
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Votre commentaire..."
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={() => submitReview.mutate()}
            disabled={!reviewRating || submitReview.isPending}
          >
            Publier l'avis
          </Button>
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {reviews?.content.map((review: Review) => (
          <Box key={review.id} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography fontWeight={600}>{review.userFullName}</Typography>
              <Typography variant="caption" color="text.secondary">{formatDate(review.createdAt)}</Typography>
            </Box>
            <Rating value={review.rating} size="small" readOnly />
            {review.comment && <Typography variant="body2" sx={{ mt: 0.5 }}>{review.comment}</Typography>}
          </Box>
        ))}
        {!reviews?.content.length && (
          <Typography color="text.secondary">Aucun avis pour ce produit.</Typography>
        )}
      </Box>
    </Box>
  );
}
