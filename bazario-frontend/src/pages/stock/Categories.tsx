import { useRef, useState } from 'react';
import {
  Typography, Box, Paper, Button, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, IconButton, Tooltip, alpha,
  Grid,
} from '@mui/material';
import AddIcon         from '@mui/icons-material/Add';
import EditIcon        from '@mui/icons-material/Edit';
import DeleteIcon      from '@mui/icons-material/Delete';
import CloseIcon       from '@mui/icons-material/Close';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '@/api/miscApi';
import { Category } from '@/types';
import toast from 'react-hot-toast';
import ImageCropDialog from '@/components/common/ImageCropDialog';

// Empty in dev (Vite proxy) and same-origin prod; set VITE_API_BASE_URL for cross-origin deploys
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

const CAT_COLORS = [
  '#E8521A','#3730A3','#D97706','#16A34A','#DC2626',
  '#7C3AED','#0369A1','#BE185D','#065F46','#92400E',
  '#1D4ED8','#B45309','#15803D','#6D28D9','#9D174D',
  '#0F766E','#C2410C','#1E40AF','#166534','#7E22CE',
];

// ─── Dialog (create / edit) ───────────────────────────────────────────────────
function CategoryDialog({
  open, category, onClose,
}: {
  open: boolean;
  category?: Category;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = Boolean(category);
  const [label, setLabel] = useState(category?.label ?? '');
  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Crop dialog state for the picked (not-yet-uploaded) picture
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropFileName, setCropFileName] = useState('image.jpg');

  // Reset when dialog reopens for a different category
  const [lastId, setLastId] = useState<number | undefined>(category?.id);
  if (category?.id !== lastId) {
    setLabel(category?.label ?? '');
    setImageFile(null);
    setImagePreview(null);
    setLastId(category?.id);
  }

  const afterSave = (saved: Category) => {
    qc.invalidateQueries({ queryKey: ['categories'] });
    // Fire-and-forget: image upload failure must not affect the category save result
    if (imageFile) {
      categoryApi.uploadImage(saved.id, imageFile)
        .then(() => qc.invalidateQueries({ queryKey: ['categories'] }))
        .catch(() => toast.error('Image non uploadée — réessayez depuis la liste'));
    }
  };

  const createMutation = useMutation({
    mutationFn: () => categoryApi.create(label.trim()),
    onSuccess: (saved) => { afterSave(saved); toast.success('Catégorie créée'); onClose(); },
    onError:   () => toast.error('Erreur lors de la création'),
  });

  const updateMutation = useMutation({
    mutationFn: () => categoryApi.update(category!.id, { label: label.trim() || undefined }),
    onSuccess: (saved) => { afterSave(saved); toast.success('Catégorie mise à jour'); onClose(); },
    onError:   () => toast.error('Erreur lors de la mise à jour'),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFileName(file.name);
    setCropSrc(URL.createObjectURL(file));
    setCropOpen(true);
    e.target.value = '';
  };

  const handleCropClose = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropOpen(false);
    setCropSrc(null);
  };

  const handleCropped = (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    handleCropClose();
  };

  const handleSave = () => {
    if (!label.trim() && !isEdit) { toast.error('Le nom est requis'); return; }
    isEdit ? updateMutation.mutate() : createMutation.mutate();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {isEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          <TextField
            label="Nom de la catégorie (libellé)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            fullWidth size="small"
            required={!isEdit}
            placeholder="ex: Disjoncteurs"
          />

          {/* Image upload */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Photo</Typography>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Tooltip title="Cliquer pour choisir une image">
                <Box
                  onClick={() => fileRef.current?.click()}
                  sx={{
                    width: 80, height: 80, borderRadius: 2, border: '2px dashed',
                    borderColor: imagePreview ? 'primary.main' : 'divider',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                  }}
                >
                  {imagePreview
                    ? <Box component="img" src={imagePreview} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : category?.imageUrl
                      ? <Box component="img" src={`${API_BASE}${category.imageUrl}`} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <PhotoCameraIcon color="action" />}
                </Box>
              </Tooltip>
              <Box>
                <Button size="small" variant="outlined" onClick={() => fileRef.current?.click()}>
                  {imagePreview || category?.imageUrl ? 'Changer' : 'Ajouter une photo'}
                </Button>
                {(imagePreview) && (
                  <Button size="small" color="inherit" sx={{ ml: 1 }} onClick={() => { setImageFile(null); setImagePreview(null); }}>
                    Retirer
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">Annuler</Button>
        <Button onClick={handleSave} variant="contained" disabled={isPending}>
          {isPending ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer'}
        </Button>
      </DialogActions>

      <ImageCropDialog
        open={cropOpen}
        imageSrc={cropSrc}
        fileName={cropFileName}
        aspect={1}
        onClose={handleCropClose}
        onCropped={handleCropped}
      />
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StockCategories() {
  const [dialogOpen, setDialogOpen]         = useState(false);
  const [editTarget, setEditTarget]         = useState<Category | undefined>(undefined);
  const [deleteTarget, setDeleteTarget]     = useState<Category | undefined>(undefined);
  const qc = useQueryClient();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoryApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Catégorie supprimée');
      setDeleteTarget(undefined);
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const openCreate = () => { setEditTarget(undefined); setDialogOpen(true); };
  const openEdit   = (cat: Category) => { setEditTarget(cat); setDialogOpen(true); };
  const closeDialog = () => setDialogOpen(false);

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h2" fontWeight={700}>Catégories</Typography>
          <Typography color="text.secondary" fontSize="0.9rem">
            Gérez les catégories de produits et leurs photos
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ fontWeight: 600 }}>
          Nouvelle catégorie
        </Button>
      </Box>

      <Grid container spacing={2}>
        {categories.map((cat, idx) => {
          const color = CAT_COLORS[idx % CAT_COLORS.length];
          return (
            <Grid item xs={6} sm={4} md={3} lg={2} key={cat.id}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5, borderRadius: 3, border: '1.5px solid', borderColor: 'divider',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.2,
                  position: 'relative', transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: `0 4px 16px ${alpha(color, 0.18)}`, borderColor: color },
                }}
              >
                {/* Edit button */}
                <Tooltip title="Modifier la catégorie" placement="top">
                  <IconButton
                    size="small"
                    onClick={() => openEdit(cat)}
                    sx={{
                      position: 'absolute', top: 6, right: 34,
                      opacity: 0, transition: 'opacity 0.15s',
                      '.MuiPaper-root:hover &': { opacity: 1 },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                {/* Delete button */}
                <Tooltip title="Supprimer la catégorie" placement="top">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteTarget(cat)}
                    sx={{
                      position: 'absolute', top: 6, right: 6,
                      opacity: 0, transition: 'opacity 0.15s',
                      '.MuiPaper-root:hover &': { opacity: 1 },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Box sx={{ width: 88, height: 88, borderRadius: '50%', bgcolor: alpha(color, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {cat.imageUrl
                    ? <Box component="img" src={`${API_BASE}${cat.imageUrl}`} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <ImageNotSupportedIcon sx={{ fontSize: 40, color }} />}
                </Box>
                <Typography fontWeight={600} textAlign="center" fontSize="0.78rem" lineHeight={1.3}>
                  {cat.label}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <CategoryDialog open={dialogOpen} category={editTarget} onClose={closeDialog} />

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(undefined)} maxWidth="xs" fullWidth>
        <DialogTitle>Supprimer la catégorie</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Voulez-vous supprimer <strong>{deleteTarget?.label}</strong>&nbsp;? Les produits qui lui sont associés ne seront pas supprimés, ils perdront simplement cette catégorie.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(undefined)} color="inherit">Annuler</Button>
          <Button
            variant="contained" color="error"
            disabled={deleteMutation.isPending}
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
