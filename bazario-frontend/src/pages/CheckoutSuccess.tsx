import { Container, Box, Typography, Button } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  return (
    <Container maxWidth="xs" sx={{ py: 10, textAlign: 'center' }}>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
        <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
      </motion.div>
      <Typography variant="h2" gutterBottom>Commande confirmée !</Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Merci pour votre commande. Vous pouvez suivre son état dans vos commandes.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button variant="contained" onClick={() => navigate('/orders')}>Mes commandes</Button>
        <Button variant="outlined" onClick={() => navigate('/products')}>Continuer les achats</Button>
      </Box>
    </Container>
  );
}
