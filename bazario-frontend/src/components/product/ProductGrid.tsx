import { Grid } from '@mui/material';
import { Product } from '@/types';
import ProductCard from './ProductCard';

interface Props {
  products: Product[];
  wishlistedIds?: Set<number>;
}

export default function ProductGrid({ products, wishlistedIds }: Props) {
  return (
    <Grid container spacing={2}>
      {products.map((p) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={p.id}>
          <ProductCard product={p} wishlisted={wishlistedIds?.has(p.id)} />
        </Grid>
      ))}
    </Grid>
  );
}
