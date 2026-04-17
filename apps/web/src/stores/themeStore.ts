import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

function applyToDom(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

function detectInitial(): Theme {
  if (typeof window === 'undefined') return 'light';
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: detectInitial(),
      setTheme: (t) => {
        applyToDom(t);
        set({ theme: t });
      },
      toggle: () => {
        const next: Theme = get().theme === 'light' ? 'dark' : 'light';
        applyToDom(next);
        set({ theme: next });
      },
    }),
    {
      name: 'nakliye-crm-theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyToDom(state.theme);
      },
    },
  ),
);
