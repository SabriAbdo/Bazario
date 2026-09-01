import { Box, Typography, Paper, Button, alpha } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import BoltIcon from '@mui/icons-material/Bolt';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate } from 'react-router-dom';

export default function CheckoutSucces() {
  const navigate = useNavigate();
  return (
    <Box sx={{
      minHeight: 'calc(100vh - 200px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #F4F6F8 0%, #e8f5ec 100%)',
      px: 2, py: 4,
    }}>
      <Paper sx={{ p: { xs: 4, md: 6 }, textAlign: 'center', maxWidth: 520, borderRadius: 3,
        boxShadow: '0 16px 48px rgba(0,149,48,0.15)', border: '2px solid', borderColor: 'success.light' }}>
        <Box sx={{
          display: 'inline-flex', bgcolor: alpha('#27AE60', 0.12), borderRadius: '50%',
          p: 2.5, mb: 3,
        }}>
          <CheckCircleIcon sx={{ fontSize: 56, color: 'success.main' }} />
        </Box>
        <Typography variant="h3" sx={{ color: '#0D1E36', mb: 1 }}>Commande envoyée !</Typography>
        <Typography color="text.secondary" mb={1} sx={{ fontSize: '1.05rem' }}>
          Votre commande a bien été enregistrée.
        </Typography>
        <Box sx={{ bgcolor: alpha('#27AE60', 0.07), borderRadius: 2, p: 2.5, mb: 4, display: 'flex', alignItems: 'flex-start', gap: 1.5, textAlign: 'left' }}>
          <WhatsAppIcon sx={{ color: '#25D366', mt: 0.3, flexShrink: 0 }} />
          <Typography variant="body2" color="text.secondary">
            Un opérateur vous contactera bientôt sur <strong>WhatsApp</strong> pour confirmer votre commande et préparer votre retrait.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="contained" size="large" startIcon={<HomeIcon />} onClick={() => navigate('/')}>
            Retour au catalogue
          </Button>
          <Button variant="outlined" size="large" startIcon={<BoltIcon />} onClick={() => navigate('/')} color="primary">
            Nouvelle commande
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
