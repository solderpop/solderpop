import { noop } from 'sdp-func-tools';

import promisifyIpc from '../view/promisifyIpc';
import { COMPILE_SIMULATION } from '../shared/events';

const compileSimulationIpc = promisifyIpc(COMPILE_SIMULATION);

// :: String -> Promise Suite Error
export const compileSimulation = code => compileSimulationIpc(noop, code);
