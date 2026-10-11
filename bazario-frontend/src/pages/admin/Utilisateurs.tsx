import { useMemo, useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, InputLabel, FormControl, LinearProgress, Alert, Tooltip, alpha,
  Grid, Avatar, Divider, InputAdornment, Switch, TableSortLabel, TablePagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PeopleIcon from '@mui/icons-material/People';
import BadgeIcon from '@mui/icons-material/Badge';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SearchIcon from '@mui/icons-material/Search';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, type CreateUserRequest } from '../../api/adminApi';
import type { User } from '../../types';
import toast from 'react-hot-toast';
import TableSkeleton from '../../components/common/TableSkeleton';

const ROLES: User['role'][] = ['ADMIN', 'OPERATEUR', 'STOCK_OPERATEUR', 'CLIENT'];
const ROLE_LABELS: Record<User['role'], string> = {
  ADMIN: 'Administrateur',
  OPERATEUR: 'Opérateur',
  STOCK_OPERATEUR: 'Stock-Opérateur',
  CLIENT: 'Client',
};
const ROLE_COLORS: Record<User['role'], 'error' | 'info' | 'secondary'> = {
  ADMIN: 'error',
  OPERATEUR: 'info',
  STOCK_OPERATEUR: 'secondary',
  CLIENT: 'secondary',
};
const ROLE_AVATAR_BG: Record<User['role'], string> = {
  ADMIN: '#d32f2f',
  OPERATEUR: '#0288d1',
  STOCK_OPERATEUR: '#7b1fa2',
  CLIENT: '#E8521A',
};

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

export default function AdminUtilisateurs() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState<CreateUserRequest>({ username: '', email: '', password: '', fullName: '', role: 'OPERATEUR' });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<User['role'] | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [sortField, setSortField] = useState('fullName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
    setPage(0);
  };

  const { data: result, isLoading, isError } = useQuery({
    queryKey: ['admin-users', page, rowsPerPage, sortField, sortDir, search],
    queryFn: () => adminApi.getUsersPaged({ q: search || undefined, page, size: rowsPerPage, sort: sortField, sortDir }),
  });

  const filteredUsers = useMemo(() => (result?.content ?? []).filter((u) =>
    (roleFilter === 'ALL' || u.role === roleFilter) &&
    (statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? u.active : !u.active))
  ), [result, roleFilter, statusFilter]);
  const total = result?.totalElements ?? 0;

  const createMutation = useMutation({
    mutationFn: adminApi.createUser,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Utilisateur créé'); closeDialog(); },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof adminApi.updateUser>[1] }) =>
      adminApi.updateUser(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Utilisateur mis à jour'); closeDialog(); },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteUser,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Utilisateur supprimé'); },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (u: User) => (u.active ? adminApi.banUser(u.id) : adminApi.unbanUser(u.id)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Statut mis à jour'); },
    onError: () => toast.error('Erreur lors du changement de statut'),
  });

  const openCreate = () => {
    setEditUser(null);
    setForm({ username: '', email: '', password: '', fullName: '', role: 'OPERATEUR' });
    setOpen(true);
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({ username: u.username, email: u.email ?? '', password: '', fullName: u.fullName, role: u.role });
    setOpen(true);
  };

  const closeDialog = () => { setOpen(false); setEditUser(null); };

  const handleSubmit = () => {
    if (editUser) {
      updateMutation.mutate({
        id: editUser.id,
        data: {
          username: form.username,
          email: form.email,
          fullName: form.fullName,
          role: form.role,
          ...(form.password ? { password: form.password } : {}),
        },
      });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ bgcolor: '#009530', borderRadius: 2, p: 1, display: 'flex' }}>
            <PeopleIcon sx={{ fontSize: 22, color: '#fff' }} />
          </Box>
          <Box>
            <Typography variant="h4">Utilisateurs</Typography>
            <Typography variant="body2" color="text.secondary">{total} compte{total > 1 ? 's' : ''} enregistré{total > 1 ? 's' : ''}</Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Nouvel utilisateur</Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small" placeholder="Rechercher un utilisateur..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ maxWidth: 280, flex: 1 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Rôle</InputLabel>
          <Select value={roleFilter} label="Rôle" onChange={(e) => setRoleFilter(e.target.value as User['role'] | 'ALL')}>
            <MenuItem value="ALL">Tous les rôles</MenuItem>
            {ROLES.map((r) => <MenuItem key={r} value={r}>{ROLE_LABELS[r]}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Statut</InputLabel>
          <Select value={statusFilter} label="Statut" onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}>
            <MenuItem value="ALL">Tous les statuts</MenuItem>
            <MenuItem value="ACTIVE">Actif</MenuItem>
            <MenuItem value="INACTIVE">Inactif</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {isError && <Alert severity="error">Erreur de chargement.</Alert>}

      <Paper sx={{ overflow: 'hidden', position: 'relative' }}>
        {(isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending) && (
          <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }} color="primary" />
        )}
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#0D1E36' }}>
              {([
                { field: 'fullName', label: 'Nom complet' },
                { field: 'username', label: 'Identifiant' },
                { field: 'email', label: 'Email' },
                { field: 'role', label: 'Rôle' },
                { field: 'active', label: 'Statut' },
              ] as const).map((c) => (
                <TableCell key={c.field} sx={{ color: '#fff', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.06em', py: 1.5 }}>
                  <TableSortLabel
                    active={sortField === c.field}
                    direction={sortField === c.field ? sortDir : 'asc'}
                    onClick={() => handleSort(c.field)}
                    sx={{ color: '#fff !important', '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}
                  >{c.label}</TableSortLabel>
                </TableCell>
              ))}
              <TableCell align="center" sx={{ color: '#fff', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.06em', py: 1.5 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? <TableSkeleton rows={rowsPerPage} cols={6} /> : filteredUsers.map((u) => (
              <TableRow key={u.id} sx={{ '&:hover': { bgcolor: alpha('#009530', 0.04) } }}>
                <TableCell sx={{ fontWeight: 600 }}>{u.fullName}</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{u.username}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{u.email ?? '—'}</TableCell>
                <TableCell><Chip label={ROLE_LABELS[u.role]} size="small" color={ROLE_COLORS[u.role]} variant="outlined" /></TableCell>
                <TableCell>
                  <Tooltip title={u.active ? 'Désactiver' : 'Activer'}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Switch checked={u.active} size="small" color="success"
                        onChange={() => toggleActiveMutation.mutate(u)} disabled={toggleActiveMutation.isPending} />
                      <Typography variant="caption" color={u.active ? 'success.main' : 'text.disabled'}>{u.active ? 'Actif' : 'Inactif'}</Typography>
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Inspecter"><IconButton size="small" onClick={() => setViewUser(u)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Modifier"><IconButton size="small" onClick={() => openEdit(u)} sx={{ color: 'primary.main' }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Supprimer"><IconButton size="small" color="error" onClick={() => deleteMutation.mutate(u.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && filteredUsers.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>Aucun utilisateur ne correspond aux filtres.</TableCell></TableRow>
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

      <Dialog open={open} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0D1E36', color: '#fff', fontWeight: 700 }}>
          {editUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: ROLE_AVATAR_BG[form.role], fontWeight: 700 }}>
              {getInitials(form.fullName || '?')}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {form.fullName || 'Nouvel utilisateur'}
              </Typography>
              <Chip label={ROLE_LABELS[form.role]} size="small" color={ROLE_COLORS[form.role]} variant="outlined" />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <BadgeIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.08em' }}>
              Identité
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Identifiant" required fullWidth value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Email" type="email" required fullWidth value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Nom complet" required fullWidth value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField label={editUser ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'} type="password"
                required={!editUser} fullWidth value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <AdminPanelSettingsIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.08em' }}>
              Rôle &amp; accès
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Rôle</InputLabel>
                <Select value={form.role} label="Rôle" onChange={(e) => setForm({ ...form, role: e.target.value as User['role'] })}>
                  {ROLES.map((r) => <MenuItem key={r} value={r}>{ROLE_LABELS[r]}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog}>Annuler</Button>
          <Button variant="contained" onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}>
            {editUser ? 'Enregistrer' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!viewUser} onClose={() => setViewUser(null)} maxWidth="xs" fullWidth>
        {viewUser && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 48, height: 48, bgcolor: ROLE_AVATAR_BG[viewUser.role], fontWeight: 700 }}>
                {getInitials(viewUser.fullName)}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{viewUser.fullName}</Typography>
                <Chip label={ROLE_LABELS[viewUser.role]} size="small" color={ROLE_COLORS[viewUser.role]} variant="outlined" />
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                <Box><Typography variant="caption" color="text.secondary">Identifiant</Typography><Typography fontFamily="monospace">{viewUser.username}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Email</Typography><Typography>{viewUser.email ?? '—'}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Rôle</Typography><Typography>{ROLE_LABELS[viewUser.role]}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Statut</Typography>
                  <Chip label={viewUser.active ? 'Actif' : 'Inactif'} color={viewUser.active ? 'success' : 'default'} size="small" />
                </Box>
                {viewUser.allowedCategories && (
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="caption" color="text.secondary">Catégories autorisées</Typography>
                    <Typography>{viewUser.allowedCategories}</Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setViewUser(null)}>Fermer</Button>
              <Button variant="contained" onClick={() => { const u = viewUser; setViewUser(null); openEdit(u); }}>Modifier</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
