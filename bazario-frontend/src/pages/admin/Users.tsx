import { useState } from 'react';
import {
  Container, Typography, Box, Paper, TextField, Button, Chip, InputAdornment, Avatar,
  TablePagination, TableSortLabel, Table, TableHead, TableBody, TableRow, TableCell,
  LinearProgress, alpha, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip,
} from '@mui/material';
import { Search, Delete, Category as CategoryIcon } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/miscApi';
import { categoryApi } from '@/api/miscApi';
import { User, Category } from '@/types';
import toast from 'react-hot-toast';
import TableSkeleton from '@/components/common/TableSkeleton';

type SortField = 'fullName' | 'email' | 'role' | 'createdAt';
type SortDir = 'asc' | 'desc';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  OPERATEUR: 'Opérateur',
  STOCK_OPERATEUR: 'Stock Opérateur',
};

function AllowedCategoriesDialog({ user, categories, onClose }: { user: User; categories: Category[]; onClose: () => void }) {
  const qc = useQueryClient();
  const current = user.allowedCategories ? user.allowedCategories.split(',').filter(Boolean) : [];
  const [selected, setSelected] = useState<string[]>(current);

  const mutation = useMutation({
    mutationFn: () => adminApi.setAllowedCategories(user.id, selected.length ? selected.join(',') : null),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); toast.success('Catégories mises à jour'); onClose(); },
    onError: () => toast.error('Erreur'),
  });

  const toggle = (slug: string) =>
    setSelected((prev) => prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]);

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Catégories autorisées — {user.fullName}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Sélectionnez les catégories que cet opérateur peut utiliser. Laissez tout décochéi pour autoriser toutes les catégories.
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {categories.map((cat) => (
            <Chip
              key={cat.slug}
              label={cat.label}
              clickable
              color={selected.includes(cat.slug) ? 'primary' : 'default'}
              variant={selected.includes(cat.slug) ? 'filled' : 'outlined'}
              onClick={() => toggle(cat.slug)}
            />
          ))}
        </Box>
        {selected.length === 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
            ⚠ Aucune restriction — toutes les catégories sont accessibles.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Annuler</Button>
        <Button onClick={() => mutation.mutate()} variant="contained" disabled={mutation.isPending}>Enregistrer</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AdminUsers() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [sortField, setSortField] = useState<SortField>('fullName');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [catDialogUser, setCatDialogUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const qc = useQueryClient();

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
    setPage(0);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, rowsPerPage, sortField, sortDir, q],
    queryFn: () => adminApi.getUsers({ q: q || undefined, page, size: rowsPerPage, sort: sortField, sortDir }),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
  });

  const banMutation = useMutation({
    mutationFn: (id: number) => adminApi.banUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); toast.success('Utilisateur désactivé'); },
  });

  const unbanMutation = useMutation({
    mutationFn: (id: number) => adminApi.unbanUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); toast.success('Utilisateur réactivé'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); toast.success('Utilisateur supprimé (historique conservé)'); setDeleteConfirm(null); },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const users = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const SortCell = ({ field, label }: { field: SortField; label: string }) => (
    <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em', py: 1.5, bgcolor: 'grey.100' }}>
      <TableSortLabel active={sortField === field} direction={sortField === field ? sortDir : 'asc'} onClick={() => handleSort(field)}>{label}</TableSortLabel>
    </TableCell>
  );

  return (
    <Container maxWidth="lg">
      <Typography variant="h2" gutterBottom>Utilisateurs</Typography>
      <TextField
        placeholder="Rechercher..." value={q}
        onChange={(e) => { setQ(e.target.value); setPage(0); }}
        sx={{ mb: 3, maxWidth: 360 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
        size="small"
      />
      <Paper sx={{ overflow: 'hidden', position: 'relative' }}>
        {isLoading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', bgcolor: 'grey.100', py: 1.5 }}>Avatar</TableCell>
              <SortCell field="fullName" label="Nom" />
              <SortCell field="email" label="Email / Username" />
              <SortCell field="role" label="Rôle" />
              <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', bgcolor: 'grey.100', py: 1.5 }}>Statut</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', bgcolor: 'grey.100', py: 1.5 }}>Catégories</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.78rem', bgcolor: 'grey.100', py: 1.5 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? <TableSkeleton rows={rowsPerPage} cols={7} imageCol={0} /> : users.map((user: User) => (
              <TableRow key={user.id} sx={{ '&:hover': { bgcolor: alpha('#009530', 0.04) } }}>
                <TableCell sx={{ py: 0.5 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>{user.fullName?.[0]}</Avatar>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{user.fullName}</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.82rem' }}>{user.username}</TableCell>
                <TableCell>
                  <Chip label={ROLE_LABELS[user.role] ?? user.role} size="small" color="primary" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.active ? 'Actif' : 'Inactif'} size="small"
                    color={user.active ? 'success' : 'error'}
                    sx={{ fontWeight: 700 }}
                  />
                </TableCell>
                <TableCell sx={{ maxWidth: 180 }}>
                  {user.role === 'STOCK_OPERATEUR' && (
                    user.allowedCategories
                      ? <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                          {user.allowedCategories.split(',').slice(0, 3).join(', ')}{user.allowedCategories.split(',').length > 3 ? '…' : ''}
                        </Typography>
                      : <Typography variant="caption" color="text.disabled">Toutes</Typography>
                  )}
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                    {user.active ? (
                      <Tooltip title="Désactiver le compte">
                        <Button size="small" color="error" variant="outlined" onClick={() => banMutation.mutate(user.id)}>
                          Bannir
                        </Button>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Réactiver le compte">
                        <Button size="small" color="success" variant="outlined" onClick={() => unbanMutation.mutate(user.id)}>
                          Activer
                        </Button>
                      </Tooltip>
                    )}
                    {user.role === 'STOCK_OPERATEUR' && (
                      <Tooltip title="Gérer les catégories autorisées">
                        <IconButton size="small" color="primary" onClick={() => setCatDialogUser(user)}>
                          <CategoryIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Supprimer l'utilisateur (historique conservé)">
                      <IconButton size="small" color="error" onClick={() => setDeleteConfirm(user)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && users.length === 0 && (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>Aucun utilisateur.</TableCell></TableRow>
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

      {catDialogUser && (
        <AllowedCategoriesDialog user={catDialogUser} categories={categories} onClose={() => setCatDialogUser(null)} />
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Supprimer l'utilisateur ?</DialogTitle>
        <DialogContent>
          <Typography>Voulez-vous supprimer <strong>{deleteConfirm?.fullName}</strong> ? L'historique des commandes et des produits sera conservé.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)} color="inherit">Annuler</Button>
          <Button color="error" variant="contained" onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

