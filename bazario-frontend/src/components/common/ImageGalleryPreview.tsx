import { useEffect, useState } from 'react';
import { Box, IconButton, Tooltip, Typography, alpha } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';

export interface GalleryImage {
  key: string;
  src: string;
  onRemove: () => void;
  removing?: boolean;
  /** true for a not-yet-uploaded (pending) image */
  pending?: boolean;
}

/**
 * Mini carousel preview for product images (pending + already-uploaded), with
 * prev/next arrows, keyboard navigation (when focused), and a thumbnail strip.
 */
export default function ImageGalleryPreview({
  images, onAddClick, accentColor = '#009530',
}: {
  images: GalleryImage[];
  onAddClick: () => void;
  accentColor?: string;
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (idx > images.length - 1) setIdx(Math.max(0, images.length - 1));
  }, [images.length, idx]);

  const goToPrev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const goToNext = () => setIdx((i) => (i + 1) % images.length);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (images.length <= 1) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); goToPrev(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); goToNext(); }
  };

  const current = images[idx];

  return (
    <Box>
      <Box
        tabIndex={images.length > 1 ? 0 : -1}
        onKeyDown={handleKeyDown}
        sx={{
          position: 'relative', width: 180, height: 180, borderRadius: 2, overflow: 'hidden',
          bgcolor: 'grey.100', outline: 'none',
          '&:focus-visible': { boxShadow: `0 0 0 2px ${alpha(accentColor, 0.5)}` },
        }}
      >
        {current ? (
          <>
            <Box component="img" key={current.key} src={current.src} alt=""
              sx={{
                width: '100%', height: '100%', objectFit: 'cover',
                border: current.pending ? '2px dashed' : '2px solid',
                borderColor: current.pending ? accentColor : 'primary.main',
                borderRadius: 2, boxSizing: 'border-box',
                opacity: current.pending ? 0.85 : 1,
              }} />
            <Tooltip title={current.pending ? 'Annuler' : 'Supprimer'}>
              <IconButton size="small" onClick={current.onRemove} disabled={current.removing}
                sx={{
                  position: 'absolute', top: 6, right: 6,
                  bgcolor: current.pending ? 'warning.main' : 'error.main', color: '#fff',
                  '&:hover': { bgcolor: current.pending ? 'warning.dark' : 'error.dark' },
                  width: 24, height: 24,
                }}>
                <DeleteIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
            {images.length > 1 && (
              <>
                <IconButton size="small" onClick={goToPrev}
                  sx={{
                    position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)',
                    bgcolor: '#fff', border: '1px solid', borderColor: 'divider', boxShadow: 2,
                    '&:hover': { bgcolor: '#f5f5f5' },
                  }}>
                  <ArrowBackIosNewIcon sx={{ fontSize: 13 }} />
                </IconButton>
                <IconButton size="small" onClick={goToNext}
                  sx={{
                    position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                    bgcolor: '#fff', border: '1px solid', borderColor: 'divider', boxShadow: 2,
                    '&:hover': { bgcolor: '#f5f5f5' },
                  }}>
                  <ArrowForwardIosIcon sx={{ fontSize: 13 }} />
                </IconButton>
                <Box sx={{
                  position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
                  bgcolor: alpha('#000', 0.55), color: '#fff', px: 1, borderRadius: 1.5,
                  fontSize: '0.7rem', lineHeight: '18px',
                }}>
                  {idx + 1} / {images.length}
                </Box>
              </>
            )}
          </>
        ) : (
          <Box onClick={onAddClick} sx={{
            width: '100%', height: '100%', border: '2px dashed', borderColor: alpha(accentColor, 0.4),
            borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: accentColor, gap: 0.5,
            '&:hover': { bgcolor: alpha(accentColor, 0.06), borderColor: accentColor },
          }}>
            <AddPhotoAlternateIcon sx={{ fontSize: 34 }} />
            <Typography variant="caption" fontWeight={600}>Ajouter des photos</Typography>
          </Box>
        )}
      </Box>

      {/* Thumbnail strip */}
      <Box sx={{
        display: 'flex', gap: 1, mt: 1.25, flexWrap: 'wrap', alignItems: 'center',
      }}>
        {images.map((img, i) => (
          <Box key={img.key} component="img" src={img.src} alt=""
            onClick={() => setIdx(i)}
            sx={{
              width: 48, height: 48, objectFit: 'cover', flexShrink: 0, borderRadius: 1.5,
              cursor: 'pointer', bgcolor: '#fff',
              border: '2px solid', borderColor: i === idx ? accentColor : 'divider',
              opacity: i === idx ? 1 : 0.6, transition: 'all 0.18s',
              '&:hover': { opacity: 1, borderColor: alpha(accentColor, 0.6) },
            }} />
        ))}
        <Tooltip title="Ajouter des photos">
          <Box onClick={onAddClick} sx={{
            width: 48, height: 48, flexShrink: 0, border: '2px dashed', borderColor: alpha(accentColor, 0.4),
            borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: accentColor,
            '&:hover': { bgcolor: alpha(accentColor, 0.06), borderColor: accentColor },
          }}>
            <AddPhotoAlternateIcon sx={{ fontSize: 20 }} />
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );
}
