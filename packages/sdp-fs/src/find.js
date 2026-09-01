import R from 'ramda';
import { statSync } from 'fs';
import { resolve, dirname } from 'path';
import { rejectWithCode } from 'sdp-func-tools';

import { isBasename, isExtname, isDirectory } from './utils.js';
import * as ERROR_CODES from './errorCodes.js';

function getParentDirectories(path) {
  function loop(currentPath, parentDirectories) {
    let stats;
    try {
      stats = statSync(currentPath);
    } catch (error) {
      stats = null;
    }
    if (stats && stats.isDirectory()) parentDirectories.push(currentPath);
    const parentPath = resolve(currentPath, '..');
    if (parentPath === currentPath) return parentDirectories;
    return loop(parentPath, parentDirectories);
  }

  return loop(resolve(process.cwd(), path), []);
}

export function isWorkspaceDir(path) {
  try {
    const sdpWorkspace = resolve(process.cwd(), path, '.sdp-workspace');
    return statSync(sdpWorkspace).isFile();
  } catch (error) {
    return false;
  }
}

function isProjectDir(path) {
  try {
    const projectSdp = resolve(process.cwd(), path, 'project.sdp');
    return statSync(projectSdp).isFile();
  } catch (error) {
    return false;
  }
}

export function findClosestWorkspaceDir(path) {
  return new Promise((resolve$, reject) => {
    const closestWorkspaceDir = getParentDirectories(path).find(isWorkspaceDir);
    if (closestWorkspaceDir) return resolve$(closestWorkspaceDir);
    return reject(
      new Error(
        `could not find workspace directory around "${path}". Workspace directory must contain ".sdp-workspace" file.`
      )
    );
  });
}

export function findClosestProjectDir(path) {
  return new Promise((resolve$, reject) => {
    const closestProjectDir = getParentDirectories(path).find(isProjectDir);
    if (closestProjectDir) return resolve$(closestProjectDir);
    return reject(
      new Error(
        `could not find project directory around "${path}". Project directory must contain "project.sdp" file.`
      )
    );
  });
}

// :: Path -> Promise Path Error
export const getPathToSdpProject = R.composeP(
  R.cond([
    [isBasename('project.sdp'), dirname],
    [isExtname('.solderball'), R.identity],
    [R.either(isBasename('patch.sdpp'), isDirectory), findClosestProjectDir],
    [
      R.T,
      (filePath) =>
        rejectWithCode(
          ERROR_CODES.TRIED_TO_OPEN_NOT_SDP_FILE,
          new Error(`Tried to open not a SolderPop file: ${filePath}`)
        ),
    ],
  ]),
  Promise.resolve.bind(Promise)
);
