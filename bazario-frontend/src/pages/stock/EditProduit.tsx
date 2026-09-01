import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Switch, FormControlLabel,
  CircularProgress, Alert, alpha, IconButton, Tooltip, MenuItem, InputAdornment,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '../../api/productApi';
import { categoryApi } from '../../api/miscApi';
import type { Category } from '../../types';
import toast from 'react-hot-toast';

export default function EditProduit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    libelle: '', description: '', prix: '', prixActif: true,
    prixPromo: '', reference: '', marque: '', categorie: '', unite: 'PIECE', quantiteMin: '1',
  });
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.getById(Number(id)),
    enabled: !!id,
  });

  // Dynamic categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
  });
  const [newCatInput, setNewCatInput] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const addCategoryMutation = useMutation({
    mutationFn: (label: string) => categoryApi.create(label),
    onSuccess: (cat) => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      setForm((f) => ({ ...f, categorie: cat.slug }));
      setNewCatInput('');
      setShowNewCat(false);
      toast.success(`Catégorie "${cat.label}" ajoutée`);
    },
    onError: () => toast.error('Catégorie déjà existante ou invalide'),
  });

  useEffect(() => {
    if (product) {
      setForm({
        libelle: product.libelle,
        description: product.description ?? '',
        prix: String(product.prix),
        prixActif: product.prixActif,
        prixPromo: product.prixPromo != null ? String(product.prixPromo) : '',
        reference: product.reference ?? '',
        marque: product.marque ?? '',
        categorie: product.categorie ?? '',
        unite: product.unite ?? 'PIECE',
        quantiteMin: String(product.quantiteMin ?? 1),
      });
    }
  }, [product]);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setPendingFiles((prev) => [...prev, ...files]);
    setPendingPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removePending = (idx: number) => {
    URL.revokeObjectURL(pendingPreviews[idx]);
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
    setPendingPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const deleteImageMutation = useMutation({
    mutationFn: (imageUrl: string) => productApi.deleteImage(Number(id), imageUrl),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['product', id] }); toast.success('Image supprimée'); },
    onError: () => toast.error('Erreur suppression image'),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      await productApi.update(Number(id), {
        libelle: form.libelle,
        description: form.description || undefined,
        prix: parseFloat(form.prix),
        prixActif: form.prixActif,
        prixPromo: form.prixPromo ? parseFloat(form.prixPromo) : undefined,
        reference: form.reference || undefined,
        marque: form.marque || undefined,
        categorie: form.categorie || undefined,
        unite: form.unite,
        quantiteMin: parseInt(form.quantiteMin) || 1,
      });
      if (pendingFiles.length > 0) {
        await productApi.uploadImages(Number(id), pendingFiles);
        setPendingFiles([]);
        setPendingPreviews([]);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mes-produits'] });
      qc.invalidateQueries({ queryKey: ['product', id] });
      toast.success('Produit mis à jour !');
      navigate('/stock/produits');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  if (isLoading) return <Box sx={{ p: 4 }}><CircularProgress /></Box>;
  if (isError) return <Alert severity="error" sx={{ m: 4 }}>Produit introuvable.</Alert>;

  const existingImages: string[] = product?.images ?? [];

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/stock/produits')} sx={{ mb: 3 }}>
        Retour aux produits
      </Button>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
        <Box sx={{ bgcolor: '#1565C0', borderRadius: 2, p: 1, display: 'flex' }}>
          <EditIcon sx={{ fontSize: 22, color: '#fff' }} />
        </Box>
        <Typography variant="h4">Modifier le produit</Typography>
      </Box>

      <Paper sx={{ p: 4, maxWidth: 620, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <TextField
          label="Libellé" required fullWidth value={form.libelle}
          onChange={(e) => setForm({ ...form, libelle: e.target.value })}
        />
        <TextField
          label="Description" fullWidth multiline rows={3} value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <TextField
          label="Prix (MAD)" required fullWidth type="number" value={form.prix}
          onChange={(e) => setForm({ ...form, prix: e.target.value })}
          inputProps={{ min: 0, step: 0.01 }}
        />
        <TextField
          label="Prix promo (MAD)" fullWidth type="number" value={form.prixPromo}
          onChange={(e) => setForm({ ...form, prixPromo: e.target.value })}
          inputProps={{ min: 0, step: 0.01 }}
          helperText="Laisser vide pour supprimer la promotion"
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Référence / SKU" fullWidth value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
            placeholder="Ex: SCH-iC60N-2P-20A"
          />
          <TextField
            label="Marque" fullWidth value={form.marque}
            onChange={(e) => setForm({ ...form, marque: e.target.value })}
            placeholder="Ex: Schneider"
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            select label="Catégorie" fullWidth value={form.categorie}
            onChange={(e) => setForm({ ...form, categorie: e.target.value })}>
            <MenuItem value="">— Non spécifiée —</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.slug} value={c.slug}>{c.label}</MenuItem>
            ))}
            <MenuItem
              onClick={(e) => { e.stopPropagation(); setShowNewCat(true); }}
              sx={{ color: 'primary.main', fontWeight: 600 }}>
              <AddIcon sx={{ fontSize: 16, mr: 0.5 }} /> Ajouter une catégorie…
            </MenuItem>
          </TextField>
          {showNewCat && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: -1 }}>
              <TextField
                size="small" fullWidth label="Nom de la nouvelle catégorie"
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCatInput.trim()) {
                    addCategoryMutation.mutate(newCatInput.trim());
                  } else if (e.key === 'Escape') {
                    setShowNewCat(false);
                    setNewCatInput('');
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Confirmer">
                        <span>
                          <IconButton size="small"
                            disabled={!newCatInput.trim() || addCategoryMutation.isPending}
                            onClick={() => addCategoryMutation.mutate(newCatInput.trim())}>
                            {addCategoryMutation.isPending
                              ? <CircularProgress size={14} />
                              : <AddIcon sx={{ fontSize: 16 }} />}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
              <Button size="small" onClick={() => { setShowNewCat(false); setNewCatInput(''); }}>
                Annuler
              </Button>
            </Box>
          )}
          <TextField
            select label="Unité" fullWidth value={form.unite}
            onChange={(e) => setForm({ ...form, unite: e.target.value })}>
            <MenuItem value="PIECE">Pièce</MenuItem>
            <MenuItem value="METRE">Mètre</MenuItem>
            <MenuItem value="BOBINE">Bobine</MenuItem>
            <MenuItem value="LOT">Lot</MenuItem>
          </TextField>
        </Box>
        <TextField
          label="Quantité minimale" fullWidth type="number" value={form.quantiteMin}
          onChange={(e) => setForm({ ...form, quantiteMin: e.target.value })}
          inputProps={{ min: 1, step: 1 }}
          helperText="Quantité minimum de commande"
        />

        {/* Images */}
        <Box>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
            Photos du produit <Typography component="span" variant="caption" color="text.secondary">(optionnel)</Typography>
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'flex-start' }}>
            {/* Existing saved images */}
            {existingImages.map((url) => (
              <Box key={url} sx={{ position: 'relative', width: 90, height: 90 }}>
                <Box component="img" src={productApi.imageUrl(url)} alt=""
                  sx={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 2, border: '2px solid', borderColor: 'primary.main' }} />
                <Tooltip title="Supprimer">
                  <IconButton size="small"
                    onClick={() => deleteImageMutation.mutate(url)}
                    disabled={deleteImageMutation.isPending}
                    sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'error.main', color: '#fff', '&:hover': { bgcolor: 'error.dark' }, width: 22, height: 22 }}>
                    <DeleteIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
            {/* Pending new images */}
            {pendingPreviews.map((src, idx) => (
              <Box key={idx} sx={{ position: 'relative', width: 90, height: 90 }}>
                <Box component="img" src={src} alt=""
                  sx={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 2, border: '2px dashed', borderColor: '#009530', opacity: 0.8 }} />
                <Tooltip title="Annuler">
                  <IconButton size="small"
                    onClick={() => removePending(idx)}
                    sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'warning.main', color: '#fff', '&:hover': { bgcolor: 'warning.dark' }, width: 22, height: 22 }}>
                    <DeleteIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
            {/* Add button */}
            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{ width: 90, height: 90, border: '2px dashed', borderColor: alpha('#009530', 0.4), borderRadius: 2,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#009530', gap: 0.3,
                '&:hover': { bgcolor: alpha('#009530', 0.06), borderColor: '#009530' }, transition: 'all 0.2s' }}>
              <AddPhotoAlternateIcon sx={{ fontSize: 26 }} />
              <Typography variant="caption" fontWeight={600} lineHeight={1}>Ajouter</Typography>
            </Box>
          </Box>
          <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleFilePick} />
        </Box>

        <Box sx={{ bgcolor: alpha(form.prixActif ? '#009530' : '#9E9E9E', 0.08), borderRadius: 2, px: 2, py: 1.5,
          border: '1px solid', borderColor: alpha(form.prixActif ? '#009530' : '#9E9E9E', 0.25) }}>
          <FormControlLabel
            control={<Switch checked={form.prixActif} onChange={(e) => setForm({ ...form, prixActif: e.target.checked })} color="success" />}
            label={
              <Typography variant="body2" fontWeight={500}>
                {form.prixActif ? 'Visible dans le catalogue' : 'Masqué du catalogue'}
              </Typography>
            }
          />
        </Box>
        <Button
          variant="contained" size="large"
          onClick={() => mutation.mutate()}
          disabled={!form.libelle || !form.prix || mutation.isPending}
          startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
        >
          Enregistrer les modifications
        </Button>
      </Paper>
    </Box>
  );
}

