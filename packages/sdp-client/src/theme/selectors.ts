import type { ColorKey } from './colorRegistry.ts';
import type { ThemeState } from './state.ts';

interface State {
  theme: ThemeState;
}

export const getCurrentTheme = (state: State) => state.theme.currentTheme;
export const getThemeList = (state: State) => state.theme.themes;
export const getTheme = (state: State) =>
  state.theme.themes[state.theme.currentTheme];
export const getThemeName = (state: State) => getTheme(state).name;
export const getThemeColors = (state: State) => getTheme(state).colors;
export const getThemeColor = (state: State, key: ColorKey) =>
  getThemeColors(state)[key];
