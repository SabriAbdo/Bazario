import { useState } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, Button, LinearProgress, Alert, Tooltip, ButtonGroup, alpha,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider, IconButton,
  TableSortLabel, TablePagination, TextField, InputAdornment,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '../../api/orderApi';
import type { Command, CommandStatus } from '../../types';
import toast from 'react-hot-toast';
import TableSkeleton from '../../components/common/TableSkeleton';

const STATUS_CHIP: Record<CommandStatus, { label: string; color: 'warning' | 'success' | 'error' | 'info' | 'primary' | 'default' }> = {
  EN_ATTENTE:     { label: 'EN ATTENTE',      color: 'warning' },
  CONFIRMEE:      { label: 'Confirmée',        color: 'info' },
  EN_PREPARATION: { label: 'En préparation',   color: 'primary' },
  EXPEDIEE:       { label: 'Expédiée',         color: 'info' },
  LIVREE:         { label: 'Livrée',           color: 'success' },
  VALIDEE:        { label: '✓ VALIDÉE',        color: 'success' },
  REFUSEE:        { label: '✗ Refusée',        color: 'error' },
  ANNULEE:        { label: 'Annulée',          color: 'error' },
};

export default function OperateurCommandes() {
  const qc = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Command | null>(null);
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

  const { data: result, isLoading, isError } = useQuery({
    queryKey: ['commands', page, rowsPerPage, sortField, sortDir, search],
    queryFn: () => orderApi.getAll({ page, size: rowsPerPage, sort: sortField, sortDir, q: search || undefined }),
    refetchInterval: 30_000,
    staleTime: 0,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: CommandStatus }) =>
      orderApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['commands'] }); toast.success('Statut mis à jour'); },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const display = result?.content ?? [];
  const total = result?.totalElements ?? 0;

  const SortCell = ({ field, label }: { field: string; label: string }) => (
    <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em', py: 1.5 }}>
      <TableSortLabel
        active={sortField === field}
        direction={sortField === field ? sortDir : 'asc'}
        onClick={() => handleSort(field)}
        sx={{ color: '#fff !important', '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}
      >{label}</TableSortLabel>
    </TableCell>
  );

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
        <Box sx={{ bgcolor: '#009530', borderRadius: 2, p: 1, display: 'flex' }}>
          <ReceiptLongIcon sx={{ fontSize: 22, color: '#fff' }} />
        </Box>
        <Box>
          <Typography variant="h4">Commandes</Typography>
          <Typography variant="body2" color="text.secondary">
            {total} au total
          </Typography>
        </Box>
      </Box>

      <TextField
        size="small" placeholder="Rechercher client, #..." value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        sx={{ mb: 2, maxWidth: 320 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
      />

      {isError && <Alert severity="error">Erreur de chargement.</Alert>}

      <Paper sx={{ overflow: 'hidden', position: 'relative' }}>
        {(isLoading || mutation.isPending) && (
          <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }} color="primary" />
        )}
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#0D1E36' }}>
              <SortCell field="id" label="#" />
              <SortCell field="nom" label="Client" />
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em', py: 1.5 }}>Téléphone</TableCell>
              <SortCell field="type" label="Type" />
              <SortCell field="createdAt" label="Date" />
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em', py: 1.5 }}>Articles</TableCell>
              <SortCell field="status" label="Statut" />
              <TableCell align="center" sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em', py: 1.5 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? <TableSkeleton rows={rowsPerPage} cols={8} /> : display.map((order) => (
              <TableRow key={order.id} sx={{
                bgcolor: order.status === 'EN_ATTENTE' ? alpha('#FF6B35', 0.07) :
                         order.status === 'VALIDEE' ? alpha('#009530', 0.04) :
                         order.status === 'REFUSEE' ? alpha('#C62828', 0.04) : undefined,
                borderLeft: order.status === 'EN_ATTENTE' ? '4px solid #FF6B35' :
                            order.status === 'VALIDEE' ? '4px solid #009530' :
                            order.status === 'REFUSEE' ? '4px solid #C62828' : '4px solid transparent',
                '&:hover': { bgcolor: alpha('#009530', 0.06) },
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
                  {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  <Typography component="div" sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>
                    {new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={`${order.items.length} art.`} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                </TableCell>
                <TableCell>
                  <Chip
                    {...STATUS_CHIP[order.status]}
                    size="medium"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      letterSpacing: order.status === 'EN_ATTENTE' ? '0.04em' : undefined,
                      minWidth: 100,
                    }}
                  />
                </TableCell>
                <TableCell align="center">
                  <ButtonGroup size="small">
                    <Tooltip title="Voir les détails">
                      <Button variant="outlined" onClick={() => setSelectedOrder(order)}>
                        <VisibilityIcon sx={{ fontSize: 16 }} />
                      </Button>
                    </Tooltip>
                    <Tooltip title="Contacter sur WhatsApp">
                      <Button
                        sx={{ bgcolor: '#25D366', color: '#fff', '&:hover': { bgcolor: '#1da851' }, borderColor: '#25D366 !important' }}
                        startIcon={<WhatsAppIcon sx={{ fontSize: '14px !important' }} />}
                        onClick={() => window.open(`https://wa.me/${order.telephone.replace(/\D/g, '')}?text=Bonjour ${encodeURIComponent(order.prenom + ' ' + order.nom)}, concernant votre commande num%C3%A9ro ${order.id}...`, '_blank')}
                      >
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

      {/* Detail dialog */}
      <Dialog open={!!selectedOrder} onClose={() => setSelectedOrder(null)} maxWidth="sm" fullWidth>
        {selectedOrder && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="h6" fontWeight={700}>Commande #{selectedOrder.id}</Typography>
                {selectedOrder.type === 'DEMANDE_INFO'
                  ? <Chip label="Demande info" size="small" color="info" variant="outlined" />
                  : <Chip label="Commande" size="small" color="default" variant="outlined" />}
                <Chip {...STATUS_CHIP[selectedOrder.status]} size="medium" sx={{ fontWeight: 700 }} />
              </Box>
              <IconButton size="small" onClick={() => setSelectedOrder(null)}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>

            <DialogContent dividers>
              {/* Client info */}
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Informations client</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
                <Box><Typography variant="caption" color="text.secondary">Nom</Typography><Typography fontWeight={600}>{selectedOrder.prenom} {selectedOrder.nom}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Téléphone</Typography><Typography fontFamily="monospace">{selectedOrder.telephone}</Typography></Box>
                {selectedOrder.email && <Box sx={{ gridColumn: '1 / -1' }}><Typography variant="caption" color="text.secondary">Email</Typography><Typography>{selectedOrder.email}</Typography></Box>}
                <Box><Typography variant="caption" color="text.secondary">Date</Typography><Typography>{new Date(selectedOrder.createdAt).toLocaleString('fr-FR')}</Typography></Box>
                {selectedOrder.treatedBy && <Box><Typography variant="caption" color="text.secondary">Traité par</Typography><Typography>{selectedOrder.treatedBy}</Typography></Box>}
              </Box>

              {selectedOrder.items.length > 0 && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Articles ({selectedOrder.items.length})</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Désignation</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Prix unit.</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Qté</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Sous-total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOrder.items.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell sx={{ fontSize: '0.85rem' }}>{item.libelleSnapshot}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.85rem' }}>{item.prixSnapshot.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.85rem' }}>{item.quantite}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{(item.prixSnapshot * item.quantite).toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD</TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ bgcolor: 'action.selected' }}>
                        <TableCell colSpan={3} align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {selectedOrder.items.reduce((s, i) => s + i.prixSnapshot * i.quantite, 0).toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </>
              )}
            </DialogContent>

            <DialogActions sx={{ px: 2.5, py: 1.5 }}>
              <Button
                variant="contained"
                startIcon={<WhatsAppIcon />}
                sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1da851' } }}
                onClick={() => window.open(`https://wa.me/${selectedOrder.telephone.replace(/\D/g, '')}?text=Bonjour ${encodeURIComponent(selectedOrder.prenom + ' ' + selectedOrder.nom)}, concernant votre commande num%C3%A9ro ${selectedOrder.id}...`, '_blank')}
              >
                WhatsApp
              </Button>
              {selectedOrder.status === 'EN_ATTENTE' && (
                <>
                  <Button variant="contained" color="primary" startIcon={<CheckIcon />}
                    onClick={() => { mutation.mutate({ id: selectedOrder.id, status: 'VALIDEE' }); setSelectedOrder(null); }}>
                    Valider
                  </Button>
                  <Button variant="outlined" color="error" startIcon={<CloseIcon />}
                    onClick={() => { mutation.mutate({ id: selectedOrder.id, status: 'REFUSEE' }); setSelectedOrder(null); }}>
                    Refuser
                  </Button>
                </>
              )}
              <Button onClick={() => setSelectedOrder(null)}>Fermer</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
