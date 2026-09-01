import { useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, IconButton, Tooltip, Alert, alpha, LinearProgress,
  TableSortLabel, TablePagination, TextField, InputAdornment,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import InventoryIcon from '@mui/icons-material/Inventory';
import SearchIcon from '@mui/icons-material/Search';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import VerifiedIcon from '@mui/icons-material/Verified';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '../../api/productApi';
import toast from 'react-hot-toast';
import TableSkeleton from '../../components/common/TableSkeleton';

type SortField = 'libelle' | 'prix' | 'createdAt';
type SortDir = 'asc' | 'desc';

export default function StockProduits() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [search, setSearch] = useState('');

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
    setPage(0);
  };

  const { data: result, isLoading, isError } = useQuery({
    queryKey: ['mes-produits', page, rowsPerPage, sortField, sortDir, search],
    queryFn: () => productApi.myProducts(page, rowsPerPage, sortField, sortDir, search || undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mes-produits'] }); toast.success('Produit d�plac� en corbeille'); },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const products = result?.content ?? [];
  const total = result?.totalElements ?? 0;

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ bgcolor: '#009530', borderRadius: 2, p: 1, display: 'flex' }}>
            <InventoryIcon sx={{ fontSize: 22, color: '#fff' }} />
          </Box>
          <Box>
            <Typography variant="h4">Mes Produits</Typography>
            <Typography variant="body2" color="text.secondary">{total} produit{total > 1 ? 's' : ''} enregistr�{total > 1 ? 's' : ''}</Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/stock/produits/nouveau')}>
          Nouveau produit
        </Button>
      </Box>

      <TextField
        size="small" placeholder="Rechercher..." value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        sx={{ mb: 2, maxWidth: 320 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
      />

      {isError && <Alert severity="error">Erreur de chargement.</Alert>}

      <Paper sx={{ overflow: 'hidden', position: 'relative' }}>
        {(isLoading || deleteMutation.isPending) && (
          <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }} color="primary" />
        )}
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#0D1E36' }}>
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', py: 1.5, width: 68 }}>Photo</TableCell>
              <SortableCell field="libelle" label="Libell�" />
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', py: 1.5 }}>Marque � R�f.</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', py: 1.5 }}>Cat�gorie</TableCell>
              <SortableCell field="prix" label="Prix (MAD)" />
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', py: 1.5 }}>Unit� � Qt� min</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', py: 1.5 }}>Variantes</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', py: 1.5 }}>Approbation</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', py: 1.5 }}>Catalogue</TableCell>
              <SortableCell field="createdAt" label="Cr�� le" />
              <TableCell align="center" sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', py: 1.5 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? <TableSkeleton rows={rowsPerPage} cols={11} imageCol={0} /> : products.map((p) => (
              <TableRow key={p.id} sx={{
                bgcolor: !p.approvedByAdmin ? alpha('#FF6B35', 0.04) : undefined,
                '&:hover': { bgcolor: alpha('#009530', 0.04) },
              }}>
                <TableCell sx={{ py: 0.5 }}>
                  {p.images?.length > 0 ? (
                    <Box component="img" src={productApi.imageUrl(p.images[0])} alt={p.libelle}
                      sx={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 1.5, border: '1px solid', borderColor: 'divider', display: 'block' }} />
                  ) : (
                    <Box sx={{ width: 52, height: 52, borderRadius: 1.5, bgcolor: alpha('#009530', 0.06),
                      border: '1px dashed', borderColor: alpha('#009530', 0.2),
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.disabled' }}>
                      <ImageNotSupportedIcon sx={{ fontSize: 20 }} />
                    </Box>
                  )}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, maxWidth: 180 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>{p.libelle}</Typography>
                  {p.description && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{p.description}</Typography>
                  )}
                </TableCell>
                <TableCell sx={{ fontSize: '0.82rem' }}>
                  {p.marque && <Typography variant="body2" fontWeight={500}>{p.marque}</Typography>}
                  {p.reference && <Typography variant="caption" fontFamily="monospace" color="text.secondary">{p.reference}</Typography>}
                  {!p.marque && !p.reference && <Typography variant="caption" color="text.disabled">�</Typography>}
                </TableCell>
                <TableCell sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>{p.categorie ?? '�'}</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                  {p.prix.toLocaleString('fr-MA', { minimumFractionDigits: 2 })}
                  {p.prixPromo && <Typography variant="caption" color="secondary.main" display="block">{p.prixPromo.toLocaleString('fr-MA', { minimumFractionDigits: 2 })}</Typography>}
                </TableCell>
                <TableCell sx={{ fontSize: '0.82rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>{p.unite} � {p.quantiteMin}</TableCell>
                <TableCell>
                  {p.variants && p.variants.length > 0
                    ? <Chip label={`${p.variants.length} var.`} size="small" variant="outlined" />
                    : <Typography variant="caption" color="text.disabled">�</Typography>}
                </TableCell>
                <TableCell>
                  {p.approvedByAdmin
                    ? <Chip icon={<VerifiedIcon sx={{ fontSize: '14px !important' }} />} label="Approuv�" size="small" color="success" />
                    : <Chip icon={<PendingActionsIcon sx={{ fontSize: '14px !important' }} />} label="En attente" size="small" color="warning" />}
                </TableCell>
                <TableCell>
                  <Chip label={p.prixActif ? 'Visible' : 'Cach�'} color={p.prixActif ? 'success' : 'default'} size="small" />
                </TableCell>
                <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Modifier">
                    <IconButton size="small" sx={{ color: 'primary.main' }} onClick={() => navigate(`/stock/produits/${p.id}/edit`)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Supprimer (envoi en corbeille)">
                    <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(p.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {products.length === 0 && !isLoading && (
              <TableRow><TableCell colSpan={11} align="center" sx={{ py: 4, color: 'text.secondary' }}>Aucun produit.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div" count={total} page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Lignes :" labelDisplayedRows={({ from, to, count }) => `${from}�${to} sur ${count}`}
        />
      </Paper>
    </Box>
  );
}

