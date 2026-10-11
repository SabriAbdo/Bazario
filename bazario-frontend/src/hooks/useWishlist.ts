import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { wishlistApi } from '@/api/miscApi';
import { useAuthStore } from '@/store/useAuthStore';

/** Shared Client wishlist state — backs the heart toggle on product cards everywhere. */
export function useWishlist() {
  const user = useAuthStore((s) => s.user);
  const isClient = user?.role === 'CLIENT';
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistApi.getWishlist(),
    enabled: isClient,
    staleTime: 30_000,
  });

  const ids = new Set((data ?? []).map((w) => w.productId));

  const addMutation = useMutation({
    mutationFn: (productId: number) => wishlistApi.add(productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (productId: number) => wishlistApi.remove(productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  const toggle = (productId: number) => {
    if (ids.has(productId)) removeMutation.mutate(productId);
    else addMutation.mutate(productId);
  };

  return { isClient, ids, toggle, isPending: addMutation.isPending || removeMutation.isPending };
}
