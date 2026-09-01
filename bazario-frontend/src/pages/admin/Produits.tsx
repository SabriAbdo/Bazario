import { Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, Chip, LinearProgress, Alert, alpha } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../../api/productApi';
import TableSkeleton from '../../components/common/TableSkeleton';

export default function AdminProduits() {
  const { data: products, isLoading, isError } = useQuery({
    queryKey: ['all-products'],
    queryFn: () => productApi.getAll(),
  });

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
        <Box sx={{ bgcolor: '#009530', borderRadius: 2, p: 1, display: 'flex' }}>
          <InventoryIcon sx={{ fontSize: 22, color: '#fff' }} />
        </Box>
        <Box>
          <Typography variant="h4">Tous les Produits</Typography>
          <Typography variant="body2" color="text.secondary">{products?.totalElements ?? 0} produits enregistrés</Typography>
        </Box>
      </Box>

      {isError && <Alert severity="error">Erreur de chargement.</Alert>}

      <Paper sx={{ overflow: 'hidden', position: 'relative' }}>
        {isLoading && (
          <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }} color="primary" />
        )}
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#0D1E36' }}>
              {['Libellé', 'Prix (MAD)', 'Statut', 'Ajouté par', 'Date'].map((h) => (
                <TableCell key={h} sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em', py: 1.5 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? <TableSkeleton rows={5} cols={5} /> : products?.content?.map((p) => (
              <TableRow key={p.id} sx={{ '&:hover': { bgcolor: alpha('#009530', 0.04) } }}>
                <TableCell sx={{ fontWeight: 600 }}>{p.libelle}</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{p.prix.toLocaleString('fr-MA', { minimumFractionDigits: 2 })}</TableCell>
                <TableCell><Chip label={p.prixActif ? 'Actif' : 'Inactif'} color={p.prixActif ? 'success' : 'default'} size="small" /></TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{p.createdByName ?? '—'}</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{new Date(p.createdAt).toLocaleDateString('fr-FR')}</TableCell>
              </TableRow>
            ))}
            {!isLoading && !products?.content?.length && (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>Aucun produit.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
