import * as AT from './actionTypes.ts';
import type { ThemeAction } from './actions.ts';
import type { ColorKey } from './colorRegistry.ts';
import { DEFAULT_THEME_ID, INITIAL_STATE, type ThemeState } from './state.ts';
import type { Theme } from './themeFile.ts';

const uniqueId = (base: string, taken: Record<string, unknown>): string => {
  if (!taken[base]) {
    return base;
  }

  let n = 2;
  while (taken[`${base}-${n}`]) {
    n += 1;
  }
  return `${base}-${n}`;
};

// First-party themes are read-only: the first edit forks the current one
// into a user theme ("Navy (custom)") and switches to it.
const ensureEditable = (state: ThemeState): ThemeState => {
  const current = state.themes[state.currentTheme];
  if (current.source === 'user') {
    return state;
  }

  const id = uniqueId(`${current.id}-custom`, state.themes);
  const fork: Theme = {
    ...current,
    id,
    name: `${current.name} (custom)`,
    author: undefined,
    version: undefined,
    source: 'user',
  };

  return {
    currentTheme: id,
    themes: { ...state.themes, [id]: fork },
  };
};

const setThemeColor = (
  state: ThemeState,
  color: ColorKey,
  value: string
): ThemeState => {
  const editable = ensureEditable(state);
  const current = editable.themes[editable.currentTheme];
  return {
    ...editable,
    themes: {
      ...editable.themes,
      [current.id]: {
        ...current,
        colors: { ...current.colors, [color]: value },
      },
    },
  };
};

const toggleTheme = (state: ThemeState): ThemeState => {
  const ids = Object.keys(state.themes);
  const next = ids[(ids.indexOf(state.currentTheme) + 1) % ids.length];
  return { ...state, currentTheme: next };
};

const deleteTheme = (state: ThemeState, id: string): ThemeState => {
  if (state.themes[id]?.source !== 'user') {
    return state;
  }

  const { [id]: _deleted, ...themes } = state.themes;
  return {
    currentTheme:
      state.currentTheme === id ? DEFAULT_THEME_ID : state.currentTheme,
    themes,
  };
};

const reducer = (
  state: ThemeState = INITIAL_STATE,
  action: ThemeAction
): ThemeState => {
  switch (action.type) {
    case AT.SET_THEME:
      if (!state.themes[action.payload.theme]) {
        return state;
      }
      return { ...state, currentTheme: action.payload.theme };

    case AT.TOGGLE_THEME:
      return toggleTheme(state);

    case AT.SET_THEME_COLOR:
      return setThemeColor(state, action.payload.color, action.payload.value);

    case AT.DELETE_THEME:
      return deleteTheme(state, action.payload.theme);

    default:
      return state;
  }
};

export default reducer;
