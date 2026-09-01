import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, Button, LinearProgress, Alert, Tooltip, ButtonGroup, alpha,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '../../api/orderApi';
import type { CommandStatus } from '../../types';
import toast from 'react-hot-toast';
import TableSkeleton from '../../components/common/TableSkeleton';

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

export default function AdminCommandes() {
  const qc = useQueryClient();
  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['admin-commands'],
    queryFn: () => orderApi.getAll(),
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: CommandStatus }) =>
      orderApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-commands'] }); toast.success('Statut mis à jour'); },
  });

  const all = orders?.content ?? [];
  const pending = all.filter((o) => o.status === 'EN_ATTENTE');
  const rest = all.filter((o) => o.status !== 'EN_ATTENTE');
  const display = [...pending, ...rest];

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
        <Box sx={{ bgcolor: '#009530', borderRadius: 2, p: 1, display: 'flex' }}>
          <ReceiptLongIcon sx={{ fontSize: 22, color: '#fff' }} />
        </Box>
        <Box>
          <Typography variant="h4">Toutes les Commandes</Typography>
          <Typography variant="body2" color="text.secondary">
            {pending.length > 0 ? <><strong style={{ color: '#FF6B35' }}>{pending.length}</strong> en attente · </> : null}
            {display.length} au total
          </Typography>
        </Box>
      </Box>

      {isError && <Alert severity="error">Erreur de chargement.</Alert>}

      <Paper sx={{ overflow: 'hidden', position: 'relative' }}>
        {(isLoading || mutation.isPending) && (
          <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }} color="primary" />
        )}
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#0D1E36' }}>
              {['#', 'Client', 'Téléphone', 'Articles', 'Traité par', 'Statut', 'Actions'].map((h, i) => (
                <TableCell key={h} align={i === 6 ? 'center' : 'left'}
                  sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em', py: 1.5 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? <TableSkeleton rows={5} cols={7} /> : display.map((order) => (
              <TableRow key={order.id} sx={{
                bgcolor: order.status === 'EN_ATTENTE' ? alpha('#FF6B35', 0.05) : undefined,
                '&:hover': { bgcolor: alpha('#009530', 0.04) },
              }}>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.85rem' }}>#{order.id}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{order.prenom} {order.nom}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{order.telephone}</TableCell>
                <TableCell><Chip label={`${order.items.length} art.`} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} /></TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{order.treatedBy ?? '—'}</TableCell>
                <TableCell><Chip {...STATUS_CHIP[order.status]} size="small" /></TableCell>
                <TableCell align="center">
                  <ButtonGroup size="small">
                    <Tooltip title="WhatsApp">
                      <Button
                        sx={{ bgcolor: '#25D366', color: '#fff', '&:hover': { bgcolor: '#1da851' }, borderColor: '#25D366 !important' }}
                        startIcon={<WhatsAppIcon sx={{ fontSize: '14px !important' }} />}
                        onClick={() => window.open(`https://wa.me/${order.telephone.replace(/\D/g, '')}`, '_blank')}>
                        WA
                      </Button>
                    </Tooltip>
                    {order.status === 'EN_ATTENTE' && (
                      <>
                        <Tooltip title="Valider">
                          <Button color="primary" onClick={() => mutation.mutate({ id: order.id, status: 'VALIDEE' })}>
                            <CheckIcon sx={{ fontSize: 16 }} />
                          </Button>
                        </Tooltip>
                        <Tooltip title="Refuser">
                          <Button color="error" onClick={() => mutation.mutate({ id: order.id, status: 'REFUSEE' })}>
                            <CloseIcon sx={{ fontSize: 16 }} />
                          </Button>
                        </Tooltip>
                      </>
                    )}
                  </ButtonGroup>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && display.length === 0 && (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>Aucune commande.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
