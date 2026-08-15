import { INITIAL_STATE } from './state';
import * as AT from './actionTypes';

const reducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case AT.SET_THEME:
      return {
        ...state,
        currentTheme: action.payload.theme,
      };

    case AT.TOGGLE_THEME:
      const themeOrder = ['light', 'dark', 'blue'];
      const currentIndex = themeOrder.indexOf(state.currentTheme);
      const nextIndex = (currentIndex + 1) % themeOrder.length;
      return {
        ...state,
        currentTheme: themeOrder[nextIndex],
      };

    case AT.SET_THEME_COLOR:
      const { color, value } = action.payload;
      return {
        ...state,
        themes: {
          ...state.themes,
          [state.currentTheme]: {
            ...state.themes[state.currentTheme],
            colors: {
              ...state.themes[state.currentTheme].colors,
              [color]: value,
            },
          },
        },
      };

    default:
      return state;
  }
};

export default reducer;