import R from 'ramda';
import { statSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { rejectWithCode } from 'sdp-func-tools';

import {
  isDirectory,
  isProjectBasename,
  isPatchBasename,
  isSolderballPath,
} from './utils.js';
import { PROJECT_FILENAME, LEGACY_PROJECT_FILENAMES } from './constants.js';
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
    const xodworkspace = resolve(process.cwd(), path, '.xodworkspace');
    return statSync(xodworkspace).isFile();
  } catch (error) {
    return false;
  }
}

function isProjectDir(path) {
  return [PROJECT_FILENAME, ...LEGACY_PROJECT_FILENAMES].some((filename) => {
    try {
      return statSync(resolve(process.cwd(), path, filename)).isFile();
    } catch (error) {
      return false;
    }
  });
}

export function findClosestWorkspaceDir(path) {
  return new Promise((resolve$, reject) => {
    const closestWorkspaceDir = getParentDirectories(path).find(isWorkspaceDir);
    if (closestWorkspaceDir) return resolve$(closestWorkspaceDir);
    return reject(
      new Error(
        `could not find workspace directory around "${path}". Workspace directory must contain ".xodworkspace" file.`
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
        `could not find project directory around "${path}". Project directory must contain a "${PROJECT_FILENAME}" file.`
      )
    );
  });
}

// :: Path -> Promise Path Error
export const getPathToXodProject = R.composeP(
  R.cond([
    [(filePath) => isProjectBasename(basename(filePath)), dirname],
    [isSolderballPath, R.identity],
    [
      R.either((filePath) => isPatchBasename(basename(filePath)), isDirectory),
      findClosestProjectDir,
    ],
    [
      R.T,
      (filePath) =>
        rejectWithCode(
          ERROR_CODES.TRIED_TO_OPEN_NOT_XOD_FILE,
          new Error(`Tried to open not a sdp file: ${filePath}`)
        ),
    ],
  ]),
  Promise.resolve.bind(Promise)
);
