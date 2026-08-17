import { noop } from 'sdp-func-tools';

import promisifyIpc from '../view/promisifyIpc.js';
import { COMPILE_SIMULATION } from '../shared/events.js';

const compileSimulationIpc = promisifyIpc(COMPILE_SIMULATION);

// :: String -> Promise Suite Error
const compileSimulation = (code) => compileSimulationIpc(noop, code);

export default compileSimulation;
