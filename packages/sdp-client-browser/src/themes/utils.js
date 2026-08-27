import * as R from 'ramda';

// applyTheme - Sets CSS variables for theme colors
export const applyTheme = (colors) => {
  if (!colors || typeof document === 'undefined') return;

  // Normalize color keys to match our CSS variable names
  const cssVariableMap = {
    // Primary colors
    primary: '--theme-color-primary',
    secondary: '--theme-color-secondary',
    accent: '--theme-color-accent',
    success: '--theme-color-success',
    warning: '--theme-color-warning',
    danger: '--theme-color-danger',

    // Text colors
    textPrimary: '--theme-text-primary',
    textSecondary: '--theme-text-secondary',
    textTertiary: '--theme-text-tertiary',
    textInverse: '--theme-text-inverse',

    // Backgrounds
    bgPrimary: '--theme-bg-primary',
    bgSecondary: '--theme-bg-secondary',
    bgTertiary: '--theme-bg-tertiary',
    bgInverse: '--theme-bg-inverse',
    bgCard: '--theme-bg-card',

    // UI elements
    borderColor: '--theme-border-color',
    borderRadius: '--theme-border-radius',
    shadow: '--theme-shadow',

    // Canvas
    canvasBg: '--theme-canvas-bg',
    canvasGridlines: '--theme-canvas-gridlines',
    canvasFace: '--theme-canvas-face',
    canvasFaceLight: '--theme-canvas-face-light',
    canvasFaceText: '--theme-canvas-face-text',

    // Nodes
    nodeFill: '--theme-node-fill',
    nodeLabel: '--theme-node-label',
    nodeOutline: '--theme-node-outline',
    pinBg: '--theme-pin-bg',
    pinLabel: '--theme-pin-label',
    commentText: '--theme-comment-text',

    // Menubar and tabs
    menubarBg: '--theme-menubar-bg',
    menubarText: '--theme-menubar-text',
    menubarActiveBg: '--theme-menubar-active-bg',
    menubarActiveText: '--theme-menubar-active-text',
    menubarHoverBg: '--theme-menubar-hover-bg',

    // Sidebar
    sidebarBg: '--theme-sidebar-bg',
    sidebarHoverBg: '--theme-sidebar-hover-bg',
    sidebarSelectedBg: '--theme-sidebar-selected-bg',
    sidebarText: '--theme-sidebar-text',
    sidebarSubtitle: '--theme-sidebar-subtitle',

    // Tabs
    tabBg: '--theme-tab-bg',
    tabItemBg: '--theme-tab-item-bg',
    tabText: '--theme-tab-text',

    // Inputs
    inputBg: '--theme-input-bg',
    inputText: '--theme-input-text',
    inputBorder: '--theme-input-border',

    // Buttons
    darkButtonBg: '--theme-button-dark-bg',
    darkButtonHoverBg: '--theme-button-dark-hover-bg',
    darkButtonText: '--theme-button-dark-text',
    lightButtonBg: '--theme-button-light-bg',
    lightButtonText: '--theme-button-light-text',

    // Highlight and selections
    highlight: '--theme-highlight',
    selected: '--theme-selected',
    error: '--theme-error',
    errorText: '--theme-error-text',

    // Window chrome
    chromeBg: '--theme-chrome-bg',
    chromeTitleBg: '--theme-chrome-title-bg',
    chromeOutlines: '--theme-chrome-outlines',
    chromeLightBg: '--theme-chrome-light-bg',

    // Status indicators
    statusSuccess: '--theme-status-success',
    statusWarning: '--theme-status-warning',
    statusDanger: '--theme-status-danger',
  };

  R.forEachObjIndexed((value, key) => {
    const cssVar = cssVariableMap[key];
    if (cssVar) {
      document.documentElement.style.setProperty(cssVar, value);
    }
  }, colors);
};

// resetTheme - Resets all theme variables to their defaults
export const resetTheme = () => {
  if (typeof document === 'undefined') return;

  // Reset all CSS variables to their default values as defined in the base.css file
  const defaultValues = {
    primary: '#3b82f6',
    secondary: '#64748b',
    accent: '#ff6b6b',
    success: '#10b981',
    warning: '#f59e00',
    danger: '#ef4444',
    textPrimary: '#1f2937',
    textSecondary: '#6b7280',
    textTertiary: '#9ca3af',
    textInverse: '#f9fafb',
    bgPrimary: '#ffffff',
    bgSecondary: '#f3f4f6',
    bgTertiary: '#e5e7eb',
    bgInverse: '#111821',
    bgCard: '#fafafa',
    borderColor: '#d1d5db',
    borderRadius: '0.375rem',
    shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    canvasBg: '#ffffff',
    canvasGridlines: '#e5e7eb',
    canvasFace: '#f3f4f6',
    canvasFaceLight: '#fafafa',
    canvasFaceText: '#1f2937',
    nodeFill: '#ffffff',
    nodeLabel: '#1f2937',
    nodeOutline: '#d1d5db',
    pinBg: '#f3f4f6',
    pinLabel: '#6b7280',
    commentText: '#1f2937',
    menubarBg: '#ffffff',
    menubarText: '#1f2937',
    menubarActiveBg: '#fff1f2',
    menubarActiveText: '#ff6b6b',
    menubarHoverBg: '#f3f4f6',
    sidebarBg: '#fafafa',
    sidebarHoverBg: '#e5e7eb',
    sidebarSelectedBg: '#fff1f2',
    sidebarText: '#1f2937',
    sidebarSubtitle: '#6b7280',
    tabBg: '#f3f4f6',
    tabItemBg: '#ffffff',
    tabText: '#6b7280',
    inputBg: '#ffffff',
    inputText: '#1f2937',
    inputBorder: '#d1d5db',
    darkButtonBg: '#374151',
    darkButtonHoverBg: '#4b5563',
    darkButtonText: '#ffffff',
    lightButtonBg: '#f3f4f6',
    lightButtonText: '#1f2937',
    highlight: '#f3f4f6',
    selected: '#ff6b6b',
    error: '#ef4444',
    errorText: '#dc2626',
    chromeBg: '#ffffff',
    chromeTitleBg: '#f8fafc',
    chromeOutlines: '#e2e8f0',
    chromeLightBg: '#f1f5f9',
    statusSuccess: '#10b981',
    statusWarning: '#f59e00',
    statusDanger: '#ef4444',
  };

  R.forEachObjIndexed((value, key) => {
    const cssVar = `--theme-${key}`;
    document.documentElement.style.setProperty(cssVar, value);
  }, defaultValues);
};

// getThemeStyles - Get CSS variables string for use in themes
export const getThemeStyles = (colors) => {
  if (!colors) return '';

  const colorVars = R.toPairs(colors)
    .map(([key, value]) => `--theme-${key}: ${value}`)
    .join('\n');

  return `
    :root {
      ${colorVars}
    }
  `;
};
