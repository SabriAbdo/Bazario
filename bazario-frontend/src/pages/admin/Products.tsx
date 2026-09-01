import { useState } from 'react';
import {
  Container, Typography, Box, TextField, InputAdornment, FormControl, InputLabel,
  Select, MenuItem, LinearProgress, Paper, Table, TableHead, TableBody, TableRow,
  TableCell, Chip, IconButton, Tooltip, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TablePagination, alpha, Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import VerifiedIcon from '@mui/icons-material/Verified';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '@/api/productApi';
import { adminApi } from '@/api/adminApi';
import type { Product } from '@/types';
import toast from 'react-hot-toast';
import TableSkeleton from '@/components/common/TableSkeleton';

const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Plus récents' },
  { value: 'createdAt_asc', label: 'Plus anciens' },
  { value: 'libelle_asc', label: 'Libellé A→Z' },
  { value: 'libelle_desc', label: 'Libellé Z→A' },
  { value: 'prix_asc', label: 'Prix croissant' },
  { value: 'prix_desc', label: 'Prix décroissant' },
];

function ProductDetailDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const qc = useQueryClient();
  const approveMutation = useMutation({
    mutationFn: () => adminApi.approveProduct(product.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'products'] }); qc.invalidateQueries({ queryKey: ['admin-stats'] }); toast.success('Produit approuvé'); onClose(); },
  });
  const rejectMutation = useMutation({
    mutationFn: () => adminApi.rejectProduct(product.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'products'] }); qc.invalidateQueries({ queryKey: ['admin-stats'] }); toast.success('Produit refusé / retiré'); onClose(); },
  });

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1, flexWrap: 'wrap' }}>
        <Typography variant="h6" fontWeight={700}>{product.libelle}</Typography>
        {product.approvedByAdmin
          ? <Chip label="Approuvé" size="small" color="success" icon={<VerifiedIcon />} />
          : <Chip label="En attente d'approbation" size="small" color="warning" icon={<PendingActionsIcon />} />}
        {!product.prixActif && <Chip label="Caché du catalogue" size="small" color="default" />}
      </DialogTitle>
      <DialogContent dividers>
        {product.images.length > 0 ? (
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2.5 }}>
            {product.images.map((img, i) => (
              <Box key={i} component="img" src={img} alt=""
                sx={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }} />
            ))}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, color: 'text.disabled' }}>
            <ImageNotSupportedIcon /> <Typography variant="body2">Aucune image</Typography>
          </Box>
        )}
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Box><Typography variant="caption" color="text.secondary">Référence</Typography><Typography fontFamily="monospace">{product.reference ?? '—'}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Marque</Typography><Typography>{product.marque ?? '—'}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Catégorie</Typography><Typography>{product.categorie ?? '—'}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Unité · Qté min</Typography><Typography>{product.unite} · {product.quantiteMin}</Typography></Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Prix</Typography>
            <Typography fontWeight={700} color="primary.main">{product.prix.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD</Typography>
          </Box>
          <Box><Typography variant="caption" color="text.secondary">Prix promo</Typography><Typography color="secondary.main">{product.prixPromo ? `${product.prixPromo.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD` : '—'}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Créé par</Typography><Typography>{product.createdByName ?? '—'}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Date de création</Typography><Typography>{new Date(product.createdAt).toLocaleString('fr-FR')}</Typography></Box>
          {product.description && (
            <Box sx={{ gridColumn: '1 / -1' }}><Typography variant="caption" color="text.secondary">Description</Typography>
              <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{product.description}</Typography>
            </Box>
          )}
        </Box>
        {product.variants && product.variants.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Variantes ({product.variants.length})</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {product.variants.map((v) => (
                <Chip key={v.id} label={`${v.valeur} · ${v.stock} en stock`} size="small" variant="outlined" />
              ))}
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2.5, py: 1.5, gap: 1 }}>
        {!product.approvedByAdmin ? (
          <>
            <Button variant="contained" color="success" startIcon={<CheckCircleIcon />}
              onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>Approuver</Button>
            <Button variant="outlined" color="error" startIcon={<CancelIcon />}
              onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending}>Rejeter</Button>
          </>
        ) : (
          <Button variant="outlined" color="warning" startIcon={<CancelIcon />}
            onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending}>Retirer l'approbation</Button>
        )}
        <Button onClick={onClose} color="inherit">Fermer</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AdminProducts() {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('createdAt_desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [filterApproval, setFilterApproval] = useState<'all' | 'pending'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const qc = useQueryClient();

  const [sortField, sortDir] = sortKey.split('_') as [string, 'asc' | 'desc'];

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'products', search, sortField, sortDir, page, rowsPerPage],
    queryFn: () => productApi.getAll({ q: search || undefined, page, size: rowsPerPage, sort: sortField, sortDir }),
    enabled: filterApproval === 'all',
  });

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['admin', 'products', 'pending', page, rowsPerPage],
    queryFn: () => adminApi.getPendingProducts(page, rowsPerPage),
    enabled: filterApproval === 'pending',
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => adminApi.approveProduct(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'products'] }); qc.invalidateQueries({ queryKey: ['admin-stats'] }); toast.success('Produit approuvé'); },
  });
  const rejectMutation = useMutation({
    mutationFn: (id: number) => adminApi.rejectProduct(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'products'] }); qc.invalidateQueries({ queryKey: ['admin-stats'] }); toast.success('Produit refusé'); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => productApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'products'] }); toast.success('Produit supprimé'); },
  });

  const displayData = filterApproval === 'pending' ? pendingData : data;
  const products = displayData?.content ?? [];
  const total = displayData?.totalElements ?? 0;
  const loading = filterApproval === 'pending' ? pendingLoading : isLoading;

  return (
    <Container maxWidth="xl">
      <Typography variant="h2" gutterBottom>Tous les produits</Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small" placeholder="Rechercher..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ maxWidth: 280, flex: 1 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          disabled={filterApproval === 'pending'}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filtre approbation</InputLabel>
          <Select value={filterApproval} label="Filtre approbation" onChange={(e) => { setFilterApproval(e.target.value as any); setPage(0); }}>
            <MenuItem value="all">Tous les produits</MenuItem>
            <MenuItem value="pending">En attente d'approbation</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }} disabled={filterApproval === 'pending'}>
          <InputLabel>Trier par</InputLabel>
          <Select value={sortKey} label="Trier par" onChange={(e) => setSortKey(e.target.value)}>
            {SORT_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {!loading && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{total} produit{total !== 1 ? 's' : ''}</Typography>}

      <Paper sx={{ overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#0D1E36' }}>
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', py: 1.5, width: 68 }}>Photo</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', py: 1.5 }}>Libellé</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', py: 1.5 }}>Réf. / Marque</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', py: 1.5 }}>Catégorie</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', py: 1.5 }}>Prix</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', py: 1.5 }}>Créé par</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', py: 1.5 }}>Date</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', py: 1.5 }}>Statut</TableCell>
              <TableCell align="center" sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', py: 1.5 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? <TableSkeleton rows={rowsPerPage} cols={9} imageCol={0} /> : products.map((p: Product) => (
              <TableRow key={p.id} sx={{
                bgcolor: !p.approvedByAdmin ? alpha('#FF6B35', 0.04) : undefined,
                '&:hover': { bgcolor: alpha('#009530', 0.04) },
              }}>
                <TableCell sx={{ py: 0.5 }}>
                  {p.images?.length > 0 ? (
                    <Box component="img" src={p.images[0]} alt={p.libelle}
                      sx={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 1.5, border: '1px solid', borderColor: 'divider', display: 'block' }} />
                  ) : (
                    <Box sx={{ width: 52, height: 52, borderRadius: 1.5, bgcolor: alpha('#009530', 0.06),
                      border: '1px dashed', borderColor: alpha('#009530', 0.2),
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.disabled' }}>
                      <ImageNotSupportedIcon sx={{ fontSize: 20 }} />
                    </Box>
                  )}
                </TableCell>
                <TableCell sx={{ maxWidth: 200 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>{p.libelle}</Typography>
                  {p.description && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{p.description}</Typography>}
                </TableCell>
                <TableCell sx={{ fontSize: '0.82rem' }}>
                  {p.reference && <Typography variant="caption" fontFamily="monospace" display="block">{p.reference}</Typography>}
                  {p.marque && <Typography variant="caption" color="text.secondary" display="block">{p.marque}</Typography>}
                  {!p.reference && !p.marque && <Typography variant="caption" color="text.disabled">—</Typography>}
                </TableCell>
                <TableCell sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>{p.categorie ?? '—'}</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'primary.main', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                  {p.prix.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD
                  {p.prixPromo && <Typography variant="caption" color="secondary.main" display="block">{p.prixPromo.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD</Typography>}
                </TableCell>
                <TableCell sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>{p.createdByName ?? '—'}</TableCell>
                <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>{new Date(p.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {p.approvedByAdmin
                      ? <Chip label="Approuvé" size="small" color="success" />
                      : <Chip label="En attente" size="small" color="warning" />}
                    {!p.prixActif && <Chip label="Masqué" size="small" variant="outlined" />}
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                    <Tooltip title="Voir les détails">
                      <IconButton size="small" onClick={() => setSelectedProduct(p)} color="primary">
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {!p.approvedByAdmin ? (
                      <Tooltip title="Approuver">
                        <IconButton size="small" color="success" onClick={() => approveMutation.mutate(p.id)}>
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Retirer l'approbation">
                        <IconButton size="small" color="warning" onClick={() => rejectMutation.mutate(p.id)}>
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Supprimer">
                      <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(p.id)}>
                        <DeleteForeverIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {!loading && products.length === 0 && (
              <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                {filterApproval === 'pending' ? "Aucun produit en attente d'approbation 🎉" : 'Aucun produit.'}
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div" count={total} page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[10, 20, 50, 100]}
          labelRowsPerPage="Lignes :" labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
        />
      </Paper>

      {selectedProduct && <ProductDetailDialog product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </Container>
  );
}

