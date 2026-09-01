import { useState } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, LinearProgress, Alert, alpha, TableSortLabel, TablePagination,
  TextField, InputAdornment,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import { useQuery } from '@tanstack/react-query';
import { orderApi } from '../../api/orderApi';
import type { CommandStatus } from '../../types';
import TableSkeleton from '../../components/common/TableSkeleton';

const STATUS_CHIP: Record<CommandStatus, { label: string; color: 'warning' | 'success' | 'error' | 'info' | 'primary' | 'default' }> = {
  EN_ATTENTE:     { label: 'EN ATTENTE',      color: 'warning' },
  CONFIRMEE:      { label: 'Confirmée',        color: 'info' },
  EN_PREPARATION: { label: 'En préparation',   color: 'primary' },
  EXPEDIEE:       { label: 'Expédiée',         color: 'info' },
  LIVREE:         { label: 'Livrée',           color: 'success' },
  VALIDEE:        { label: '✓ Validée',        color: 'success' },
  REFUSEE:        { label: '✗ Refusée',        color: 'error' },
  ANNULEE:        { label: 'Annulée',          color: 'error' },
};

type SortField = 'updatedAt' | 'createdAt' | 'nom' | 'status';
type SortDir = 'asc' | 'desc';

export default function OperateurHistorique() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [search, setSearch] = useState('');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(0);
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['commands', 'historique', page, rowsPerPage, sortField, sortDir, search],
    queryFn: () => orderApi.getHistorique({ page, size: rowsPerPage, sort: sortField, sortDir, q: search || undefined }),
  });

  const orders = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const SortableCell = ({ field, label }: { field: SortField; label: string }) => (
    <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em', py: 1.5 }}>
      <TableSortLabel
        active={sortField === field}
        direction={sortField === field ? sortDir : 'asc'}
        onClick={() => handleSort(field)}
        sx={{ color: '#fff !important', '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
        <Box sx={{ bgcolor: '#009530', borderRadius: 2, p: 1, display: 'flex' }}>
          <HistoryIcon sx={{ fontSize: 22, color: '#fff' }} />
        </Box>
        <Box>
          <Typography variant="h4">Historique des commandes</Typography>
          <Typography variant="body2" color="text.secondary">{total} commande{total > 1 ? 's' : ''} traitée{total > 1 ? 's' : ''}</Typography>
        </Box>
      </Box>

      <TextField
        size="small" placeholder="Rechercher par nom, prénom, tél…" value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        sx={{ mb: 2, maxWidth: 360 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
      />

      {isError && <Alert severity="error">Erreur de chargement.</Alert>}

      <Paper sx={{ overflow: 'hidden', position: 'relative' }}>
        {isLoading && (
          <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }} color="primary" />
        )}
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#0D1E36' }}>
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em', py: 1.5 }}>#</TableCell>
              <SortableCell field="nom" label="Client" />
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em', py: 1.5 }}>Téléphone</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em', py: 1.5 }}>Traité par</TableCell>
              <SortableCell field="status" label="Statut" />
              <SortableCell field="updatedAt" label="Traité le" />
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? <TableSkeleton rows={rowsPerPage} cols={6} /> : orders.map((order) => (
              <TableRow key={order.id} sx={{
                bgcolor: order.status === 'VALIDEE' ? alpha('#009530', 0.04) :
                         order.status === 'REFUSEE' ? alpha('#C62828', 0.04) : undefined,
                borderLeft: order.status === 'VALIDEE' ? '4px solid #009530' :
                            order.status === 'REFUSEE' ? '4px solid #C62828' :
                            order.status === 'ANNULEE' ? '4px solid #666' : '4px solid transparent',
                '&:hover': { bgcolor: alpha('#009530', 0.04) },
              }}>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.85rem' }}>#{order.id}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{order.prenom} {order.nom}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{order.telephone}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{order.treatedBy ?? '—'}</TableCell>
                <TableCell><Chip {...STATUS_CHIP[order.status as CommandStatus]} size="medium" sx={{ fontWeight: 700, minWidth: 90 }} /></TableCell>
                <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{new Date(order.updatedAt).toLocaleDateString('fr-FR')}</TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && !isLoading && (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>Aucune commande traitée.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="Lignes :"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
        />
      </Paper>
    </Box>
  );
}

