import { Container, Typography, Box, Avatar, Paper, Chip, Divider } from '@mui/material';
import { useAuthStore } from '@/store/useAuthStore';

export default function Profile() {
  const { user, token } = useAuthStore();

  if (!token || !user) return null;

  return (
    <Container maxWidth="sm">
      <Typography variant="h2" gutterBottom>Mon profil</Typography>
      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
          <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}>
            {user.fullName?.[0]?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>{user.fullName}</Typography>
            <Typography color="text.secondary" sx={{ mb: 0.5 }}>@{user.username}</Typography>
            <Chip label={user.role} color="primary" size="small" />
          </Box>
        </Box>
        <Divider sx={{ mb: 3 }} />
        <Typography color="text.secondary" variant="body2">
          La modification du profil sera disponible prochainement.
        </Typography>
      </Paper>
    </Container>
  );
}