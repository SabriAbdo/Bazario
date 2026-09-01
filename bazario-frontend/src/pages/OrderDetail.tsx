import {
  Container, Typography, Box, Paper, Chip, Divider, Alert,
  Stepper, Step, StepLabel, StepContent,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import BuildIcon from '@mui/icons-material/Build';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { orderApi } from '@/api/orderApi';
import { formatCurrency } from '@/utils/formatCurrency';
import PageLoader from '@/components/common/PageLoader';
import type { Command, CommandStatus } from '@/types';

interface StatusMeta { label: string; color: string; icon: React.ReactNode; }

const STATUS_META: Record<CommandStatus, StatusMeta> = {
  EN_ATTENTE:     { label: 'En attente',      color: '#FF9800', icon: <HourglassEmptyIcon /> },
  CONFIRMEE:      { label: 'Confirmée',        color: '#2196F3', icon: <CheckCircleIcon /> },
  EN_PREPARATION: { label: 'En préparation',   color: '#9C27B0', icon: <BuildIcon /> },
  EXPEDIEE:       { label: 'Expédiée',         color: '#00BCD4', icon: <LocalShippingIcon /> },
  LIVREE:         { label: 'Livrée',           color: '#4CAF50', icon: <DoneAllIcon /> },
  VALIDEE:        { label: 'Validée',          color: '#4CAF50', icon: <CheckCircleIcon /> },
  REFUSEE:        { label: 'Refusée',          color: '#F44336', icon: <CancelIcon /> },
  ANNULEE:        { label: 'Annulée',          color: '#F44336', icon: <CancelIcon /> },
};

const TIMELINE_STEPS: CommandStatus[] = ['EN_ATTENTE', 'CONFIRMEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE'];

function formatDT(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);

  const { data: order, isLoading } = useQuery<Command>({
    queryKey: ['order', orderId],
    queryFn: () => orderApi.getById(orderId),
    enabled: !!orderId,
    refetchInterval: 15000, // poll every 15 s instead of WebSocket
  });

  if (isLoading) return <PageLoader />;
  if (!order) return <Alert severity="error">Commande non trouvée.</Alert>;

  const currentStatus: CommandStatus = order.status;
  const meta = STATUS_META[currentStatus] ?? STATUS_META.EN_ATTENTE;
  const isTerminal = currentStatus === 'REFUSEE' || currentStatus === 'ANNULEE';
  const activeStep = TIMELINE_STEPS.indexOf(currentStatus);
  const historyByStatus: Partial<Record<CommandStatus, string>> = {};
  (order.history ?? []).forEach((h) => { historyByStatus[h.status] = h.changedAt; });
  const total = order.items.reduce((s, i) => s + i.prixSnapshot * i.quantite, 0);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>Commande #{order.id}</Typography>

      {/* Status banner */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, border: `2px solid ${meta.color}`, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ color: meta.color, display: 'flex' }}>{meta.icon}</Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary">Statut actuel</Typography>
          <Typography fontWeight={700} sx={{ color: meta.color }}>{meta.label}</Typography>
        </Box>
        <Chip label={`Commande du ${formatDT(order.createdAt)}`} size="small" variant="outlined" />
      </Paper>

      {/* Tracking timeline */}
      {!isTerminal && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Suivi de commande</Typography>
          <Stepper activeStep={activeStep === -1 ? 0 : activeStep} orientation="vertical">
            {TIMELINE_STEPS.map((step) => {
              const sm = STATUS_META[step];
              const reached = TIMELINE_STEPS.indexOf(step) <= (activeStep === -1 ? 0 : activeStep);
              const ts = historyByStatus[step];
              return (
                <Step key={step} completed={reached && step !== currentStatus}>
                  <StepLabel
                    StepIconComponent={() => (
                      <Box sx={{
                        width: 32, height: 32, borderRadius: '50%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        bgcolor: reached ? sm.color : 'action.disabledBackground',
                        color: '#fff', '& svg': { fontSize: 18 },
                      }}>
                        {sm.icon}
                      </Box>
                    )}
                  >
                    <Typography fontWeight={reached ? 700 : 400} color={reached ? 'text.primary' : 'text.disabled'}>
                      {sm.label}
                    </Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" color="text.secondary">
                      {ts ? formatDT(ts) : step === currentStatus ? 'En cours…' : ''}
                    </Typography>
                  </StepContent>
                </Step>
              );
            })}
          </Stepper>
        </Paper>
      )}

      {isTerminal && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Cette commande a été <strong>{meta.label.toLowerCase()}</strong>.
          {historyByStatus[currentStatus] && ` Le ${formatDT(historyByStatus[currentStatus]!)}.`}
        </Alert>
      )}

      {/* Order details */}
      <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', mb: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">Client</Typography>
            <Typography fontWeight={600}>{order.prenom} {order.nom}</Typography>
          </Box>
          {order.telephone && <Box><Typography variant="body2" color="text.secondary">Téléphone</Typography><Typography fontWeight={600}>{order.telephone}</Typography></Box>}
          {order.email && <Box><Typography variant="body2" color="text.secondary">Email</Typography><Typography fontWeight={600}>{order.email}</Typography></Box>}
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>Articles</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {order.items.map((item, i) => (
            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
              <Typography>{item.libelleSnapshot}</Typography>
              <Box sx={{ display: 'flex', gap: 3, color: 'text.secondary' }}>
                <Typography>× {item.quantite}</Typography>
                <Typography>{formatCurrency(item.prixSnapshot)}</Typography>
                <Typography fontWeight={700} color="text.primary">{formatCurrency(item.prixSnapshot * item.quantite)}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Typography variant="h6" fontWeight={700}>Total : {formatCurrency(total)}</Typography>
        </Box>
      </Paper>

      {/* Status history log */}
      {(order.history ?? []).length > 0 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Historique des statuts</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[...(order.history ?? [])].reverse().map((h, i) => {
              const hm = STATUS_META[h.status] ?? STATUS_META.EN_ATTENTE;
              return (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ color: hm.color, display: 'flex', '& svg': { fontSize: 18 } }}>{hm.icon}</Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600}>{hm.label}</Typography>
                    {h.changedBy && <Typography variant="caption" color="text.secondary">par {h.changedBy}</Typography>}
                  </Box>
                  <Typography variant="caption" color="text.secondary">{formatDT(h.changedAt)}</Typography>
                </Box>
              );
            })}
          </Box>
        </Paper>
      )}


    </Container>
  );
}
