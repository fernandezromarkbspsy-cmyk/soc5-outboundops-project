import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role } from '../types';

const today = () => {
  const value = new Date();
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
};

export type ThemeMode = 'light' | 'dark' | 'system';

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

function applyTheme(mode: ThemeMode) {
  document.documentElement.dataset.theme = resolveTheme(mode);
}

interface UiState {
  sidebarOpen: boolean;
  soundEnabled: boolean;
  theme: ThemeMode;
  search: string;
  dateFrom: string;
  dateTo: string;
  viewRole: Role | null;
  setViewRole: (viewRole: Role | null) => void;
  setSearch: (search: string) => void;
  setDateRange: (dateFrom: string, dateTo: string) => void;
  resetDateRange: () => void;
  toggleSidebar: () => void;
  toggleSound: () => void;
  setTheme: (theme: ThemeMode) => void;
}

export const useUiStore = create<UiState>()(persist((set, get) => ({
  sidebarOpen: false,
  soundEnabled: true,
  theme: 'system',
  search: '',
  dateFrom: today(),
  dateTo: today(),
  viewRole: null,
  setViewRole: viewRole => set({ viewRole }),
  setSearch: search => set({ search }),
  setDateRange: (dateFrom, dateTo) => set({ dateFrom, dateTo }),
  resetDateRange: () => set({ dateFrom: today(), dateTo: today() }),
  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
  toggleSound: () => set(state => ({ soundEnabled: !state.soundEnabled })),
  setTheme: theme => {
    applyTheme(theme);
    set({ theme });
  },
}), {
  name: 'soc5-ui',
  partialize: state => ({
    soundEnabled: state.soundEnabled,
    theme: state.theme,
  }),
  onRehydrateStorage: () => state => {
    if (state) applyTheme(state.theme);
  },
}));

if (typeof window !== 'undefined') {
  applyTheme(useUiStore.getState().theme);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (useUiStore.getState().theme === 'system') applyTheme('system');
  });
}
