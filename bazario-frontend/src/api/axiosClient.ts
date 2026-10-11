import axios from 'axios';
import toast from 'react-hot-toast';
import i18n from '../i18n';
import { useAuthStore } from '../store/useAuthStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

const axiosClient = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

axiosClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && useAuthStore.getState().token) {
      useAuthStore.getState().clearAuth();
      // single toast id avoids duplicates when the proactive expiry watcher fires around the same time
      toast.error(i18n.t('auth.session_expired'), { id: 'session-expired' });
    }
    return Promise.reject(err);
  }
);

export default axiosClient;
