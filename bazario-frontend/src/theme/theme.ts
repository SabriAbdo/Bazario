import { createTheme, ThemeOptions } from '@mui/material/styles';

const getThemeOptions = (mode: 'light' | 'dark'): ThemeOptions => ({
  palette: {
    mode,
    // Warm coral-orange — high energy, strong CTAs, clear on white (4.6:1 on #FFF7F4)
    primary:   { main: '#E8521A', light: '#F0723D', dark: '#B33E12', contrastText: '#FFFFFF' },
    // Slightly warmer indigo — distinguishable from text, still trustworthy
    secondary: { main: '#3730A3', light: '#6366F1', dark: '#1E1B7B', contrastText: '#FFFFFF' },
    // Grounded green — confident, not neon
    success:   { main: '#16A34A', light: '#22C55E', dark: '#15803D' },
    warning:   { main: '#D97706', light: '#F59E0B', dark: '#B45309' },
    error:     { main: '#DC2626', light: '#EF4444', dark: '#B91C1C' },
    background: {
      default: mode === 'light' ? '#FFF7F4' : '#0F0F1A',
      paper:   mode === 'light' ? '#FFFFFF' : '#1A1A2E',
    },
    text: {
      primary:   mode === 'light' ? '#1C1917' : '#F5F5F4',
      secondary: mode === 'light' ? '#6B7280' : '#9CA3AF',
    },
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 700 },
    h2: { fontSize: '1.75rem', fontWeight: 600 },
    body1: { fontSize: '0.9375rem' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'scale(1.015)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.14)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
  },
});

export const createAppTheme = (mode: 'light' | 'dark') =>
  createTheme(getThemeOptions(mode));
