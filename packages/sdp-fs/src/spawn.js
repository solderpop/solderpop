import R from 'ramda';
import path from 'path';
import copy from 'recursive-copy';
import { rejectWithCode } from 'sdp-func-tools';

const { curry } = R;

import { writeFile } from './write.js';
import { resolvePath, resolveDefaultProjectPath } from './utils.js';
import { WORKSPACE_FILENAME } from './constants.js';
import * as ERROR_CODES from './errorCodes.js';

const copyOptions = {
  overwrite: true,
};

// :: Path -> Promise Path Error
export const spawnWorkspaceFile = workspacePath =>
  Promise.resolve(resolvePath(workspacePath))
    .then(p => path.resolve(p, WORKSPACE_FILENAME))
    .then(p => writeFile(p, '', 'utf8'))
    .then(() => workspacePath)
    .catch(rejectWithCode(ERROR_CODES.CANT_CREATE_WORKSPACE_FILE));

// :: Path -> Promise Path Error
export const spawnDefaultProject = curry((defaultProjectPath, workspacePath) =>
  copy(
    defaultProjectPath,
    resolveDefaultProjectPath(workspacePath),
    copyOptions
  )
    .then(() => workspacePath)
    .catch(rejectWithCode(ERROR_CODES.CANT_COPY_DEFAULT_PROJECT))
);

export default {};
