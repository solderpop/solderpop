import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import client from 'sdp-client';
import type {
  Theme,
  ThemeApi,
  ThemeSource,
  ThemeState,
  ThemeStorage,
} from 'sdp-client/src/theme/index.ts';

import * as settings from '../app/settings.js';
import { getResourcesRoot } from '../app/utils.js';
import { getUserThemesDir } from '../app/userDirs.ts';

const T = client.theme as ThemeApi;

// First-party themes, shipped next to the app (resources/themes).
const getBundledThemesDir = (): string =>
  path.join(getResourcesRoot(), 'themes');

const readThemeDir = (dir: string, source: ThemeSource): Theme[] => {
  let files: string[];
  try {
    files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }

  return files
    .filter((file) => file !== 'theme.schema.json')
    .flatMap((file) => {
      const filePath = path.join(dir, file);
      try {
        const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const { theme, warnings } = T.parseTheme(raw, source, T.fallbackColors);
        warnings.forEach((w: string) =>
          // eslint-disable-next-line no-console
          console.warn(`Theme ${filePath}: ${w}`)
        );
        return theme ? [theme] : [];
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(`Theme ${filePath} skipped:`, err);
        return [];
      }
    });
};

// On-disk first-party themes take precedence over the copies compiled into
// sdp-client, so a theme can be fixed in an installed IDE without a rebuild.
export const loadThemeState = (): ThemeState =>
  T.buildThemeState(
    [
      ...readThemeDir(getBundledThemesDir(), 'bundled'),
      ...T.bundledThemes,
      ...readThemeDir(getUserThemesDir(), 'user'),
    ],
    settings.getCurrentTheme(settings.load())
  );

const schemaUrl = (): string =>
  pathToFileURL(path.join(getBundledThemesDir(), 'theme.schema.json')).href;

const userThemePath = (id: string): string =>
  path.join(getUserThemesDir(), T.themeFileName(id));

export const electronThemeStorage: ThemeStorage = {
  saveCurrentTheme(id) {
    settings.save(settings.setCurrentTheme(id, settings.load()));
  },
  saveUserTheme(theme) {
    try {
      fs.mkdirSync(getUserThemesDir(), { recursive: true });
      fs.writeFileSync(
        userThemePath(theme.id),
        `${JSON.stringify(T.toThemeFile(theme, schemaUrl()), null, 2)}\n`
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Could not save theme "${theme.id}":`, err);
    }
  },
  deleteUserTheme(id) {
    fs.rm(userThemePath(id), { force: true }, (err) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.error(`Could not delete theme "${id}":`, err);
      }
    });
  },
};
