import * as AT from './actionTypes.js';

// eslint-disable-next-line import/prefer-default-export
export const updateProjectPath = (path) => ({
  type: AT.UPDATE_PROJECT_PATH,
  payload: path,
});
