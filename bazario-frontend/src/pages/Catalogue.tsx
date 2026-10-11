import { useState, useMemo, useEffect, useRef } from 'react';
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
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import ProductDetailDialog, { UNITE_LABEL } from '../components/ProductDetailDialog';
import { buildCategoryDisplays, findCategoryDisplay, findCategoryDisplays, ALL_CATEGORY } from '../utils/categoryDisplay';
import type { CategoryDisplay } from '../utils/categoryDisplay';
import CategoryHoverCard from '../components/common/CategoryHoverCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import LinearProgress from '@mui/material/LinearProgress';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { productApi } from '../api/productApi';
import { categoryApi } from '../api/miscApi';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useWishlist } from '@/hooks/useWishlist';
import { useLikes } from '@/hooks/useLikes';
import toast from 'react-hot-toast';
import type { Category, Product } from '../types';
import { useTranslation } from 'react-i18next';

const PAGE_SIZE = 24;

// ─── Product Card ─────────────────────────────────────────────────────────────
export function ProductCard({ product, categoryDisplays, added, onAdd, onDetails, isStockOrAdmin, onEdit, onDelete }: {
  product: Product; categoryDisplays: CategoryDisplay[]; added: boolean; onAdd: () => void; onDetails: () => void;
  isStockOrAdmin?: boolean; onEdit?: () => void; onDelete?: () => void;
}) {
  const productCats = findCategoryDisplays(categoryDisplays, product.categories);
  const cat = productCats[0];
  const catLabel = productCats.length > 1 ? `${cat.label} +${productCats.length - 1}` : cat.label;
  const uniteLabel = UNITE_LABEL[product.unite ?? 'PIECE'] ?? 'pce';
  const hasPromo = product.prixPromo != null && product.prixPromo > 0 && product.prixPromo < product.prix;
  const [confirming, setConfirming] = useState(false);
  const navigate = useNavigate();
  const { isClient, ids: wishlistIds, toggle: toggleWishlist } = useWishlist();
  const { ids: likeIds, toggle: toggleLike } = useLikes();
  const isWishlisted = wishlistIds.has(product.id);
  const isLiked = likeIds.has(product.id);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isClient) {
      toast('Connectez-vous avec un compte Client pour utiliser la liste de souhaits');
      navigate('/login');
      return;
    }
    toggleWishlist(product.id);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isClient) {
      toast('Connectez-vous avec un compte Client pour aimer un produit');
      navigate('/login');
      return;
    }
    toggleLike(product.id);
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <Box sx={{ position: 'absolute', top: 6, right: 6, zIndex: 2, display: 'flex', gap: 0.5 }}>
        <Tooltip title={isLiked ? 'Ne plus aimer' : 'Aimer ce produit'}>
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 0.25, borderRadius: 5,
            bgcolor: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: '#fff' }, pr: 0.75,
          }}>
            <IconButton size="small" onClick={handleLikeClick}>
              {isLiked ? <FavoriteIcon fontSize="small" color="error" /> : <FavoriteBorderIcon fontSize="small" />}
            </IconButton>
            <Typography variant="caption" fontWeight={700} color="text.secondary">
              {product.likesCount ?? 0}
            </Typography>
          </Box>
        </Tooltip>
        <Tooltip title={isWishlisted ? 'Retirer de la liste de souhaits' : 'Ajouter à la liste de souhaits'}>
          <IconButton size="small" onClick={handleWishlistClick}
            sx={{
              bgcolor: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: '#fff' },
            }}>
            {isWishlisted ? <BookmarkAddedIcon fontSize="small" color="primary" /> : <BookmarkAddIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Top: product image, or category picture + label when no product photo */}
      {product.images?.length > 0 ? (
        <Box onClick={onDetails} sx={{ height: 160, overflow: 'hidden', position: 'relative', bgcolor: '#f5f5f5', cursor: 'pointer' }}>
          <Box component="img"
            src={productApi.imageUrl(product.images[0])}
            alt={product.libelle}
            sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.04)' } }}
          />
          <Box sx={{
            position: 'absolute', top: 8, left: 8, display: 'flex', alignItems: 'center', gap: 0.5,
            bgcolor: alpha('#000', 0.55), borderRadius: 10, px: 1, py: 0.25,
          }}>
            <Box sx={{ width: 16, height: 16, borderRadius: '50%', overflow: 'hidden', display: 'flex', color: '#fff', '& svg': { fontSize: 14 }, '& img': { width: '100%', height: '100%', objectFit: 'cover' } }}>
              {cat.icon}
            </Box>
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.62rem', lineHeight: 1 }}>
              {catLabel}
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box sx={{ px: 2, pt: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box sx={{
            width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, bgcolor: '#f5f5f5',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary', '& svg': { fontSize: 18 },
            '& img': { width: '100%', height: '100%', objectFit: 'cover' },
          }}>
            {cat.icon}
          </Box>
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {catLabel}
          </Typography>
        </Box>
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
  const [search, setSearch] = useState<string>(() => searchParams.get('q') ?? '');
  const [activeCategory, setActiveCategory] = useState<string>(() => searchParams.get('cat') ?? 'all');
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

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
  });
  const categoryDisplays = useMemo(() => [ALL_CATEGORY, ...buildCategoryDisplays(categories)], [categories]);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const scrollCategories = (dir: 'left' | 'right') =>
    categoryScrollRef.current?.scrollBy({ left: dir === 'right' ? 240 : -240, behavior: 'smooth' });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produit supprimé');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  // Debounced filter values sent to backend
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get('q') ?? '');
  useEffect(() => {
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

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['products', debouncedSearch, backendSort, page, activeCategory, filterMarque, debouncedPriceMin, debouncedPriceMax],
    queryFn: () => productApi.getAll({
      q: debouncedSearch || undefined,
      categorie: activeCategory !== 'all' ? activeCategory : undefined,
      marque: filterMarque || undefined,
      minPrix: debouncedPriceMin ? parseFloat(debouncedPriceMin) : undefined,
      maxPrix: debouncedPriceMax ? parseFloat(debouncedPriceMax) : undefined,
      page, size: PAGE_SIZE, ...backendSort,
    }),
    // Keep showing the previous category's products while the new ones load, for a smooth cross-fade instead of a jarring flash-to-skeleton.
    placeholderData: keepPreviousData,
  });
  const showSkeleton = isLoading && !data;
  const isSwitching = isFetching && !!data;

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

  const categoryCount = (key: string) => {
    if (key === 'all') return totalElements;
    if (key === 'none') return allLoaded.filter((p) => !p.categories || p.categories.length === 0).length;
    return allLoaded.filter((p) => p.categories?.includes(key)).length;
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
      {/* ── Slim page header: title + search (hero/marketing lives on Home) ─── */}
      <Box sx={{
        bgcolor: '#0D1E36', px: { xs: 2, md: 4 }, py: 2.5,
        display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GridViewIcon sx={{ fontSize: 20, color: '#FF6B35' }} />
          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.15rem' }}>
            {t('catalogue.title')}
          </Typography>
          <Typography sx={{ color: alpha('#fff', 0.55), fontSize: '0.78rem' }}>
            {(totalElements || 0).toLocaleString('fr-MA')} {t('catalogue.products_count_suffix')}
          </Typography>
        </Box>

        <TextField
          placeholder={t('catalogue.search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: alpha('#fff', 0.6), fontSize: 18 }} /></InputAdornment> }}
          sx={{
            flex: 1, minWidth: 220, maxWidth: 480, ml: { md: 'auto' },
            '& .MuiOutlinedInput-root': {
              bgcolor: alpha('#fff', 0.1), borderRadius: 2,
              color: '#fff', fontSize: '0.85rem',
              '& fieldset': { borderColor: alpha('#fff', 0.2) },
              '&:hover fieldset': { borderColor: alpha('#FF6B35', 0.6) },
              '&.Mui-focused fieldset': { borderColor: '#FF6B35' },
            },
            '& input::placeholder': { color: alpha('#fff', 0.5) },
          }}
        />
      </Box>

      {/* ── Category Filter ──────────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid', borderColor: 'divider', px: { xs: 2, md: 4 }, py: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            size="small" onClick={() => scrollCategories('left')}
            sx={{ flexShrink: 0, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <Box
            ref={categoryScrollRef}
            sx={{
              display: 'flex', gap: 2.5, overflowX: 'auto', overflowY: 'hidden', px: 0.5, pt: 0.5, pb: 1.5,
              scrollBehavior: 'smooth',
              '&::-webkit-scrollbar': { height: 5 },
              '&::-webkit-scrollbar-thumb': { bgcolor: alpha('#0D1E36', 0.15), borderRadius: 4 },
            }}
          >
            {categoryDisplays.map((cat) => {
              const count = categoryCount(cat.key);
              const active = activeCategory === cat.key;
              return (
                <CategoryHoverCard key={cat.key} label={cat.label} imageUrl={cat.imageUrl} description={cat.description}>
                <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.94 }} style={{ flexShrink: 0 }}>
                  <Box
                    onClick={() => setActiveCategory(cat.key)}
                    sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75, cursor: 'pointer', width: 82 }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <Box sx={{
                        width: 68, height: 68, borderRadius: '50%', p: '3px', display: 'flex',
                        background: active
                          ? `linear-gradient(135deg, ${cat.color}, ${alpha(cat.color, 0.5)})`
                          : `linear-gradient(135deg, ${alpha(cat.color, 0.18)}, ${alpha(cat.color, 0.06)})`,
                        boxShadow: active ? `0 8px 18px ${alpha(cat.color, 0.4)}` : `0 2px 6px ${alpha('#0D1E36', 0.08)}`,
                        transition: 'all 0.25s ease',
                      }}>
                        <Box sx={{
                          width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden',
                          bgcolor: '#fff', border: '2px solid #fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: cat.color, '& svg': { fontSize: 28 }, '& img': { width: '100%', height: '100%', objectFit: 'contain' },
                        }}>
                          {cat.icon}
                        </Box>
                      </Box>
                      {count > 0 && (
                        <Box sx={{
                          position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, px: 0.5, borderRadius: 10,
                          bgcolor: active ? cat.color : '#0D1E36', color: '#fff', fontSize: '0.62rem', fontWeight: 800,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff',
                        }}>
                          {count}
                        </Box>
                      )}
                    </Box>
                    <Typography sx={{
                      fontSize: '0.72rem', fontWeight: active ? 700 : 600, color: active ? cat.color : 'text.secondary',
                      textAlign: 'center', lineHeight: 1.2, maxWidth: 82, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {cat.label}
                    </Typography>
                  </Box>
                </motion.div>
                </CategoryHoverCard>
              );
            })}
          </Box>
          <IconButton
            size="small" onClick={() => scrollCategories('right')}
            sx={{ flexShrink: 0, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
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
      <Box sx={{ px: { xs: 2, md: 4 }, py: 4, position: 'relative' }}>
        {/* Thin top progress bar while switching category/filters without clearing the grid */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, overflow: 'hidden', borderRadius: 1 }}>
          <AnimatePresence>
            {isSwitching && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <LinearProgress sx={{ height: 2 }} color="primary" />
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

        {isError && <Alert severity="error" sx={{ mb: 3 }}>Erreur lors du chargement des produits.</Alert>}

        {!showSkeleton && visible.length > 0 && (
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>{visible.length}</strong> produit{visible.length > 1 ? 's' : ''} trouvé{visible.length > 1 ? 's' : ''}
              {activeCategory !== 'all' && ` dans "${findCategoryDisplay(categoryDisplays, activeCategory).label}"`}
            </Typography>
          </Box>
        )}

        <Grid
          container spacing={2.5}
          sx={{ opacity: isSwitching ? 0.55 : 1, filter: isSwitching ? 'saturate(0.85)' : 'none', transition: 'opacity 0.25s ease, filter 0.25s ease' }}
        >
          {showSkeleton && Array.from({ length: 8 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={`skel-${i}`}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.2) }}>
                <Card sx={{ height: '100%', borderRadius: 3 }}>
                  <Skeleton variant="rectangular" animation="wave" height={180} sx={{ transform: 'none' }} />
                  <CardContent sx={{ pb: 1 }}>
                    <Skeleton variant="text" animation="wave" width="35%" height={20} sx={{ mb: 1 }} />
                    <Skeleton variant="text" animation="wave" width="75%" height={26} sx={{ mb: 0.5 }} />
                    <Skeleton variant="text" animation="wave" width="50%" height={20} />
                    <Skeleton variant="text" animation="wave" width="40%" height={28} sx={{ mt: 1 }} />
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Skeleton variant="rectangular" animation="wave" width="100%" height={36} sx={{ borderRadius: 2 }} />
                  </CardActions>
                </Card>
              </motion.div>
            </Grid>
          ))}
          <AnimatePresence mode="popLayout">
            {!showSkeleton && visible.map((product, i) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.24), ease: 'easeOut' }}
                  style={{ height: '100%' }}
                >
                  <ProductCard
                    product={product}
                    categoryDisplays={categoryDisplays}
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

        {!showSkeleton && !isSwitching && visible.length === 0 && (
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

