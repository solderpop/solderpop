# CommonJS → ESM migration plan

Status: not started. Written 2026-08-16 as a pickup point after the Babel 6→7→8,
webpack 3→5, and bs-platform→ReScript 12 migrations (branch
`worktree-migration+babel-webpack-ts`) all landed and were pushed for review.

## Why this is a separate effort

The prior migrations were deep-but-narrow: one problem domain each, same fix
recipe repeated across a handful of packages. This one is shallow-but-wide: it
touches every package in the monorepo and every cross-package `require()` call
site, plus infra pieces (bundler, Electron packaging, test runners) that didn't
need to change for the earlier work. Expect it to take multiple sessions, not
one.

## Scope inventory (as of this writing)

- **18 packages** under `packages/*` have their own `package.json`:
  `arduino-cli`, `belt-holes`, `sdp-arduino`, `sdp-cli`, `sdp-client`,
  `sdp-client-browser`, `sdp-client-electron`, `sdp-cloud-compile`,
  `sdp-deploy`, `sdp-deploy-bin`, `sdp-fs`, `sdp-func-tools`,
  `sdp-patch-search`, `sdp-pm`, `sdp-project`, `sdp-tabtest`,
  `sdp-tethering-inet`, `sdp-wasm-compile`.
- **6 packages** are ReScript-backed (have `bsconfig.json`, now on
  `rescript@^12.3.0`): `belt-holes`, `sdp-arduino`, `sdp-func-tools`,
  `sdp-project`, `sdp-tabtest`, `sdp-tethering-inet`. Each has
  `package-specs.module: "commonjs"` in its `bsconfig.json` — this is the
  actual module-format switch for compiled ReScript output
  (`"commonjs"` → `"esmodule"`).
  Note: ReScript 9+ emits `.mjs` file extensions in `esmodule` mode by
  default unless configured otherwise — decide before flipping the switch,
  since it affects every `require()`/`import` site downstream.
- **123 files** (plain `.js`/`.jsx`, excluding compiled `.bs.js` output,
  which regenerates automatically once the ReScript module target flips)
  contain `require(` calls. Re-check this count before starting — it will
  have drifted.
- Root `bsconfig.json` is currently an inert stopper (empty `sources`/
  `dependencies`) — do not delete it. See git history on this branch for why:
  ReScript 12's parent-config walk-up will otherwise escape this worktree and
  pick up a bsconfig.json from an ancestor directory (the main checkout, in
  this repo's layout).

## What has to change

1. Each `bsconfig.json` (6 files): `package-specs.module` →
   `"esmodule"`, and decide/verify the output file suffix.
2. Each `package.json` (18 files, likely more once transitive tooling
   packages are counted): add `"type": "module"`.
3. Babel config: `@babel/preset-env`'s `modules` option needs to stop
   forcing `"commonjs"` (see `babel.config.js` and the per-package overrides
   added during the Babel 8 migration — several packages pin explicit
   `targets`/`modules` settings that will need re-checking).
4. `tools/babel-register.js`: this bootstraps `@babel/register` for the
   mocha test suites. `@babel/register` does not transparently support ESM
   the way it does CommonJS — likely needs either a loader-hooks-based
   replacement or per-package test runner changes. Investigate before
   committing to an approach; this could be the trickiest single piece.
5. Every cross-package `require()` call site (123+ files) → `import`.
   Mechanical for simple cases; watch for:
   - Conditional/dynamic `require()` calls (`require(someVariable)`) —
     these need `import()` (async) and may change call-site semantics.
   - `require.resolve` usage.
   - `module.exports =` / `exports.foo =` patterns → `export default` /
     `export const foo`, which changes the *shape* of what's imported
     (default vs. named) — every importer of that file needs the matching
     update, not just the file itself.
6. Webpack config (`packages/sdp-client/webpack.config.js` and friends):
   webpack 5 handles ESM source fine, but double-check any place that
   currently relies on CommonJS interop (e.g. `require('some-cjs-pkg')`
   mixed with ESM in the same file) or webpack-specific CommonJS globals
   (`__dirname`, `__filename` — not defined in native ESM, need
   `import.meta.url` equivalents if used directly rather than through
   webpack's shims).
7. Electron packaging (`sdp-client-electron`): Electron's main process
   historically wants CommonJS; ESM main-process support depends on the
   Electron/Node version pinned. Verify before assuming this "just works" —
   flagged in this plan as the highest-uncertainty item.
8. Circular require/import cycles: CommonJS tolerates these via partial
   exports at require-time; ESM's live-binding semantics behave differently
   on cycles. Unknown whether any exist in this codebase — grep for them
   before starting (a package that requires a package that requires it back)
   rather than discovering it via a runtime error mid-migration.

## Suggested phased approach

This repo has a 250 LOC/PR cap (see project memory), so this cannot land as
one PR regardless of approach. Suggested phase order, roughly
least-risky/most-isolated first:

**Phase 0 — investigation spike (no code changes committed):**
- Confirm the `@babel/register` + ESM story (item 4 above) with a throwaway
  probe package, the way earlier migrations used scratch probe files. This
  is the item most likely to invalidate the rest of the plan if it doesn't
  pan out cleanly.
- Grep for circular require cycles.
- Re-run the require() file count and the package list — both will have
  drifted since this doc was written.

**Phase 1 — leaf packages with no/few internal cross-package requires:**

*Progress: `sdp-func-tools` done (2026-08-16) — see "Phase 1 findings" below
for the interop gotchas hit and the fix pattern to reuse on every other
package.*

Likely candidates (verify against current dependency graph, not memory):
`sdp-fs`, `sdp-deploy-bin`, `sdp-patch-search`, `belt-holes`,
`sdp-func-tools`. Small blast radius, good place to validate the mechanical
`require`→`import` conversion pattern and the test-runner change together
before scaling up.

**Phase 2 — mid-tier packages:** the remaining ReScript-backed packages
(`sdp-arduino`, `sdp-project`, `sdp-tabtest`, `sdp-tethering-inet`) plus
`sdp-cli`, `sdp-cloud-compile`, `sdp-wasm-compile`, `sdp-deploy`, `sdp-pm`.
Flip each package's `bsconfig.json` module target in the same PR as its own
source conversion, not separately — a ReScript package emitting CommonJS
while its `package.json` claims `"type": "module"` (or vice versa) will
break immediately.

**Phase 3 — GUI/build-tooling-facing packages last:** `sdp-client`,
`sdp-client-browser`, `sdp-client-electron`. Highest risk (Electron
packaging uncertainty, webpack interop, hardest to verify headless — the
project's own guidance is to actually exercise the UI in a browser/app
before calling frontend work done, not just rely on the type-checker/build
succeeding).

## Verification approach (carry over from the ReScript migration)

The ReScript 12 migration repeatedly found that "compiles clean" and "looks
right" were not sufficient signals — several real bugs (regex capture-group
semantics, template-literal interpolation rules, operator-shadowing) only
surfaced by actually running the test suite and comparing against an
established baseline. Apply the same discipline here: for each phase, run
the full existing test suite (build chain + mocha/jest) before and after,
and treat any diff in pass/fail counts as a real regression to root-cause,
not something to patch around.

## Phase 0 findings (2026-08-16)

Investigation spike run, no code changes committed.

- **Scope re-check:** 18 packages, 6 ReScript (`bsconfig.json`) packages — both
  counts unchanged from original writing. require() file count now **126**
  (was 123) — small drift, not concerning.
- **Circular requires (package-level):** built the internal `sdp-*`/`arduino-cli`/
  `belt-holes` dependency graph from each package's `package.json` and ran a
  DFS cycle check — **no cycles found**. File-level (intra-package) cycles not
  checked; lower risk since those stay within one module-format boundary per
  phase.
- **`@babel/register` + ESM probe — bigger deal than expected: `.nvmrc` pins
  Node 24**, but root `package.json` `engines` still says `>=12.16.3` (stale,
  update this in Phase 1). Node 22.12+ ships unflagged `require(esm)` —
  synchronous native `require()` of real ESM modules, no `--experimental`
  flag. Probed on this repo's actual Node 24.19.0:
  - Plain `require()` of a `"type": "module"` package's plain ESM file
    (`export const foo = ...`) **works out of the box**, no `@babel/register`
    involved. No `ERR_REQUIRE_ESM`.
  - With `@babel/register` hooked in, `require()` of an ESM file containing
    JSX **still reaches Babel's parser** (confirmed via a deliberate failure —
    parse error for JSX with no preset configured) — i.e. `@babel/register`'s
    `require.extensions` hook is *not* simply bypassed for `"type": "module"`
    files on this Node version. With the repo's real `babel.config.js`
    (JSX/Flow presets present) this should transform correctly; not yet
    verified end-to-end with the actual config, only with an empty probe
    config.
  - **Conclusion: item 4 ("trickiest single piece") is likely much less risky
    than assumed** — no loader-hooks rewrite may be needed. But this
    apparent coexistence of `require(esm)` and a legacy `require.extensions`
    hook is subtle, Node-version-dependent behavior, not something to lean on
    without an end-to-end test using the real `babel.config.js` and real
    mocha invocation (`tools/babel-register.js` unmodified) against a Phase 1
    candidate package. Do that as the first concrete step of Phase 1, before
    trusting this finding further.

## Phase 1 findings — `sdp-func-tools` (2026-08-16)

First real package converted. All 58 existing mocha tests still pass, same
count as baseline. Confirms the mechanical recipe below; reuse it as-is for
the rest of Phase 1 and Phase 2's plain-JS side.

**Per-package recipe that worked:**
1. `bsconfig.json`: `package-specs.module` → `"esmodule"`. Suffix decision
   (item 1 in "Explicitly not decided yet" above) resolved: **keep
   `.bs.js`**, don't switch to `.mjs` — `"type": "module"` in `package.json`
   is sufficient for Node to treat it as ESM, no extension rename needed.
2. `package.json`: `"type"` → `"module"`.
3. `.babelrc` / babel config: `modules: "commonjs"` → `modules: false`
   (leaves `import`/`export` untouched instead of downleveling to
   `require`/`exports`). Left the `targets` value alone even where stale
   (e.g. `"ie 11"`, which cannot run ESM output regardless) — re-litigating
   browser targets is a separate decision, out of scope for this migration.
4. Rebuild (`rescript build` then `babel src -d dist`) to regenerate
   `.bs.js` and `dist/` with the new module format. Both are gitignored in
   this package (confirm per-package — not all `.bs.js` are; `belt-holes`
   force-un-ignores its `.bs.js` via `!!` in `.gitignore`), so nothing to
   commit there, just needs to happen at build/install time.
5. **New gotcha, not anticipated in the original scope inventory: bare
   extensionless relative imports break.** Every file in this repo already
   uses `import`/`export` syntax in source (Babel was transpiling it to
   CommonJS at build time), but without extensions
   (`import { def } from './types'`) — valid for Babel/webpack resolution,
   invalid for native ESM `import`/`require(esm)`, which requires the exact
   file extension. Every relative import needed `.js` appended. Mechanical,
   but touches nearly every file with an import statement — this inflates
   the "convert require() to import" cost estimate in item 5 above,
   since even already-`import`-syntax files needed a pass.
6. **Bigger gotcha: several widely-used CJS dependencies don't have
   statically-analyzable named exports**, so named/namespace imports
   (`import { assert } from 'chai'`, `import * as R from 'ramda'`,
   `import { Either } from 'ramda-fantasy'`) resolve to `undefined` under
   Node's CJS→ESM interop (`ERR`-free but silently broken, or a hard
   `SyntaxError: does not provide an export named 'X'` at the mocha/import
   layer) even though the same code worked fine under Babel's own CJS
   interop. Root cause: Node's `cjs-module-lexer` static analysis doesn't
   pick up these packages' export shape (large/dynamic `module.exports =
   {...}` object builders). Fix pattern, confirmed working: switch to a
   **default import and destructure**:
   ```js
   // before (breaks under native ESM)
   import { assert } from 'chai';
   import * as R from 'ramda';
   import { Either } from 'ramda-fantasy';

   // after
   import chai from 'chai';
   import R from 'ramda';
   import RamdaFantasy from 'ramda-fantasy';
   const { assert } = chai;
   const { Either } = RamdaFantasy;
   ```
   Confirmed affected so far: `ramda`, `ramda-fantasy`, `chai`. **Check every
   other CJS dependency for the same issue in each subsequent package** —
   don't assume it's limited to these three.
7. **Related gotcha: Babel-compiled (`__esModule`-flagged) CJS dependencies
   double-wrap under default import.** `hm-def`'s dist output has
   `exports.default = {...}` (a Babel-8-style compiled default export). A
   plain `import HMDef from 'hm-def'` under Node's native interop binds
   `HMDef` to the *whole* `module.exports` object (`{ default: {...},
   __esModule: true }`), not to `module.exports.default` — Node does not
   special-case the `__esModule` marker the way bundlers do. Named-importing
   `{ default as HMDef }` does **not** help either — the ESM namespace's own
   `default` key already IS Node's synthetic default (the whole
   `module.exports`), so it collides with and shadows the CJS `exports.default`
   property of the same name. Working fix: import the module normally, then
   explicitly unwrap `.default`:
   ```js
   import HMDefModule from 'hm-def';
   const HMDef = HMDefModule.default;
   ```
   Check for this pattern specifically on any dependency built with Babel 6/7/8
   that exports a single default (grep target: `exports.default =` combined
   with `__esModule` in the dependency's own dist output).
8. Cross-package direction validated end-to-end, not just via the Phase 0
   probe: a plain, unconverted CommonJS script in the worktree root
   successfully did `require('./packages/sdp-func-tools/dist/index.js')`
   (now pure ESM syntax) and called into it correctly. Backs up the Phase 0
   conclusion that Phase 2/3 packages depending on an already-converted
   Phase 1 package should keep working via `require()` without themselves
   being converted yet — but re-verify this per real Phase 2 package once
   started, since this was only smoke-tested with a throwaway script, not a
   full package's real require() call sites.
9. Root `package.json` `engines.node` was still `">=12.16.3"` (stale per
   the Phase 0 note) — updated to `">=22.12.0"`, the actual functional floor
   now that the migration depends on unflagged `require(esm)`. This
   supersedes the `.nvmrc` pin of `24` as informational only; `engines` is
   the enforced floor.

**Not yet touched, still open:** none of the ReScript source files needed
edits beyond the one `@module("..")` → `@module("../index.js")` self-import
fix (4 `.res` files, `Either`/`Errors`/`Maybe`/`Strings` — same
extensionless-import problem as item 5, just on the ReScript side of the
boundary via the `@module` FFI string). Watch for the same pattern in every
other ReScript package with a `@module("..")` self-reference.

## Explicitly not decided yet

- Whether ReScript's `esmodule` output should use `.mjs` or `.js` +
  `package.json` `"type": "module"` — pick one and apply consistently.
- Whether to convert all 123+ require() sites mechanically in bulk per
  package, or file-by-file with test runs in between. Given how many subtle
  bugs the mechanical `.re`→`.res` converter introduced in the ReScript
  migration, bulk-then-verify is lower risk with a good test net; file-by-file
  is lower risk without one. Decide per-package based on existing test
  coverage.
