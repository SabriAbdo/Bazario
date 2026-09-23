import axiosClient from './axiosClient';

export interface NotificationItem {
  id: number;
  type: 'NEW_COMMANDE' | 'NEW_DEMANDE_INFO';
  message: string;
  orderId: number;
  createdAt: string;
}

export const notificationApi = {
  getRecent: () =>
    axiosClient.get<NotificationItem[]>('/notifications').then((r) => r.data),
  countSince: (sinceId: number | null) =>
    axiosClient
      .get<{ count: number }>('/notifications/count', { params: sinceId ? { sinceId } : {} })
      .then((r) => r.data.count),
};
