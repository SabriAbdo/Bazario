import { useState } from 'react';
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, Button, Alert, Paper, Chip, alpha, Tooltip,
} from '@mui/material';
import ProductDetailDialog from '../components/ProductDetailDialog';
import type { Product } from '../types';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';

export default function Panier() {
  const { items, removeItem, updateQty, addItem, totalPrice } = useCartStore();
  const navigate = useNavigate();
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  if (items.length === 0) {
    return (
      <Box sx={{ px: { xs: 2, md: 4 }, py: 6, textAlign: 'center' }}>
        <ShoppingCartIcon sx={{ fontSize: 72, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h5" color="text.secondary" gutterBottom>Votre panier est vide</Typography>
        <Typography variant="body2" color="text.disabled" mb={3}>Parcourez notre catalogue pour trouver du matériel électrique.</Typography>
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={() => navigate('/')}>Retour au catalogue</Button>
      </Box>
    );
  }

  const fmt = (n: number) => n.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MAD';

  return (
    <>
    <Box sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
        <ShoppingCartIcon sx={{ color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h4">Mon Panier</Typography>
        <Chip label={`${items.length} article${items.length > 1 ? 's' : ''}`} color="primary" size="small" />
      </Box>

      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: { xs: 'wrap', lg: 'nowrap' } }}>
        {/* Table */}
        <Paper sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Produit</TableCell>
                <TableCell align="center" sx={{ width: 130 }}>Prix unit.</TableCell>
                <TableCell align="center" sx={{ width: 140 }}>Quantité</TableCell>
                <TableCell align="right" sx={{ width: 130 }}>Sous-total</TableCell>
                <TableCell sx={{ width: 50 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((entry) => (
                <TableRow key={entry.product.id} sx={{ '&:hover': { bgcolor: alpha('#009530', 0.03) } }}>
                  <TableCell>
                    <Tooltip title="Voir les détails" placement="top">
                      <Typography variant="body2" fontWeight={600}
                        onClick={() => setDetailProduct(entry.product)}
                        sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main', textDecoration: 'underline' } }}>
                        {entry.product.libelle}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" color="text.secondary">{fmt(entry.product.prix)}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <IconButton size="small" onClick={() => updateQty(entry.product.id, entry.quantite - 1)}
                        sx={{ bgcolor: alpha('#009530', 0.08), '&:hover': { bgcolor: alpha('#009530', 0.15) } }}>
                        <RemoveIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                      <Typography sx={{ minWidth: 28, textAlign: 'center', fontWeight: 700 }}>{entry.quantite}</Typography>
                      <IconButton size="small" onClick={() => updateQty(entry.product.id, entry.quantite + 1)}
                        sx={{ bgcolor: alpha('#009530', 0.08), '&:hover': { bgcolor: alpha('#009530', 0.15) } }}>
                        <AddIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={700} color="primary.main">
                      {fmt(entry.product.prix * entry.quantite)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="error" onClick={() => removeItem(entry.product.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

        {/* Order summary */}
        <Paper sx={{ width: { xs: '100%', lg: 300 }, flexShrink: 0, p: 3, borderRadius: 3, border: '2px solid', borderColor: 'primary.light' }}>
          <Typography variant="h6" fontWeight={700} mb={2}>Récapitulatif</Typography>
          {items.map((e) => (
            <Box key={e.product.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {e.product.libelle} ×{e.quantite}
              </Typography>
              <Typography variant="body2" fontWeight={600}>{fmt(e.product.prix * e.quantite)}</Typography>
            </Box>
          ))}
          <Box sx={{ borderTop: '2px solid', borderColor: 'primary.main', mt: 2, pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Typography fontWeight={700}>Total</Typography>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h5" fontWeight={800} color="primary.main">
                {totalPrice().toLocaleString('fr-MA', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="caption" color="text.secondary">MAD</Typography>
            </Box>
          </Box>
          <Button variant="contained" fullWidth size="large" startIcon={<ShoppingCartCheckoutIcon />}
            onClick={() => navigate('/checkout')} sx={{ mt: 3 }}>
            Commander
          </Button>
          <Button fullWidth size="small" startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')} sx={{ mt: 1, color: 'text.secondary' }}>
            Continuer mes achats
          </Button>
        </Paper>
      </Box>
    </Box>
      {detailProduct && (
        <ProductDetailDialog
          product={detailProduct}
          added={items.some((i) => i.product.id === detailProduct.id)}
          onAdd={(qty) => { addItem(detailProduct, qty); }}
          onClose={() => setDetailProduct(null)}
        />
      )}
    </>
  );
}
