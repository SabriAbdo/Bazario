import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productApi } from '@/api/productApi';
import { useAuthStore } from '@/store/useAuthStore';

/** Shared Client "like" state — backs the like toggle on product cards everywhere. */
export function useLikes() {
  const user = useAuthStore((s) => s.user);
  const isClient = user?.role === 'CLIENT';
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['likes'],
    queryFn: () => productApi.getMyLikes(),
    enabled: isClient,
    staleTime: 30_000,
  });

  const ids = new Set(data ?? []);

  const likeMutation = useMutation({
    mutationFn: (productId: number) => productApi.like(productId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['likes'] });
      qc.invalidateQueries({ queryKey: ['product'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: (productId: number) => productApi.unlike(productId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['likes'] });
      qc.invalidateQueries({ queryKey: ['product'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const toggle = (productId: number) => {
    if (ids.has(productId)) unlikeMutation.mutate(productId);
    else likeMutation.mutate(productId);
  };

  return { isClient, ids, toggle, isPending: likeMutation.isPending || unlikeMutation.isPending };
}
