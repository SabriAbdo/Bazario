import { useState, useCallback } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Slider, Typography, IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import { getCroppedImageFile } from '@/utils/cropImage';

interface ImageCropDialogProps {
  open: boolean;
  imageSrc: string | null;
  fileName: string;
  /** width / height, e.g. 1 for square, 4/3, 16/9... */
  aspect?: number;
  onClose: () => void;
  onCropped: (file: File) => void;
}

// Reusable crop/zoom dialog used before uploading a category or product picture
export default function ImageCropDialog({
  open, imageSrc, fileName, aspect = 1, onClose, onCropped,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
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
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </Box>
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
