/**
 * Module for the main process related to checking and installing the
 * Emscripten SDK, needed to compile WASM locally for Simulate — mirrors
 * arduinoDependencies.js's shape for the equivalent Arduino toolchain flow.
 *
 * Nothing is bundled into the app: emsdk (the small control-scripts repo,
 * NOT the multi-hundred-MB toolchain itself) is downloaded from GitHub on
 * demand into a writable per-user directory, then its own `install`/
 * `activate` commands fetch the actual per-platform toolchain — emsdk
 * already knows how to pick the right archive for the current OS/arch, so
 * there's no platform-URL mapping to write or maintain here.
 */

import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import fse from 'fs-extra';
import download from 'sdp-deploy/dist/download.js';
import unpackZip from 'sdp-deploy/dist/unzip.js';
import createProgress from 'sdp-deploy/dist/progress.js';
import { isEmsdkInstalled } from 'sdp-wasm-compile';
import { createError } from 'sdp-func-tools';

import {
  CHECK_EMSDK_INSTALLED,
  INSTALL_EMSDK,
  UNINSTALL_EMSDK,
} from '../shared/events.js';
import subscribeIpc from './subscribeIpc.js';
import { getUserDataDir } from './utils.js';

const EMSDK_SCRIPTS_URL =
  'https://github.com/emscripten-core/emsdk/archive/refs/heads/main.zip';

// :: _ -> Path
export const getEmsdkRoot = () => path.join(getUserDataDir(), 'emsdk');

// :: Path -> [String] -> ((String) -> _) -> Promise _ Error
const runEmsdkCommand = (emsdkRoot, args, onLine) =>
  new Promise((resolve, reject) => {
    const script = path.join(
      emsdkRoot,
      os.platform() === 'win32' ? 'emsdk.bat' : 'emsdk'
    );
    const proc = spawn(script, args, { cwd: emsdkRoot });
    proc.stdout.on('data', (data) => onLine(data.toString()));
    proc.stderr.on('data', (data) => onLine(data.toString()));
    proc.on('error', reject);
    proc.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(createError('EMSDK_INSTALL_FAILED', { code }));
    });
  });

// :: (ProgressData -> _) -> Path -> Promise _ Error
const installEmsdkScripts = async (onProgress, emsdkRoot) => {
  const progress = createProgress(2);
  onProgress(progress('Downloading emsdk...'));

  const zipPath = path.join(getUserDataDir(), 'emsdk-scripts.zip');
  await download(EMSDK_SCRIPTS_URL, zipPath);

  onProgress(progress('Unpacking emsdk...'));
  const unpackedDirName = await unpackZip(zipPath);
  const unpackedPath = path.join(path.dirname(zipPath), unpackedDirName);

  await fse.remove(emsdkRoot);
  await fse.move(unpackedPath, emsdkRoot);
  await fse.remove(zipPath);
};

// :: (ProgressData -> _) -> Promise _ Error
export const installEmsdk = async (onProgress) => {
  const emsdkRoot = getEmsdkRoot();

  await installEmsdkScripts(onProgress, emsdkRoot);

  // emsdk's own install/activate output doesn't come with a percentage —
  // forwarded as log lines instead, same as Debugger.jsx already handles
  // for other installers when percentage is absent.
  const onLine = (message) => onProgress({ note: message.trim() });
  await runEmsdkCommand(emsdkRoot, ['install', 'latest'], onLine);
  await runEmsdkCommand(emsdkRoot, ['activate', 'latest'], onLine);
};

// :: _ -> Promise _ Error
export const uninstallEmsdk = () => fse.remove(getEmsdkRoot());

export const subscribeOnCheckEmsdkInstalled = () =>
  subscribeIpc(() => isEmsdkInstalled(getEmsdkRoot()), CHECK_EMSDK_INSTALLED);

export const subscribeOnInstallEmsdk = () =>
  subscribeIpc((_, __, onProgress) => installEmsdk(onProgress), INSTALL_EMSDK);

export const subscribeOnUninstallEmsdk = () =>
  subscribeIpc(uninstallEmsdk, UNINSTALL_EMSDK);
