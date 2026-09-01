import { Container, Typography, Box, Paper, Chip, TextField, InputAdornment } from '@mui/material';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderApi } from '@/api/orderApi';
import { Link } from 'react-router-dom';
import PageLoader from '@/components/common/PageLoader';
import { Command, CommandStatus } from '@/types';
import { Search } from '@mui/icons-material';

const STATUS_COLOR: Record<CommandStatus, 'default' | 'warning' | 'info' | 'success' | 'error' | 'primary'> = {
  EN_ATTENTE:     'warning',
  CONFIRMEE:      'info',
  EN_PREPARATION: 'primary',
  EXPEDIEE:       'info',
  LIVREE:         'success',
  VALIDEE:        'success',
  REFUSEE:        'error',
  ANNULEE:        'error',
};

const STATUS_LABEL: Record<CommandStatus, string> = {
  EN_ATTENTE:     'En attente',
  CONFIRMEE:      'Confirmée',
  EN_PREPARATION: 'En préparation',
  EXPEDIEE:       'Expédiée',
  LIVREE:         'Livrée',
  VALIDEE:        'Validée',
  REFUSEE:        'Refusée',
  ANNULEE:        'Annulée',
};

export default function Orders() {
  const [q, setQ] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'all'],
    queryFn: () => orderApi.getAll(),
  });

  if (isLoading) return <PageLoader />;

  const commands: Command[] = data?.content ?? [];
  const filtered = q.trim()
    ? commands.filter((c) =>
        c.id.toString().includes(q) ||
        c.nom.toLowerCase().includes(q.toLowerCase()) ||
        c.telephone.includes(q),
      )
    : commands;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h2" gutterBottom>Commandes</Typography>
      <TextField
        placeholder="Chercher par numéro, nom ou téléphone..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        size="small"
        sx={{ mb: 3, maxWidth: 380 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
      />
      {!filtered.length ? (
        <Typography color="text.secondary">Aucune commande trouvée.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map((order: Command) => (
            <Paper
              key={order.id}
              component={Link}
              to={`/orders/${order.id}`}
              sx={{
                p: 3,
                borderRadius: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit',
                '&:hover': { boxShadow: 4 },
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box>
                <Typography fontWeight={700}>Commande #{order.id}</Typography>
                <Typography variant="body2" color="text.secondary">{order.nom} {order.prenom}</Typography>
                <Typography variant="body2" color="text.secondary">{order.items.length} article(s)</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Chip
                  label={STATUS_LABEL[order.status] ?? order.status}
                  color={STATUS_COLOR[order.status] ?? 'default'}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Container>
  );
}
