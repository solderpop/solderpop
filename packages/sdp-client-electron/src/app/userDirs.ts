import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Hidden per-user folder for things users or third parties add to the IDE.
// SOLDERPOP_HOME overrides it (functional tests, portable setups).
export const getUserHomeDir = (): string =>
  process.env.SOLDERPOP_HOME || path.join(os.homedir(), '.solderpop');

export const getUserThemesDir = (): string =>
  path.join(getUserHomeDir(), 'themes');

export const getUserExtensionsDir = (): string =>
  path.join(getUserHomeDir(), 'extensions');

// Idempotent, so it runs on every launch: not every installer format
// (deb/rpm/dmg/NSIS) offers a post-install hook to do it once.
export const ensureUserDirs = (): void => {
  [getUserThemesDir(), getUserExtensionsDir()].forEach((dir) =>
    fs.mkdirSync(dir, { recursive: true })
  );
};
