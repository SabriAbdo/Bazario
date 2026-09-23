import { useState } from 'react';
import {
  Box, Container, Typography, Button, Grid, Paper,
  Chip, Skeleton, InputBase, alpha,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search } from '@mui/icons-material';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import { productApi } from '@/api/productApi';
import { categoryApi } from '@/api/miscApi';
import ProductCarousel from '@/components/product/ProductCarousel';
import type { Category, PagedResponse, Product } from '@/types';
import { useTranslation } from 'react-i18next';

// Empty in dev (Vite proxy) and same-origin prod; set VITE_API_BASE_URL for cross-origin deploys
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

const CAT_COLORS = [
  '#E8521A','#3730A3','#D97706','#16A34A','#DC2626',
  '#7C3AED','#0369A1','#BE185D','#065F46','#92400E',
  '#1D4ED8','#B45309','#15803D','#6D28D9','#9D174D',
  '#0F766E','#C2410C','#1E40AF','#166534','#7E22CE',
];

const TRUST_BADGE_KEYS = [
  'trust.fast_delivery',
  'trust.easy_returns',
  'trust.secure_payment',
  'trust.support',
  'trust.best_prices',
] as const;

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchQ, setSearchQ] = useState('');

  const { data: bestSellers, isLoading: loadingBestSellers } = useQuery<Product[]>({
    queryKey: ['products', 'home-best-sellers'],
    queryFn: () => productApi.getBestSellers(12),
  });

  const { data: latest, isLoading: loadingLatest } = useQuery<PagedResponse<Product>>({
    queryKey: ['products', 'home-latest'],
    queryFn: () => productApi.getAll({ page: 0, size: 12, sort: 'createdAt', sortDir: 'desc' }),
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/products${searchQ.trim() ? `?q=${encodeURIComponent(searchQ.trim())}` : ''}`);
  };

  return (
    <Box>
      {/* ── Hero ── */}
      <Box
        component={motion.div as any}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        sx={{
          background: 'linear-gradient(135deg, #FF6B35 0%, #C62828 45%, #1A237E 100%)',
          py: { xs: 8, md: 11 },
          px: 2,
          textAlign: 'center',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative blobs */}
        <Box sx={{ position:'absolute',top:-80,left:-80,width:260,height:260,borderRadius:'50%',bgcolor:'rgba(255,255,255,0.06)',pointerEvents:'none' }} />
        <Box sx={{ position:'absolute',bottom:-60,right:-60,width:220,height:220,borderRadius:'50%',bgcolor:'rgba(255,255,255,0.06)',pointerEvents:'none' }} />

        <Container maxWidth="md" sx={{ position:'relative', zIndex:1 }}>
          <Typography sx={{ fontSize:{ xs:'3rem',md:'5rem' }, fontWeight:900, letterSpacing:'-0.03em', mb:0.5, lineHeight:1 }}>
            Bazario
          </Typography>
          <Typography variant="h5" sx={{ opacity:0.9, mb:1, fontWeight:400 }}>
            {t('home.tagline')}
          </Typography>
          <Typography sx={{ opacity:0.72, mb:4, fontSize:'0.95rem' }}>
            {t('home.subtitle')}
          </Typography>

          {/* Hero search */}
          <Box
            component="form"
            onSubmit={handleSearch}
            sx={{ display:'flex', bgcolor:'white', borderRadius:3, overflow:'hidden', maxWidth:540, mx:'auto', mb:4, boxShadow:'0 8px 32px rgba(0,0,0,0.25)' }}
          >
            <InputBase
              placeholder={t('home.search_placeholder')}
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              sx={{ flex:1, px:2.5, py:1.2, fontSize:'0.9rem', color:'#222' }}
            />
            <Button type="submit" variant="contained"
              sx={{ bgcolor:'#FF6B35','&:hover':{ bgcolor:'#E55A28' }, borderRadius:0, px:3, minWidth:'auto' }}>
              <Search />
            </Button>
          </Box>

          <Box sx={{ display:'flex', gap:2, justifyContent:'center', flexWrap:'wrap' }}>
            <Button component={Link} to="/products" variant="contained"
              sx={{ bgcolor:'white', color:'#FF6B35', fontWeight:700, px:4, py:1.4, '&:hover':{ bgcolor:'grey.100' } }}>
              {t('home.explore_btn')}
            </Button>
            <Button component={Link} to="/register" variant="outlined"
              sx={{ borderColor:'rgba(255,255,255,0.8)', color:'white', px:4, py:1.4, '&:hover':{ bgcolor:'rgba(255,255,255,0.1)' } }}>
              {t('home.become_seller_btn')}
            </Button>
          </Box>
        </Container>
      </Box>

      <Box sx={{ px: { xs: 2, md: 4 }, py: 4 }}>

        {/* Trust badges */}
        <Box sx={{ display:'flex', gap:1.5, flexWrap:'wrap', mb:7, justifyContent:'center' }}>
          {TRUST_BADGE_KEYS.map((key) => (
            <Chip key={key} label={t(key)} variant="outlined" color="primary" sx={{ fontWeight:600, fontSize:'0.8rem' }} />
          ))}
        </Box>

        {/* Categories grid */}
        <Box sx={{ mb:8 }}>
          <Typography variant="h2" sx={{ fontWeight:700, mb:0.5 }}>{t('home.categories_title')}</Typography>
          <Typography color="text.secondary" sx={{ mb:3, fontSize:'0.9rem' }}>
            {t('home.categories_subtitle')}
          </Typography>
          <Grid container spacing={2}>
            {categories
              ? categories.map((cat, idx) => {
                  const color = CAT_COLORS[idx % CAT_COLORS.length];
                  return (
                    <Grid item xs={6} sm={4} md={3} lg={2} key={cat.id}>
                      <Paper
                        component={Link}
                        to={`/products?cat=${cat.slug}`}
                        elevation={0}
                        sx={{
                          display:'flex', flexDirection:'column', alignItems:'center',
                          justifyContent:'center', gap:1.2, p:2.5, borderRadius:3,
                          border:'1.5px solid', borderColor:'divider', textDecoration:'none',
                          color:'text.primary', transition:'all 0.2s ease',
                          '&:hover':{ borderColor:color, transform:'translateY(-4px)', boxShadow:`0 8px 24px ${alpha(color,0.22)}` },
                        }}
                      >
                        <Box sx={{ width:52,height:52,borderRadius:'50%',bgcolor:alpha(color,0.12),display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden' }}>
                          {cat.imageUrl
                            ? <Box component="img" src={`${API_BASE}${cat.imageUrl}`} alt={cat.label} sx={{ width:'100%', height:'100%', objectFit:'cover' }} />
                            : <ImageNotSupportedIcon sx={{ fontSize:24, color }} />}
                        </Box>
                        <Typography sx={{ fontWeight:600, textAlign:'center', fontSize:'0.78rem', lineHeight:1.3 }}>
                          {cat.label}
                        </Typography>
                      </Paper>
                    </Grid>
                  );
                })
              : Array.from({ length:12 }).map((_, i) => (
                  <Grid item xs={6} sm={4} md={3} lg={2} key={i}>
                    <Skeleton variant="rounded" height={110} sx={{ borderRadius:3 }} />
                  </Grid>
                ))}
          </Grid>
          {categories && (
            <Box sx={{ textAlign:'center', mt:3 }}>
              <Button component={Link} to="/products" variant="outlined" sx={{ fontWeight:600 }}>
                {t('home.see_all_products')}
              </Button>
            </Box>
          )}
        </Box>

        {/* Best sellers — stylish sliding carousel */}
        <Box sx={{ mb:8 }}>
          <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', mb:3 }}>
            <Box>
              <Typography variant="h2" sx={{ fontWeight:700 }}>{t('home.best_sellers_title')}</Typography>
              <Typography color="text.secondary" sx={{ fontSize:'0.9rem' }}>{t('home.best_sellers_subtitle')}</Typography>
            </Box>
            <Button component={Link} to="/products" variant="outlined" sx={{ fontWeight:600 }}>
              {t('home.see_all')}
            </Button>
          </Box>
          {loadingBestSellers ? (
            <Grid container spacing={2}>
              {Array.from({ length:4 }).map((_,i) => (
                <Grid item xs={12} sm={6} md={3} key={i}>
                  <Skeleton variant="rounded" height={280} sx={{ borderRadius:2 }} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <ProductCarousel products={bestSellers ?? []} />
          )}
        </Box>

        {/* New arrivals — stylish sliding carousel */}
        <Box>
          <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', mb:3 }}>
            <Box>
              <Typography variant="h2" sx={{ fontWeight:700 }}>{t('home.arrivals_title')}</Typography>
              <Typography color="text.secondary" sx={{ fontSize:'0.9rem' }}>{t('home.arrivals_subtitle')}</Typography>
            </Box>
            <Button component={Link} to="/products" variant="outlined" sx={{ fontWeight:600 }}>
              {t('home.see_all')}
            </Button>
          </Box>
          {loadingLatest ? (
            <Grid container spacing={2}>
              {Array.from({ length:4 }).map((_,i) => (
                <Grid item xs={12} sm={6} md={3} key={i}>
                  <Skeleton variant="rounded" height={280} sx={{ borderRadius:2 }} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <ProductCarousel products={latest?.content ?? []} autoPlayMs={6000} />
          )}
        </Box>

      </Box>
    </Box>
  );
}