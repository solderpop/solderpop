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

export const fromSolderballData = def(
  'fromSolderballData :: Object -> Either Error Project',
  R.compose(
    R.map(injectProjectTypeHints),
    foldEither(() => fail('INVALID_SOLDERBALL_FORMAT', {}), Either.of),
    validateSanctuaryType(Project),
    migrateProjectDimensionsToSlots,
    addMissingOptionalProjectFields
  )
);

export const fromSolderballDataUnsafe = def(
  'fromSolderballDataUnsafe :: Object -> Project',
  R.compose(explodeEither, fromSolderballData)
);

export const fromSolderball = def(
  'fromSolderball :: String -> Either Error Project',
  (jsonString) =>
    R.tryCatch(R.pipe(JSON.parse, Either.of), (input) =>
      fail('NOT_A_JSON', { input })
    )(jsonString).chain(fromSolderballData)
);

export const toSolderball = def(
  'toSolderball :: Project -> String',
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
