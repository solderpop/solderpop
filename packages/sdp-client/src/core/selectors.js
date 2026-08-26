import R from 'ramda';
import RamdaFantasy from 'ramda-fantasy';
import { createSelector } from 'reselect';

import { maybeProp } from 'sdp-func-tools';
import * as XP from 'sdp-project';

import * as User from '../user/selectors.js';
import * as Editor from '../editor/selectors.js';
import * as Project from '../project/selectors.js';
import * as ProjectBrowser from '../projectBrowser/selectors.js';
import * as Errors from '../messages/selectors.js';
import * as Processes from '../processes/selectors.js';
import * as Debugger from '../debugger/selectors.js';

import { SELECTION_ENTITY_TYPE } from '../editor/constants.js';

const { Maybe } = RamdaFantasy;

//
// Unsaved changes
//

export const getLastSavedProject = R.prop('lastSavedProject');

export const hasUnsavedChanges = createSelector(
  [Project.getProject, getLastSavedProject],
  R.complement(R.equals)
);

//
// Docs sidebar
//

export const getPatchForHelpbox = createSelector(
  [
    Project.getProject,
    ProjectBrowser.getSelectedPatchPath,
    Editor.isSuggesterVisible,
    Editor.getSuggesterHighlightedPatchPath,
  ],
  (project, selectedPatchPath, suggesterVisible, suggesterPatchPath) => {
    if (suggesterVisible && suggesterPatchPath) {
      return XP.getPatchByPath(suggesterPatchPath, project);
    }
    return R.compose(
      R.chain(XP.getPatchByPath(R.__, project)),
      Maybe
    )(selectedPatchPath);
  }
);
export const getPatchOfSelectedNodeForQuickHelp = createSelector(
  [Project.getProject, Editor.getSelection, Project.getCurrentPatchNodes],
  (project, editorSelection, currentPatchNodes) =>
    R.compose(
      R.chain(R.pipe(XP.getNodeType, XP.getPatchByPath(R.__, project))),
      R.chain(({ id }) => maybeProp(id, currentPatchNodes)),
      Maybe,
      R.find(R.propEq('entity', SELECTION_ENTITY_TYPE.NODE))
    )(editorSelection)
);

export default {
  User,
  Editor,
  Errors,
  Processes,
  Debugger,
};
