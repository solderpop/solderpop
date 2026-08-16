import R from 'ramda';
import { getPatchPath } from 'sdp-project';

import { def } from './types.js';
import { isProjectFile, isPatchFile, getFileContent } from './utils.js';

export default def(
  'packProject :: [AnyXodFile] -> Map PatchPath Patch -> Project',
  (unpackedData, libraryPatches = {}) => {
    const project = R.compose(getFileContent, R.find(isProjectFile))(
      unpackedData
    );

    const projectPatches = R.compose(
      R.indexBy(getPatchPath),
      R.map(getFileContent),
      R.filter(isPatchFile)
    )(unpackedData);

    const patches = R.merge(libraryPatches, projectPatches);

    return R.assoc('patches', patches, project);
  }
);
