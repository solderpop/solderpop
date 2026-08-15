import * as R from 'ramda';

import { INITIAL_STATE } from './state';
import * as AT from './actionTypes';

const setCurrentTheme = (state, theme) => R.assoc('currentTheme', theme, state);

const toggleTheme = state => {
  const themeKeys = R.keys(state.themes);
  const currentIndex = themeKeys.indexOf(state.currentTheme);
  const nextIndex = (currentIndex + 1) % themeKeys.length;
  return setCurrentTheme(state, themeKeys[nextIndex]);
};

const setThemeColor = (state, { color, value }) =>
  R.over(
    R.lensPath(['themes', state.currentTheme, 'colors', color]),
    R.always(value),
    state
  );

const reducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case AT.SET_THEME:
      if (!R.has(action.payload.theme, state.themes)) return state;
      return setCurrentTheme(state, action.payload.theme);

    case AT.TOGGLE_THEME:
      return toggleTheme(state);

    case AT.SET_THEME_COLOR:
      return setThemeColor(state, action.payload);

    default:
      return state;
  }
};

export default reducer;
