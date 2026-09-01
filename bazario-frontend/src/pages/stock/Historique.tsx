import { useState } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  LinearProgress, Alert, alpha, Button, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, TableSortLabel, TablePagination, Chip,
} from '@mui/material';
import TableSkeleton from '../../components/common/TableSkeleton';
import HistoryIcon from '@mui/icons-material/History';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import InboxIcon from '@mui/icons-material/Inbox';
import LockIcon from '@mui/icons-material/Lock';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { productApi } from '../../api/productApi';
import { useAuthStore } from '../../store/useAuthStore';
import type { Product } from '../../types';

type SortField = 'libelle' | 'prix' | 'createdAt';
type SortDir = 'asc' | 'desc';

export default function StockHistorique() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [confirmProduct, setConfirmProduct] = useState<Product | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('desc'); }
    setPage(0);
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', 'deleted', page, rowsPerPage, sortField, sortDir],
    queryFn: () => productApi.getDeleted({ page, size: rowsPerPage, sort: sortField, sortDir }),
  });

  const products = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const restoreMutation = useMutation({
    mutationFn: (id: number) => productApi.restore(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['products', 'deleted'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      const name = products.find((p) => p.id === id)?.libelle ?? 'Produit';
      toast.success(`� ${name} � restaur� avec succ�s`);
      setConfirmProduct(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erreur lors de la restauration');
      setConfirmProduct(null);
    },
  });

  const SortableCell = ({ field, label }: { field: SortField; label: string }) => (
    <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em', py: 1.5 }}>
      <TableSortLabel
        active={sortField === field} direction={sortField === field ? sortDir : 'asc'}
        onClick={() => handleSort(field)}
        sx={{ color: '#fff !important', '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}
      >{label}</TableSortLabel>
    </TableCell>
  );

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box sx={{ bgcolor: '#FF6B35', borderRadius: 2, p: 1, display: 'flex' }}>
          <HistoryIcon sx={{ fontSize: 22, color: '#fff' }} />
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={700}>Corbeille � Historique</Typography>
          <Typography variant="body2" color="text.secondary">
            {total} produit{total !== 1 ? 's' : ''} supprim�{total !== 1 ? 's' : ''}
            {!isAdmin && ' � restauration r�serv�e aux administrateurs'}
          </Typography>
        </Box>
      </Box>

      {!isAdmin && (
        <Alert severity="info" icon={<LockIcon />} sx={{ mb: 3 }}>
          La restauration de produits supprim�s n�cessite l'approbation d'un <strong>administrateur</strong>.
          Contactez votre admin pour restaurer un produit.
        </Alert>
      )}

      {isError && <Alert severity="error">Erreur de chargement.</Alert>}

      <Paper sx={{ overflow: 'hidden', borderRadius: 2, boxShadow: 2, position: 'relative' }}>
        {(isLoading || restoreMutation.isPending) && (
          <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }} color="warning" />
        )}
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#0D1E36' }}>
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', py: 1.5, width: 68 }}>Photo</TableCell>
              <SortableCell field="libelle" label="Libell�" />
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', py: 1.5 }}>R�f�rence</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', py: 1.5 }}>Marque</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', py: 1.5 }}>Cat�gorie</TableCell>
              <SortableCell field="prix" label="Prix (MAD)" />
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', py: 1.5 }}>Cr�� par</TableCell>
              <SortableCell field="createdAt" label="Date d'ajout" />
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', py: 1.5 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? <TableSkeleton rows={rowsPerPage} cols={9} /> : products.map((p) => (
              <TableRow key={p.id} sx={{ '&:hover': { bgcolor: alpha('#FF6B35', 0.05) }, opacity: 0.85 }}>
                <TableCell sx={{ py: 0.5 }}>
                  {p.images?.length > 0 ? (
                    <Box component="img" src={p.images[0]} alt={p.libelle}
                      sx={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 1.5, border: '1px solid', borderColor: 'divider', display: 'block', filter: 'grayscale(40%)' }} />
                  ) : (
                    <Box sx={{ width: 44, height: 44, borderRadius: 1.5, bgcolor: alpha('#FF6B35', 0.08), border: '1px dashed', borderColor: alpha('#FF6B35', 0.2), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 18, opacity: 0.4 }}>??</span>
                    </Box>
                  )}
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <DeleteForeverIcon sx={{ fontSize: 16, color: 'error.light' }} />
                    {p.libelle}
                  </Box>
                </TableCell>
                <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem', fontFamily: 'monospace' }}>{p.reference ?? '�'}</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{p.marque ?? '�'}</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{p.categorie ?? '�'}</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {p.prix.toLocaleString('fr-MA', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>{p.createdByName ?? '�'}</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                  {new Date(p.createdAt).toLocaleString('fr-FR')}
                </TableCell>
                <TableCell>
                  {isAdmin ? (
                    <Tooltip title="Annuler la suppression et remettre en catalogue">
                      <Button size="small" variant="outlined" color="success" startIcon={<RestoreIcon />}
                        onClick={() => setConfirmProduct(p)} disabled={restoreMutation.isPending}
                        sx={{ textTransform: 'none', fontWeight: 600 }}>
                        Restaurer
                      </Button>
                    </Tooltip>
                  ) : (
                    <Chip icon={<LockIcon sx={{ fontSize: '14px !important' }} />} label="Admin requis" size="small" color="default" variant="outlined" />
                  )}
                </TableCell>
              </TableRow>
            ))}

            {products.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <InboxIcon sx={{ fontSize: 44, color: 'text.disabled' }} />
                    <Typography variant="body1" color="text.secondary">La corbeille est vide.</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div" count={total} page={page} rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="Lignes :" labelDisplayedRows={({ from, to, count }) => `${from}�${to} sur ${count}`}
        />
      </Paper>

      <Dialog open={!!confirmProduct} onClose={() => setConfirmProduct(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RestoreIcon color="success" /> Restaurer le produit
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Voulez-vous remettre <strong>� {confirmProduct?.libelle} �</strong> dans le catalogue ?
            Il sera automatiquement marqu� comme <strong>approuv�</strong>.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmProduct(null)} color="inherit">Annuler</Button>
          <Button variant="contained" color="success" startIcon={<RestoreIcon />}
            onClick={() => confirmProduct && restoreMutation.mutate(confirmProduct.id)}
            disabled={restoreMutation.isPending}>
            Confirmer la restauration
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
