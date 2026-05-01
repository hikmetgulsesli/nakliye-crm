import api from '@/config/api';

export type SavedViewResource = 'customers' | 'quotations' | 'shipments' | 'activities';

export interface SavedView {
  id: number;
  userId: number;
  name: string;
  resource: SavedViewResource;
  filters: Record<string, unknown>;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavedViewInput {
  name: string;
  resource: SavedViewResource;
  filters: Record<string, unknown>;
  isPinned?: boolean;
}

export interface UpdateSavedViewInput {
  name?: string;
  filters?: Record<string, unknown>;
  isPinned?: boolean;
}

export const savedViewsService = {
  async list(resource?: SavedViewResource): Promise<SavedView[]> {
    const { data } = await api.get<SavedView[]>('/saved-views', {
      params: resource ? { resource } : undefined,
    });
    return data;
  },

  async create(input: CreateSavedViewInput): Promise<SavedView> {
    const { data } = await api.post<SavedView>('/saved-views', input);
    return data;
  },

  async update(id: number, input: UpdateSavedViewInput): Promise<SavedView> {
    const { data } = await api.patch<SavedView>(`/saved-views/${id}`, input);
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/saved-views/${id}`);
  },
};
