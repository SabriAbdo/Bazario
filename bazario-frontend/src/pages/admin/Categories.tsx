import { useRef, useState } from 'react';
import { Container, Typography, Box, Paper, Button, TextField, IconButton, Tooltip, Avatar } from '@mui/material';
import { Add, Delete, PhotoCamera } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '@/api/miscApi';
import { Category } from '@/types';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

// Empty in dev (Vite proxy) and same-origin prod; set VITE_API_BASE_URL for cross-origin deploys
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export default function AdminCategories() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const createFileRef = useRef<HTMLInputElement>(null);
  // maps category id → hidden input ref for per-row uploads
  const rowFileRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const { register, handleSubmit, reset } = useForm<{ name: string; iconName?: string }>();

  const { data } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: async (d: { name: string; iconName?: string }) => {
      const cat = await categoryApi.create(d.name, d.iconName || undefined);
      if (imageFile) await categoryApi.uploadImage(cat.id, imageFile);
      return cat;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Catégorie créée');
      reset();
      setImageFile(null);
      setImagePreview(null);
      setShowForm(false);
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => categoryApi.uploadImage(id, file),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Image mise à jour'); },
    onError: () => toast.error('Erreur lors de l\'upload'),
  });

  const handleCreateImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleRowImage = (catId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadMutation.mutate({ id: catId, file });
    e.target.value = '';
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h2">Catégories</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setShowForm(!showForm)}>
          Ajouter
        </Button>
      </Box>

      {showForm && (
        <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>Nouvelle catégorie</Typography>
          <Box component="form" onSubmit={handleSubmit((d) => createMutation.mutate(d))} sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <TextField label="Nom" size="small" {...register('name')} required />
            <TextField label="Icône (optionnel)" size="small" {...register('iconName')} />

            {/* Image picker for new category */}
            <input ref={createFileRef} type="file" accept="image/*" hidden onChange={handleCreateImage} />
            <Tooltip title="Ajouter une image">
              <Box
                onClick={() => createFileRef.current?.click()}
                sx={{
                  width: 56, height: 56, borderRadius: 2, border: '2px dashed',
                  borderColor: imagePreview ? 'primary.main' : 'divider',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                }}
              >
                {imagePreview
                  ? <Box component="img" src={imagePreview} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <PhotoCamera color="action" />}
              </Box>
            </Tooltip>
            {imagePreview && (
              <Button size="small" color="inherit" onClick={() => { setImageFile(null); setImagePreview(null); }}>
                Retirer
              </Button>
            )}

            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Création…' : 'Créer'}
            </Button>
          </Box>
        </Paper>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {data?.map((cat) => (
          <Paper key={cat.id} sx={{ p: 2, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {/* Clickable avatar to replace image */}
              <input
                type="file" accept="image/*" hidden
                ref={(el) => { rowFileRefs.current[cat.id] = el; }}
                onChange={(e) => handleRowImage(cat.id, e)}
              />
              <Tooltip title="Changer l'image">
                <Box
                  onClick={() => rowFileRefs.current[cat.id]?.click()}
                  sx={{
                    width: 40, height: 40, borderRadius: 1.5, overflow: 'hidden',
                    cursor: 'pointer', position: 'relative',
                    border: '1.5px dashed', borderColor: 'divider',
                    '&:hover .overlay': { opacity: 1 },
                  }}
                >
                  {cat.imageUrl
                    ? <Box component="img" src={`${API_BASE}${cat.imageUrl}`} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover' }}>
                        <PhotoCamera fontSize="small" color="disabled" />
                      </Box>
                  }
                  {/* hover overlay */}
                  <Box className="overlay" sx={{
                    position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.45)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'opacity .15s',
                  }}>
                    <PhotoCamera sx={{ color: '#fff', fontSize: 16 }} />
                  </Box>
                </Box>
              </Tooltip>
              <Typography fontWeight={600}>{cat.label}</Typography>
            </Box>
            <Tooltip title="Supprimer">
              <IconButton color="error" size="small" onClick={() => { if (confirm('Supprimer ?')) toast.error('Suppression non disponible'); }}>
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Paper>
        ))}
      </Box>
    </Container>
  );
}

