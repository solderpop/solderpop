import type { Middleware } from 'redux';

import type { ThemeState } from './state.ts';
import type { Theme } from './themeFile.ts';

// Platform-specific: Electron writes to ~/.solderpop/themes + settings,
// the browser build uses localStorage.
export interface ThemeStorage {
  saveCurrentTheme(id: string): void;
  saveUserTheme(theme: Theme): void;
  deleteUserTheme(id: string): void;
}

// Colour pickers fire on every drag step; don't rewrite the file each time.
const SAVE_DELAY_MS = 400;

export const createThemePersistenceMiddleware = (
  storage: ThemeStorage
): Middleware<object, { theme: ThemeState }> => {
  const pending = new Map<string, ReturnType<typeof setTimeout>>();

  const scheduleSave = (theme: Theme) => {
    clearTimeout(pending.get(theme.id));
    pending.set(
      theme.id,
      setTimeout(() => {
        pending.delete(theme.id);
        storage.saveUserTheme(theme);
      }, SAVE_DELAY_MS)
    );
  };

  return (store) => (next) => (action) => {
    const prev = store.getState().theme;
    const result = next(action);
    const curr = store.getState().theme;

    if (prev === curr) {
      return result;
    }

    if (prev.currentTheme !== curr.currentTheme) {
      storage.saveCurrentTheme(curr.currentTheme);
    }

    Object.values(curr.themes)
      .filter((t) => t.source === 'user' && prev.themes[t.id] !== t)
      .forEach(scheduleSave);

    Object.keys(prev.themes)
      .filter((id) => !curr.themes[id])
      .forEach((id) => {
        clearTimeout(pending.get(id));
        pending.delete(id);
        storage.deleteUserTheme(id);
      });

    return result;
  };
};
