import { create } from 'zustand';

export type Theme = 'light' | 'dark';

interface ThemeStore {
  theme: Theme;
  toggleTheme: () => void;
}

const stored =
  typeof window !== 'undefined'
    ? (localStorage.getItem('van-theme') as Theme | null)
    : null;

export const useThemeStore = create<ThemeStore>()((set) => ({
  theme: stored ?? 'light',

  toggleTheme: () =>
    set((s) => {
      const next: Theme = s.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('van-theme', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      document.documentElement.classList.toggle('light', next === 'light');
      return { theme: next };
    }),
}));
