import { useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, InputLabel, FormControl, LinearProgress, Alert, Tooltip, alpha,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, type CreateUserRequest } from '../../api/adminApi';
import type { User } from '../../types';
import toast from 'react-hot-toast';
import TableSkeleton from '../../components/common/TableSkeleton';

const ROLES: User['role'][] = ['ADMIN', 'OPERATEUR', 'STOCK_OPERATEUR'];
const ROLE_LABELS: Record<User['role'], string> = {
  ADMIN: 'Administrateur',
  OPERATEUR: 'Opérateur',
  STOCK_OPERATEUR: 'Stock-Opérateur',
};
const ROLE_COLORS: Record<User['role'], 'error' | 'info' | 'secondary'> = {
  ADMIN: 'error',
  OPERATEUR: 'info',
  STOCK_OPERATEUR: 'secondary',
};

export default function AdminUtilisateurs() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState<CreateUserRequest>({ username: '', password: '', fullName: '', role: 'OPERATEUR' });

  const { data: users, isLoading, isError } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.getUsers(),
  });

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

  const openCreate = () => {
    setEditUser(null);
    setForm({ username: '', password: '', fullName: '', role: 'OPERATEUR' });
    setOpen(true);
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({ username: u.username, password: '', fullName: u.fullName, role: u.role });
    setOpen(true);
  };

  const closeDialog = () => { setOpen(false); setEditUser(null); };

  const handleSubmit = () => {
    if (editUser) {
      updateMutation.mutate({ id: editUser.id, data: { fullName: form.fullName, role: form.role } });
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
            <Typography variant="body2" color="text.secondary">{users?.length ?? 0} compte{(users?.length ?? 0) > 1 ? 's' : ''} enregistré{(users?.length ?? 0) > 1 ? 's' : ''}</Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Nouvel utilisateur</Button>
      </Box>

      {isError && <Alert severity="error">Erreur de chargement.</Alert>}

      <Paper sx={{ overflow: 'hidden', position: 'relative' }}>
        {(isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending) && (
          <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }} color="primary" />
        )}
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#0D1E36' }}>
              {['Nom complet', 'Identifiant', 'Rôle', 'Statut', 'Actions'].map((h, i) => (
                <TableCell key={h} align={i === 4 ? 'center' : 'left'}
                  sx={{ color: '#fff', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.06em', py: 1.5 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? <TableSkeleton rows={4} cols={5} /> : users?.map((u) => (
              <TableRow key={u.id} sx={{ '&:hover': { bgcolor: alpha('#009530', 0.04) } }}>
                <TableCell sx={{ fontWeight: 600 }}>{u.fullName}</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{u.username}</TableCell>
                <TableCell><Chip label={ROLE_LABELS[u.role]} size="small" color={ROLE_COLORS[u.role]} variant="outlined" /></TableCell>
                <TableCell><Chip label={u.active ? 'Actif' : 'Inactif'} color={u.active ? 'success' : 'default'} size="small" /></TableCell>
                <TableCell align="center">
                  <Tooltip title="Modifier"><IconButton size="small" onClick={() => openEdit(u)} sx={{ color: 'primary.main' }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Supprimer"><IconButton size="small" color="error" onClick={() => deleteMutation.mutate(u.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0D1E36', color: '#fff', fontWeight: 700 }}>
          {editUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
          {!editUser && (
            <TextField label="Identifiant" required fullWidth value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })} />
          )}
          <TextField label="Nom complet" required fullWidth value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          {!editUser && (
            <TextField label="Mot de passe" type="password" required fullWidth value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          )}
          <FormControl fullWidth>
            <InputLabel>Rôle</InputLabel>
            <Select value={form.role} label="Rôle" onChange={(e) => setForm({ ...form, role: e.target.value as User['role'] })}>
              {ROLES.map((r) => <MenuItem key={r} value={r}>{ROLE_LABELS[r]}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog}>Annuler</Button>
          <Button variant="contained" onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}>
            {editUser ? 'Enregistrer' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
