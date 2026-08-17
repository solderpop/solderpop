import * as wasmCompile from 'sdp-wasm-compile';

import subscribeIpc from './subscribeIpc.js';
import { COMPILE_SIMULATION } from '../shared/events.js';
import { getEmsdkRoot } from './emsdkInstaller.js';

// :: _ -> UnsubscribeFn
// eslint-disable-next-line import/prefer-default-export
export const subscribeCompileSimulation = () =>
  subscribeIpc(
    (_, code) => wasmCompile.compileSimulation(code, getEmsdkRoot()),
    COMPILE_SIMULATION
  );
