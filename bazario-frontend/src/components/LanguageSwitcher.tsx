import { useState } from 'react';
import { Button, Menu, MenuItem, ListItemIcon, Typography, Box } from '@mui/material';
import { Language } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { SupportedLang } from '@/i18n';

const LANGS: { code: SupportedLang; label: string; flag: string }[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇩🇿' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const current = LANGS.find((l) => l.code === i18n.language) ?? LANGS[0];

  const handleSelect = (code: SupportedLang) => {
    i18n.changeLanguage(code);
    setAnchor(null);
  };

  return (
    <>
      <Button
        size="small"
        onClick={(e) => setAnchor(e.currentTarget)}
        startIcon={<Language fontSize="small" />}
        sx={{
          minWidth: 'auto', px: 1.2, py: 0.5,
          fontWeight: 600, fontSize: '0.78rem',
          color: 'rgba(255,255,255,0.75)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 1.5,
          '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' },
          textTransform: 'none',
        }}
      >
        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
          {current.flag}&nbsp;{current.code.toUpperCase()}
        </Box>
        <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
          {current.flag}
        </Box>
      </Button>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        PaperProps={{
          sx: {
            minWidth: 150,
            bgcolor: '#0F1C2E',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          },
        }}
      >
        {LANGS.map((l) => (
          <MenuItem
            key={l.code}
            selected={l.code === i18n.language}
            onClick={() => handleSelect(l.code)}
            sx={{
              gap: 1,
              color: l.code === i18n.language ? '#E8521A' : 'rgba(255,255,255,0.8)',
              '&.Mui-selected': { bgcolor: 'rgba(232,82,26,0.12)' },
              '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 'auto' }}>
              <Typography>{l.flag}</Typography>
            </ListItemIcon>
            <Typography variant="body2" fontWeight={l.code === i18n.language ? 700 : 400}>
              {l.label}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
