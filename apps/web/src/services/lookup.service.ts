import api from '@/config/api';
import type { LookupValue, LookupCreateInput } from '@nakliye-crm/shared';

export interface LookupUpdateInput {
  value?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export const lookupService = {
  async getAll(): Promise<Record<string, LookupValue[]>> {
    const { data } = await api.get<Record<string, LookupValue[]>>('/lookups');
    return data;
  },

  async getByCategory(category: string, includeInactive = false): Promise<LookupValue[]> {
    const { data } = await api.get<LookupValue[]>(`/lookups/category/${category}`, {
      params: { includeInactive },
    });
    return data;
  },

  async create(input: LookupCreateInput): Promise<LookupValue> {
    const { data } = await api.post<LookupValue>('/lookups', input);
    return data;
  },

  async update(id: number, input: LookupUpdateInput): Promise<LookupValue> {
    const { data } = await api.patch<LookupValue>(`/lookups/${id}`, input);
    return data;
  },

  async toggle(id: number): Promise<LookupValue> {
    const { data } = await api.patch<LookupValue>(`/lookups/${id}/toggle`);
    return data;
  },

  async reorder(items: Array<{ id: number; sortOrder: number }>): Promise<void> {
    await api.patch('/lookups/reorder', { items });
  },
};
