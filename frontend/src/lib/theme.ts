export type Theme = 'light' | 'dark';

const storageKey = 'soc5-theme';

export function getPreferredTheme(): Theme {
  const saved = localStorage.getItem(storageKey);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function saveTheme(theme: Theme) {
  localStorage.setItem(storageKey, theme);
  applyTheme(theme);
}
