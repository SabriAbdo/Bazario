import { Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, LinearProgress, Alert, Chip, alpha } from '@mui/material';
import ManageHistoryIcon from '@mui/icons-material/ManageHistory';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/adminApi';
import TableSkeleton from '../../components/common/TableSkeleton';

export default function AdminActivite() {
  const { data: logs, isLoading, isError } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: adminApi.getActivityLogs,
  });

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
        <Box sx={{ bgcolor: '#009530', borderRadius: 2, p: 1, display: 'flex' }}>
          <ManageHistoryIcon sx={{ fontSize: 22, color: '#fff' }} />
        </Box>
        <Box>
          <Typography variant="h4">Journal d'activité</Typography>
          <Typography variant="body2" color="text.secondary">Suivi des actions récentes</Typography>
        </Box>
      </Box>

      {isError && <Alert severity="error">Erreur de chargement.</Alert>}

      <Paper sx={{ overflow: 'hidden', position: 'relative' }}>
        {isLoading && (
          <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }} color="primary" />
        )}
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#0D1E36' }}>
              {['Utilisateur', 'Action', 'Détails', 'Date'].map((h) => (
                <TableCell key={h} sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em', py: 1.5 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? <TableSkeleton rows={5} cols={4} /> : logs?.map((log) => (
              <TableRow key={log.id} sx={{ '&:hover': { bgcolor: alpha('#009530', 0.04) } }}>
                <TableCell sx={{ fontWeight: 600 }}>{log.userFullName}</TableCell>
                <TableCell><Chip label={log.action} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} /></TableCell>
                <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'text.secondary' }}>
                  {log.details ?? '—'}
                </TableCell>
                <TableCell sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>{new Date(log.createdAt).toLocaleString('fr-FR')}</TableCell>
              </TableRow>
            ))}
            {logs?.length === 0 && !isLoading && (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>Aucune activité.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
