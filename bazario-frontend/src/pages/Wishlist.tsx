import { useState } from 'react';
import { Typography, Box, Grid, Skeleton } from '@mui/material';
import { useQueries, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useWishlist } from '@/hooks/useWishlist';
import { productApi } from '@/api/productApi';
import { categoryApi } from '@/api/miscApi';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { buildCategoryDisplays, ALL_CATEGORY } from '@/utils/categoryDisplay';
import ProductDetailDialog from '@/components/ProductDetailDialog';
import { ProductCard } from './Catalogue';
import type { Category, Product } from '@/types';

export default function Wishlist() {
  const { ids } = useWishlist();
  const productIds = Array.from(ids);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const addItem = useCartStore((s) => s.addItem);
  const { user } = useAuthStore();
  const isStockOrAdmin = user?.role === 'STOCK_OPERATEUR' || user?.role === 'ADMIN';

  const [justAdded, setJustAdded] = useState<Set<number>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
  });
  const categoryDisplays = [ALL_CATEGORY, ...buildCategoryDisplays(categories)];

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produit supprimé');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const handleAdd = (product: Product, qty = 1) => {
    addItem(product, qty);
    toast.success(`${qty > 1 ? `${qty}× ` : ''}${product.libelle} ajouté au panier`, { duration: 1800 });
    setJustAdded((prev) => { const s = new Set(prev); s.add(product.id); return s; });
    setTimeout(() => setJustAdded((prev) => { const s = new Set(prev); s.delete(product.id); return s; }), 2000);
  };

  const productQueries = useQueries({
    queries: productIds.map((id) => ({
      queryKey: ['product', id],
      queryFn: () => productApi.getById(id),
    })),
  });

  const isLoading = productQueries.some((q) => q.isLoading);

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
      <Typography variant="h2" gutterBottom>Liste de souhaits</Typography>
      {isLoading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={280} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      ) : productIds.length === 0 ? (
        <Typography color="text.secondary">Votre liste de souhaits est vide.</Typography>
      ) : (
        <Grid container spacing={2}>
          {productQueries.map((q) => {
            const product = q.data;
            if (!product) return null;
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                <ProductCard
                  product={product}
                  categoryDisplays={categoryDisplays}
                  added={justAdded.has(product.id)}
                  onAdd={() => handleAdd(product)}
                  onDetails={() => setSelectedProduct(product)}
                  isStockOrAdmin={isStockOrAdmin}
                  onEdit={() => navigate(`/stock/produits/${product.id}/edit`)}
                  onDelete={() => deleteMutation.mutate(product.id)}
                />
              </Grid>
            );
          })}
        </Grid>
      )}

      {selectedProduct && (
        <ProductDetailDialog
          product={selectedProduct}
          added={justAdded.has(selectedProduct.id)}
          onAdd={(qty) => handleAdd(selectedProduct, qty)}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </Box>
  );
}

