import { toCssVar } from './colorRegistry.ts';
import type { ThemeColors } from './themeFile.ts';

export const applyTheme = (colors: ThemeColors | null | undefined): void => {
  if (!colors || typeof document === 'undefined') {
    return;
  }

  const { style } = document.documentElement;
  Object.entries(colors).forEach(([key, value]) =>
    style.setProperty(toCssVar(key), value)
  );
};
