import api from '../config/api';
import type { AuthUser } from '../stores/authStore';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: AuthUser;
  accessToken: string;
}

interface RefreshResponse {
  accessToken: string;
}

interface MeResponse {
  user: AuthUser;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials);
    return data;
  },

  async refreshToken(): Promise<RefreshResponse> {
    const { data } = await api.post<RefreshResponse>(
      '/auth/refresh',
      {},
      { withCredentials: true },
    );
    return data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getMe(): Promise<MeResponse> {
    const { data } = await api.get<MeResponse>('/auth/me');
    return data;
  },
};
