import { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import ProductCard from './ProductCard';
import type { Product } from '@/types';

interface Props {
  products: Product[];
  /** Auto-advance interval in ms; set to 0 to disable */
  autoPlayMs?: number;
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '10%' : '-10%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-10%' : '10%', opacity: 0 }),
};

export default function ProductCarousel({ products, autoPlayMs = 5000 }: Props) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const perView = isXs ? 1 : isSm ? 2 : isMd ? 3 : 4;

  const pages = useMemo(() => {
    const chunks: Product[][] = [];
    for (let i = 0; i < products.length; i += perView) chunks.push(products.slice(i, i + perView));
    return chunks;
  }, [products, perView]);

  const [[page, direction], setPageState] = useState<[number, number]>([0, 1]);

  useEffect(() => { setPageState([0, 1]); }, [perView, products.length]);

  const goTo = useCallback((next: number, dir: number) => {
    setPageState([((next % pages.length) + pages.length) % pages.length, dir]);
  }, [pages.length]);

  useEffect(() => {
    if (pages.length <= 1 || !autoPlayMs) return;
    const id = setInterval(() => goTo(page + 1, 1), autoPlayMs);
    return () => clearInterval(id);
  }, [page, pages.length, autoPlayMs, goTo]);

  if (!pages.length) return null;

  return (
    <Box sx={{ position: 'relative', px: { xs: 0, md: 5 } }}>
      {pages.length > 1 && (
        <IconButton
          onClick={() => goTo(page - 1, -1)}
          size="small"
          sx={{
            position: 'absolute', left: { xs: -8, md: 0 }, top: '40%', transform: 'translateY(-50%)', zIndex: 2,
            bgcolor: 'background.paper', boxShadow: 3, border: '1px solid', borderColor: 'divider',
            '&:hover': { bgcolor: 'grey.100' },
          }}
        >
          <ChevronLeft />
        </IconButton>
      )}

      <Box sx={{ overflow: 'hidden', borderRadius: 3 }}>
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={page}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: `repeat(${perView}, 1fr)`,
                gap: 2,
              }}
            >
              {pages[page].map((product) => (
                <Box key={product.id}>
                  <ProductCard product={product} />
                </Box>
              ))}
            </Box>
          </motion.div>
        </AnimatePresence>
      </Box>

      {pages.length > 1 && (
        <IconButton
          onClick={() => goTo(page + 1, 1)}
          size="small"
          sx={{
            position: 'absolute', right: { xs: -8, md: 0 }, top: '40%', transform: 'translateY(-50%)', zIndex: 2,
            bgcolor: 'background.paper', boxShadow: 3, border: '1px solid', borderColor: 'divider',
            '&:hover': { bgcolor: 'grey.100' },
          }}
        >
          <ChevronRight />
        </IconButton>
      )}

      {pages.length > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2.5 }}>
          {pages.map((_, i) => (
            <Box
              key={i}
              onClick={() => goTo(i, i > page ? 1 : -1)}
              sx={{
                width: i === page ? 22 : 8, height: 8, borderRadius: 4, cursor: 'pointer',
                bgcolor: i === page ? 'primary.main' : 'grey.300',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
