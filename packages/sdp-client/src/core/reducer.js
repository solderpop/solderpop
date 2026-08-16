import R from 'ramda';
import { combineReducers } from 'redux';

import userReducer from '../user/reducer.js';
import projectReducer from '../project/reducer.js';
import undoableProject from './undoableProject.js';
import projectBrowserReducer from '../projectBrowser/reducer.js';
import editorReducer from '../editor/reducer.js';
import errorsReducer from '../messages/reducer.js';
import processesReducer from '../processes/reducer.js';
import popupsReducer from '../popups/reducer.js';
import debuggerReducer from '../debugger/reducer.js';
import hintingReducer from '../hinting/reducer.js';
import workersReducer from '../workers/reducer.js';
import themeReducer from '../theme/reducer.js';

import keepIntegrityAfterNavigatingHistory from './keepIntegrityAfterNavigatingHistory.js';
import trackLastSavedChanges from './trackLastSavedChanges.js';
import initialProjectState from '../project/state.js';

import { RECOVER_STATE } from './actionTypes.js';

// :: [(s -> a -> s)] -> s -> a -> s
const pipeReducers = (...reducers) => (state, action) =>
  action.type === RECOVER_STATE
    ? action.payload
    : reducers.reduce((s, r) => r(s, action), state);

const lastActionsReducer = (prevActions = [], newAction) =>
  R.compose(R.slice(-3, Infinity), R.append(newAction))(prevActions);

const combineRootReducers = extraReducers => {
  const reducers = R.merge(
    {
      user: userReducer,
      project: projectReducer,
      projectHistory: (s = {}) => s,
      lastSavedProject: (s = initialProjectState) => s,
      projectBrowser: projectBrowserReducer,
      popups: popupsReducer,
      editor: editorReducer,
      errors: errorsReducer,
      processes: processesReducer,
      debugger: debuggerReducer,
      hinting: hintingReducer,
      workers: workersReducer,
      theme: themeReducer,
      lastActions: lastActionsReducer,
    },
    extraReducers
  );

  return undoableProject(
    pipeReducers(combineReducers(reducers), trackLastSavedChanges),
    keepIntegrityAfterNavigatingHistory
  );
};

export const createReducer = combineRootReducers;

export default createReducer;
