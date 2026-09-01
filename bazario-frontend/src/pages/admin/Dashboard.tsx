import {
  Box, Grid, Paper, Typography, Skeleton, Alert, alpha, Button,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import BoltIcon from '@mui/icons-material/Bolt';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import BlockIcon from '@mui/icons-material/Block';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/adminApi';
import { useNavigate } from 'react-router-dom';

interface StatCardProps { label: string; value: number; icon: React.ReactNode; color: string; onClick?: () => void; badge?: string; }

function StatCard({ label, value, icon, color, onClick, badge }: StatCardProps) {
  return (
    <Paper onClick={onClick} sx={{
      p: 3, position: 'relative', overflow: 'hidden',
      border: `1px solid ${alpha(color, 0.25)}`,
      cursor: onClick ? 'pointer' : 'default',
      '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: `0 8px 24px ${alpha(color, 0.2)}` } : undefined,
      transition: 'all 0.2s ease',
    }}>
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, bgcolor: color }} />
      <Box sx={{ position: 'absolute', right: -8, bottom: -8, color: alpha(color, 0.08), '& svg': { fontSize: 80 } }}>{icon}</Box>
      {badge && (
        <Box sx={{ position: 'absolute', top: 12, right: 12, bgcolor: color, color: '#fff', borderRadius: 10, px: 1, py: 0.2, fontSize: '0.68rem', fontWeight: 700 }}>
          {badge}
        </Box>
      )}
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ bgcolor: alpha(color, 0.12), borderRadius: 2, p: 1, display: 'inline-flex', color, mb: 2 }}>
          {icon}
        </Box>
        <Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1, mb: 0.5 }}>{value}</Typography>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>{label}</Typography>
      </Box>
    </Paper>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.getStats,
  });

  if (isLoading) return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4, pb: 3, borderBottom: '2px solid', borderColor: alpha('#009530', 0.2) }}>
        <Skeleton variant="rectangular" width={38} height={38} sx={{ borderRadius: 2 }} />
        <Box><Skeleton variant="text" width={180} height={32} /><Skeleton variant="text" width={120} height={20} /></Box>
      </Box>
      <Grid container spacing={3}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Paper sx={{ p: 3, position: 'relative', overflow: 'hidden' }}>
              <Skeleton variant="rectangular" height={4} sx={{ position: 'absolute', top: 0, left: 0, right: 0, transform: 'none' }} />
              <Skeleton variant="rectangular" width={42} height={42} sx={{ borderRadius: 2, mb: 2, mt: 0.5 }} />
              <Skeleton variant="text" width="40%" height={48} />
              <Skeleton variant="text" width="60%" height={20} />
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
  if (isError || !stats) return <Alert severity="error" sx={{ m: 4 }}>Erreur de chargement.</Alert>;

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4,
        pb: 3, borderBottom: '2px solid', borderColor: alpha('#009530', 0.2),
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ bgcolor: '#009530', borderRadius: 2, p: 1, display: 'flex' }}>
            <BoltIcon sx={{ fontSize: 22, color: '#fff' }} />
          </Box>
          <Box>
            <Typography variant="h4">Tableau de bord</Typography>
            <Typography variant="body2" color="text.secondary">Vue d'ensemble de l'activit�</Typography>
          </Box>
        </Box>
        {stats.pendingApprovalProducts > 0 && (
          <Button
            variant="contained"
            color="warning"
            startIcon={<PendingActionsIcon />}
            onClick={() => navigate('/admin/produits')}
            sx={{ fontWeight: 700 }}
          >
            {stats.pendingApprovalProducts} produit{stats.pendingApprovalProducts > 1 ? 's' : ''} en attente
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Utilisateurs actifs" value={stats.totalUsers} icon={<PeopleIcon />} color="#009530"
            onClick={() => navigate('/admin/utilisateurs')} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Utilisateurs bannis" value={stats.bannedUsers} icon={<BlockIcon />} color="#C62828"
            onClick={() => navigate('/admin/utilisateurs')} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Produits en catalogue" value={stats.totalProducts} icon={<InventoryIcon />} color="#1565C0"
            onClick={() => navigate('/admin/produits')} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Produits en attente d'approbation" value={stats.pendingApprovalProducts}
            icon={<PendingActionsIcon />} color="#F57C00"
            onClick={() => navigate('/admin/produits')}
            badge={stats.pendingApprovalProducts > 0 ? 'Action requise' : undefined}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Commandes totales" value={stats.totalCommands} icon={<ShoppingBagIcon />} color="#0D1E36"
            onClick={() => navigate('/admin/commandes')} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="En attente de traitement" value={stats.commandsEnAttente} icon={<HourglassEmptyIcon />} color="#FF6B35"
            onClick={() => navigate('/admin/commandes')} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Commandes valid�es" value={stats.commandsValidees} icon={<CheckCircleIcon />} color="#2E7D32" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Commandes refus�es" value={stats.commandsRefusees} icon={<CancelIcon />} color="#C62828" />
        </Grid>
      </Grid>
    </Box>
  );
}
