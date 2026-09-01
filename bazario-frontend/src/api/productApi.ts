import axiosClient from './axiosClient';
import type { PagedResponse, Product, ProductComment, ProductVariant, VariantType } from '../types';

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? 'http://localhost:8081';

export interface CreateProductRequest {
  libelle: string;
  description?: string;
  prix: number;
  prixActif: boolean;
  prixPromo?: number;
  reference?: string;
  marque?: string;
  categorie?: string;
  unite?: string;
  quantiteMin?: number;
}

export interface ProductFilters {
  q?: string;
  categorie?: string;
  marque?: string;
  minPrix?: number;
  maxPrix?: number;
  page?: number;
  size?: number;
  sort?: string;
  sortDir?: string;
}

export interface AddVariantRequest {
  type: VariantType;
  valeur: string;
  prixSupplement?: number;
  stock?: number;
}

export const productApi = {
  /** Paginated product list with optional faceted filters */
  getAll: (params: ProductFilters = {}) =>
    axiosClient.get<PagedResponse<Product>>('/products', { params }).then((r) => r.data),

  /** Quick search returning Product[] */
  search: (q: string) =>
    axiosClient.get<PagedResponse<Product>>('/products', { params: { q, page: 0, size: 10 } })
      .then((r) => r.data.content),
  getById: (id: number) =>
    axiosClient.get<Product>(`/products/${id}`).then((r) => r.data),
  create: (data: CreateProductRequest) =>
    axiosClient.post<Product>('/products', data).then((r) => r.data),
  update: (id: number, data: Partial<CreateProductRequest>) =>
    axiosClient.put<Product>(`/products/${id}`, data).then((r) => r.data),
  delete: (id: number) =>
    axiosClient.delete(`/products/${id}`),
  myProducts: (page = 0, size = 20, sort = 'createdAt', sortDir = 'desc', q?: string) =>
    axiosClient.get<PagedResponse<Product>>('/products/mes-produits', { params: { page, size, sort, sortDir, q } }).then((r) => r.data),
  uploadImages: (id: number, files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    return axiosClient.post<Product>(`/products/${id}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
  deleteImage: (id: number, imageUrl: string) =>
    axiosClient.delete<Product>(`/products/${id}/images`, { params: { imageUrl } }).then((r) => r.data),
  getDeleted: (params: { page?: number; size?: number; sort?: string; sortDir?: string } = {}) =>
    axiosClient.get<PagedResponse<Product>>('/products/deleted', { params }).then((r) => r.data),
  restore: (id: number) =>
    axiosClient.put<Product>(`/products/${id}/restore`).then((r) => r.data),
  imageUrl: (path: string) => path,

  /** Variant management */
  addVariant: (productId: number, data: AddVariantRequest) =>
    axiosClient.post<Product>(`/products/${productId}/variants`, data).then((r) => r.data),
  deleteVariant: (productId: number, variantId: number) =>
    axiosClient.delete<Product>(`/products/${productId}/variants/${variantId}`).then((r) => r.data),

  /** Comments */
  getComments: (productId: number) =>
    axiosClient.get<ProductComment[]>(`/products/${productId}/comments`).then((r) => r.data),
  addComment: (productId: number, authorName: string, content: string) =>
    axiosClient.post<ProductComment>(`/products/${productId}/comments`, { authorName, content }).then((r) => r.data),
  deleteComment: (commentId: number) =>
    axiosClient.delete(`/comments/${commentId}`),
};
