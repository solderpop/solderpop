export const getCurrentTheme = state => state.theme.currentTheme;
export const getThemeList = state => state.theme.themes;
export const getTheme = state => state.theme.themes[state.theme.currentTheme];
export const getThemeName = state =>
  state.theme.themes[state.theme.currentTheme].name;
export const getThemeColors = state =>
  state.theme.themes[state.theme.currentTheme].colors;

export const getThemeColor = (state, key) => getThemeColors(state)[key];
