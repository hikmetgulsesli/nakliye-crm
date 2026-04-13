import api from '@/config/api';
import type {
  User,
  UserCreateInput,
  UserUpdateInput,
  PaginatedResponse,
} from '@nakliye-crm/shared';

export const userService = {
  async getAll(
    page: number = 1,
    pageSize: number = 100,
  ): Promise<PaginatedResponse<User>> {
    const { data } = await api.get<PaginatedResponse<User>>('/users', {
      params: { page, pageSize },
    });
    return data;
  },

  async getById(id: number): Promise<User> {
    const { data } = await api.get<User>(`/users/${id}`);
    return data;
  },

  async create(input: UserCreateInput): Promise<User> {
    const { data } = await api.post<User>('/users', input);
    return data;
  },

  async update(id: number, input: UserUpdateInput): Promise<User> {
    const { data } = await api.patch<User>(`/users/${id}`, input);
    return data;
  },

  async deactivate(id: number): Promise<User> {
    const { data } = await api.patch<User>(`/users/${id}/deactivate`);
    return data;
  },
};
