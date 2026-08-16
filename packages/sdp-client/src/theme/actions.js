import * as AT from './actionTypes';

export const setTheme = theme => ({
  type: AT.SET_THEME,
  payload: { theme },
});

export const toggleTheme = () => ({
  type: AT.TOGGLE_THEME,
});

export const setThemeColor = (color, value) => ({
  type: AT.SET_THEME_COLOR,
  payload: { color, value },
});
