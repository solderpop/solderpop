import lightJson from '../../themes/light.json' with { type: 'json' };
import navyJson from '../../themes/navy.json' with { type: 'json' };
import nordicJson from '../../themes/nordic.json' with { type: 'json' };

import {
  parseTheme,
  type FallbackColors,
  type Theme,
  type ThemeColors,
} from './themeFile.ts';

export interface ThemeState {
  currentTheme: string;
  themes: Record<string, Theme>;
}

export const DEFAULT_THEME_ID = 'light';

// First-party theme files are complete, so they're their own fallback.
export const FALLBACK_COLORS: FallbackColors = {
  dark: navyJson.colors as ThemeColors,
  light: lightJson.colors as ThemeColors,
};

const parseBundled = (raw: unknown): Theme => {
  const { theme } = parseTheme(raw, 'bundled', FALLBACK_COLORS);
  if (!theme) {
    throw new Error('Invalid first-party theme');
  }
  return theme;
};

// Compiled into the client so the browser build and a first paint in
// Electron always have themes, even before anything is read from disk.
export const BUNDLED_THEMES: Theme[] = [lightJson, navyJson, nordicJson].map(
  parseBundled
);

// Earlier themes win on id clashes, so pass bundled themes first: a user
// file can't silently replace a first-party theme.
export const buildThemeState = (
  themes: Theme[],
  currentTheme?: string | null
): ThemeState => {
  const byId: Record<string, Theme> = {};
  themes.forEach((theme) => {
    if (!byId[theme.id]) {
      byId[theme.id] = theme;
    }
  });
  return {
    currentTheme:
      currentTheme && byId[currentTheme] ? currentTheme : DEFAULT_THEME_ID,
    themes: byId,
  };
};

export const INITIAL_STATE: ThemeState = buildThemeState(BUNDLED_THEMES);
