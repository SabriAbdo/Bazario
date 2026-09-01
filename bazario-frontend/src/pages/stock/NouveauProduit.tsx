import { useState, useRef, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Switch, FormControlLabel,
  CircularProgress, alpha, IconButton, Tooltip, MenuItem, InputAdornment, Alert, Collapse,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoIcon from '@mui/icons-material/Info';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productApi } from '../../api/productApi';
import { categoryApi } from '../../api/miscApi';
import type { Category } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

export default function NouveauProduit() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const isStockOp = user?.role === 'STOCK_OPERATEUR';

  const [form, setForm] = useState({
    libelle: '', description: '', prix: '', prixActif: true,
    prixPromo: '', reference: '', marque: '', categorie: '', unite: 'PIECE', quantiteMin: '1',
  });
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [debouncedLibelle, setDebouncedLibelle] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedLibelle(form.libelle.trim()), 500);
    return () => clearTimeout(t);
  }, [form.libelle]);

  const { data: duplicates = [] } = useQuery({
    queryKey: ['product-check', debouncedLibelle],
    queryFn: () => productApi.search(debouncedLibelle),
    enabled: debouncedLibelle.length >= 3,
    staleTime: 10_000,
  });

  const { data: allCategories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
  });

  // Filter categories by allowed ones for STOCK_OPERATEUR
  const allowedSlugs = user?.allowedCategories ? user.allowedCategories.split(',').filter(Boolean) : null;
  const categories = allowedSlugs ? allCategories.filter((c) => allowedSlugs.includes(c.slug)) : allCategories;

  const [newCatInput, setNewCatInput] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const addCategoryMutation = useMutation({
    mutationFn: (label: string) => categoryApi.create(label),
    onSuccess: (cat) => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      setForm((f) => ({ ...f, categorie: cat.slug }));
      setNewCatInput('');
      setShowNewCat(false);
      toast.success(`Cat�gorie "${cat.label}" ajout�e`);
    },
    onError: () => toast.error('Cat�gorie d�j� existante ou invalide'),
  });

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setPendingFiles((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removePreview = (idx: number) => {
    URL.revokeObjectURL(previews[idx]);
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const product = await productApi.create({
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
        await productApi.uploadImages(product.id, pendingFiles);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mes-produits'] });
      toast.success(isStockOp ? 'Produit cr�� � en attente d\'approbation admin' : 'Produit cr�� !');
      navigate('/stock/produits');
    },
    onError: () => toast.error('Erreur lors de la cr�ation'),
  });

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 4, maxWidth: 920, mx: 'auto' }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/stock/produits')} sx={{ mb: 3 }}>
        Retour aux produits
      </Button>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box sx={{ bgcolor: '#009530', borderRadius: 2, p: 1, display: 'flex' }}>
          <AddCircleOutlineIcon sx={{ fontSize: 22, color: '#fff' }} />
        </Box>
        <Typography variant="h4">Nouveau Produit</Typography>
      </Box>

      {isStockOp && (
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
          <strong>Validation requise</strong> � Ce produit sera soumis � l'approbation d'un administrateur avant d'appara�tre dans le catalogue public.
        </Alert>
      )}

      {allowedSlugs && allowedSlugs.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Vous �tes autoris� � cr�er des produits uniquement dans les cat�gories suivantes : <strong>{categories.map((c) => c.label).join(', ')}</strong>.
        </Alert>
      )}

      <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Libell� */}
        <Box>
          <TextField
            label="Libell�" required fullWidth value={form.libelle}
            onChange={(e) => setForm({ ...form, libelle: e.target.value })}
            placeholder="Ex: Disjoncteur iC60N 16A 2P"
          />
          <Collapse in={debouncedLibelle.length >= 3 && duplicates.length > 0}>
            <Alert severity="warning" icon={<WarningAmberIcon fontSize="small" />} sx={{ mt: 1, fontSize: '0.82rem' }}>
              <strong>{duplicates.length} produit{duplicates.length > 1 ? 's' : ''} similaire{duplicates.length > 1 ? 's' : ''} d�j� dans le catalogue&nbsp;:</strong>
              <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2 }}>
                {duplicates.slice(0, 5).map((p) => (
                  <li key={p.id}>
                    {p.libelle}{p.reference ? <> � <em>{p.reference}</em></> : null}
                    {' � '}{p.prix.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD
                  </li>
                ))}
              </Box>
            </Alert>
          </Collapse>
        </Box>

        <TextField
          label="Description" fullWidth multiline rows={3} value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="D�tails techniques, caract�ristiques..."
        />

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5 }}>
          <TextField
            label="Prix (MAD)" required fullWidth type="number" value={form.prix}
            onChange={(e) => setForm({ ...form, prix: e.target.value })}
            inputProps={{ min: 0, step: 0.01 }}
          />
          <TextField
            label="Prix promo (MAD)" fullWidth type="number" value={form.prixPromo}
            onChange={(e) => setForm({ ...form, prixPromo: e.target.value })}
            inputProps={{ min: 0, step: 0.01 }} helperText="Laisser vide si pas de promotion"
          />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5 }}>
          <TextField
            label="R�f�rence / SKU" fullWidth value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
            placeholder="Ex: SCH-iC60N-2P-20A"
          />
          <TextField
            label="Marque" fullWidth value={form.marque}
            onChange={(e) => setForm({ ...form, marque: e.target.value })}
            placeholder="Ex: Schneider"
          />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 2.5 }}>
          <TextField
            select label="Cat�gorie" fullWidth value={form.categorie}
            onChange={(e) => setForm({ ...form, categorie: e.target.value })}>
            <MenuItem value="">� Non sp�cifi�e �</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.slug} value={c.slug}>{c.label}</MenuItem>
            ))}
            {!isStockOp && (
              <MenuItem onClick={(e) => { e.stopPropagation(); setShowNewCat(true); }}
                sx={{ color: 'primary.main', fontWeight: 600 }}>
                <AddIcon sx={{ fontSize: 16, mr: 0.5 }} /> Ajouter une cat�gorie�
              </MenuItem>
            )}
          </TextField>
          <TextField
            select label="Unit�" fullWidth value={form.unite}
            onChange={(e) => setForm({ ...form, unite: e.target.value })}>
            <MenuItem value="PIECE">Pi�ce</MenuItem>
            <MenuItem value="METRE">M�tre</MenuItem>
            <MenuItem value="BOBINE">Bobine</MenuItem>
            <MenuItem value="LOT">Lot</MenuItem>
          </TextField>
          <TextField
            label="Qt� minimale" fullWidth type="number" value={form.quantiteMin}
            onChange={(e) => setForm({ ...form, quantiteMin: e.target.value })}
            inputProps={{ min: 1, step: 1 }} helperText="Qt� min de commande"
          />
        </Box>

        {showNewCat && (
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <TextField
              size="small" fullWidth label="Nom de la nouvelle cat�gorie"
              value={newCatInput} onChange={(e) => setNewCatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newCatInput.trim()) addCategoryMutation.mutate(newCatInput.trim());
                else if (e.key === 'Escape') { setShowNewCat(false); setNewCatInput(''); }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Confirmer"><span>
                      <IconButton size="small" disabled={!newCatInput.trim() || addCategoryMutation.isPending}
                        onClick={() => addCategoryMutation.mutate(newCatInput.trim())}>
                        {addCategoryMutation.isPending ? <CircularProgress size={14} /> : <AddIcon sx={{ fontSize: 16 }} />}
                      </IconButton>
                    </span></Tooltip>
                  </InputAdornment>
                ),
              }}
            />
            <Button size="small" onClick={() => { setShowNewCat(false); setNewCatInput(''); }}>Annuler</Button>
          </Box>
        )}

        {/* Image upload */}
        <Box>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
            Photos du produit <Typography component="span" variant="caption" color="text.secondary">(optionnel)</Typography>
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'flex-start' }}>
            {previews.map((src, idx) => (
              <Box key={idx} sx={{ position: 'relative', width: 90, height: 90 }}>
                <Box component="img" src={src} alt=""
                  sx={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }} />
                <Tooltip title="Supprimer">
                  <IconButton size="small" onClick={() => removePreview(idx)}
                    sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'error.main', color: '#fff', '&:hover': { bgcolor: 'error.dark' }, width: 22, height: 22 }}>
                    <DeleteIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
            <Box onClick={() => fileInputRef.current?.click()}
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
                {form.prixActif ? 'Visible dans le catalogue (une fois approuv�)' : 'Masqu� du catalogue'}
              </Typography>
            }
          />
        </Box>

        <Button
          variant="contained" size="large"
          onClick={() => mutation.mutate()}
          disabled={!form.libelle || !form.prix || mutation.isPending}
          startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : <AddCircleOutlineIcon />}
        >
          {isStockOp ? 'Soumettre pour approbation' : 'Cr�er le produit'}
        </Button>
      </Paper>
    </Box>
  );
}
