import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

type AppRole = 'ADMIN' | 'OPERATEUR' | 'STOCK_OPERATEUR';

interface Props {
  roles?: AppRole[];
}

export default function ProtectedRoute({ roles }: Props) {
  const { token, user } = useAuthStore();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role as AppRole)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
