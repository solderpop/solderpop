import * as AT from './actionTypes.ts';
import type { ColorKey } from './colorRegistry.ts';

export const setTheme = (theme: string) =>
  ({ type: AT.SET_THEME, payload: { theme } }) as const;

export const toggleTheme = () => ({ type: AT.TOGGLE_THEME }) as const;

export const setThemeColor = (color: ColorKey, value: string) =>
  ({ type: AT.SET_THEME_COLOR, payload: { color, value } }) as const;

// Only user themes can be deleted; bundled ones are ignored by the reducer.
export const deleteTheme = (theme: string) =>
  ({ type: AT.DELETE_THEME, payload: { theme } }) as const;

export type ThemeAction =
  | ReturnType<typeof setTheme>
  | ReturnType<typeof toggleTheme>
  | ReturnType<typeof setThemeColor>
  | ReturnType<typeof deleteTheme>;
