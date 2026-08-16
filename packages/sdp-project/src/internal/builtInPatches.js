// Single canonical import of built-in-patches.json, shared by every
// consumer (src/project.js, src/patch.js, src/migrations/
// unitlessToSlots.js, and test/project.spec.js). Deliberately centralized
// in one module rather than duplicated per file: each independent import
// of the same path still resolves to the same cached object (Node/webpack
// both dedup module resolution by path), but centralizing keeps that
// invariant obvious and gives every consumer the exact same reference on
// purpose -- see the migration plan doc for why that sharing matters (a
// downstream mutation bug relies on it).
//
// A bare `import ... from '*.json'` needs the "with { type: 'json' }"
// import attribute under real Node ESM (Node 22+, this repo's floor) --
// without it, Node rejects the import outright. An earlier version of
// this fix read the file via `fs.readFileSync` instead, which satisfied
// Node but broke the moment this module got bundled into the browser app
// (sdp-client -> sdp-client-browser pulls this package in) -- `fs` and
// `url` don't exist in a browser, and webpack 5 doesn't polyfill Node
// core modules by default. The import-attribute form works in both:
// webpack has always handled bare `.json` imports as a first-class
// module type regardless of the attribute, and Babel (this repo's
// bundling pipeline) parses and passes the attribute through unchanged.
import BUILT_IN_PATCHES from '../../dist/built-in-patches.json' with { type: 'json' };

export default BUILT_IN_PATCHES;
