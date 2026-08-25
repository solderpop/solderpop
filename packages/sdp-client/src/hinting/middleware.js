import { notEquals } from 'sdp-func-tools';

import { getProject } from '../project/selectors.js';

import {
  getDeducedTypes,
  getErrors,
  getPatchSearchData,
  getPatchMarkers,
} from './selectors.js';
import updateHinting from './actions.js';
import { shallDeduceTypes, deduceTypes } from './typeDeduction.js';
import { shallValidate, validateProject } from './validation.js';
import {
  shallUpdatePatchSearchData,
  getNewPatchSearchData,
} from './patchSearchData.js';
import { shallUpdatePatchMarkers, getNewPatchMarkers } from './patchMarkers.js';

// =============================================================================
//
// Middleware
//
// =============================================================================

export default store => next => action => {
  const oldProject = getProject(store.getState());
  const act = next(action);
  const newState = store.getState();
  const newProject = getProject(newState);

  if (oldProject === newProject) return newState;

  // Type deducing
  const prevDeducedTypes = getDeducedTypes(newState);
  const nextDeducedTypes = shallDeduceTypes(newProject, action)
    ? deduceTypes(newProject, action, prevDeducedTypes)
    : prevDeducedTypes;
  const willUpdateDeducedTypes = notEquals(prevDeducedTypes, nextDeducedTypes);

  // Validation
  const prevErrors = getErrors(newState);
  const nextErrors = shallValidate(action, newProject, nextDeducedTypes)
    ? validateProject(action, newProject, nextDeducedTypes, prevErrors)
    : prevErrors;
  const willUpdateErrors = notEquals(prevErrors, nextErrors);

  // Patch Search Indexing
  const prevSearchIndex = getPatchSearchData(newState);
  const nextSearchIndex = shallUpdatePatchSearchData(newProject, action)
    ? getNewPatchSearchData(prevSearchIndex, newProject, action)
    : prevSearchIndex;
  const willUpdateSearchIndex = notEquals(prevSearchIndex, nextSearchIndex);

  // Patch Markers
  const prevPatchMarkers = getPatchMarkers(newState);
  const nextPatchMarkers = shallUpdatePatchMarkers(action)
    ? getNewPatchMarkers(prevPatchMarkers, newProject, action)
    : prevPatchMarkers;
  const willUpdatePatchMarkers = notEquals(prevPatchMarkers, nextPatchMarkers);

  // Dispatch changes, if needed
  if (willUpdateDeducedTypes || willUpdateErrors || willUpdateSearchIndex) {
    store.dispatch(
      updateHinting(
        willUpdateDeducedTypes ? nextDeducedTypes : null,
        willUpdateErrors ? nextErrors : null,
        willUpdateSearchIndex ? nextSearchIndex : null,
        willUpdatePatchMarkers ? nextPatchMarkers : null
      )
    );
  }

  return act;
};
