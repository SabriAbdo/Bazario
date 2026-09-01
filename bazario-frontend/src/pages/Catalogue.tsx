import { useState, useMemo, useEffect } from 'react';
import {
  Box, TextField, InputAdornment, Grid, Card, CardContent, CardActions,
  Typography, Button, Chip, Skeleton, Alert, alpha,
  IconButton, Tooltip, Collapse, Select, MenuItem,
  FormControl, InputLabel, Badge, Switch, FormControlLabel,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import TuneIcon from '@mui/icons-material/Tune';
import SortIcon from '@mui/icons-material/Sort';
import ClearIcon from '@mui/icons-material/Clear';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import BoltIcon from '@mui/icons-material/Bolt';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import PowerIcon from '@mui/icons-material/Power';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ElectricMeterIcon from '@mui/icons-material/ElectricMeter';
import GridViewIcon from '@mui/icons-material/GridView';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ProductDetailDialog, { CATEGORIES, CATEGORIE_MAP, UNITE_LABEL, getCategory } from '../components/ProductDetailDialog';
import type { CatKey } from '../components/ProductDetailDialog';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { productApi } from '../api/productApi';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import type { Product } from '../types';
import { useTranslation } from 'react-i18next';

const PAGE_SIZE = 24;

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, added, onAdd, onDetails, isStockOrAdmin, onEdit, onDelete }: {
  product: Product; added: boolean; onAdd: () => void; onDetails: () => void;
  isStockOrAdmin?: boolean; onEdit?: () => void; onDelete?: () => void;
}) {
  const catKey = product.categorie
    ? (CATEGORIE_MAP[product.categorie] ?? 'all')
    : getCategory(product.libelle);
  const cat = CATEGORIES.find((c) => c.key === catKey) ?? CATEGORIES[0];
  const uniteLabel = UNITE_LABEL[product.unite ?? 'PIECE'] ?? 'pce';
  const hasPromo = product.prixPromo != null && product.prixPromo > 0 && product.prixPromo < product.prix;
  const [confirming, setConfirming] = useState(false);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top: image OR color band + icon */}
      {product.images?.length > 0 ? (
        <Box onClick={onDetails} sx={{ height: 160, overflow: 'hidden', position: 'relative', bgcolor: '#f5f5f5', cursor: 'pointer' }}>
          <Box component="img"
            src={productApi.imageUrl(product.images[0])}
            alt={product.libelle}
            sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.04)' } }}
          />
          <Chip label={cat.label} size="small"
            sx={{ position: 'absolute', top: 8, left: 8, bgcolor: alpha(cat.color, 0.9), color: '#fff', fontWeight: 700, fontSize: '0.62rem', height: 20 }} />
        </Box>
      ) : (
        <>
          <Box sx={{ bgcolor: cat.color, height: 6 }} />
          <Box sx={{
            bgcolor: alpha(cat.color, 0.06), px: 2, pt: 2, pb: 1,
            display: 'flex', alignItems: 'center', gap: 1.5,
          }}>
            <Box sx={{
              bgcolor: alpha(cat.color, 0.15), borderRadius: 2, p: 1,
              display: 'flex', color: cat.color, flexShrink: 0,
            }}>
              {cat.icon}
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Chip
                label={cat.label}
                size="small"
                sx={{ bgcolor: alpha(cat.color, 0.12), color: cat.color, fontWeight: 700, fontSize: '0.65rem', height: 20 }}
              />
            </Box>
          </Box>
        </>
      )}

      <CardContent sx={{ flexGrow: 1, px: 2, py: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom
          sx={{ lineHeight: 1.3, fontSize: '0.95rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {product.libelle}
        </Typography>

        {/* Reference + Marque chips */}
        {(product.reference || product.marque) && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.75 }}>
            {product.reference && (
              <Chip size="small" label={`Réf. ${product.reference}`}
                sx={{ bgcolor: alpha('#0D1E36', 0.06), color: '#0D1E36', fontWeight: 600,
                  fontSize: '0.62rem', height: 18, border: '1px solid', borderColor: alpha('#0D1E36', 0.15) }} />
            )}
            {product.marque && (
              <Chip size="small" label={product.marque}
                sx={{ bgcolor: alpha(cat.color, 0.08), color: cat.color, fontWeight: 700,
                  fontSize: '0.62rem', height: 18, border: `1px solid ${alpha(cat.color, 0.2)}` }} />
            )}
          </Box>
        )}

        {product.description && (
          <Typography variant="body2" color="text.secondary"
            sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '0.8rem', lineHeight: 1.4 }}>
            {product.description}
          </Typography>
        )}
      </CardContent>

      {/* Price block */}
      <Box sx={{ px: 2, pb: 0.5 }}>
        {hasPromo ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
              <Typography variant="h6" fontWeight={800} sx={{ fontSize: '1.15rem', color: '#E53935' }}>
                {product.prixPromo!.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>MAD / {uniteLabel}</Typography>
              <Chip size="small" label={`-${Math.round((1 - product.prixPromo! / product.prix) * 100)}%`}
                sx={{ bgcolor: '#E53935', color: '#fff', fontWeight: 700, fontSize: '0.58rem', height: 16, ml: 0.25 }} />
            </Box>
            <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.disabled', fontSize: '0.72rem' }}>
              {product.prix.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD
            </Typography>
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
            <Typography variant="h6" fontWeight={800} color="primary.main" sx={{ fontSize: '1.15rem' }}>
              {product.prix.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>MAD / {uniteLabel}</Typography>
          </Box>
        )}
      </Box>

      <CardActions sx={{ px: 2, pb: 2, pt: 0.5, gap: 1, flexDirection: 'column' }}>
        <Button
          size="small" fullWidth variant={added ? 'outlined' : 'contained'} color={added ? 'success' : 'primary'}
          startIcon={added ? <CheckCircleIcon fontSize="small" /> : <AddShoppingCartIcon fontSize="small" />}
          onClick={onAdd}
          sx={{ fontSize: '0.8rem' }}
        >
          {added ? 'Ajouté !' : 'Ajouter au panier'}
        </Button>
        <Button
          size="small" fullWidth variant="outlined" color="inherit"
          startIcon={<InfoOutlinedIcon fontSize="small" />}
          onClick={onDetails}
          sx={{ fontSize: '0.78rem', color: 'text.secondary', borderColor: 'divider', '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}
        >
          Voir plus de détails
        </Button>

        {isStockOrAdmin && (
          <Box sx={{ display: 'flex', width: '100%', gap: 1, pt: 0.5, borderTop: '1px dashed', borderColor: 'divider' }}>
            <Tooltip title="Modifier" placement="top">
              <Button size="small" fullWidth variant="outlined" color="primary"
                startIcon={<EditIcon fontSize="small" />}
                onClick={onEdit}
                sx={{ fontSize: '0.75rem', py: 0.4 }}>
                Modifier
              </Button>
            </Tooltip>
            {!confirming ? (
              <Tooltip title="Supprimer" placement="top">
                <Button size="small" fullWidth variant="outlined" color="error"
                  startIcon={<DeleteIcon fontSize="small" />}
                  onClick={() => setConfirming(true)}
                  sx={{ fontSize: '0.75rem', py: 0.4 }}>
                  Supprimer
                </Button>
              </Tooltip>
            ) : (
              <Box sx={{ display: 'flex', flex: 1, alignItems: 'center', gap: 0.5, pl: 0.5 }}>
                <Typography variant="caption" color="error.main" fontWeight={700} sx={{ flex: 1 }}>Confirmer ?</Typography>
                <Tooltip title="Oui, supprimer">
                  <IconButton size="small" color="error" onClick={() => { setConfirming(false); onDelete?.(); }}>
                    <CheckIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Annuler">
                  <IconButton size="small" onClick={() => setConfirming(false)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
        )}
      </CardActions>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Catalogue() {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<CatKey>(() => (searchParams.get('cat') as CatKey) ?? 'all');
  const [justAdded, setJustAdded] = useState<Set<number>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [promoOnly, setPromoOnly] = useState(false);
  const [filterMarque, setFilterMarque] = useState('');
  const [filterUnite, setFilterUnite] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'prix_asc' | 'prix_desc' | 'name_asc' | 'name_desc'>('default');
  const [page, setPage] = useState(0);
  const addItem = useCartStore((s) => s.addItem);
  const { user } = useAuthStore();
  const isStockOrAdmin = user?.role === 'STOCK_OPERATEUR' || user?.role === 'ADMIN';
  const navigate = useNavigate();
  const qc = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produit supprimé');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  // Debounced filter values sent to backend
  const [debouncedSearch, setDebouncedSearch] = useState('');  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const [debouncedPriceMin, setDebouncedPriceMin] = useState('');
  const [debouncedPriceMax, setDebouncedPriceMax] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedPriceMin(priceMin); setDebouncedPriceMax(priceMax); }, 600);
    return () => clearTimeout(t);
  }, [priceMin, priceMax]);

  // Map sort state to backend sort params
  const backendSort = useMemo(() => {
    switch (sortBy) {
      case 'prix_asc':  return { sort: 'prix', sortDir: 'asc' };
      case 'prix_desc': return { sort: 'prix', sortDir: 'desc' };
      case 'name_asc':  return { sort: 'libelle', sortDir: 'asc' };
      case 'name_desc': return { sort: 'libelle', sortDir: 'desc' };
      default:          return { sort: 'createdAt', sortDir: 'desc' };
    }
  }, [sortBy]);

  // Reset to page 0 when filters change
  useEffect(() => { setPage(0); }, [debouncedSearch, backendSort, activeCategory, filterMarque, debouncedPriceMin, debouncedPriceMax]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', debouncedSearch, backendSort, page, activeCategory, filterMarque, debouncedPriceMin, debouncedPriceMax],
    queryFn: () => productApi.getAll({
      q: debouncedSearch || undefined,
      categorie: activeCategory !== 'all' ? activeCategory : undefined,
      marque: filterMarque || undefined,
      minPrix: debouncedPriceMin ? parseFloat(debouncedPriceMin) : undefined,
      maxPrix: debouncedPriceMax ? parseFloat(debouncedPriceMax) : undefined,
      page, size: PAGE_SIZE, ...backendSort,
    }),
  });

  const visible = useMemo(() => {
    let result = (data?.content ?? []).filter((p) => p.prixActif);

    // Promo only — client-side (backend doesn't have this filter)
    if (promoOnly) result = result.filter((p) => p.prixPromo != null && p.prixPromo > 0 && p.prixPromo < p.prix);

    // Unite filter — client-side
    if (filterUnite) result = result.filter((p) => (p.unite ?? 'PIECE') === filterUnite);

    // Sort client-side for local filters (backend handles primary sort by field/dir)
    if (sortBy === 'prix_asc') return [...result].sort((a, b) => (a.prixPromo ?? a.prix) - (b.prixPromo ?? b.prix));
    if (sortBy === 'prix_desc') return [...result].sort((a, b) => (b.prixPromo ?? b.prix) - (a.prixPromo ?? a.prix));
    if (sortBy === 'name_asc') return [...result].sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr'));
    if (sortBy === 'name_desc') return [...result].sort((a, b) => b.libelle.localeCompare(a.libelle, 'fr'));
    return result;
  }, [data, activeCategory, search, priceMin, priceMax, promoOnly, filterMarque, filterUnite, sortBy]);

  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const handleAdd = (product: Product, qty = 1) => {
    addItem(product, qty);
    toast.success(`${qty > 1 ? `${qty}× ` : ''}${product.libelle} ajouté au panier`, { duration: 1800 });
    setJustAdded((prev) => { const s = new Set(prev); s.add(product.id); return s; });
    setTimeout(() => setJustAdded((prev) => { const s = new Set(prev); s.delete(product.id); return s; }), 2000);
  };

  const allLoaded = (data?.content ?? []).filter((p) => p.prixActif);

  const categoryCount = (key: CatKey) => {
    if (key === 'all') return totalElements;
    return allLoaded.filter((p) => {
      const k = p.categorie ? (CATEGORIE_MAP[p.categorie] ?? 'all') : getCategory(p.libelle);
      return k === key;
    }).length;
  };

  const availableMarques = useMemo(() =>
    [...new Set((allLoaded.filter((p) => p.marque) ?? []).map((p) => p.marque!))].sort((a, b) => a.localeCompare(b, 'fr'))
  , [allLoaded]);

  const activeFilterCount = [priceMin, priceMax, promoOnly, filterMarque, filterUnite].filter(Boolean).length + (sortBy !== 'default' ? 1 : 0);

  const resetFilters = () => {
    setSearch('');
    setActiveCategory('all');
    setPriceMin('');
    setPriceMax('');
    setPromoOnly(false);
    setFilterMarque('');
    setFilterUnite('');
    setSortBy('default');
  };

  return (
    <Box>
      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <Box sx={{
        background: 'linear-gradient(135deg, #0D1E36 0%, #0a2744 50%, #0D1E36 100%)',
        position: 'relative', overflow: 'hidden',
        px: { xs: 3, md: 8 }, py: { xs: 5, md: 7 },
      }}>
        {/* Circuit pattern overlay */}
        <Box sx={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: `
            repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px),
            repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px)
          `,
        }} />
        {/* Decorative icons */}
        <BoltIcon sx={{ position: 'absolute', top: 24, right: '12%', fontSize: 120, color: alpha('#FF6B35', 0.06) }} />
        <GridViewIcon sx={{ position: 'absolute', bottom: 16, right: '5%', fontSize: 60, color: alpha('#FF6B35', 0.08) }} />

        <Box sx={{ position: 'relative', maxWidth: 680 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box sx={{ bgcolor: '#FF6B35', borderRadius: 1, px: 1.5, py: 0.4, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
              <GridViewIcon sx={{ fontSize: 14, color: '#fff' }} />
              <Typography sx={{ fontSize: '0.7rem', color: '#fff', fontWeight: 700, letterSpacing: '0.12em' }}>
                BAZARIO MARKETPLACE
              </Typography>
            </Box>
          </Box>

          <Typography variant="h2" sx={{ color: '#fff', mb: 1.5, fontSize: { xs: '2rem', md: '2.8rem' } }}>
            {t('home.tagline')}
          </Typography>
          <Typography sx={{ color: alpha('#fff', 0.7), mb: 4, fontSize: '1rem', maxWidth: 500 }}>
            {t('home.subtitle')}
          </Typography>

          {/* Search */}
          <TextField
            placeholder={t('catalogue.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: alpha('#fff', 0.6) }} /></InputAdornment> }}
            sx={{
              maxWidth: 520, width: '100%',
              '& .MuiOutlinedInput-root': {
                bgcolor: alpha('#fff', 0.1), borderRadius: 2,
                color: '#fff', fontSize: '0.9rem',
                '& fieldset': { borderColor: alpha('#fff', 0.2) },
                '&:hover fieldset': { borderColor: alpha('#FF6B35', 0.6) },
                '&.Mui-focused fieldset': { borderColor: '#FF6B35' },
              },
              '& input::placeholder': { color: alpha('#fff', 0.5) },
            }}
          />

          {/* Stats row */}
          <Box sx={{ display: 'flex', gap: 3, mt: 3, flexWrap: 'wrap' }}>
            {[
              { label: 'Produits', value: totalElements || '…' },
              { label: 'Catégories', value: 20 },
              { label: 'Livraison', value: 'Rapide' },
            ].map((s) => (
              <Box key={s.label} sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography sx={{ color: '#FF6B35', fontWeight: 800, fontSize: '1.25rem', lineHeight: 1 }}>{s.value}</Typography>
                <Typography sx={{ color: alpha('#fff', 0.55), fontSize: '0.72rem', letterSpacing: '0.08em' }}>{s.label.toUpperCase()}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ── Category Filter ──────────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid', borderColor: 'divider', px: { xs: 2, md: 4 }, py: 1.5 }}>
        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5, '&::-webkit-scrollbar': { height: 3 } }}>
          {CATEGORIES.map((cat) => {
            const count = categoryCount(cat.key);
            const active = activeCategory === cat.key;
            return (
              <Chip
                key={cat.key}
                icon={<Box sx={{ color: active ? '#fff' : cat.color, display: 'flex', '& svg': { fontSize: 16 } }}>{cat.icon}</Box>}
                label={`${cat.label}${count > 0 ? ` (${count})` : ''}`}
                onClick={() => setActiveCategory(cat.key)}
                sx={{
                  borderRadius: 6, fontWeight: active ? 700 : 500,
                  fontSize: '0.8rem', whiteSpace: 'nowrap', cursor: 'pointer',
                  bgcolor: active ? cat.color : alpha(cat.color, 0.08),
                  color: active ? '#fff' : cat.color,
                  border: `1px solid ${active ? cat.color : alpha(cat.color, 0.3)}`,
                  '& .MuiChip-label': { pl: 0.5 },
                  '&:hover': { bgcolor: active ? cat.color : alpha(cat.color, 0.16) },
                  flexShrink: 0,
                }}
              />
            );
          })}
        </Box>
      </Box>

      {/* ── Advanced Filters Bar ─────────────────────────────────────────── */}
      <Box sx={{ bgcolor: '#f8f9fa', borderBottom: '1px solid', borderColor: 'divider', px: { xs: 2, md: 4 }, py: 1.25 }}>
        {/* Always-visible row: filter toggle + sort */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Badge badgeContent={activeFilterCount} color="primary" max={9}>
            <Button
              size="small"
              variant={filtersOpen ? 'contained' : 'outlined'}
              color="primary"
              startIcon={<TuneIcon sx={{ fontSize: '1rem !important' }} />}
              onClick={() => setFiltersOpen((v) => !v)}
              sx={{ fontWeight: 600, fontSize: '0.8rem', borderRadius: 6, textTransform: 'none' }}
            >
              Filtres avancés
            </Button>
          </Badge>

          {/* Active filter chips summary */}
          {promoOnly && (
            <Chip size="small" icon={<LocalOfferIcon sx={{ fontSize: '12px !important' }} />} label="Promo" color="error"
              onDelete={() => setPromoOnly(false)} sx={{ fontWeight: 700, fontSize: '0.72rem', height: 22 }} />
          )}
          {filterMarque && (
            <Chip size="small" label={`Marque: ${filterMarque}`} color="primary" variant="outlined"
              onDelete={() => setFilterMarque('')} sx={{ fontSize: '0.72rem', height: 22 }} />
          )}
          {filterUnite && (
            <Chip size="small" label={`Unité: ${UNITE_LABEL[filterUnite] ?? filterUnite}`} color="primary" variant="outlined"
              onDelete={() => setFilterUnite('')} sx={{ fontSize: '0.72rem', height: 22 }} />
          )}
          {(priceMin || priceMax) && (
            <Chip size="small"
              label={priceMin && priceMax ? `${priceMin}–${priceMax} MAD` : priceMin ? `≥ ${priceMin} MAD` : `≤ ${priceMax} MAD`}
              color="primary" variant="outlined"
              onDelete={() => { setPriceMin(''); setPriceMax(''); }} sx={{ fontSize: '0.72rem', height: 22 }} />
          )}

          <Box sx={{ flex: 1 }} />

          {/* Sort */}
          <FormControl size="small" sx={{ minWidth: 185 }}>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              displayEmpty
              startAdornment={<SortIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />}
              sx={{ fontSize: '0.8rem', borderRadius: 2 }}
            >
              <MenuItem value="default">{t('catalogue.sort_relevant')}</MenuItem>
              <MenuItem value="prix_asc">{t('catalogue.sort_price_asc')}</MenuItem>
              <MenuItem value="prix_desc">{t('catalogue.sort_price_desc')}</MenuItem>
              <MenuItem value="name_asc">Nom A → Z</MenuItem>
              <MenuItem value="name_desc">Nom Z → A</MenuItem>
            </Select>
          </FormControl>

          {(activeFilterCount > 0 || search) && (
            <Button size="small" color="error" variant="outlined"
              startIcon={<ClearIcon sx={{ fontSize: '0.9rem !important' }} />}
              onClick={resetFilters}
              sx={{ fontSize: '0.78rem', borderRadius: 6, textTransform: 'none' }}>
              Réinitialiser
            </Button>
          )}
        </Box>

        {/* Collapsible advanced filters */}
        <Collapse in={filtersOpen}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, pt: 1.5, pb: 0.5, alignItems: 'flex-end' }}>

            {/* Price range */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                label="Prix min" value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                type="number" size="small" inputProps={{ min: 0, step: 1 }}
                sx={{ width: 105, '& input': { fontSize: '0.85rem' } }}
              />
              <Typography variant="body2" color="text.disabled">—</Typography>
              <TextField
                label="Prix max" value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                type="number" size="small" inputProps={{ min: 0, step: 1 }}
                sx={{ width: 105, '& input': { fontSize: '0.85rem' } }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>MAD</Typography>
            </Box>

            {/* Promo toggle */}
            <FormControlLabel
              control={<Switch checked={promoOnly} onChange={(e) => setPromoOnly(e.target.checked)} size="small" color="error" />}
              label={
                <Typography variant="body2" fontWeight={promoOnly ? 700 : 400}
                  color={promoOnly ? 'error.main' : 'text.secondary'}>
                  Promo uniquement
                </Typography>
              }
              sx={{ m: 0 }}
            />

            {/* Marque */}
            {availableMarques.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('catalogue.brand')}</InputLabel>
                <Select value={filterMarque} label="Marque"
                  onChange={(e) => setFilterMarque(e.target.value)}
                  sx={{ fontSize: '0.85rem' }}>
                  <MenuItem value=""><em>Toutes</em></MenuItem>
                  {availableMarques.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </Select>
              </FormControl>
            )}

            {/* Unite */}
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Unité</InputLabel>
              <Select value={filterUnite} label="Unité"
                onChange={(e) => setFilterUnite(e.target.value)}
                sx={{ fontSize: '0.85rem' }}>
                <MenuItem value=""><em>Toutes</em></MenuItem>
                <MenuItem value="PIECE">Pièce</MenuItem>
                <MenuItem value="METRE">Mètre</MenuItem>
                <MenuItem value="BOBINE">Bobine</MenuItem>
                <MenuItem value="LOT">Lot</MenuItem>
              </Select>
            </FormControl>

          </Box>
        </Collapse>
      </Box>

      {/* ── Product Grid ─────────────────────────────────────────────────────── */}
      <Box sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
        {isError && <Alert severity="error" sx={{ mb: 3 }}>Erreur lors du chargement des produits.</Alert>}

        {!isLoading && visible.length > 0 && (
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>{visible.length}</strong> produit{visible.length > 1 ? 's' : ''} trouvé{visible.length > 1 ? 's' : ''}
              {activeCategory !== 'all' && ` dans "${CATEGORIES.find((c) => c.key === activeCategory)?.label}"`}
            </Typography>
          </Box>
        )}

        <Grid container spacing={2.5}>
          {isLoading && Array.from({ length: 8 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={`skel-${i}`}>
              <Card sx={{ height: '100%', borderRadius: 3 }}>
                <Skeleton variant="rectangular" height={180} sx={{ transform: 'none' }} />
                <CardContent sx={{ pb: 1 }}>
                  <Skeleton variant="text" width="35%" height={20} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="75%" height={26} sx={{ mb: 0.5 }} />
                  <Skeleton variant="text" width="50%" height={20} />
                  <Skeleton variant="text" width="40%" height={28} sx={{ mt: 1 }} />
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Skeleton variant="rectangular" width="100%" height={36} sx={{ borderRadius: 2 }} />
                </CardActions>
              </Card>
            </Grid>
          ))}
          <AnimatePresence mode="popLayout">
            {visible.map((product, i) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.3) }}
                  style={{ height: '100%' }}
                >
                  <ProductCard
                    product={product}
                    added={justAdded.has(product.id)}
                    onAdd={() => handleAdd(product)}
                    onDetails={() => setSelectedProduct(product)}
                    isStockOrAdmin={isStockOrAdmin}
                    onEdit={() => navigate(`/stock/produits/${product.id}/edit`)}
                    onDelete={() => deleteMutation.mutate(product.id)}
                  />
                </motion.div>
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mt: 4, mb: 2 }}>
            <IconButton
              disabled={page === 0}
              onClick={() => { setPage((p) => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              color="primary"
            >
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="body2" color="text.secondary">
              {page + 1} / {totalPages}
            </Typography>
            <IconButton
              disabled={page >= totalPages - 1}
              onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              color="primary"
            >
              <ChevronRightIcon />
            </IconButton>
          </Box>
        )}

        {!isLoading && visible.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <BoltIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">{t('catalogue.no_results')}</Typography>
            <Button sx={{ mt: 2 }} onClick={() => { setSearch(''); setActiveCategory('all'); }}>
              {t('common.retry')}
            </Button>
          </Box>
        )}
      </Box>

      {/* ── Detail Dialog ─────────────────────────────────────────────────────── */}
      {selectedProduct && (
        <ProductDetailDialog
          product={selectedProduct}
          added={justAdded.has(selectedProduct.id)}
          onAdd={(qty) => handleAdd(selectedProduct, qty)}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </Box>
  );
}

