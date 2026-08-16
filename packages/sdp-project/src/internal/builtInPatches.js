// Single canonical read of built-in-patches.json, shared by every consumer
// (src/project.js, src/patch.js, src/migrations/unitlessToSlots.js, and
// test/project.spec.js). A bare `import ... from '*.json'` compiles to a
// static ESM import with no "with { type: json }" attribute, which real
// Node ESM rejects -- so this reads it via fs instead, resolved through
// import.meta.url. Deliberately centralized in one module rather than
// duplicated per file: each independent read/parse would produce its own
// object, breaking the reference sharing every importer of the same file
// got for free under the old static import (Node's module cache dedups
// by resolved path, so every `import` of the same JSON file got the exact
// same object). At least one consumer relies on that aliasing -- some
// code mutates a built-in patch object in place rather than returning a
// new one, and that mutation is expected to be visible to every other
// consumer holding the "same" data, exactly as it was before this file
// existed.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const BUILT_IN_PATCHES = JSON.parse(
  readFileSync(
    fileURLToPath(new URL('../../dist/built-in-patches.json', import.meta.url)),
    'utf8'
  )
);

export default BUILT_IN_PATCHES;
