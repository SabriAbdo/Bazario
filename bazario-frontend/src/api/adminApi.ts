import axiosClient from './axiosClient';
import type { User, ActivityLog, AdminStats, PagedResponse, Product } from '../types';

export interface CreateUserRequest {
  username: string;
  password: string;
  fullName: string;
  role: User['role'];
}

export const adminApi = {
  getStats: () =>
    axiosClient.get<AdminStats>('/admin/stats').then((r) => r.data),
  getUsers: (q?: string) =>
    axiosClient.get<PagedResponse<User>>('/admin/users', { params: { size: 200, ...(q ? { q } : {}) } }).then((r) => r.data.content),
  createUser: (data: CreateUserRequest) =>
    axiosClient.post<User>('/admin/users', data).then((r) => r.data),
  updateUser: (id: number, data: Partial<Omit<CreateUserRequest, 'username' | 'password'> & { active: boolean }>) =>
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
  getActivityLogs: () =>
    axiosClient.get<ActivityLog[]>('/admin/activite').then((r) => r.data),
};

