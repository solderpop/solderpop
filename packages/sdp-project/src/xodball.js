import R from 'ramda';
import RamdaFantasy from 'ramda-fantasy';
import {
  foldEither,
  explodeEither,
  validateSanctuaryType,
  omitTypeHints,
  fail,
} from 'sdp-func-tools';

import { getPatchPath, resolveNodeTypesInPatch } from './patch.js';
import {
  listLibraryPatches,
  omitPatches,
  injectProjectTypeHints,
  listGenuinePatches,
} from './project.js';
import {
  addMissingOptionalProjectFields,
  omitEmptyOptionalProjectFields,
} from './optionalFieldsUtils.js';
import {
  migrateProjectDimensionsToSlots,
  addPositionAndSizeUnitsToPatchEntities,
} from './migrations/unitlessToSlots.js';
import { Project, def } from './types.js';

const { Either } = RamdaFantasy;

export const fromXodballData = def(
  'fromXodballData :: Object -> Either Error Project',
  R.compose(
    R.map(injectProjectTypeHints),
    foldEither(() => fail('INVALID_XODBALL_FORMAT', {}), Either.of),
    validateSanctuaryType(Project),
    // Type hints should never be present in on-disk data (toXodball always
    // strips them before writing), but a file resaved by older code -- or
    // hand-edited -- can carry stale ones. sanctuary-def trusts an existing
    // `@@type` tag rather than re-validating structurally, so a stale tag
    // (e.g. from before the xod-project -> sdp-project rename) fails
    // validation outright instead of just being ignored. Stripping here
    // mirrors the same protection sdp-fs's patch-file loader already has.
    omitTypeHints,
    migrateProjectDimensionsToSlots,
    addMissingOptionalProjectFields
  )
);

export const fromXodballDataUnsafe = def(
  'fromXodballDataUnsafe :: Object -> Project',
  R.compose(explodeEither, fromXodballData)
);

export const fromXodball = def(
  'fromXodball :: String -> Either Error Project',
  (jsonString) =>
    R.tryCatch(R.pipe(JSON.parse, Either.of), (input) =>
      fail('NOT_A_JSON', { input })
    )(jsonString).chain(fromXodballData)
);

export const toXodball = def(
  'toXodball :: Project -> String',
  R.compose(
    (p) => JSON.stringify(p, null, 2),
    R.evolve({ patches: R.map(addPositionAndSizeUnitsToPatchEntities) }),
    omitTypeHints,
    omitEmptyOptionalProjectFields,
    R.converge(omitPatches, [
      R.compose(R.map(getPatchPath), listLibraryPatches),
      R.identity,
    ])
  )
);

export const prepareLibPatchesToInsertIntoProject = def(
  'prepareLibPatchesToInsertIntoProject :: String -> Project -> [Patch]',
  (libName, project) =>
    R.compose(
      R.map(
        R.compose(
          resolveNodeTypesInPatch,
          R.over(R.lensProp('path'), R.replace('@', libName))
        )
      ),
      listGenuinePatches
    )(project)
);
