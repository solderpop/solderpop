import R from 'ramda';

import { updatePatch } from '../project.js';
import squashSingleOutputNodes from './squashSingleOutputNodes.js';
import { TETHERING_INET_PATH } from '../constants.js';

// :: PatchPath -> Project -> Either Error Project
export default R.curry((path, project) =>
  updatePatch(path, squashSingleOutputNodes(TETHERING_INET_PATH), project)
);
