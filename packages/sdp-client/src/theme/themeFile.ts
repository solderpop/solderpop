import { COLOR_KEYS, type ColorKey } from './colorRegistry.ts';

export type ThemeColors = Record<ColorKey, string>;
export type ThemeType = 'dark' | 'light';
// 'bundled' themes ship in the IDE's themes/ folder and are never written
// to; 'user' themes live in ~/.solderpop/themes (or browser storage).
export type ThemeSource = 'bundled' | 'user';

export interface Theme {
  id: string;
  name: string;
  author?: string;
  version?: string;
  type: ThemeType;
  source: ThemeSource;
  colors: ThemeColors;
}

// On-disk shape. Partial `colors` are allowed: missing keys fall back to
// the first-party theme of the same `type`.
export interface ThemeFile {
  $schema?: string;
  id: string;
  name: string;
  author?: string;
  version?: string;
  type?: ThemeType;
  colors: Partial<ThemeColors>;
}

export type FallbackColors = Record<ThemeType, ThemeColors>;

export interface ParseResult {
  theme: Theme | null;
  warnings: string[];
}

export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const THEME_ID = /^[a-z0-9][a-z0-9._-]*$/i;
const KNOWN_KEYS = new Set<string>(COLOR_KEYS);

const isObject = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);

const optionalString = (x: unknown): string | undefined =>
  typeof x === 'string' ? x : undefined;

export const parseTheme = (
  raw: unknown,
  source: ThemeSource,
  fallbacks: FallbackColors
): ParseResult => {
  if (!isObject(raw)) {
    return { theme: null, warnings: ['not a JSON object'] };
  }

  if (typeof raw.id !== 'string' || !THEME_ID.test(raw.id)) {
    return {
      theme: null,
      warnings: ['"id" must be letters, digits, ".", "_" or "-"'],
    };
  }

  const warnings: string[] = [];
  const type: ThemeType = raw.type === 'light' ? 'light' : 'dark';
  const rawColors = isObject(raw.colors) ? raw.colors : {};

  Object.keys(rawColors)
    .filter((key) => !KNOWN_KEYS.has(key))
    .forEach((key) => warnings.push(`unknown color "${key}" ignored`));

  const colors = Object.fromEntries(
    COLOR_KEYS.map((key) => {
      const value = rawColors[key];
      if (value === undefined) {
        return [key, fallbacks[type][key]];
      }

      if (typeof value === 'string' && HEX_COLOR.test(value)) {
        return [key, value.toLowerCase()];
      }
      warnings.push(`"${key}": "${String(value)}" is not a #rrggbb color`);
      return [key, fallbacks[type][key]];
    })
  ) as ThemeColors;

  return {
    theme: {
      id: raw.id,
      name: optionalString(raw.name) || raw.id,
      author: optionalString(raw.author),
      version: optionalString(raw.version),
      type,
      source,
      colors,
    },
    warnings,
  };
};

export const toThemeFile = (theme: Theme, schema?: string): ThemeFile => ({
  ...(schema ? { $schema: schema } : {}),
  id: theme.id,
  name: theme.name,
  ...(theme.author ? { author: theme.author } : {}),
  ...(theme.version ? { version: theme.version } : {}),
  type: theme.type,
  colors: theme.colors,
});

export const themeFileName = (id: string): string => `${id}.json`;
