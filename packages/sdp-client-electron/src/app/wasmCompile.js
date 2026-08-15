import * as wasmCompile from 'sdp-wasm-compile';

import subscribeIpc from './subscribeIpc';
import { COMPILE_SIMULATION } from '../shared/events';
import { getEmsdkRoot } from './emsdkInstaller';

// :: _ -> UnsubscribeFn
export const subscribeCompileSimulation = () =>
  subscribeIpc(
    (_, code) => wasmCompile.compileSimulation(code, getEmsdkRoot()),
    COMPILE_SIMULATION
  );
