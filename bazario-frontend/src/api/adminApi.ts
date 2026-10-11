import axiosClient from './axiosClient';
import type { User, ActivityLog, AdminStats, AdvancedAdminStats, PagedResponse, Product } from '../types';

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: User['role'];
}

export const adminApi = {
  getStats: () =>
    axiosClient.get<AdminStats>('/admin/stats').then((r) => r.data),
  getAdvancedStats: (granularity: 'DAY' | 'WEEK' | 'MONTH' = 'DAY') =>
    axiosClient.get<AdvancedAdminStats>('/admin/stats/advanced', { params: { granularity } }).then((r) => r.data),
  getUsers: (q?: string) =>
    axiosClient.get<PagedResponse<User>>('/admin/users', { params: { size: 200, ...(q ? { q } : {}) } }).then((r) => r.data.content),
  getUsersPaged: (params: { q?: string; page?: number; size?: number; sort?: string; sortDir?: string } = {}) =>
    axiosClient.get<PagedResponse<User>>('/admin/users', { params }).then((r) => r.data),
  createUser: (data: CreateUserRequest) =>
    axiosClient.post<User>('/admin/users', data).then((r) => r.data),
  updateUser: (id: number, data: Partial<Omit<CreateUserRequest, 'password'> & { password: string; active: boolean }>) =>
    axiosClient.put<User>(`/admin/users/${id}`, data).then((r) => r.data),
  deleteUser: (id: number) =>
    axiosClient.delete(`/admin/users/${id}`),
  banUser: (id: number) =>
    axiosClient.patch<User>(`/admin/users/${id}/ban`).then((r) => r.data),
  unbanUser: (id: number) =>
    axiosClient.patch<User>(`/admin/users/${id}/unban`).then((r) => r.data),
  setAllowedCategories: (id: number, allowedCategories: string | null) =>
    axiosClient.put<User>(`/admin/users/${id}/categories`, { allowedCategories }).then((r) => r.data),
  approveProduct: (id: number) =>
    axiosClient.patch<Product>(`/admin/products/${id}/approve`).then((r) => r.data),
  rejectProduct: (id: number) =>
    axiosClient.patch<Product>(`/admin/products/${id}/reject`).then((r) => r.data),
  getPendingProducts: (page = 0, size = 20) =>
    axiosClient.get<PagedResponse<Product>>('/admin/products/pending', { params: { page, size } }).then((r) => r.data),
  setFeaturedBestSeller: (id: number, value: boolean) =>
    axiosClient.patch<Product>(`/admin/products/${id}/best-sellers`, null, { params: { value } }).then((r) => r.data),
  setFeaturedNewArrival: (id: number, value: boolean) =>
    axiosClient.patch<Product>(`/admin/products/${id}/new-arrivals`, null, { params: { value } }).then((r) => r.data),
  setFeaturedPopular: (id: number, value: boolean) =>
    axiosClient.patch<Product>(`/admin/products/${id}/popular`, null, { params: { value } }).then((r) => r.data),
  getActivityLogs: () =>
    axiosClient.get<ActivityLog[]>('/admin/activite').then((r) => r.data),
  exportExcel: () =>
    axiosClient.get('/admin/export/excel', { responseType: 'blob' }).then((r) => r.data as Blob),
};

