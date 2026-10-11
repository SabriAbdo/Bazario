import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/useAuthStore';
import { getTokenExpiryMs } from '../../utils/jwt';

/**
 * Proactively detects JWT expiration (on load and via a scheduled timer) instead of
 * waiting for a 401 on the next API call, then forces logout + redirect + toast.
 */
export default function SessionExpiryWatcher() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const forceLogout = () => {
      if (!useAuthStore.getState().token) return;
      useAuthStore.getState().clearAuth();
      toast.error(t('auth.session_expired'), { id: 'session-expired' });
      navigate('/login');
    };

    const scheduleCheck = (token: string | null) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (!token) return;

      const expiryMs = getTokenExpiryMs(token);
      if (expiryMs === null) return;

      const msUntilExpiry = expiryMs - Date.now();
      if (msUntilExpiry <= 0) {
        forceLogout();
        return;
      }
      timeoutRef.current = setTimeout(forceLogout, msUntilExpiry);
    };

    // handle a token already expired on app load (persisted via zustand/persist)
    scheduleCheck(useAuthStore.getState().token);

    const unsubscribe = useAuthStore.subscribe((state: ReturnType<typeof useAuthStore.getState>) =>
      scheduleCheck(state.token)
    );

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      unsubscribe();
    };
  }, [navigate, t]);

  return null;
}
