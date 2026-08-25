/**
 * Middleware marks Debugger session as outdated on any change of the project.
 */

import { isDebugSession } from './selectors.js';
import { markDebugSessionOutdated } from './actions.js';
import { getProject } from '../project/selectors.js';

export default store => next => action => {
  const state = store.getState();
  const prevProject = getProject(state);
  const result = next(action);

  const newProject = getProject(store.getState());

  if (isDebugSession(state) && prevProject !== newProject) {
    store.dispatch(markDebugSessionOutdated());
  }

  return result;
};
