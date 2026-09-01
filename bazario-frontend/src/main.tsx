import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, CssBaseline, Box, Typography, Button } from '@mui/material';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { useTranslation } from 'react-i18next';
import { createTheme } from '@mui/material/styles';
import App from './App';
import './i18n';

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <Box sx={{ p: 4, fontFamily: 'monospace' }}>
          <Typography variant="h5" color="error" gutterBottom>Erreur de rendu</Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', bgcolor: '#fee', p: 2, borderRadius: 1, mb: 2 }}>
            {err.message}{'\n\n'}{err.stack}
          </Typography>
          <Button variant="outlined" onClick={() => window.location.reload()}>Recharger</Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
// ─────────────────────────────────────────────────────────────────────────────

const ltrCache = createCache({ key: 'css' });
const rtlCache = createCache({ key: 'cssrtl', stylisPlugins: [prefixer, rtlPlugin] });

function buildTheme(mode: 'light' | 'dark', direction: 'ltr' | 'rtl') {
  return createTheme({
    direction,
    palette: {
      mode,
      primary: { main: '#FF6B35', light: '#FF8C5A', dark: '#C84E1C' },
      secondary: { main: '#1A237E', light: '#3949AB', dark: '#0D1642' },
      success: { main: '#2ECC71' },
      warning: { main: '#F39C12' },
      error: { main: '#E74C3C' },
      background: {
        default: mode === 'light' ? '#F8F9FE' : '#0F0F1A',
        paper: mode === 'light' ? '#FFFFFF' : '#1A1A2E',
      },
      text: {
        primary: mode === 'light' ? '#1A1A2E' : '#F0F0FF',
        secondary: mode === 'light' ? '#6B7280' : '#9CA3AF',
      },
    },
    typography: {
      fontFamily:
        direction === 'rtl'
          ? '"Cairo", "Segoe UI", sans-serif'
          : '"Inter", sans-serif',
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
          root: { borderRadius: 10, textTransform: 'none', fontWeight: 600 },
        },
      },
      MuiChip: {
        styleOverrides: { root: { borderRadius: 8 } },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
          },
        },
      },
    },
  });
}

function ThemedApp() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const direction = isRtl ? 'rtl' : 'ltr';

  React.useLayoutEffect(() => {
    document.dir = direction;
    document.documentElement.lang = i18n.language;
  }, [direction, i18n.language]);

  const [colorMode, setColorMode] = React.useState<'light' | 'dark'>(() => {
    try {
      const stored = localStorage.getItem('bazario-theme');
      return stored === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  (window as unknown as Record<string, unknown>).__bazarioToggleTheme = () =>
    setColorMode((m) => {
      const next = m === 'light' ? 'dark' : 'light';
      localStorage.setItem('bazario-theme', next);
      return next;
    });

  const theme = buildTheme(colorMode, direction);
  const cache = isRtl ? rtlCache : ltrCache;

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </CacheProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemedApp />
    </ErrorBoundary>
  </React.StrictMode>,
);