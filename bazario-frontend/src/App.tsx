import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './api/queryClient';
import { useAuthStore } from './store/useAuthStore';
import type { User } from './types';

// Layout
import MainLayout from './components/layout/MainLayout';

// Public pages
import Home from './pages/Home';
import Register from './pages/Register';
import Catalogue from './pages/Catalogue';
import ProductDetail from './pages/ProductDetail';
import Panier from './pages/Panier';
import Checkout from './pages/Checkout';
import CheckoutSucces from './pages/CheckoutSucces';
import Login from './pages/Login';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';

// Operateur pages
import OperateurCommandes from './pages/operateur/Commandes';
import OperateurHistorique from './pages/operateur/Historique';

// Stock-Operateur pages
import StockProduits from './pages/stock/Produits';
import StockNouveauProduit from './pages/stock/NouveauProduit';
import StockEditProduit from './pages/stock/EditProduit';
import StockHistorique from './pages/stock/Historique';
import StockCategories from './pages/stock/Categories';

// Admin pages
import AdminUtilisateurs from './pages/admin/Utilisateurs';
import AdminCommandes from './pages/admin/Commandes';
import AdminProduits from './pages/admin/Products';
import AdminActivite from './pages/admin/Activite';
import AdminDashboard from './pages/admin/Dashboard';
import AdminApprobations from './pages/admin/Approbations';

// ─── Protected route ─────────────────────────────────────────────────────────
interface ProtectedProps {
  roles: User['role'][];
  children: React.ReactNode;
}

function Protected({ roles, children }: ProtectedProps) {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route element={<MainLayout />}>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Catalogue />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/panier" element={<Panier />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/checkout/succes" element={<CheckoutSucces />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/wishlist" element={<Wishlist />} />

            {/* Operateur */}
            <Route path="/operateur/commandes" element={<Protected roles={['OPERATEUR', 'ADMIN']}><OperateurCommandes /></Protected>} />
            <Route path="/operateur/historique" element={<Protected roles={['OPERATEUR', 'ADMIN']}><OperateurHistorique /></Protected>} />

            {/* Stock-Operateur */}
            <Route path="/stock/produits" element={<Protected roles={['STOCK_OPERATEUR', 'ADMIN']}><StockProduits /></Protected>} />
            <Route path="/stock/produits/nouveau" element={<Protected roles={['STOCK_OPERATEUR', 'ADMIN']}><StockNouveauProduit /></Protected>} />
            <Route path="/stock/produits/:id/edit" element={<Protected roles={['STOCK_OPERATEUR', 'ADMIN']}><StockEditProduit /></Protected>} />
            <Route path="/stock/historique" element={<Protected roles={['STOCK_OPERATEUR', 'ADMIN']}><StockHistorique /></Protected>} />
            <Route path="/stock/categories" element={<Protected roles={['STOCK_OPERATEUR', 'ADMIN']}><StockCategories /></Protected>} />

            {/* Admin */}
            <Route path="/admin" element={<Protected roles={['ADMIN']}><AdminDashboard /></Protected>} />
            <Route path="/admin/utilisateurs" element={<Protected roles={['ADMIN']}><AdminUtilisateurs /></Protected>} />
            <Route path="/admin/commandes" element={<Protected roles={['ADMIN']}><AdminCommandes /></Protected>} />
            <Route path="/admin/produits" element={<Protected roles={['ADMIN']}><AdminProduits /></Protected>} />
            <Route path="/admin/approbations" element={<Protected roles={['ADMIN']}><AdminApprobations /></Protected>} />
            <Route path="/admin/activite" element={<Protected roles={['ADMIN']}><AdminActivite /></Protected>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
