import R from 'ramda';
import { explode } from 'sdp-func-tools';
import { listMissingLibraryNames } from 'sdp-project';
import { parseLibQuery } from 'sdp-pm';

import { installLibraries } from '../editor/actions.js';
import { PROJECT_OPEN, PROJECT_IMPORT } from './actionTypes.js';
import { getProject } from './selectors.js';

export default store => next => action => {
  const res = next(action);

  if (R.contains(action.type, [PROJECT_OPEN, PROJECT_IMPORT])) {
    const project = getProject(store.getState());
    const missingLibParams = R.compose(
      R.map(R.compose(explode, parseLibQuery)),
      listMissingLibraryNames
    )(project);

    if (missingLibParams.length > 0) {
      store.dispatch(installLibraries(missingLibParams));
    }
  }

  return res;
};
