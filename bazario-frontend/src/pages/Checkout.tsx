import { useState } from 'react';
import {
  Box, Typography, TextField, Button, Paper, Alert, CircularProgress, Divider, alpha, Chip,
} from '@mui/material';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';;
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { orderApi } from '../api/orderApi';
import toast from 'react-hot-toast';

export default function Checkout() {
  const { items, clearCart, totalPrice } = useCartStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nom: '', prenom: '', telephone: '', email: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (items.length === 0) {
    return (
      <Box sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
        <Alert severity="warning">Votre panier est vide. <Button onClick={() => navigate('/')}>Retour au catalogue</Button></Alert>
      </Box>
    );
  }

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nom.trim()) e.nom = 'Nom requis';
    if (!form.prenom.trim()) e.prenom = 'Prénom requis';
    if (!form.telephone.trim()) e.telephone = 'Téléphone requis';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Email invalide';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await orderApi.place({
        ...form,
        email: form.email.trim() || undefined,
        items: items.map((e) => ({ productId: e.product.id, quantite: e.quantite })),
      });
      clearCart();
      navigate('/checkout/succes');
    } catch {
      toast.error('Erreur lors de la commande. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => n.toLocaleString('fr-MA', { minimumFractionDigits: 2 }) + ' MAD';

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
        <ShoppingCartCheckoutIcon sx={{ color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h4">Finaliser ma commande</Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: { xs: 'wrap', lg: 'nowrap' } }}>
        {/* Form */}
        <Paper sx={{ flex: 1, minWidth: 0, p: 3.5, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <PersonIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" fontWeight={700}>Vos coordonnées</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField label="Nom" fullWidth value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
              error={!!errors.nom} helperText={errors.nom} />
            <TextField label="Prénom" fullWidth value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })}
              error={!!errors.prenom} helperText={errors.prenom} />
          </Box>
          <TextField label="Numéro de téléphone" fullWidth
            value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })}
            error={!!errors.telephone} helperText={errors.telephone} placeholder="06XXXXXXXX"
            InputProps={{ startAdornment: <PhoneIcon sx={{ color: 'text.secondary', fontSize: 18, mr: 1 }} /> }}
          />
          <TextField label="Email (optionnel)" fullWidth
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={!!errors.email} helperText={errors.email || 'Pour recevoir une confirmation par email'}
            placeholder="exemple@email.com" type="email" sx={{ mt: 2 }}
            InputProps={{ startAdornment: <EmailIcon sx={{ color: 'text.secondary', fontSize: 18, mr: 1 }} /> }}
          />

          <Box sx={{ mt: 3, p: 2, bgcolor: alpha('#25D366', 0.07), borderRadius: 2, border: '1px solid', borderColor: alpha('#25D366', 0.25), display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <WhatsAppIcon sx={{ color: '#25D366', flexShrink: 0, mt: 0.3 }} />
            <Typography variant="body2" color="text.secondary">
              Un opérateur vous contactera sur <strong>WhatsApp</strong> après confirmation de votre commande.
            </Typography>
          </Box>

          <Button variant="contained" fullWidth size="large" onClick={handleSubmit}
            disabled={loading} startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ShoppingCartCheckoutIcon />}
            sx={{ mt: 3 }}>
            Confirmer la commande
          </Button>
        </Paper>

        {/* Summary */}
        <Paper sx={{ width: { xs: '100%', lg: 300 }, flexShrink: 0, p: 3, borderRadius: 3, position: { lg: 'sticky' }, top: 80, border: '2px solid', borderColor: 'primary.light' }}>
          <Typography variant="h6" fontWeight={700} mb={2}>Récapitulatif</Typography>
          <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
            {items.map((e) => (
              <Box key={e.product.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600} sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.product.libelle}
                  </Typography>
                  <Chip label={`×${e.quantite}`} size="small" sx={{ height: 18, fontSize: '0.65rem', mt: 0.25 }} />
                </Box>
                <Typography variant="body2" fontWeight={700} color="primary.main">{fmt(e.product.prix * e.quantite)}</Typography>
              </Box>
            ))}
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Typography fontWeight={700} fontSize="1.05rem">Total</Typography>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h5" fontWeight={800} color="primary.main">
                {totalPrice().toLocaleString('fr-MA', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="caption" color="text.secondary">MAD</Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
