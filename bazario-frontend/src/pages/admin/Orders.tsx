import { useState } from 'react';
import {
  Container, Typography, Paper, Chip, Table, TableHead, TableBody, TableRow, TableCell,
  LinearProgress, alpha, TablePagination, TableSortLabel, TextField, InputAdornment, ButtonGroup, Button, Tooltip,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '@/api/orderApi';
import type { Command, CommandStatus } from '@/types';
import toast from 'react-hot-toast';
import TableSkeleton from '@/components/common/TableSkeleton';

const STATUS_CHIP: Record<CommandStatus, { label: string; color: 'warning' | 'success' | 'error' | 'info' | 'primary' | 'default' }> = {
  EN_ATTENTE:     { label: 'En attente',      color: 'warning' },
  CONFIRMEE:      { label: 'Confirmée',        color: 'info' },
  EN_PREPARATION: { label: 'En préparation',   color: 'primary' },
  EXPEDIEE:       { label: 'Expédiée',         color: 'info' },
  LIVREE:         { label: 'Livrée',           color: 'success' },
  VALIDEE:        { label: 'Validée',          color: 'success' },
  REFUSEE:        { label: 'Refusée',          color: 'error' },
  ANNULEE:        { label: 'Annulée',          color: 'error' },
};

export default function AdminOrders() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
    setPage(0);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'orders', page, rowsPerPage, sortField, sortDir, search],
    queryFn: () => orderApi.getAll({ page, size: rowsPerPage, sort: sortField, sortDir, q: search || undefined }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: CommandStatus }) => orderApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'orders'] }); toast.success('Statut mis à jour'); },
  });

  const orders = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const SortCell = ({ field, label }: { field: string; label: string }) => (
    <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em', py: 1.5, color: '#fff' }}>
      <TableSortLabel
        active={sortField === field}
        direction={sortField === field ? sortDir : 'asc'}
        onClick={() => handleSort(field)}
        sx={{ color: '#fff !important', '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}
      >{label}</TableSortLabel>
    </TableCell>
  );

  return (
    <Container maxWidth="xl">
      <Typography variant="h2" gutterBottom>Toutes les commandes</Typography>
      <TextField
        size="small" placeholder="Rechercher..." value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        sx={{ mb: 2, maxWidth: 320 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
      />
      <Paper sx={{ overflow: 'hidden', position: 'relative' }}>
        {(isLoading || updateMutation.isPending) && (
          <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />
        )}
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#0D1E36' }}>
              <SortCell field="id" label="#" />
              <SortCell field="nom" label="Client" />
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', py: 1.5 }}>Téléphone</TableCell>
              <SortCell field="type" label="Type" />
              <SortCell field="createdAt" label="Date" />
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', py: 1.5 }}>Articles</TableCell>
              <SortCell field="status" label="Statut" />
              <TableCell align="center" sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', py: 1.5 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? <TableSkeleton rows={rowsPerPage} cols={8} /> : orders.map((order: Command) => (
              <TableRow key={order.id} sx={{
                bgcolor: order.status === 'EN_ATTENTE' ? alpha('#FF6B35', 0.05) : undefined,
                '&:hover': { bgcolor: alpha('#009530', 0.04) },
              }}>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.85rem' }}>#{order.id}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{order.prenom} {order.nom}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{order.telephone}</TableCell>
                <TableCell>
                  {order.type === 'DEMANDE_INFO'
                    ? <Chip label="Demande info" size="small" color="info" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                    : <Chip label="Commande" size="small" color="default" variant="outlined" sx={{ fontSize: '0.7rem' }} />}
                </TableCell>
                <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                  {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell>
                  <Chip label={`${order.items.length} art.`} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                </TableCell>
                <TableCell>
                  <Chip {...STATUS_CHIP[order.status]} size="small" />
                </TableCell>
                <TableCell align="center">
                  {order.status === 'EN_ATTENTE' && (
                    <ButtonGroup size="small">
                      <Tooltip title="Valider">
                        <Button color="primary" onClick={() => updateMutation.mutate({ id: order.id, status: 'VALIDEE' })}>
                          <CheckIcon sx={{ fontSize: 16 }} />
                        </Button>
                      </Tooltip>
                      <Tooltip title="Refuser">
                        <Button color="error" onClick={() => updateMutation.mutate({ id: order.id, status: 'REFUSEE' })}>
                          <CloseIcon sx={{ fontSize: 16 }} />
                        </Button>
                      </Tooltip>
                    </ButtonGroup>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && orders.length === 0 && (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>Aucune commande.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[10, 20, 50, 100]}
          labelRowsPerPage="Lignes :"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
        />
      </Paper>
    </Container>
  );
}
