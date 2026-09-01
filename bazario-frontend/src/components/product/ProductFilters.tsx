import { Box, Paper, Typography, Slider, FormControl, InputLabel, Select, MenuItem, Button, Divider, Rating } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { categoryApi } from '@/api/miscApi';
import { Category } from '@/types';

export interface Filters {
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: string;
  sortDir?: string;
}

interface Props {
  filters: Filters;
  onChange: (f: Partial<Filters>) => void;
  onReset: () => void;
}

const MAX_PRICE = 10000;

export default function ProductFilters({ filters, onChange, onReset }: Props) {
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
  });

  return (
    <Paper sx={{ p: 2, borderRadius: 3 }}>
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>Filtres</Typography>
      <Divider sx={{ mb: 2 }} />

      {/* Category */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Catégorie</InputLabel>
        <Select
          value={filters.categorySlug ?? ''}
          label="Catégorie"
          onChange={(e) => onChange({ categorySlug: e.target.value || undefined })}
        >
          <MenuItem value="">Toutes</MenuItem>
          {categories?.map((c) => (
            <MenuItem key={c.id} value={c.slug}>{c.label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Price range */}
      <Typography variant="body2" gutterBottom>
        Prix: {filters.minPrice ?? 0} – {filters.maxPrice ?? MAX_PRICE} MAD
      </Typography>
      <Slider
        value={[filters.minPrice ?? 0, filters.maxPrice ?? MAX_PRICE]}
        min={0}
        max={MAX_PRICE}
        step={50}
        onChange={(_e, val) => {
          const [min, max] = val as number[];
          onChange({ minPrice: min, maxPrice: max });
        }}
        sx={{ mb: 2 }}
        valueLabelDisplay="auto"
      />

      {/* Min rating */}
      <Typography variant="body2" gutterBottom>Note minimale</Typography>
      <Rating
        value={filters.minRating ?? 0}
        onChange={(_e, v) => onChange({ minRating: v ?? 0 })}
        sx={{ mb: 2 }}
      />

      {/* Sort */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Trier par</InputLabel>
        <Select
          value={filters.sortBy ?? 'createdAt'}
          label="Trier par"
          onChange={(e) => onChange({ sortBy: e.target.value })}
        >
          <MenuItem value="createdAt">Nouveautés</MenuItem>
          <MenuItem value="price">Prix</MenuItem>
          <MenuItem value="avgRating">Meilleures notes</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Ordre</InputLabel>
        <Select
          value={filters.sortDir ?? 'desc'}
          label="Ordre"
          onChange={(e) => onChange({ sortDir: e.target.value })}
        >
          <MenuItem value="asc">Croissant</MenuItem>
          <MenuItem value="desc">Décroissant</MenuItem>
        </Select>
      </FormControl>

      <Button variant="outlined" fullWidth onClick={onReset} size="small">
        Réinitialiser
      </Button>
    </Paper>
  );
}
