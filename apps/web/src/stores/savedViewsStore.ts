import { create } from 'zustand';
import {
  savedViewsService,
  type SavedView,
  type SavedViewResource,
  type CreateSavedViewInput,
  type UpdateSavedViewInput,
} from '@/services/saved-views.service';

interface SavedViewsState {
  /** Tüm scope'lardaki görünümler — sidebar bunları kullanır. */
  all: SavedView[];
  loaded: boolean;
  loading: boolean;
  fetch: () => Promise<void>;
  fetchIfNeeded: () => Promise<void>;
  byResource: (r: SavedViewResource) => SavedView[];
  pinned: () => SavedView[];
  add: (input: CreateSavedViewInput) => Promise<SavedView>;
  update: (id: number, input: UpdateSavedViewInput) => Promise<SavedView>;
  remove: (id: number) => Promise<void>;
  /** Logout/login dongusunde temizlemek icin */
  reset: () => void;
}

export const useSavedViewsStore = create<SavedViewsState>((set, get) => ({
  all: [],
  loaded: false,
  loading: false,

  async fetch() {
    set({ loading: true });
    try {
      const list = await savedViewsService.list();
      set({ all: list, loaded: true, loading: false });
    } catch {
      // Auth/network hatasinda sessizce yut — sidebar bos kalir
      set({ loading: false, loaded: true });
    }
  },

  async fetchIfNeeded() {
    if (get().loaded || get().loading) return;
    await get().fetch();
  },

  byResource(r) {
    return get().all.filter((v) => v.resource === r);
  },

  pinned() {
    return get().all.filter((v) => v.isPinned);
  },

  async add(input) {
    const created = await savedViewsService.create(input);
    set((s) => ({ all: [...s.all, created] }));
    return created;
  },

  async update(id, input) {
    const updated = await savedViewsService.update(id, input);
    set((s) => ({ all: s.all.map((v) => (v.id === id ? updated : v)) }));
    return updated;
  },

  async remove(id) {
    await savedViewsService.remove(id);
    set((s) => ({ all: s.all.filter((v) => v.id !== id) }));
  },

  reset() {
    set({ all: [], loaded: false, loading: false });
  },
}));
