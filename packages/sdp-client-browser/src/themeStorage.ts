import client from 'sdp-client';
import type {
  Theme,
  ThemeApi,
  ThemeState,
  ThemeStorage,
} from 'sdp-client/src/theme/index.ts';

const T = client.theme as ThemeApi;

const CURRENT_KEY = 'solderpop.theme.current';
const USER_THEMES_KEY = 'solderpop.theme.user';

// localStorage throws in private windows / with site data blocked.
const read = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string): void => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Theme still applies for this session, it just won't persist.
  }
};

const readUserThemeFiles = (): Record<string, unknown> => {
  try {
    const parsed = JSON.parse(read(USER_THEMES_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const updateUserThemeFiles = (
  update: (files: Record<string, unknown>) => Record<string, unknown>
): void => {
  write(USER_THEMES_KEY, JSON.stringify(update(readUserThemeFiles())));
};

export const loadThemeState = (): ThemeState => {
  const userThemes = Object.values(readUserThemeFiles()).flatMap((raw) => {
    const { theme } = T.parseTheme(raw, 'user', T.fallbackColors);
    return theme ? [theme] : [];
  });
  return T.buildThemeState(
    [...T.bundledThemes, ...userThemes],
    read(CURRENT_KEY)
  );
};

export const browserThemeStorage: ThemeStorage = {
  saveCurrentTheme(id) {
    write(CURRENT_KEY, id);
  },
  saveUserTheme(theme: Theme) {
    updateUserThemeFiles((files) => ({
      ...files,
      [theme.id]: T.toThemeFile(theme),
    }));
  },
  deleteUserTheme(id) {
    updateUserThemeFiles(({ [id]: _deleted, ...rest }) => rest);
  },
};
