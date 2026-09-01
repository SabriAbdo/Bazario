import { Container, Typography, Box, Grid, Button } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistApi } from '@/api/miscApi';
import { productApi } from '@/api/productApi';
import ProductGrid from '@/components/product/ProductGrid';
import PageLoader from '@/components/common/PageLoader';
import { Product } from '@/types';
import toast from 'react-hot-toast';

export default function Wishlist() {
  const qc = useQueryClient();

  const { data: wishlist, isLoading } = useQuery<{ productId: number }[]>({
    queryKey: ['wishlist'],
    queryFn: () => wishlistApi.getWishlist(),
  });

  const wishlistedIds = new Set(wishlist?.map((w) => w.productId) ?? []);

  if (isLoading) return <PageLoader />;

  return (
    <Container maxWidth="lg">
      <Typography variant="h2" gutterBottom>Liste de souhaits</Typography>
      {wishlistedIds.size === 0 ? (
        <Typography color="text.secondary">Votre liste de souhaits est vide.</Typography>
      ) : (
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {wishlistedIds.size} produit(s) dans votre liste de souhaits.
        </Typography>
      )}
    </Container>
  );
}
