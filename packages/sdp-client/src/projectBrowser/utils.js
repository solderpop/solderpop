import * as R from 'ramda';
import * as XP from 'sdp-project';

import { getProject } from '../project/selectors';

// eslint-disable-next-line import/prefer-default-export
export const isPatchEmpty = (state, patchPath) =>
  R.compose(
    R.isEmpty,
    XP.listNodes,
    R.view(XP.lensPatch(patchPath)),
    getProject
  )(state);
