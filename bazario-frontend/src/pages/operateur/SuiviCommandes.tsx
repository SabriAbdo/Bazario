import { useState } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, Button, LinearProgress, Alert, Tooltip, ButtonGroup, alpha,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider, IconButton,
  TableSortLabel, TablePagination, TextField, InputAdornment, Tabs, Tab,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CloseIcon from '@mui/icons-material/Close';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import BlockIcon from '@mui/icons-material/Block';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '../../api/orderApi';
import type { Command, CommandStatus } from '../../types';
import toast from 'react-hot-toast';
import TableSkeleton from '../../components/common/TableSkeleton';

const STATUS_CHIP: Record<CommandStatus, { label: string; color: 'warning' | 'success' | 'error' | 'info' | 'primary' | 'default' }> = {
  EN_ATTENTE:     { label: 'En attente',      color: 'warning' },
  CONFIRMEE:      { label: 'Confirmée',        color: 'info' },
  EN_PREPARATION: { label: 'En préparation',   color: 'primary' },
  EXPEDIEE:       { label: 'Expédition',       color: 'info' },
  LIVREE:         { label: 'Livré',            color: 'success' },
  VALIDEE:        { label: 'Acceptée',         color: 'success' },
  REFUSEE:        { label: 'Refusée',          color: 'error' },
  ANNULEE:        { label: 'Annulé',           color: 'error' },
  EN_ROUTE:       { label: 'En route',         color: 'primary' },
  RETOURNEE:      { label: 'Retourné',         color: 'error' },
};

// Tracked lifecycle for accepted commandes, in display order
const TRACK_TABS: { status: CommandStatus | ''; label: string }[] = [
  { status: '', label: 'Toutes' },
  { status: 'VALIDEE', label: 'Acceptée' },
  { status: 'EXPEDIEE', label: 'Expédition' },
  { status: 'EN_ROUTE', label: 'En route' },
  { status: 'LIVREE', label: 'Livré' },
  { status: 'RETOURNEE', label: 'Retourné' },
  { status: 'ANNULEE', label: 'Annulé' },
];

// Next possible statuses reachable from a given tracked status
const NEXT_ACTIONS: Partial<Record<CommandStatus, { status: CommandStatus; label: string; icon: React.ReactNode; color: 'primary' | 'success' | 'error' }[]>> = {
  VALIDEE:  [{ status: 'EXPEDIEE', label: 'Expédier', icon: <LocalShippingIcon sx={{ fontSize: 16 }} />, color: 'primary' },
             { status: 'ANNULEE', label: 'Annuler', icon: <BlockIcon sx={{ fontSize: 16 }} />, color: 'error' }],
  EXPEDIEE: [{ status: 'EN_ROUTE', label: 'En route', icon: <DirectionsCarIcon sx={{ fontSize: 16 }} />, color: 'primary' },
             { status: 'RETOURNEE', label: 'Retourner', icon: <KeyboardReturnIcon sx={{ fontSize: 16 }} />, color: 'error' }],
  EN_ROUTE: [{ status: 'LIVREE', label: 'Livrer', icon: <DoneAllIcon sx={{ fontSize: 16 }} />, color: 'success' },
             { status: 'RETOURNEE', label: 'Retourner', icon: <KeyboardReturnIcon sx={{ fontSize: 16 }} />, color: 'error' }],
  LIVREE:   [{ status: 'RETOURNEE', label: 'Retourner', icon: <KeyboardReturnIcon sx={{ fontSize: 16 }} />, color: 'error' }],
};

export default function OperateurSuiviCommandes() {
  const qc = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Command | null>(null);
  const [pendingAction, setPendingAction] = useState<{ order: Command; status: CommandStatus; label: string } | null>(null);
  const [tab, setTab] = useState<CommandStatus | ''>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [sortField, setSortField] = useState('updatedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
    setPage(0);
  };

  const { data: result, isLoading, isError } = useQuery({
    queryKey: ['commands-suivi', tab, page, rowsPerPage, sortField, sortDir, search],
    queryFn: () => orderApi.getSuivi({ status: tab || undefined, page, size: rowsPerPage, sort: sortField, sortDir, q: search || undefined }),
    refetchInterval: 30_000,
    staleTime: 0,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: CommandStatus }) =>
      orderApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['commands-suivi'] }); toast.success('Statut mis à jour'); },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const confirmPendingAction = () => {
    if (!pendingAction) return;
    mutation.mutate({ id: pendingAction.order.id, status: pendingAction.status });
    setPendingAction(null);
    setSelectedOrder(null);
  };

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
          <LocalShippingIcon sx={{ fontSize: 22, color: '#fff' }} />
        </Box>
        <Box>
          <Typography variant="h4">Suivi Commandes</Typography>
          <Typography variant="body2" color="text.secondary">{total} commande{total > 1 ? 's' : ''} acceptée{total > 1 ? 's' : ''}</Typography>
        </Box>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => { setTab(v); setPage(0); }}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2, minHeight: 36, '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontWeight: 600 } }}
      >
        {TRACK_TABS.map((t) => <Tab key={t.status} value={t.status} label={t.label} />)}
      </Tabs>

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
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em', py: 1.5 }}>Articles</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em', py: 1.5 }}>Traité par</TableCell>
              <SortCell field="status" label="Statut" />
              <SortCell field="updatedAt" label="Mis à jour" />
              <TableCell align="center" sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em', py: 1.5 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? <TableSkeleton rows={rowsPerPage} cols={8} /> : display.map((order) => {
              const nextActions = NEXT_ACTIONS[order.status] ?? [];
              return (
                <TableRow key={order.id} sx={{ '&:hover': { bgcolor: alpha('#009530', 0.06) } }}>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.85rem' }}>#{order.id}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{order.prenom} {order.nom}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{order.telephone}</TableCell>
                  <TableCell><Chip label={`${order.items.length} art.`} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} /></TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{order.treatedBy ?? '—'}</TableCell>
                  <TableCell><Chip {...STATUS_CHIP[order.status]} size="small" /></TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{new Date(order.updatedAt).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell align="center">
                    <ButtonGroup size="small">
                      <Tooltip title="Voir les détails">
                        <Button variant="outlined" onClick={() => setSelectedOrder(order)}>
                          <VisibilityIcon sx={{ fontSize: 16 }} />
                        </Button>
                      </Tooltip>
                      <Tooltip title="WhatsApp">
                        <Button
                          sx={{ bgcolor: '#25D366', color: '#fff', '&:hover': { bgcolor: '#1da851' }, borderColor: '#25D366 !important' }}
                          onClick={() => window.open(`https://wa.me/${order.telephone.replace(/\D/g, '')}`, '_blank')}>
                          <WhatsAppIcon sx={{ fontSize: 16 }} />
                        </Button>
                      </Tooltip>
                      {nextActions.map((a) => (
                        <Tooltip key={a.status} title={a.label}>
                          <Button color={a.color} onClick={() => setPendingAction({ order, status: a.status, label: a.label })}>
                            {a.icon}
                          </Button>
                        </Tooltip>
                      ))}
                    </ButtonGroup>
                  </TableCell>
                </TableRow>
              );
            })}
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
                <Chip {...STATUS_CHIP[selectedOrder.status]} size="medium" sx={{ fontWeight: 700 }} />
              </Box>
              <IconButton size="small" onClick={() => setSelectedOrder(null)}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>

            <DialogContent dividers>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Informations client</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
                <Box><Typography variant="caption" color="text.secondary">Nom</Typography><Typography fontWeight={600}>{selectedOrder.prenom} {selectedOrder.nom}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Téléphone</Typography><Typography fontFamily="monospace">{selectedOrder.telephone}</Typography></Box>
                {selectedOrder.adresse && <Box sx={{ gridColumn: '1 / -1' }}><Typography variant="caption" color="text.secondary">Adresse de livraison</Typography><Typography>{selectedOrder.adresse}</Typography></Box>}
                {selectedOrder.email && <Box sx={{ gridColumn: '1 / -1' }}><Typography variant="caption" color="text.secondary">Email</Typography><Typography>{selectedOrder.email}</Typography></Box>}
                <Box><Typography variant="caption" color="text.secondary">Créée le</Typography><Typography>{new Date(selectedOrder.createdAt).toLocaleString('fr-FR')}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Mise à jour le</Typography><Typography>{new Date(selectedOrder.updatedAt).toLocaleString('fr-FR')}</Typography></Box>
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

              {selectedOrder.history && selectedOrder.history.length > 0 && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Historique du statut</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {selectedOrder.history.map((h, i) => (
                      <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <Chip {...STATUS_CHIP[h.status]} size="small" sx={{ fontWeight: 600 }} />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(h.changedAt).toLocaleString('fr-FR')} {h.changedBy ? `· ${h.changedBy}` : ''}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </DialogContent>

            <DialogActions sx={{ px: 2.5, py: 1.5, flexWrap: 'wrap', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<WhatsAppIcon />}
                sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1da851' } }}
                onClick={() => window.open(`https://wa.me/${selectedOrder.telephone.replace(/\D/g, '')}?text=Bonjour ${encodeURIComponent(selectedOrder.prenom + ' ' + selectedOrder.nom)}, concernant votre commande num%C3%A9ro ${selectedOrder.id}...`, '_blank')}
              >
                WhatsApp
              </Button>
              {(NEXT_ACTIONS[selectedOrder.status] ?? []).map((a) => (
                <Button
                  key={a.status}
                  variant="contained"
                  color={a.color}
                  startIcon={a.icon}
                  onClick={() => setPendingAction({ order: selectedOrder, status: a.status, label: a.label })}
                >
                  {a.label}
                </Button>
              ))}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Status change confirmation */}
      <Dialog open={!!pendingAction} onClose={() => setPendingAction(null)} maxWidth="xs" fullWidth>
        {pendingAction && (
          <>
            <DialogTitle>Confirmer le changement de statut</DialogTitle>
            <DialogContent>
              <Typography>
                Passer la commande <strong>#{pendingAction.order.id}</strong> ({pendingAction.order.prenom} {pendingAction.order.nom}) de{' '}
                <Chip {...STATUS_CHIP[pendingAction.order.status]} size="small" sx={{ mx: 0.5 }} /> à{' '}
                <Chip {...STATUS_CHIP[pendingAction.status]} size="small" sx={{ mx: 0.5 }} /> ?
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPendingAction(null)}>Annuler</Button>
              <Button variant="contained" onClick={confirmPendingAction} disabled={mutation.isPending}>
                Confirmer
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
