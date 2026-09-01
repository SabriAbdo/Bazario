import { Box, Container, Typography, Link as MuiLink, Divider } from '@mui/material';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <Box component="footer" sx={{ mt: 'auto', py: 4, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight={700} color="primary" gutterBottom>
              Bazario
            </Typography>
            <Typography variant="body2" color="text.secondary" maxWidth={260}>
              La marketplace de confiance pour acheter et vendre des produits en ligne.
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Navigation</Typography>
            {[{ label: 'Accueil', to: '/' }, { label: 'Produits', to: '/products' }, { label: 'Mon panier', to: '/cart' }].map((l) => (
              <Box key={l.to}>
                <MuiLink component={Link} to={l.to} color="text.secondary" underline="hover" variant="body2">
                  {l.label}
                </MuiLink>
              </Box>
            ))}
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Compte</Typography>
            {[{ label: 'Connexion', to: '/login' }, { label: 'Inscription', to: '/register' }, { label: 'Profil', to: '/profile' }].map((l) => (
              <Box key={l.to}>
                <MuiLink component={Link} to={l.to} color="text.secondary" underline="hover" variant="body2">
                  {l.label}
                </MuiLink>
              </Box>
            ))}
          </Box>
        </Box>
        <Divider />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
          © {new Date().getFullYear()} Bazario. Tous droits réservés.
        </Typography>
      </Container>
    </Box>
  );
}
