import { create } from 'zustand';
import api from '../config/api';
import type { LookupValue } from '@nakliye-crm/shared';

interface LookupState {
  lookups: Record<string, LookupValue[]>;
  isLoaded: boolean;
  isLoading: boolean;
  fetchAll: () => Promise<void>;
  getByCategory: (category: string) => LookupValue[];
}

export const useLookupStore = create<LookupState>()((set, get) => ({
  lookups: {},
  isLoaded: false,
  isLoading: false,

  fetchAll: async () => {
    if (get().isLoading || get().isLoaded) return;
    set({ isLoading: true });
    try {
      // Backend returns { success, data: Record<string, LookupValue[]> }
      // after interceptor unwrap: data is Record<string, LookupValue[]>
      const { data } = await api.get<Record<string, LookupValue[]>>('/lookups');
      set({ lookups: data || {}, isLoaded: true });
    } catch (error) {
      console.error('Failed to fetch lookups:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  getByCategory: (category: string) => {
    return get().lookups[category] ?? [];
  },
}));
