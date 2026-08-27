import { undoPatch, redoPatch } from '../project/actions.js';
import { SHOW_CODE_REQUESTED, RECOVER_STATE } from './actionTypes.js';
import { getCurrentPatchPath } from '../editor/selectors.js';
import { isInput } from '../utils/browser.js';

export const undoCurrentPatch = () => (dispatch, getState) => {
  if (isInput(document.activeElement)) return;

  getCurrentPatchPath(getState()).map((currentPatchPath) =>
    dispatch(undoPatch(currentPatchPath))
  );
};

export const redoCurrentPatch = () => (dispatch, getState) => {
  if (isInput(document.activeElement)) return;

  getCurrentPatchPath(getState()).map((currentPatchPath) =>
    dispatch(redoPatch(currentPatchPath))
  );
};

export const showCode = (code) => ({
  type: SHOW_CODE_REQUESTED,
  payload: { code },
});

export const recoverState = (state) => ({
  type: RECOVER_STATE,
  payload: state,
});

export * from '../user/actions.js';
export * from '../editor/actions.js';
export * from '../project/actions.js';
export * from '../projectBrowser/actions.js';
export * from '../messages/actions.js';
export * from '../processes/actions.js';
export * from '../popups/actions.js';
export * from '../debugger/actions.js';
