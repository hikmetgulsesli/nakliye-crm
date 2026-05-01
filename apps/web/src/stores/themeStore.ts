import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';
type Accent = 'blue' | 'magenta' | 'lime';
type Density = 'comfortable' | 'compact';

interface ThemeState {
  theme: Theme;
  accent: Accent;
  density: Density;
  setTheme: (t: Theme) => void;
  setAccent: (a: Accent) => void;
  setDensity: (d: Density) => void;
  toggle: () => void;
}

function applyToDom(theme: Theme, accent?: Accent, density?: Density) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  root.dataset.theme = theme;
  if (accent) root.dataset.accent = accent;
  if (density) root.dataset.density = density;
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
      accent: 'blue',
      density: 'comfortable',
      setTheme: (t) => {
        const s = get();
        applyToDom(t, s.accent, s.density);
        set({ theme: t });
      },
      setAccent: (a) => {
        const s = get();
        applyToDom(s.theme, a, s.density);
        set({ accent: a });
      },
      setDensity: (d) => {
        const s = get();
        applyToDom(s.theme, s.accent, d);
        set({ density: d });
      },
      toggle: () => {
        const s = get();
        const next: Theme = s.theme === 'light' ? 'dark' : 'light';
        applyToDom(next, s.accent, s.density);
        set({ theme: next });
      },
    }),
    {
      name: 'nakliye-crm-theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyToDom(state.theme, state.accent, state.density);
      },
    },
  ),
);
