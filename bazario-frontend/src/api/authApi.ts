import axiosClient from './axiosClient';
import type { User } from '../types';

export interface LoginRequest { username: string; password: string; }
export interface RegisterRequest { username: string; email: string; password: string; fullName: string; }
export interface AuthResponse { accessToken: string; user: User; }

export const authApi = {
  login: (data: LoginRequest) =>
    axiosClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),
  register: (data: RegisterRequest) =>
    axiosClient.post<AuthResponse>('/auth/register', data).then((r) => r.data),
  me: () =>
    axiosClient.get<User>('/auth/me').then((r) => r.data),
};
