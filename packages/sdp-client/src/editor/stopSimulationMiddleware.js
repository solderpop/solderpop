/**
 * Middleware stops simulation on close debugger tab
 */

import { isSimulationAbortable } from '../debugger/selectors.js';
import { abortSimulation } from './actions.js';
import { TAB_CLOSE } from './actionTypes.js';
import {
  PROJECT_CREATE,
  PROJECT_OPEN,
  PROJECT_IMPORT,
} from '../project/actionTypes.js';
import { DEBUGGER_TAB_ID } from './constants.js';
import { SIMULATION_STOPPED_BY_CLOSING_TAB } from './messages.js';
import { addError } from '../messages/actions.js';

export default (store) => (next) => (action) => {
  const result = next(action);

  if (!isSimulationAbortable(store.getState())) return result;

  if (action.type === TAB_CLOSE && action.payload.id === DEBUGGER_TAB_ID) {
    store.dispatch(abortSimulation());
    store.dispatch(addError(SIMULATION_STOPPED_BY_CLOSING_TAB));
  }

  if (
    action.type === PROJECT_CREATE ||
    action.type === PROJECT_OPEN ||
    action.type === PROJECT_IMPORT
  ) {
    store.dispatch(abortSimulation());
  }

  return result;
};
