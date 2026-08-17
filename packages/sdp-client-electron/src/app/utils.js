import path from 'path';
import { fileURLToPath } from 'url';
import R from 'ramda';
import RamdaFantasy from 'ramda-fantasy';
import { resolvePath } from 'sdp-fs';
import electron from 'electron';

const { Maybe } = RamdaFantasy;

// Main Process only: this file is real native ESM once compiled to
// src-babel/app (package.json "type": "module"), which has no
// `__dirname` global. The Renderer Process branch below deliberately
// keeps using the bare `__dirname` identifier instead -- it's bundled
// by webpack (node: { __dirname: false }), which leaves that reference
// for Electron's renderer runtime to resolve to the bundle's own
// directory, a genuinely different (and correct) value for that context.
const mainProcessDirname = () => path.dirname(fileURLToPath(import.meta.url));

// see https://github.com/sindresorhus/electron-is-dev/issues/24#issuecomment-692379137
export const IS_DEV =
  (process.type === 'renderer'
    ? process.argv.includes('ELECTRON_IS_DEV')
    : !electron.app.isPackaged) || process.env.NODE_ENV === 'development';

const USERDATA_ARGNAME = '--userdata-dir=';

// Utility to set the user data directory arguments for the renerer processes
// from the main process on creating a renderer.
export const setUserDataArg = (userDataDir) =>
  `${USERDATA_ARGNAME}${userDataDir}`;

export const getUserDataDir = () =>
  process.type === 'renderer'
    ? R.compose(
        R.slice(USERDATA_ARGNAME.length, Infinity),
        R.find((arg) => arg.startsWith(USERDATA_ARGNAME))
      )(process.argv)
    : process.env.USERDATA_DIR || electron.app.getPath('userData');

// =============================================================================
//
// IPC
//
// =============================================================================

// for IPC. see https://electron.atom.io/docs/api/remote/#remote-objects
// if we don't do this, we get empty objects on the other side instead of errors
export const errorToPlainObject = R.when(
  R.is(Error),
  R.converge(R.pick, [Object.getOwnPropertyNames, R.identity])
);

// =============================================================================
//
// Cross-platform
//
// =============================================================================

/**
 * It provides one iterface for getting file path, that
 * should be opened on start-up (if User opens associated file),
 * on any platform:
 * - Windows & Linux: get it from process.argv
 * - MacOS: get it from fired events
 *
 * It accepts an app and returns a getter function,
 * that will return `Maybe Path`.
 */
// :: App -> () -> Maybe Path
export const getFilePathToOpen = (app) => {
  // Windows & Linux
  let pathToOpen = R.compose(
    R.map(resolvePath),
    R.ifElse(
      R.anyPass([
        R.isNil,
        // to filter out command line switches and other arguments
        // that are definitely not a file path to open
        R.startsWith('-'),
        R.startsWith('data:'),
        R.equals('.'),
      ]),
      Maybe.Nothing,
      Maybe.of
    ),
    R.last,
    R.tail
  )(process.argv);

  // MacOS
  app.once('will-finish-launching', () => {
    app.once('open-file', (event, filePath) => {
      pathToOpen = Maybe(filePath);
    });
  });

  return () => pathToOpen;
};

// =============================================================================

/**
 * Returns Path to the resources directory root.
 *
 * When IDE runs in development mode it resolves to directory
 * with transpiled code, and it handles call either from Main Process
 * and Renderer Process. They're have a different `__dirname` values:
 * - Main Process: /some/path/to/src-babel/app
 * - Renderer Process: /some/path/to/src-babel
 *
 * When IDE runs in production mode it resolves to resources path.
 */
export const getResourcesRoot = () => {
  if (IS_DEV) {
    return process.type === 'renderer'
      ? __dirname
      : path.resolve(mainProcessDirname(), '..');
  }
  return process.resourcesPath;
};

/**
 * Returns Path to the bundled workspace
 */
export const getPathToBundledWorkspace = () =>
  path.join(getResourcesRoot(), 'workspace');
