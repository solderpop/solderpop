import * as R from 'ramda';
import * as XP from 'sdp-project';
import { maybePath, isAmong } from 'sdp-func-tools';

// :: Action -> Maybe PatchPath
export const getActingPatchPath = maybePath(['payload', 'patchPath']);

// :: Action -> Patch -> Boolean
export const bulkActionChangesTerminalNodes = R.curry((action, patch) =>
  R.compose(
    R.any(XP.isTerminalNode),
    R.filter(R.pipe(XP.getNodeId, isAmong(action.payload.nodeIds))),
    XP.listNodes
  )(patch)
);
