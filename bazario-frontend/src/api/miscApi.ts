import axiosClient from './axiosClient';
import { CartResponse, Category, PagedResponse, Review, User } from '@/types';

export const reviewApi = {
  getProductReviews: (productId: number, page = 0, size = 10) =>
    axiosClient
      .get<PagedResponse<Review>>(`/products/${productId}/reviews`, { params: { page, size } })
      .then((r) => r.data),

  createReview: (productId: number, data: { rating: number; comment?: string }) =>
    axiosClient.post<Review>(`/products/${productId}/reviews`, data).then((r) => r.data),

  deleteReview: (productId: number, reviewId: number) =>
    axiosClient.delete(`/products/${productId}/reviews/${reviewId}`),
};

export const cartApi = {
  getCart: () => axiosClient.get<CartResponse>('/cart').then((r) => r.data),
  addItem: (productId: number, quantity: number) =>
    axiosClient.post<CartResponse>('/cart', { productId, quantity }).then((r) => r.data),
  updateItem: (productId: number, quantity: number) =>
    axiosClient.put<CartResponse>(`/cart/${productId}`, { quantity }).then((r) => r.data),
  removeItem: (productId: number) =>
    axiosClient.delete<CartResponse>(`/cart/${productId}`).then((r) => r.data),
  clearCart: () => axiosClient.delete('/cart'),
};

export const wishlistApi = {
  getWishlist: () => axiosClient.get('/wishlist').then((r) => r.data),
  add: (productId: number) => axiosClient.post(`/wishlist/${productId}`),
  remove: (productId: number) => axiosClient.delete(`/wishlist/${productId}`),
};

export const categoryApi = {
  getAll: () => axiosClient.get<Category[]>('/categories').then((r) => r.data),
  create: (label: string, icon?: string) =>
    axiosClient.post<Category>('/categories', { label, icon }).then((r) => r.data),
  update: (id: number, data: { label?: string; icon?: string }) =>
    axiosClient.put<Category>(`/categories/${id}`, data).then((r) => r.data),
  uploadImage: (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return axiosClient.post<Category>(`/categories/${id}/image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
};

export const sellerApi = {
  // No seller stats endpoint exists on the backend
};

export const adminApi = {
  getUsers: (params: { q?: string; page?: number; size?: number; sort?: string; sortDir?: string } = {}) =>
    axiosClient.get<PagedResponse<User>>('/admin/users', { params }).then((r) => r.data),
  banUser: (id: number) => axiosClient.patch(`/admin/users/${id}/ban`).then((r) => r.data),
  unbanUser: (id: number) => axiosClient.patch(`/admin/users/${id}/unban`).then((r) => r.data),
  deleteUser: (id: number) => axiosClient.delete(`/admin/users/${id}`),
  changeRole: (id: number, role: string) =>
    axiosClient.patch(`/admin/users/${id}/role`, null, { params: { role } }).then((r) => r.data),
  setAllowedCategories: (id: number, allowedCategories: string | null) =>
    axiosClient.put(`/admin/users/${id}/categories`, { allowedCategories }).then((r) => r.data),
};
