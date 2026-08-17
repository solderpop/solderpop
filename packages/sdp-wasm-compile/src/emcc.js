import os from 'os';
import path from 'path';
import which from 'which';
import fse from 'fs-extra';
import { createError } from 'sdp-func-tools';

const findBundledNode = async (emsdkRoot) => {
  const nodeRoot = path.join(emsdkRoot, 'node');
  const versions = await fse.readdir(nodeRoot).catch(() => []);
  if (versions.length === 0) {
    throw createError('EMCC_NOT_FOUND', { emsdkRoot });
  }
  const nodeBin =
    os.platform() === 'win32' ? 'node.exe' : path.join('bin', 'node');
  return path.join(nodeRoot, versions[0], nodeBin);
};

// Fallback for a system-wide emscripten install (e.g. installed via a
// package manager, already exporting a working em++ on $PATH with no
// EMSDK/EMSDK_NODE needed — those are only required for emsdk's own
// bundled, relocatable toolchain layout).
const getSystemEmxxEnv = () =>
  new Promise((resolve, reject) => {
    const emxxBin = os.platform() === 'win32' ? 'em++.bat' : 'em++';
    which(emxxBin, (err, emxxPath) => {
      if (err) {
        reject(createError('EMCC_NOT_FOUND', {}));
        return;
      }
      resolve({ emxx: emxxPath, env: process.env });
    });
  });

// Locates an emsdk root and returns the `em++` binary path plus the extra
// environment variables it needs to run standalone (found empirically:
// sourcing emsdk's own emsdk_env.sh only ever adds EMSDK, EMSDK_NODE, and
// two PATH entries — <root> and <root>/upstream/emscripten — so we
// reconstruct that directly instead of shelling out to the setup script).
//
// There's nothing bundled into the app build — Emscripten is downloaded
// on demand per-platform by the emsdk installer flow in
// packages/sdp-client-electron/src/app/emsdkInstaller.js, into a writable
// per-user directory (Electron's userData). That path is passed in here
// explicitly (this package doesn't depend on `electron` itself) rather
// than assumed, matching arduinoCli.js's own lookup style otherwise:
// an env var override wins for dev/testing, then the installed location,
// then whatever's already on $PATH for anyone with their own system-wide
// emscripten install.
//
// :: Nullable Path -> Promise { emxx :: Path, env :: StrMap String } Error
export const getEmxxEnv = async (installedEmsdkRoot = null) => {
  const emsdkRoot = process.env.SDP_EMSDK_ROOT || installedEmsdkRoot;

  if (!emsdkRoot) {
    return getSystemEmxxEnv();
  }

  const upstreamDir = path.join(emsdkRoot, 'upstream', 'emscripten');
  const emxxBin = os.platform() === 'win32' ? 'em++.bat' : 'em++';
  const emxx = path.join(upstreamDir, emxxBin);

  if (!(await fse.pathExists(emxx))) {
    return getSystemEmxxEnv().catch(() => {
      throw createError('EMCC_NOT_FOUND', { emsdkRoot });
    });
  }

  const nodeBin = await findBundledNode(emsdkRoot);

  return {
    emxx,
    env: {
      ...process.env,
      EMSDK: emsdkRoot,
      EMSDK_NODE: nodeBin,
      PATH: [emsdkRoot, upstreamDir, process.env.PATH].join(path.delimiter),
    },
  };
};

// :: Nullable Path -> Promise Boolean Error
export const isEmsdkInstalled = (installedEmsdkRoot) => {
  if (!installedEmsdkRoot) return Promise.resolve(false);
  const upstreamDir = path.join(installedEmsdkRoot, 'upstream', 'emscripten');
  const emxxBin = os.platform() === 'win32' ? 'em++.bat' : 'em++';
  return fse.pathExists(path.join(upstreamDir, emxxBin));
};
