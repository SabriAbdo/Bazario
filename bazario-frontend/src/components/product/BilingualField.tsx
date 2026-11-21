/**
 * A text field with a small FR/AR toggle, used for product fields that are stored in both
 * languages (libellé, description). French is mandatory; Arabic is optional — when left empty,
 * the site falls back to the French value when a user switches the display language to Arabic.
 */
import { useState } from 'react';
import { Box, TextField, ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material';

interface Props {
  label: string;
  valueFr: string;
  valueAr: string;
  onChangeFr: (v: string) => void;
  onChangeAr: (v: string) => void;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  placeholderFr?: string;
  fullWidth?: boolean;
}

export default function BilingualField({
  label, valueFr, valueAr, onChangeFr, onChangeAr,
  required, multiline, rows, placeholderFr, fullWidth = true,
}: Props) {
  const [lang, setLang] = useState<'fr' | 'ar'>('fr');
  const isAr = lang === 'ar';

  return (
    <Box sx={{ width: fullWidth ? '100%' : undefined }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
        <ToggleButtonGroup size="small" exclusive value={lang}
          onChange={(_e, v) => v && setLang(v)}
          sx={{ '& .MuiToggleButton-root': { px: 1.2, py: 0.15, fontSize: '0.68rem', fontWeight: 700 } }}>
          <ToggleButton value="fr">FR</ToggleButton>
          <Tooltip title={valueAr.trim() ? '' : "Optionnel — si vide, le français s'affichera en arabe aussi"}>
            <ToggleButton value="ar">AR{valueAr.trim() ? ' ●' : ''}</ToggleButton>
          </Tooltip>
        </ToggleButtonGroup>
      </Box>
      {isAr ? (
        <TextField
          key="ar" label={`${label} (Arabe — optionnel)`} fullWidth={fullWidth}
          multiline={multiline} rows={rows} value={valueAr}
          onChange={(e) => onChangeAr(e.target.value)}
          placeholder="سيُستخدم النص الفرنسي إذا تُرك فارغًا"
          inputProps={{ dir: 'rtl', style: { textAlign: 'right' } }}
        />
      ) : (
        <TextField
          key="fr" label={label} required={required} fullWidth={fullWidth}
          multiline={multiline} rows={rows} value={valueFr}
          onChange={(e) => onChangeFr(e.target.value)}
          placeholder={placeholderFr}
        />
      )}
    </Box>
  );
}
