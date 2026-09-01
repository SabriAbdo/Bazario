import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  Box, Typography, Button, Chip, alpha,
  Dialog, IconButton, Divider, TextField, Avatar, CircularProgress,
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import GridViewIcon from '@mui/icons-material/GridView';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import ComputerIcon from '@mui/icons-material/Computer';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import ManIcon from '@mui/icons-material/Man';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import KitchenIcon from '@mui/icons-material/Kitchen';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SpaIcon from '@mui/icons-material/Spa';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import PetsIcon from '@mui/icons-material/Pets';
import HandymanIcon from '@mui/icons-material/Handyman';
import LuggageIcon from '@mui/icons-material/Luggage';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '../api/productApi';
import { useAuthStore } from '../store/useAuthStore';
import type { Product, ProductComment, ProductVariant, VariantType } from '../types';
import toast from 'react-hot-toast';

// ─── Categories (Bazario — all product types) ───────────────────────────────
export type CatKey =
  | 'all' | 'electronique' | 'informatique' | 'telephonie'
  | 'mode-femme' | 'mode-homme' | 'mode-enfant' | 'chaussures'
  | 'maison-deco' | 'electromenager' | 'sport-fitness' | 'beaute-sante'
  | 'alimentation' | 'livres-culture' | 'jouets-jeux' | 'auto-moto'
  | 'jardin' | 'animalerie' | 'bricolage' | 'voyage-bagages' | 'bureau-papeterie';

export const CATEGORIES: { key: CatKey; label: string; icon: ReactNode; color: string }[] = [
  { key: 'all',              label: 'Tous',              icon: <GridViewIcon />,       color: '#1A237E' },
  { key: 'electronique',     label: 'Electronique',      icon: <ElectricBoltIcon />,   color: '#FF6B35' },
  { key: 'informatique',     label: 'Informatique',      icon: <ComputerIcon />,       color: '#1565C0' },
  { key: 'telephonie',       label: 'Telephonie',        icon: <PhoneAndroidIcon />,   color: '#6A1B9A' },
  { key: 'mode-femme',       label: 'Mode Femme',        icon: <CheckroomIcon />,      color: '#E91E63' },
  { key: 'mode-homme',       label: 'Mode Homme',        icon: <ManIcon />,            color: '#1976D2' },
  { key: 'mode-enfant',      label: 'Mode Enfant',       icon: <ChildCareIcon />,      color: '#FF9800' },
  { key: 'chaussures',       label: 'Chaussures',        icon: <CheckroomIcon />,      color: '#795548' },
  { key: 'maison-deco',      label: 'Maison & Deco',     icon: <HomeOutlinedIcon />,   color: '#009688' },
  { key: 'electromenager',   label: 'Electromenager',    icon: <KitchenIcon />,        color: '#607D8B' },
  { key: 'sport-fitness',    label: 'Sport & Fitness',   icon: <FitnessCenterIcon />,  color: '#4CAF50' },
  { key: 'beaute-sante',     label: 'Beaute & Sante',    icon: <SpaIcon />,            color: '#F06292' },
  { key: 'alimentation',     label: 'Alimentation',      icon: <ShoppingBasketIcon />, color: '#8BC34A' },
  { key: 'livres-culture',   label: 'Livres & Culture',  icon: <LibraryBooksIcon />,   color: '#5C6BC0' },
  { key: 'jouets-jeux',      label: 'Jouets & Jeux',     icon: <SmartToyIcon />,       color: '#FF5722' },
  { key: 'auto-moto',        label: 'Auto & Moto',       icon: <DirectionsCarIcon />,  color: '#78909C' },
  { key: 'jardin',           label: 'Jardin',            icon: <LocalFloristIcon />,   color: '#66BB6A' },
  { key: 'animalerie',       label: 'Animalerie',        icon: <PetsIcon />,           color: '#FFCA28' },
  { key: 'bricolage',        label: 'Bricolage',         icon: <HandymanIcon />,       color: '#FF7043' },
  { key: 'voyage-bagages',   label: 'Voyage & Bagages',  icon: <LuggageIcon />,        color: '#26C6DA' },
  { key: 'bureau-papeterie', label: 'Bureau',            icon: <WorkOutlineIcon />,    color: '#AB47BC' },
];

/** Returns the CatKey for a product based on its categorie slug. */
export function getCategory(libelle: string): CatKey {
  return 'all';
}

// Map backend category slug → CatKey (slugs match keys directly)
export const CATEGORIE_MAP: Record<string, CatKey> = {
  'electronique': 'electronique', 'informatique': 'informatique', 'telephonie': 'telephonie',
  'mode-femme': 'mode-femme', 'mode-homme': 'mode-homme', 'mode-enfant': 'mode-enfant',
  'chaussures': 'chaussures', 'maison-deco': 'maison-deco', 'electromenager': 'electromenager',
  'sport-fitness': 'sport-fitness', 'beaute-sante': 'beaute-sante', 'alimentation': 'alimentation',
  'livres-culture': 'livres-culture', 'jouets-jeux': 'jouets-jeux', 'auto-moto': 'auto-moto',
  'jardin': 'jardin', 'animalerie': 'animalerie', 'bricolage': 'bricolage',
  'voyage-bagages': 'voyage-bagages', 'bureau-papeterie': 'bureau-papeterie',
};

export const UNITE_LABEL: Record<string, string> = {
  PIECE: 'pce', METRE: 'm', BOBINE: 'bobine', LOT: 'lot', KG: 'kg', LITRE: 'L',
};

// ─── Dialog ───────────────────────────────────────────────────────────────────
function CommentSection({ productId }: { productId: number }) {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [name, setName] = useState(isAdmin ? (user?.fullName ?? user?.username ?? 'Admin') : '');
  const [content, setContent] = useState('');

  const { data: comments = [], isLoading } = useQuery<ProductComment[]>({
    queryKey: ['comments', productId],
    queryFn: () => productApi.getComments(productId),
    staleTime: 0,
  });

  const addMutation = useMutation({
    mutationFn: () => productApi.addComment(productId, name.trim(), content.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', productId] });
      setContent('');
      toast.success('Commentaire publié');
    },
    onError: () => toast.error('Erreur lors de la publication'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productApi.deleteComment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', productId] });
      toast.success('Commentaire supprimé');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const canSubmit = name.trim().length > 0 && content.trim().length > 0;

  return (
    <Box sx={{ borderTop: '1px solid', borderColor: 'divider', px: { xs: 2, sm: 3 }, py: 2.5 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
        Commentaires {comments.length > 0 && <Typography component="span" variant="body2" color="text.secondary">({comments.length})</Typography>}
      </Typography>

      {/* Form */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
        {!isAdmin && (
          <TextField
            size="small" label="Votre nom" value={name} onChange={(e) => setName(e.target.value)}
            inputProps={{ maxLength: 100 }} sx={{ maxWidth: 300 }}
          />
        )}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <TextField
            size="small" multiline minRows={2} fullWidth
            label="Laisser un commentaire…"
            value={content} onChange={(e) => setContent(e.target.value)}
            inputProps={{ maxLength: 1000 }}
          />
          <Button
            variant="contained" disabled={!canSubmit || addMutation.isPending}
            onClick={() => addMutation.mutate()}
            sx={{ flexShrink: 0, mt: 0.5, minWidth: 40, px: 1.5, py: 1.1 }}
          >
            {addMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <SendIcon fontSize="small" />}
          </Button>
        </Box>
      </Box>

      {/* List */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={24} /></Box>
      ) : comments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          Aucun commentaire pour l'instant. Soyez le premier !
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {comments.map((c) => (
            <Box key={c.id} sx={{
              display: 'flex', gap: 1.5, p: 1.5, borderRadius: 2,
              bgcolor: c.admin ? alpha('#1565C0', 0.05) : 'action.hover',
              border: c.admin ? '1px solid' : 'none',
              borderColor: c.admin ? alpha('#1565C0', 0.2) : 'transparent',
            }}>
              <Avatar sx={{ width: 34, height: 34, fontSize: '0.8rem', flexShrink: 0,
                bgcolor: c.admin ? '#1565C0' : '#757575' }}>
                {c.admin ? <AdminPanelSettingsIcon sx={{ fontSize: 18 }} /> : c.authorName[0].toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                  <Typography variant="body2" fontWeight={700}>{c.authorName}</Typography>
                  {c.admin && <Chip label="Admin" size="small" color="primary" sx={{ fontSize: '0.65rem', height: 18 }} />}
                  <Typography variant="caption" color="text.disabled">
                    {new Date(c.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{c.content}</Typography>
              </Box>
              {isAdmin && (
                <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(c.id)}
                  disabled={deleteMutation.isPending} sx={{ flexShrink: 0, alignSelf: 'flex-start' }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

export default function ProductDetailDialog({ product, added, onAdd, onClose }: {
  product: Product; added: boolean; onAdd: (qty: number) => void; onClose: () => void;
}) {
  const catKey: CatKey = product.categorie
    ? (CATEGORIE_MAP[product.categorie] ?? 'all')
    : getCategory(product.libelle);
  const cat = CATEGORIES.find((c) => c.key === catKey) ?? CATEGORIES[0];
  const uniteLabel = UNITE_LABEL[product.unite ?? 'PIECE'] ?? 'pce';
  const hasPromo = product.prixPromo != null && product.prixPromo > 0 && product.prixPromo < product.prix;
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(product.quantiteMin ?? 1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const images = product.images ?? [];

  // Group variants by type
  const variantGroups = (product.variants ?? []).reduce<Record<VariantType, ProductVariant[]>>(
    (acc, v) => { (acc[v.type] ??= []).push(v); return acc; },
    {} as Record<VariantType, ProductVariant[]>
  );
  const variantTypeLabels: Record<VariantType, string> = { SIZE: 'Taille', COLOR: 'Couleur', STORAGE: 'Stockage' };
  const [selectedVariants, setSelectedVariants] = useState<Partial<Record<VariantType, ProductVariant>>>({});

  // Effective price = base + max supplement of selected variants
  const totalSupplement = Object.values(selectedVariants).reduce((s, v) => s + (v?.prixSupplement ?? 0), 0);
  const effectivePrix = product.prix + totalSupplement;
  const effectivePrixPromo = product.prixPromo != null ? product.prixPromo + totalSupplement : null;

  const hasVariants = (product.variants ?? []).length > 0;

  useEffect(() => {
    setImgIdx(0); setQty(product.quantiteMin ?? 1); setIsZoomed(false); setSelectedVariants({});
  }, [product.id]);

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 2, overflow: 'hidden', maxHeight: '95vh' } }}>

      {/* ── Header bar ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#fafafa', flexShrink: 0 }}>
        <Chip label={cat.label} size="small"
          icon={<Box sx={{ color: cat.color, display: 'flex', '& svg': { fontSize: 13 } }}>{cat.icon}</Box>}
          sx={{ bgcolor: alpha(cat.color, 0.08), color: cat.color, fontWeight: 700, fontSize: '0.7rem', border: `1px solid ${alpha(cat.color, 0.25)}` }}
        />
        <Box sx={{ flex: 1 }} />
        <IconButton size="small" onClick={onClose}
          sx={{ bgcolor: alpha('#000', 0.05), '&:hover': { bgcolor: alpha('#000', 0.12) } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ overflow: 'auto', flex: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>

        {/* ── Left: image panel ── */}
        <Box sx={{
          flexShrink: 0, bgcolor: '#fff',
          width: { xs: '100%', sm: 360 },
          borderRight: { sm: '1px solid' }, borderColor: { sm: 'divider' },
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Main image */}
          <Box sx={{
            position: 'relative', overflow: 'hidden',
            height: { xs: 260, sm: 320 },
            display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2,
          }}>
            {images.length > 0 ? (
              <>
                <Box component="img"
                  src={productApi.imageUrl(images[imgIdx])}
                  alt={product.libelle}
                  sx={{
                    maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
                    transform: isZoomed ? 'scale(2.5)' : 'scale(1)',
                    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                    transition: isZoomed ? 'none' : 'transform 0.35s ease',
                    userSelect: 'none', pointerEvents: 'none',
                  }}
                />
                {/* Zoom overlay */}
                <Box
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setZoomOrigin({
                      x: ((e.clientX - rect.left) / rect.width) * 100,
                      y: ((e.clientY - rect.top) / rect.height) * 100,
                    });
                  }}
                  onMouseLeave={() => { if (!isZoomed) setZoomOrigin({ x: 50, y: 50 }); }}
                  onClick={() => setIsZoomed((z) => !z)}
                  sx={{
                    position: 'absolute', inset: 0, zIndex: 1,
                    cursor: isZoomed ? 'zoom-out' : 'zoom-in',
                    '&:hover .zoom-badge': { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
                  }}
                >
                  {!isZoomed && (
                    <Box className="zoom-badge" sx={{
                      position: 'absolute', top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%) scale(0.7)',
                      opacity: 0, transition: 'all 0.22s', pointerEvents: 'none',
                      bgcolor: alpha('#000', 0.52), borderRadius: '50%', p: 1.5, display: 'flex', color: '#fff',
                    }}>
                      <ZoomInIcon sx={{ fontSize: 36 }} />
                    </Box>
                  )}
                </Box>
                {images.length > 1 && (
                  <>
                    <IconButton size="small"
                      onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                      sx={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
                        bgcolor: '#fff', border: '1px solid', borderColor: 'divider', boxShadow: 2,
                        '&:hover': { bgcolor: '#f5f5f5' } }}>
                      <ArrowBackIosNewIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                    <IconButton size="small"
                      onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                      sx={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
                        bgcolor: '#fff', border: '1px solid', borderColor: 'divider', boxShadow: 2,
                        '&:hover': { bgcolor: '#f5f5f5' } }}>
                      <ArrowForwardIosIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                  </>
                )}
              </>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', color: cat.color, gap: 1 }}>
                <Box sx={{ bgcolor: alpha(cat.color, 0.08), borderRadius: 3, p: 4, display: 'flex' }}>{cat.icon}</Box>
                <Typography variant="caption" color="text.secondary">Pas de photo</Typography>
              </Box>
            )}
          </Box>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <Box sx={{
              display: 'flex', gap: 1, px: 1.5, pb: 1.5, pt: 1,
              borderTop: '1px solid', borderColor: 'divider',
              overflowX: 'auto', '&::-webkit-scrollbar': { height: 3 },
            }}>
              {images.map((url, i) => (
                <Box key={i} component="img" src={productApi.imageUrl(url)} alt=""
                  onClick={() => setImgIdx(i)}
                  sx={{
                    width: 60, height: 60, objectFit: 'contain', flexShrink: 0, p: 0.5,
                    border: '2px solid', borderColor: i === imgIdx ? cat.color : 'divider',
                    borderRadius: 1, cursor: 'pointer', bgcolor: '#fff',
                    opacity: i === imgIdx ? 1 : 0.55, transition: 'all 0.18s',
                    '&:hover': { opacity: 1, borderColor: alpha(cat.color, 0.5) },
                  }} />
              ))}
            </Box>
          )}
        </Box>

        {/* ── Right: product info ── */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, bgcolor: '#fff', p: { xs: 2, sm: 2.5 } }}>

          <Typography variant="h5" fontWeight={700}
            sx={{ lineHeight: 1.35, mb: 1, fontSize: { xs: '1rem', sm: '1.2rem' }, color: '#222' }}>
            {product.libelle}
          </Typography>

          {/* Reference + Marque */}
          {(product.reference || product.marque) && (
            <Box sx={{ display: 'flex', gap: 2.5, mb: 1.5, flexWrap: 'wrap' }}>
              {product.marque && (
                <Box>
                  <Typography sx={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.disabled', lineHeight: 1, mb: 0.4 }}>Marque</Typography>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#222' }}>{product.marque}</Typography>
                </Box>
              )}
              {product.reference && (
                <Box>
                  <Typography sx={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.disabled', lineHeight: 1, mb: 0.4 }}>Référence</Typography>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#555', fontFamily: 'monospace' }}>{product.reference}</Typography>
                </Box>
              )}
            </Box>
          )}

          {product.description && (
            <Typography variant="body2" color="text.secondary"
              sx={{ lineHeight: 1.75, mb: 2, fontSize: '0.87rem', borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
              {product.description}
            </Typography>
          )}

          {/* ── Variant selectors ── */}
          {hasVariants && Object.entries(variantGroups).map(([type, variants]) => (
            <Box key={type} sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}
                sx={{ letterSpacing: '0.07em', display: 'block', mb: 0.75 }}>
                {variantTypeLabels[type as VariantType].toUpperCase()}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {variants.map((v) => {
                  const selected = selectedVariants[type as VariantType]?.id === v.id;
                  const outOfStock = v.stock === 0;
                  return (
                    <Chip
                      key={v.id}
                      label={`${v.valeur}${v.prixSupplement > 0 ? ` +${v.prixSupplement.toFixed(0)}` : ''}`}
                      onClick={() => !outOfStock && setSelectedVariants((prev) => ({
                        ...prev,
                        [type]: selected ? undefined : v,
                      }))}
                      disabled={outOfStock}
                      variant={selected ? 'filled' : 'outlined'}
                      sx={{
                        fontWeight: selected ? 700 : 500,
                        bgcolor: selected ? cat.color : 'transparent',
                        color: selected ? '#fff' : outOfStock ? 'text.disabled' : 'text.primary',
                        borderColor: selected ? cat.color : outOfStock ? 'action.disabled' : 'divider',
                        textDecoration: outOfStock ? 'line-through' : 'none',
                        cursor: outOfStock ? 'not-allowed' : 'pointer',
                        '&:hover': !outOfStock && !selected ? { bgcolor: alpha(cat.color, 0.08), borderColor: cat.color } : {},
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          ))}

          <Box sx={{ flexGrow: 1 }} />

          {/* Price block */}
          <Box sx={{
            border: '1px solid', borderColor: alpha(cat.color, 0.3),
            borderRadius: 2, p: 1.5, mb: 2, bgcolor: alpha(cat.color, 0.03),
          }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}
              sx={{ letterSpacing: '0.08em', display: 'block', mb: 0.3 }}>PRIX UNITAIRE</Typography>
            {hasPromo ? (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                  <Typography fontWeight={900} sx={{ color: '#E53935', fontSize: { xs: '1.6rem', sm: '1.85rem' }, lineHeight: 1 }}>
                    {effectivePrixPromo!.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" fontWeight={600}>MAD / {uniteLabel}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                  <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.disabled' }}>
                    {effectivePrix.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD
                  </Typography>
                  <Chip size="small" label={`-${Math.round((1 - effectivePrixPromo! / effectivePrix) * 100)}%`}
                    sx={{ bgcolor: '#E53935', color: '#fff', fontWeight: 700, fontSize: '0.65rem', height: 18 }} />
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                <Typography fontWeight={900} color="primary.main"
                  sx={{ fontSize: { xs: '1.6rem', sm: '1.85rem' }, lineHeight: 1 }}>
                  {effectivePrix.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
                <Typography variant="body1" color="text.secondary" fontWeight={600}>MAD / {uniteLabel}</Typography>
              </Box>
            )}
            {qty > 1 && (
              <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">Total :</Typography>
                <Typography variant="body2" fontWeight={800} color={hasPromo ? '#E53935' : 'primary.main'}>
                  {((hasPromo ? effectivePrixPromo! : effectivePrix) * qty).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD
                </Typography>
              </Box>
            )}
          </Box>

          {/* Quantity */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}
              sx={{ letterSpacing: '0.07em', display: 'block', mb: 0.75 }}>QUANTITÉ</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', border: '1.5px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                <IconButton size="small" onClick={() => setQty((q) => Math.max(product.quantiteMin ?? 1, q - 1))} disabled={qty <= (product.quantiteMin ?? 1)}
                  sx={{ borderRadius: 0, width: 38, height: 38, '&:hover': { bgcolor: alpha('#000', 0.05) } }}>
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography sx={{ width: 48, textAlign: 'center', fontWeight: 700, fontSize: '1.05rem', userSelect: 'none' }}>
                  {qty}
                </Typography>
                <IconButton size="small" onClick={() => setQty((q) => Math.min(99, q + 1))} disabled={qty >= 99}
                  sx={{ borderRadius: 0, width: 38, height: 38, '&:hover': { bgcolor: alpha('#000', 0.05) } }}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
              {(product.quantiteMin ?? 1) > 1 && (
                <Typography variant="caption" color="text.secondary">
                  Min. {product.quantiteMin} {uniteLabel}(s)
                </Typography>
              )}
            </Box>
          </Box>

          {/* Add to cart */}
          <Button fullWidth size="large"
            variant={added ? 'outlined' : 'contained'} color={added ? 'success' : 'primary'}
            startIcon={added ? <CheckCircleIcon /> : <AddShoppingCartIcon />}
            onClick={() => onAdd(qty)}
            sx={{ py: 1.4, fontWeight: 700, fontSize: '1rem', borderRadius: 2, textTransform: 'none' }}>
            {added ? 'Ajouté au panier !' : (qty > 1 ? `Ajouter (×${qty}) au panier` : 'Ajouter au panier')}
          </Button>
        </Box>
      </Box>

        <CommentSection productId={product.id} />
      </Box>
    </Dialog>
  );
}
