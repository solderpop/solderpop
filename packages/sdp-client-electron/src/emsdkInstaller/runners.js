/**
 * Module for the renderer process related to checking, installing, and
 * uninstalling the Emscripten SDK — mirrors ../arduinoDependencies/runners.js.
 */

import { noop } from 'sdp-func-tools';
import {
  CHECK_EMSDK_INSTALLED,
  INSTALL_EMSDK,
  UNINSTALL_EMSDK,
} from '../shared/events.js';
import promisifyIpc from '../view/promisifyIpc.js';

// :: _ -> Promise Boolean Error
export const checkEmsdkInstalled = () =>
  promisifyIpc(CHECK_EMSDK_INSTALLED)(noop, null);

// :: (ProgressData -> _) -> Promise _ Error
export const installEmsdk = onProgress =>
  promisifyIpc(INSTALL_EMSDK)(onProgress, null);

// :: _ -> Promise _ Error
export const uninstallEmsdk = () => promisifyIpc(UNINSTALL_EMSDK)(noop, null);
