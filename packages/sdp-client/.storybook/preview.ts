import type { Decorator, Preview } from '@storybook/react';

import { applyTheme } from '../src/theme/applyTheme.ts';
import { BUNDLED_THEMES, DEFAULT_THEME_ID } from '../src/theme/state.ts';

// Toolbar "Theme" dropdown: every story renders with the chosen theme's
// CSS variables, same as the IDE.
const withTheme: Decorator = (story, context) => {
  const theme =
    BUNDLED_THEMES.find((t) => t.id === context.globals.theme) ||
    BUNDLED_THEMES[0];
  applyTheme(theme.colors);
  document.body.style.background = theme.colors['window.background'];
  return story();
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'IDE colour theme',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: BUNDLED_THEMES.map((t) => ({ value: t.id, title: t.name })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: DEFAULT_THEME_ID },
  decorators: [withTheme],
};

export default preview;
