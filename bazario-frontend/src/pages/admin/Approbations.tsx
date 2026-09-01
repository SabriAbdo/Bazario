import { useState } from 'react';
import {
  Box, Typography, Grid, Card, CardMedia, CardContent, CardActions,
  Button, Chip, LinearProgress, Alert, alpha, Dialog, DialogTitle,
  DialogContent, DialogActions, Divider, Pagination,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import PersonIcon from '@mui/icons-material/Person';
import CategoryIcon from '@mui/icons-material/Category';
import SellIcon from '@mui/icons-material/Sell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/adminApi';
import type { Product } from '@/types';
import toast from 'react-hot-toast';

const PAGE_SIZE = 12;

function ProductPreviewDialog({ product, onClose, onApprove, onReject, approving, rejecting }: {
  product: Product; onClose: () => void;
  onApprove: () => void; onReject: () => void;
  approving: boolean; rejecting: boolean;
}) {
  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <PendingActionsIcon color="warning" />
        <Box>
          <Typography variant="h6" fontWeight={700}>{product.libelle}</Typography>
          <Typography variant="caption" color="text.secondary">Soumis par {product.createdByName ?? '—'} · {new Date(product.createdAt).toLocaleString('fr-FR')}</Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {product.images?.length > 0 ? (
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2.5 }}>
            {product.images.map((img, i) => (
              <Box key={i} component="img" src={img} alt=""
                sx={{ width: 130, height: 130, objectFit: 'cover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }} />
            ))}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, color: 'text.disabled' }}>
            <ImageNotSupportedIcon /> <Typography variant="body2">Aucune image</Typography>
          </Box>
        )}
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          <Box><Typography variant="caption" color="text.secondary">Référence</Typography><Typography fontFamily="monospace">{product.reference ?? '—'}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Marque</Typography><Typography>{product.marque ?? '—'}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Catégorie</Typography><Typography>{product.categorie ?? '—'}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Unité · Qté min</Typography><Typography>{product.unite} · {product.quantiteMin}</Typography></Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Prix</Typography>
            <Typography fontWeight={700} color="primary.main">{product.prix.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD</Typography>
          </Box>
          <Box><Typography variant="caption" color="text.secondary">Prix promo</Typography>
            <Typography color="secondary.main">{product.prixPromo ? `${product.prixPromo.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD` : '—'}</Typography>
          </Box>
          {product.description && (
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="caption" color="text.secondary">Description</Typography>
              <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{product.description}</Typography>
            </Box>
          )}
        </Box>
        {product.variants && product.variants.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Variantes ({product.variants.length})</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {product.variants?.map((v) => (
                <Chip key={v.id} label={`${v.valeur} · ${v.stock} en stock`} size="small" variant="outlined" />
              ))}
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2.5, py: 1.5, gap: 1 }}>
        <Button onClick={onClose} color="inherit" sx={{ mr: 'auto' }}>Fermer</Button>
        <Button variant="outlined" color="error" startIcon={<CancelIcon />}
          onClick={onReject} disabled={rejecting || approving}>
          {rejecting ? 'Refus…' : 'Rejeter'}
        </Button>
        <Button variant="contained" color="success" size="large" startIcon={<CheckCircleIcon />}
          onClick={onApprove} disabled={approving || rejecting}>
          {approving ? 'Approbation…' : 'Approuver'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AdminApprobations() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<Product | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'approbations', page],
    queryFn: () => adminApi.getPendingProducts(page - 1, PAGE_SIZE),
    refetchInterval: 30_000, // auto-refresh every 30s
  });

  const products = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const pageCount = data?.totalPages ?? 1;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'approbations'] });
    qc.invalidateQueries({ queryKey: ['admin-stats'] });
    qc.invalidateQueries({ queryKey: ['admin', 'products'] });
  };

  const approveMutation = useMutation({
    mutationFn: (id: number) => adminApi.approveProduct(id),
    onSuccess: (_, id) => {
      const name = products.find((p) => p.id === id)?.libelle ?? 'Produit';
      toast.success(`« ${name} » approuvé et visible dans le catalogue`);
      if (preview?.id === id) setPreview(null);
      invalidate();
    },
    onError: () => toast.error("Erreur lors de l'approbation"),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => adminApi.rejectProduct(id),
    onSuccess: (_, id) => {
      const name = products.find((p) => p.id === id)?.libelle ?? 'Produit';
      toast.success(`« ${name} » refusé et déplacé en corbeille`);
      if (preview?.id === id) setPreview(null);
      invalidate();
    },
    onError: () => toast.error('Erreur lors du refus'),
  });

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <Box sx={{ bgcolor: '#FF6B35', borderRadius: 2, p: 1, display: 'flex' }}>
          <PendingActionsIcon sx={{ fontSize: 22, color: '#fff' }} />
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={700}>Approbations</Typography>
          <Typography variant="body2" color="text.secondary">
            {isLoading ? '…' : `${total} produit${total !== 1 ? 's' : ''} en attente de validation`}
          </Typography>
        </Box>
        {total > 0 && (
          <Chip label={`${total} en attente`} color="warning" size="small" sx={{ ml: 'auto', fontWeight: 700 }} />
        )}
      </Box>

      {isLoading && <LinearProgress sx={{ mt: 2, mb: 3, borderRadius: 1 }} color="warning" />}
      {isError && <Alert severity="error" sx={{ mt: 2 }}>Erreur de chargement.</Alert>}

      {/* Empty state */}
      {!isLoading && total === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 12, gap: 2 }}>
          <Box sx={{ bgcolor: alpha('#009530', 0.1), borderRadius: '50%', p: 3 }}>
            <TaskAltIcon sx={{ fontSize: 64, color: '#009530' }} />
          </Box>
          <Typography variant="h5" fontWeight={700} color="success.main">Tout est approuvé !</Typography>
          <Typography color="text.secondary">Aucun produit n'attend votre validation pour l'instant.</Typography>
        </Box>
      )}

      {/* Product cards */}
      {!isLoading && products.length > 0 && (
        <>
          <Grid container spacing={2.5} sx={{ mt: 1 }}>
            {products.map((product: Product) => {
              const busy = approveMutation.isPending || rejectMutation.isPending;
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                  <Card
                    elevation={2}
                    sx={{
                      height: '100%', display: 'flex', flexDirection: 'column',
                      borderRadius: 3, border: '1px solid', borderColor: alpha('#FF6B35', 0.25),
                      transition: 'box-shadow 0.2s, transform 0.15s',
                      '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' },
                    }}
                  >
                    {/* Image */}
                    {product.images?.length > 0 ? (
                      <CardMedia
                        component="img"
                        height={160}
                        image={product.images[0]}
                        alt={product.libelle}
                        onClick={() => setPreview(product)}
                        sx={{ objectFit: 'cover', cursor: 'pointer', borderRadius: '12px 12px 0 0' }}
                      />
                    ) : (
                      <Box onClick={() => setPreview(product)} sx={{
                        height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: alpha('#FF6B35', 0.06), cursor: 'pointer', borderRadius: '12px 12px 0 0',
                        border: '1px dashed', borderColor: alpha('#FF6B35', 0.2),
                      }}>
                        <ImageNotSupportedIcon sx={{ fontSize: 40, color: alpha('#FF6B35', 0.35) }} />
                      </Box>
                    )}

                    <CardContent sx={{ flex: 1, pb: 1 }}>
                      <Typography variant="subtitle1" fontWeight={700} gutterBottom
                        sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                        onClick={() => setPreview(product)}>
                        {product.libelle}
                      </Typography>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, mt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <PersonIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                          <Typography variant="caption" color="text.secondary">{product.createdByName ?? '—'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <CategoryIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                          <Typography variant="caption" color="text.secondary">{product.categorie ?? '—'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <SellIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                          <Typography variant="caption" fontWeight={700} color="primary.main">
                            {product.prix.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD
                          </Typography>
                        </Box>
                      </Box>

                      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
                        Soumis le {new Date(product.createdAt).toLocaleDateString('fr-FR')}
                      </Typography>
                    </CardContent>

                    <Divider />

                    <CardActions sx={{ p: 1.5, gap: 1 }}>
                      <Button
                        fullWidth variant="contained" color="success" size="small"
                        startIcon={<CheckCircleIcon />}
                        disabled={busy}
                        onClick={() => approveMutation.mutate(product.id)}
                        sx={{ fontWeight: 700 }}
                      >
                        Approuver
                      </Button>
                      <Button
                        fullWidth variant="outlined" color="error" size="small"
                        startIcon={<CancelIcon />}
                        disabled={busy}
                        onClick={() => rejectMutation.mutate(product.id)}
                        sx={{ fontWeight: 700 }}
                      >
                        Rejeter
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {pageCount > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination count={pageCount} page={page} onChange={(_, v) => setPage(v)} color="primary" />
            </Box>
          )}
        </>
      )}

      {/* Detail preview dialog */}
      {preview && (
        <ProductPreviewDialog
          product={preview}
          onClose={() => setPreview(null)}
          onApprove={() => approveMutation.mutate(preview.id)}
          onReject={() => rejectMutation.mutate(preview.id)}
          approving={approveMutation.isPending}
          rejecting={rejectMutation.isPending}
        />
      )}
    </Box>
  );
}
