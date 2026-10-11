import {
  Box, Grid, Paper, Typography, Skeleton, Alert, alpha, Button, Stack, Chip, ToggleButtonGroup, ToggleButton,
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
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PaidIcon from '@mui/icons-material/Paid';
import LocalMallIcon from '@mui/icons-material/LocalMall';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DownloadIcon from '@mui/icons-material/Download';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';
import { useQuery, useMutation } from '@tanstack/react-query';
import { adminApi } from '../../api/adminApi';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatCurrency';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface StatCardProps { label: string; value: number | string; icon: React.ReactNode; color: string; onClick?: () => void; badge?: string; }

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

function ChartCard({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>{title}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
        {action}
      </Box>
      {children}
    </Paper>
  );
}

type Period = 'DAY' | 'WEEK' | 'MONTH';

const PERIOD_LABELS: Record<Period, string> = { DAY: 'Jour', WEEK: 'Semaine', MONTH: 'Mois' };
const PERIOD_SUBTITLES: Record<Period, string> = {
  DAY: '30 derniers jours',
  WEEK: '12 dernières semaines',
  MONTH: '12 derniers mois',
};

const STATUS_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  CONFIRMEE: 'Confirmée',
  EN_PREPARATION: 'En préparation',
  EXPEDIEE: 'Expédiée',
  EN_ROUTE: 'En route',
  LIVREE: 'Livrée',
  RETOURNEE: 'Retournée',
  VALIDEE: 'Validée',
  REFUSEE: 'Refusée',
  ANNULEE: 'Annulée',
};

const STATUS_COLORS: Record<string, string> = {
  EN_ATTENTE: '#FF6B35',
  CONFIRMEE: '#1565C0',
  EN_PREPARATION: '#7B1FA2',
  EXPEDIEE: '#0288D1',
  EN_ROUTE: '#00838F',
  LIVREE: '#2E7D32',
  RETOURNEE: '#EF6C00',
  VALIDEE: '#009530',
  REFUSEE: '#C62828',
  ANNULEE: '#616161',
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  OPERATEUR: 'Opérateur',
  STOCK_OPERATEUR: 'Opérateur stock',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#0D1E36',
  OPERATEUR: '#009530',
  STOCK_OPERATEUR: '#1565C0',
};

const CATEGORY_PALETTE = ['#009530', '#FF6B35', '#1565C0', '#7B1FA2', '#F57C00', '#00838F'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [period, setPeriod] = useState<Period>('DAY');
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.getStats,
  });
  const { data: advanced, isLoading: isLoadingAdvanced } = useQuery({
    queryKey: ['admin-stats-advanced', period],
    queryFn: () => adminApi.getAdvancedStats(period),
  });

  const exportMutation = useMutation({
    mutationFn: adminApi.exportExcel,
    onMutate: () => setIsExporting(true),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bazario-rapport-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Rapport Excel téléchargé.');
    },
    onError: () => toast.error("Échec du téléchargement du rapport."),
    onSettled: () => setIsExporting(false),
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

  const statusData = (advanced?.ordersByStatus ?? []).map((s) => ({
    name: STATUS_LABELS[s.status] ?? s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] ?? '#999',
  }));

  const roleData = (advanced?.usersByRole ?? []).filter((r) => r.count > 0).map((r) => ({
    name: ROLE_LABELS[r.role] ?? r.role,
    value: r.count,
    color: ROLE_COLORS[r.role] ?? '#999',
  }));

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
            <Typography variant="body2" color="text.secondary">Vue d'ensemble de l'activité</Typography>
          </Box>
        </Box>
        <Stack direction="row" gap={1.5} alignItems="center">
          <Button
            variant="outlined"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={() => exportMutation.mutate()}
            disabled={isExporting}
            sx={{ fontWeight: 700 }}
          >
            {isExporting ? 'Génération…' : 'Télécharger Excel'}
          </Button>
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
        </Stack>
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
          <StatCard label="Commandes validées" value={stats.commandsValidees} icon={<CheckCircleIcon />} color="#2E7D32" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Commandes refusées" value={stats.commandsRefusees} icon={<CancelIcon />} color="#C62828" />
        </Grid>
      </Grid>

      {/* ─── Advanced statistics ────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 4 }}>
        <TrendingUpIcon sx={{ color: '#009530' }} />
        <Typography variant="h5" fontWeight={700}>Statistiques avancées</Typography>
      </Box>

      {isLoadingAdvanced || !advanced ? (
        <Grid container spacing={3}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Grid item xs={12} md={4} key={i}>
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          {/* Secondary KPIs derived from time-series data */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard label="Commandes (7 derniers jours)" value={advanced.ordersLast7Days} icon={<LocalMallIcon />} color="#7B1FA2" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard label="Commandes (30 derniers jours)" value={advanced.ordersLast30Days} icon={<ShoppingBagIcon />} color="#00838F" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard label="Revenu (30 derniers jours)" value={formatCurrency(advanced.revenueLast30Days)} icon={<PaidIcon />} color="#009530" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard label="Taux de validation" value={`${(advanced.approvalRate ?? 0).toFixed(0)}%`} icon={<ThumbUpAltIcon />} color="#1565C0" />
            </Grid>
          </Grid>

          {/* Deep-dive KPIs */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard label="Revenu total (historique)" value={formatCurrency(advanced.totalRevenueAllTime ?? 0)} icon={<AccountBalanceWalletIcon />} color="#0D1E36" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard label="Articles / commande (moy.)" value={(advanced.avgItemsPerOrder ?? 0).toFixed(1)} icon={<LocalMallIcon />} color="#7B1FA2" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard label="Vendeurs actifs" value={advanced.activeSellers ?? 0} icon={<StorefrontIcon />} color="#1565C0" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                label="Variantes en stock critique" value={advanced.lowStockVariants ?? 0}
                icon={<WarningAmberIcon />} color="#F57C00"
                onClick={() => navigate('/admin/produits')}
                badge={(advanced.lowStockVariants ?? 0) > 0 ? 'Stock < 5' : undefined}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Revenue & orders trend */}
            <Grid item xs={12} md={8}>
              <ChartCard
                title="Revenu & commandes"
                subtitle={`${PERIOD_SUBTITLES[period]} · Panier moyen : ${formatCurrency(advanced.avgOrderValue)}`}
                action={
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={period}
                    onChange={(_, value: Period | null) => value && setPeriod(value)}
                  >
                    {(['DAY', 'WEEK', 'MONTH'] as Period[]).map((p) => (
                      <ToggleButton key={p} value={p} sx={{ textTransform: 'none', fontWeight: 600, px: 1.5 }}>
                        {PERIOD_LABELS[p]}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                }
              >
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={advanced.revenueSeries} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#009530" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#009530" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha('#0D1E36', 0.08)} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={period === 'DAY' ? 2 : 0} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} width={70} tickFormatter={(v) => formatCurrency(v)} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} width={30} allowDecimals={false} />
                    <ReTooltip
                      formatter={(value: number, name: string) => name === 'revenue' ? [formatCurrency(value), 'Revenu'] : [value, 'Commandes']}
                      labelFormatter={(label) => `Date : ${label}`}
                    />
                    <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#009530" strokeWidth={2} fill="url(#revenueGradient)" name="revenue" />
                    <Area yAxisId="right" type="monotone" dataKey="orders" stroke="#FF6B35" strokeWidth={2} fillOpacity={0} name="orders" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>

            {/* Orders by status */}
            <Grid item xs={12} md={4}>
              <ChartCard title="Commandes par statut" subtitle="Répartition actuelle">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                      {statusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <ReTooltip formatter={(value: number, name: string) => [value, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <Stack direction="row" flexWrap="wrap" gap={0.75} justifyContent="center" sx={{ mt: 1 }}>
                  {statusData.map((s) => (
                    <Chip key={s.name} size="small" label={`${s.name} · ${s.value}`}
                      sx={{ bgcolor: alpha(s.color, 0.12), color: s.color, fontWeight: 600, fontSize: '0.7rem' }} />
                  ))}
                </Stack>
              </ChartCard>
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Top products */}
            <Grid item xs={12} md={5}>
              <ChartCard title="Meilleures ventes" subtitle="Top 5 produits par quantité vendue">
                {advanced.topProducts.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>Aucune vente enregistrée.</Typography>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={advanced.topProducts} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={alpha('#0D1E36', 0.08)} />
                      <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={110}
                        tickFormatter={(v: string) => (v.length > 16 ? `${v.slice(0, 16)}…` : v)} />
                      <ReTooltip formatter={(value: number, name: string) => (name === 'revenue' ? [formatCurrency(value), 'Revenu'] : [value, 'Qté vendue'])} />
                      <Bar dataKey="quantitySold" name="quantitySold" fill="#009530" radius={[0, 6, 6, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </Grid>

            {/* Top categories */}
            <Grid item xs={12} md={4}>
              <ChartCard title="Ventes par catégorie" subtitle="Répartition du revenu">
                {advanced.topCategories.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>Aucune donnée disponible.</Typography>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={advanced.topCategories} dataKey="revenue" nameKey="label" outerRadius={80} paddingAngle={2}>
                          {advanced.topCategories.map((entry, i) => (
                            <Cell key={entry.label} fill={CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]} />
                          ))}
                        </Pie>
                        <ReTooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <Stack direction="row" flexWrap="wrap" gap={0.75} justifyContent="center" sx={{ mt: 1 }}>
                      {advanced.topCategories.map((c, i) => (
                        <Chip key={c.label} size="small" label={c.label}
                          sx={{
                            bgcolor: alpha(CATEGORY_PALETTE[i % CATEGORY_PALETTE.length], 0.12),
                            color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length], fontWeight: 600, fontSize: '0.7rem',
                          }} />
                      ))}
                    </Stack>
                  </>
                )}
              </ChartCard>
            </Grid>

            {/* Users by role */}
            <Grid item xs={12} md={3}>
              <ChartCard title="Utilisateurs par rôle">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={roleData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                      {roleData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <ReTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <Stack gap={0.5} sx={{ mt: 1 }}>
                  {roleData.map((r) => (
                    <Stack key={r.name} direction="row" alignItems="center" justifyContent="space-between">
                      <Stack direction="row" alignItems="center" gap={0.75}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: r.color }} />
                        <Typography variant="caption">{r.name}</Typography>
                      </Stack>
                      <Typography variant="caption" fontWeight={700}>{r.value}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </ChartCard>
            </Grid>
          </Grid>

          {/* User growth */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <ChartCard title="Croissance des utilisateurs" subtitle="Nouvelles inscriptions par mois (6 derniers mois)">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={advanced.userGrowth} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha('#0D1E36', 0.08)} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={30} />
                    <ReTooltip formatter={(value: number) => [value, 'Nouveaux utilisateurs']} />
                    <Legend />
                    <Bar dataKey="count" name="Nouveaux utilisateurs" fill="#1565C0" radius={[6, 6, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>
          </Grid>

          {/* Top customers */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <ChartCard title="Meilleurs clients" subtitle="Top 5 par montant total dépensé">
                {(advanced.topCustomers ?? []).length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>Aucune donnée disponible.</Typography>
                ) : (
                  <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: alpha('#0D1E36', 0.08) }} />} gap={1.25}>
                    {(advanced.topCustomers ?? []).map((c, i) => (
                      <Stack key={c.customerId} direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 0.5 }}>
                        <Stack direction="row" alignItems="center" gap={1.5}>
                          <Box sx={{
                            width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            bgcolor: alpha('#009530', 0.12), color: '#009530', fontWeight: 700, fontSize: '0.8rem',
                          }}>
                            {i === 0 ? <EmojiEventsIcon sx={{ fontSize: 18 }} /> : `#${i + 1}`}
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight={700}>{c.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{c.orderCount} commande{c.orderCount > 1 ? 's' : ''}</Typography>
                          </Box>
                        </Stack>
                        <Typography variant="body2" fontWeight={700} color="#009530">{formatCurrency(c.totalSpent)}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </ChartCard>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
