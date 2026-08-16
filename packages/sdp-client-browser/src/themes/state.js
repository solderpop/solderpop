// Define theme color keys and default themes

export const THEME_COLOR_KEYS = [
  // Primary colors
  'primary',
  'secondary', 
  'accent',
  'success',
  'warning',
  'danger',

  // Text colors
  'textPrimary',
  'textSecondary',
  'textTertiary',
  'textInverse',

  // Backgrounds
  'bgPrimary',
  'bgSecondary',
  'bgTertiary',
  'bgInverse',
  'bgCard',

  // UI elements
  'borderColor',
  'borderRadius',
  'shadow',
  
  // Canvas
  'canvasBg',
  'canvasGridlines',
  'canvasFace',
  'canvasFaceLight',
  'canvasFaceText',

  // Nodes
  'nodeFill',
  'nodeLabel',
  'nodeOutline',
  'pinBg',
  'pinLabel',
  'commentText',

  // Menubar and tabs
  'menubarBg',
  'menubarText',
  'menubarActiveBg',
  'menubarActiveText',
  'menubarHoverBg',

  // Sidebar
  'sidebarBg',
  'sidebarHoverBg',
  'sidebarSelectedBg',
  'sidebarText',
  'sidebarSubtitle',

  // Tabs
  'tabBg',
  'tabItemBg',
  'tabText',

  // Inputs
  'inputBg',
  'inputText',
  'inputBorder',
  
  // Buttons
  'darkButtonBg',
  'darkButtonHoverBg',
  'darkButtonText',
  'lightButtonBg',
  'lightButtonText',

  // Highlight and selections
  'highlight',
  'selected',
  'error',
  'errorText',

  // Window chrome
  'chromeBg',
  'chromeTitleBg',
  'chromeOutlines',
  'chromeLightBg',

  // Status indicators
  'statusSuccess',
  'statusWarning',
  'statusDanger'
];

export const DEFAULT_THEME = {
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
  statusDanger: '#ef4444'
};

export const THEMES = {
  default: {
    name: 'Default',
    colors: DEFAULT_THEME,
    description: 'Base theme for the Solderpop IDE'
  },
  dark: {
    name: 'Dark Theme',
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b', 
      accent: '#ff6b6b',
      success: '#10b981',
      warning: '#f59e00',
      danger: '#ef4444',

      textPrimary: '#f9fafb',
      textSecondary: '#9ca3af',
      textTertiary: '#6b7280',
      textInverse: '#111821',

      bgPrimary: '#111821',
      bgSecondary: '#1f2937',
      bgTertiary: '#374151',
      bgInverse: '#ffffff',
      bgCard: '#1f2937',

      borderColor: '#374151',
      borderRadius: '0.375rem',
      shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      
      canvasBg: '#111821',
      canvasGridlines: '#374151',
      canvasFace: '#374151',
      canvasFaceLight: '#1f2937',
      canvasFaceText: '#9ca3af',

      nodeFill: '#1f2937',
      nodeLabel: '#f9fafb',
      nodeOutline: '#374151',
      pinBg: '#374151',
      pinLabel: '#9ca3af',
      commentText: '#f9fafb',

      menubarBg: '#111821',
      menubarText: '#f9fafb',
      menubarActiveBg: '#fff1f2',
      menubarActiveText: '#ff6b6b',
      menubarHoverBg: '#374151',

      sidebarBg: '#1f2937',
      sidebarHoverBg: '#374151',
      sidebarSelectedBg: '#fff1f2',
      sidebarText: '#f9fafb',
      sidebarSubtitle: '#9ca3af',

      tabBg: '#374151',
      tabItemBg: '#111821',
      tabText: '#9ca3af',

      inputBg: '#1f2937',
      inputText: '#f9fafb',
      inputBorder: '#374151',
      
      darkButtonBg: '#374151',
      darkButtonHoverBg: '#4b5563',
      darkButtonText: '#ffffff',
      lightButtonBg: '#374151',
      lightButtonText: '#f9fafb',

      highlight: '#1f2937',
      selected: '#ff6b6b',
      error: '#ef4444',
      errorText: '#dc2626',

      chromeBg: '#111821',
      chromeTitleBg: '#0c1420',
      chromeOutlines: '#374151',
      chromeLightBg: '#1f2937',

      statusSuccess: '#10b981',
      statusWarning: '#f59e00',
      statusDanger: '#ef4444'
    },
    description: 'Dark theme for comfortable night-time coding'
  },
  light: {
    name: 'Light Theme',
    colors: {
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
      statusDanger: '#ef4444'
    },
    description: 'Bright theme for daytime coding comfort'
  }
};

export const INITIAL_STATE = {
  currentTheme: 'default',
  themes: THEMES
};
