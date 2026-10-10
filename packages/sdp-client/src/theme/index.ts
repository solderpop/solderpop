import * as actions from './actions.ts';
import * as actionTypes from './actionTypes.ts';
import * as selectors from './selectors.ts';
import reducer from './reducer.ts';
import {
  INITIAL_STATE,
  BUNDLED_THEMES,
  FALLBACK_COLORS,
  buildThemeState,
} from './state.ts';
import { parseTheme, toThemeFile, themeFileName } from './themeFile.ts';
import { applyTheme } from './applyTheme.ts';
import { createThemePersistenceMiddleware } from './persistenceMiddleware.ts';
import { COLORS, COLOR_GROUPS } from './colorRegistry.ts';

export const themeApi = {
  actions,
  actionTypes,
  selectors,
  reducer,
  state: INITIAL_STATE,
  colors: COLORS,
  colorGroups: COLOR_GROUPS,
  bundledThemes: BUNDLED_THEMES,
  fallbackColors: FALLBACK_COLORS,
  buildThemeState,
  parseTheme,
  toThemeFile,
  themeFileName,
  applyTheme,
  createThemePersistenceMiddleware,
};

export type ThemeApi = typeof themeApi;

export type { ThemeState } from './state.ts';
export type { ThemeStorage } from './persistenceMiddleware.ts';
export type {
  Theme,
  ThemeColors,
  ThemeFile,
  ThemeSource,
} from './themeFile.ts';
export type { ColorKey } from './colorRegistry.ts';
