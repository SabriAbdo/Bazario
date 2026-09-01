import { useState } from 'react';
import {
  Fab, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Typography, Box, CircularProgress,
  Alert, Tooltip,
} from '@mui/material';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import { useMutation } from '@tanstack/react-query';
import { orderApi } from '../api/orderApi';
import { useAuthStore } from '../store/useAuthStore';

interface FormState {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
}

const empty: FormState = { nom: '', prenom: '', telephone: '', email: '' };

export default function ContactExpertButton() {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      orderApi.demandeInfo({
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        telephone: form.telephone.trim(),
        email: form.email.trim() || undefined,
      }),
    onSuccess: () => setSuccess(true),
  });

  const validate = (): boolean => {
    const e: Partial<FormState> = {};
    if (!form.nom.trim()) e.nom = 'Champ requis';
    if (!form.prenom.trim()) e.prenom = 'Champ requis';
    if (!form.telephone.trim()) {
      e.telephone = 'Champ requis';
    } else if (!/^[+0-9 \-]{6,20}$/.test(form.telephone.trim())) {
      e.telephone = 'Numéro invalide';
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      e.email = 'Email invalide';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) mutation.mutate();
  };

  const handleClose = () => {
    if (mutation.isPending) return;
    setOpen(false);
    setTimeout(() => {
      setForm(empty);
      setErrors({});
      setSuccess(false);
      mutation.reset();
    }, 300);
  };

  const change = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  if (user) return null;

  return (
    <>
      <Tooltip title="Contacter un expert" placement="left">
        <Fab
          color="primary"
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            zIndex: 1300,
            boxShadow: 6,
          }}
        >
          <HeadsetMicIcon />
        </Fab>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 0, pr: 6 }}>
          <Typography variant="h6" fontWeight={700}>Contacter un expert</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Laissez vos coordonnées, un opérateur vous contactera rapidement.
          </Typography>
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{ position: 'absolute', top: 12, right: 12 }}
            disabled={mutation.isPending}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {success ? (
            <Box py={2} textAlign="center">
              <Alert severity="success" sx={{ mb: 1 }}>
                Votre demande a bien été envoyée !
              </Alert>
              <Typography variant="body2" color="text.secondary">
                Un opérateur vous contactera dans les plus brefs délais.
              </Typography>
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              {mutation.isError && (
                <Alert severity="error">Une erreur est survenue. Veuillez réessayer.</Alert>
              )}
              <Box display="flex" gap={1.5}>
                <TextField
                  label="Nom"
                  value={form.nom}
                  onChange={change('nom')}
                  error={!!errors.nom}
                  helperText={errors.nom}
                  size="small"
                  fullWidth
                  required
                />
                <TextField
                  label="Prénom"
                  value={form.prenom}
                  onChange={change('prenom')}
                  error={!!errors.prenom}
                  helperText={errors.prenom}
                  size="small"
                  fullWidth
                  required
                />
              </Box>
              <TextField
                label="Téléphone"
                value={form.telephone}
                onChange={change('telephone')}
                error={!!errors.telephone}
                helperText={errors.telephone}
                size="small"
                fullWidth
                required
                placeholder="Ex: 0555 123 456"
              />
              <TextField
                label="Email (optionnel)"
                value={form.email}
                onChange={change('email')}
                error={!!errors.email}
                helperText={errors.email}
                size="small"
                fullWidth
                type="email"
                placeholder="exemple@email.com"
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          {success ? (
            <Button onClick={handleClose} variant="contained" fullWidth>
              Fermer
            </Button>
          ) : (
            <>
              <Button onClick={handleClose} disabled={mutation.isPending} color="inherit">
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                variant="contained"
                disabled={mutation.isPending}
                startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {mutation.isPending ? 'Envoi...' : 'Envoyer'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
