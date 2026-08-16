import R from 'ramda';

const { curry } = R;

// because functions exported from Reason are uncurried
import { linkifyPatchRecursivelyU, splitLinksToBusesU } from './Buses_Js.bs.js';
import { listUpstreamPinsToNiixU } from './Traversing_Js.bs.js';

export * from './project.js';
export {
  createPatch,
  duplicatePatch,
  getPatchPath,
  setPatchPath,
  getPatchDescription,
  setPatchDescription,
  getPatchAttachments,
  setPatchAttachments,
  hasImpl,
  getImpl,
  hasAttachmentManagedByMarker,
  getAttachmentManagedByMarker,
  setAttachmentManagedByMarker,
  removeAttachmentManagedByMarker,
  nodeIdEquals,
  listNodes,
  getNodeById,
  getNodeByIdUnsafe,
  getPinByKey,
  getPinByKeyUnsafe,
  getVariadicPinByKey,
  listPins,
  listInputPins,
  listOutputPins,
  isTerminalPatch,
  validatePinLabels,
  listLinks,
  linkIdEquals,
  getLinkById,
  getLinkByIdUnsafe,
  listLinksByNode,
  listLinksByPin,
  validateLink,
  assocLink,
  dissocLink,
  upsertLinks,
  omitLinks,
  assocNode,
  dissocNode,
  upsertNodes,
  canBindToOutputs,
  toposortNodes,
  getTopology,
  listComments,
  getCommentById,
  getCommentByIdUnsafe,
  assocComment,
  dissocComment,
  upsertComments,
  getTopologyMap,
  applyNodeIdMap,
  resolveNodeTypesInPatch,
  listLibraryNamesUsedInPatch,
  computeVariadicPins,
  listVariadicValuePins,
  listVariadicAccPins,
  listVariadicSharedPins,
  getArityStepFromPatch,
  isVariadicPatch,
  isAbstractPatch,
  isGenuinePatch,
  isConstructorPatch,
  isPatchNotImplementedInXod,
  doesPatchHaveGenericPins,
  validateAbstractPatch,
  validateConstructorPatch,
  validateRecordPatch,
  isDeprecatedPatch,
  getDeprecationReason,
  isUtilityPatch,
  patchListEqualsBy,
  sameCategoryMarkers,
  sameDeducedTypes,
  samePatchValidity,
  validateBuses,
  hasNodeWithType,
  findNodeBy,
  isRecordPatch,
  isUnpackRecordPatch,
} from './patch.js';
export {
  getFilename as getAttachmentFilename,
  getContent as getAttachmentContent,
  getEncoding as getAttachmentEncoding,
} from './attachment.js';
export * from './node.js';
export * from './comment.js';
export {
  createPin,
  getPinType,
  getPinDirection,
  getPinKey,
  getPinLabel,
  setPinLabel,
  getPinDefaultValue,
  getPinDescription,
  getPinOrder,
  isInputPin,
  isOutputPin,
  isTerminalPin,
  normalizeEmptyPinLabels,
  normalizeEmptyPinLabelsOppositeDirection,
  isPinBindable,
  isPulsePin,
  isGenericPin,
} from './pin.js';
export * from './link.js';
export * from './constants.js';
export * from './optionalFieldsUtils.js';
export * from './utils.js';
export * from './types.js';
export { default as flatten } from './flatten.js';
export {
  default as extractBoundInputsToConstNodes,
} from './extractBoundInputsToConstNodes.js';
export { default as expandVariadicNodes } from './expandVariadicNodes.js';
export { default as expandVariadicPassNodes } from './expandVariadicPassNodes.js';
export * from './patchPathUtils.js';
export * from './versionUtils.js';
export * from './xodball.js';
export * from './typeDeduction.js';
export * from './TypeDeduction_Js.bs.js';
export { default as autoresolveTypes } from './autoresolveTypes.js';
export { default as messages } from './messages.js';
export {
  ensureLiteral,
  migrateBoundValuesToBoundLiterals,
} from './migrations/boundValuesToBoundLiterals.js';
export {
  migrateProjectDimensionsToSlots,
  migratePatchDimensionsToSlots,
  convertPositionValueToSlots,
  addPositionAndSizeUnitsToPatchEntities,
} from './migrations/unitlessToSlots.js';
export { sortGraph } from './gmath.js';
export { BUILT_IN_TERMINAL_PATCH_PATHS } from './builtinTerminalPatches.js';
export { BINDABLE_CUSTOM_TYPES, isBindableCustomType } from './custom-types.js';
export {
  default as squashTetheringNodes,
} from './optimizers/squashTetheringNodes.js';

export const linkifyPatchRecursively = curry(linkifyPatchRecursivelyU);
export const splitLinksToBuses = curry(splitLinksToBusesU);
export const listUpstreamPinsToNiix = curry(listUpstreamPinsToNiixU);
