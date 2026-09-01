import { useState } from 'react';
import {
  Container, Grid, Box, Typography, Button, Rating, Chip,
  TextField, Divider, Alert,
} from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '@/api/productApi';
import { reviewApi } from '@/api/miscApi';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { formatDate } from '@/utils/formatCurrency';
import { formatCurrency } from '@/utils/formatCurrency';
import PageLoader from '@/components/common/PageLoader';
import { Review } from '@/types';
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

  const submitReview = useMutation({
    mutationFn: () => reviewApi.createReview(productId, { rating: reviewRating!, comment: reviewComment }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', productId] });
      setReviewComment('');
      toast.success('Avis publié');
    },
    onError: () => toast.error("Impossible de publier l'avis"),
  });

  if (isLoading) return <PageLoader />;
  if (!product) return <Alert severity="error">Produit non trouvé.</Alert>;

  const hasPromo = product.prixPromo != null && product.prixPromo > 0 && product.prixActif;
  const displayPrice = hasPromo ? product.prixPromo! : product.prix;
  const images = product.images ?? [];
  const minQty = product.quantiteMin ?? 1;

  const handleAddToCart = () => {
    addItem(product, qty);
    toast.success('Ajouté au panier !');
  };

  return (
    <Container maxWidth="lg">
      <Grid container spacing={4}>
        {/* Images */}
        <Grid item xs={12} md={6}>
          {images.length > 0 ? (
            <Box
              component="img"
              src={productApi.imageUrl(images[selectedImage])}
              alt={product.libelle}
              sx={{ width: '100%', borderRadius: 3, aspectRatio: '1', objectFit: 'cover', bgcolor: 'grey.100' }}
            />
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
            {product.categorie && <Chip label={product.categorie} size="small" />}
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
    </Container>
  );
}
