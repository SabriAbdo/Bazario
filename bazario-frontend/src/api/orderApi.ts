import axiosClient from './axiosClient';
import type { Command, CommandStatus, PagedResponse } from '../types';

export interface PlaceOrderRequest {
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  items: { productId: number; quantite: number }[];
}

export interface DemandeInfoRequest {
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
}

export const orderApi = {
  place: (data: PlaceOrderRequest) =>
    axiosClient.post<Command>('/commands', data).then((r) => r.data),
  demandeInfo: (data: DemandeInfoRequest) =>
    axiosClient.post<Command>('/commands/demande-info', data).then((r) => r.data),
  getAll: (params: { status?: CommandStatus; q?: string; page?: number; size?: number; sort?: string; sortDir?: string } = {}) =>
    axiosClient.get<PagedResponse<Command>>('/commands', { params }).then((r) => r.data),
  getHistorique: (params: { q?: string; page?: number; size?: number; sort?: string; sortDir?: string } = {}) =>
    axiosClient.get<PagedResponse<Command>>('/commands/historique', { params }).then((r) => r.data),
  getById: (id: number) =>
    axiosClient.get<Command>(`/commands/${id}`).then((r) => r.data),
  updateStatus: (id: number, status: CommandStatus) =>
    axiosClient.patch<Command>(`/commands/${id}/status`, { status }).then((r) => r.data),
};
