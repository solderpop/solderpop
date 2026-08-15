export const getCurrentTheme = state => state.theme.currentTheme;
export const getTheme = state => state.theme.themes[state.theme.currentTheme];
export const getThemeColors = state => state.theme.themes[state.theme.currentTheme].colors;
export const getThemeName = state => state.theme.themes[state.theme.currentTheme].name;