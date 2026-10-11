import { useState, useCallback, useEffect } from 'react';
import Cropper, { Area, MediaSize, Point } from 'react-easy-crop';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Slider, Typography, IconButton,
  ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import { getCroppedImageFile, getCroppedPreviewUrl } from '@/utils/cropImage';

/** Preset aspect ratios offered in the crop dialog; 'original' follows the source image's own ratio. */
type AspectPreset = 'square' | 'portrait' | 'landscape' | 'original';

const ASPECT_PRESETS: { value: AspectPreset; label: string; ratio?: number }[] = [
  { value: 'square', label: '1:1', ratio: 1 },
  { value: 'portrait', label: '3:4', ratio: 3 / 4 },
  { value: 'landscape', label: '4:3', ratio: 4 / 3 },
  { value: 'original', label: 'Originale' },
];

interface ImageCropDialogProps {
  open: boolean;
  imageSrc: string | null;
  fileName: string;
  /** width / height, e.g. 1 for square, 4/3, 16/9... Used as the initial preset. */
  aspect?: number;
  /** Lets the user switch between square/portrait/landscape/original aspect ratios. Defaults to true. */
  allowFreeAspect?: boolean;
  /** Shows a live square + circular avatar preview below the cropper (e.g. for category pictures). */
  showAvatarPreview?: boolean;
  onClose: () => void;
  onCropped: (file: File) => void;
}

// Reusable crop/zoom dialog used before uploading a category or product picture
export default function ImageCropDialog({
  open, imageSrc, fileName, aspect = 1, allowFreeAspect = true, showAvatarPreview = false, onClose, onCropped,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);
  const [preset, setPreset] = useState<AspectPreset>(
    ASPECT_PRESETS.find((p) => p.ratio === aspect)?.value ?? 'square',
  );
  const [originalRatio, setOriginalRatio] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  // Debounced live preview of the crop as it would look as an avatar
  useEffect(() => {
    if (!showAvatarPreview || !imageSrc || !croppedAreaPixels) { setPreviewUrl(null); return; }
    let cancelled = false;
    const timer = setTimeout(() => {
      getCroppedPreviewUrl(imageSrc, croppedAreaPixels).then((url) => {
        if (!cancelled) setPreviewUrl(url);
      });
    }, 150);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [showAvatarPreview, imageSrc, croppedAreaPixels]);

  const onMediaLoaded = useCallback((media: MediaSize) => {
    setOriginalRatio(media.naturalWidth / media.naturalHeight);
  }, []);

  const activeAspect = preset === 'original'
    ? (originalRatio ?? 1)
    : (ASPECT_PRESETS.find((p) => p.value === preset)?.ratio ?? 1);

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setOriginalRatio(null);
    setPreviewUrl(null);
    setPreset(ASPECT_PRESETS.find((p) => p.ratio === aspect)?.value ?? 'square');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleValidate = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setProcessing(true);
    try {
      const file = await getCroppedImageFile(imageSrc, croppedAreaPixels, fileName);
      onCropped(file);
      handleReset();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Ajuster l'image
        <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ position: 'relative', width: '100%', height: 320, bgcolor: 'grey.900' }}>
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={activeAspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              onMediaLoaded={onMediaLoaded}
            />
          )}
        </Box>
        {allowFreeAspect && (
          <Box sx={{ display: 'flex', justifyContent: 'center', px: 3, pt: 2 }}>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={preset}
              onChange={(_, v) => { if (v) setPreset(v); }}
            >
              {ASPECT_PRESETS.map((p) => (
                <ToggleButton key={p.value} value={p.value} sx={{ px: 1.5, fontSize: '0.7rem' }}>
                  {p.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        )}
        {showAvatarPreview && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 3, px: 3, pt: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{
                width: 64, height: 64, borderRadius: 1.5, overflow: 'hidden', bgcolor: 'grey.200',
                border: '1px solid', borderColor: 'divider',
                backgroundImage: previewUrl ? `url(${previewUrl})` : undefined,
                backgroundSize: 'cover', backgroundPosition: 'center',
              }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Carrée</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{
                width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', bgcolor: 'grey.200',
                border: '1px solid', borderColor: 'divider',
                backgroundImage: previewUrl ? `url(${previewUrl})` : undefined,
                backgroundSize: 'cover', backgroundPosition: 'center',
              }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Avatar</Typography>
            </Box>
          </Box>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 3, py: 2 }}>
          <ZoomOutIcon fontSize="small" color="action" />
          <Slider
            size="small"
            min={1}
            max={4}
            step={0.05}
            value={zoom}
            onChange={(_, v) => setZoom(v as number)}
          />
          <ZoomInIcon fontSize="small" color="action" />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ px: 3, pb: 1, display: 'block' }}>
          Faites glisser pour repositionner, utilisez le curseur ou la molette pour zoomer.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">Annuler</Button>
        <Button onClick={handleValidate} variant="contained" disabled={processing || !croppedAreaPixels}>
          {processing ? 'Traitement…' : 'Valider'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
