import R from 'ramda';
import * as XP from 'sdp-project';
import { foldMaybe } from 'sdp-func-tools';
import { formatTweakMessage } from 'sdp-arduino';

import { getProject } from '../project/selectors.js';
import {
  isSimulationRunning,
  getCurrentChunksPath,
  getInvertedDebuggerNodeIdsMap,
  getStoredGlobals,
} from './selectors.js';
import * as editorSelectors from '../editor/selectors.js';

import { LINE_SENT_TO_SERIAL } from './actionTypes.js';
import { NODE_PROPERTY_UPDATED } from '../project/actionTypes.js';
import {
  TWEAK_PULSE_SENT,
  NODE_PROPERTY_UPDATING,
} from '../editor/actionTypes.js';

export default ({ getState }) => next => action => {
  const state = getState();
  const result = next(action);

  const isTweakActionType =
    action.type === NODE_PROPERTY_UPDATED ||
    action.type === TWEAK_PULSE_SENT ||
    action.type === NODE_PROPERTY_UPDATING;

  if (isTweakActionType && isSimulationRunning(state)) {
    const { id: nodeId, value = '', patchPath } = action.payload;
    const nodeType = R.compose(
      XP.getNodeType,
      XP.getNodeByIdUnsafe(nodeId),
      XP.getPatchByPathUnsafe(patchPath),
      getProject
    )(state);

    if (XP.isTweakPath(nodeType)) {
      const nodeIdPath = R.compose(
        foldMaybe(nodeId, R.concat(R.__, nodeId)),
        getCurrentChunksPath
      )(state);
      const debuggerNodeId = R.compose(
        R.prop(nodeIdPath),
        getInvertedDebuggerNodeIdsMap
      )(state);

      const globals = getStoredGlobals(state);

      // If value looks like a global literal — get value from the stored globals
      const valueToSend = R.when(
        R.startsWith('='),
        R.compose(R.propOr(value, R.__, globals), R.tail)
      )(value);

      const msg = formatTweakMessage(nodeType, debuggerNodeId, valueToSend);
      const worker = editorSelectors.simulationWorker(state);
      worker.sendToWasm(msg);
    }
  }

  if (action.type === LINE_SENT_TO_SERIAL && isSimulationRunning(state)) {
    const worker = editorSelectors.simulationWorker(state);
    worker.sendToWasm(action.payload);
  }

  return result;
};
