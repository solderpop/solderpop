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

*Progress (2026-08-16): all seven Phase 1 candidates converted and
passing — `sdp-func-tools`, `sdp-fs`, `sdp-deploy-bin`, `sdp-patch-search`
(mocha/no-test-suite packages, see "Phase 1 findings" below for the interop
recipe), and `belt-holes`, `sdp-tethering-inet`, `sdp-tabtest` (the three
Jest packages — first attempt on `belt-holes` was reverted over a real
`require(esm)` blocker, then retried successfully with `babel-jest`, see
the "Jest packages retried" section below for that recipe plus several
Jest-specific interop findings, including one correction to the
`sdp-func-tools`/`sdp-fs` `hm-def` fix that only shows up under Jest).
Phase 1 candidate list fully cleared. Nothing committed yet this session —
diff is large in aggregate across 7 packages, will need splitting into
multiple PRs to respect the 250 LOC cap when ready to commit. Phase 2 not
yet started.*

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
edits beyond the one `@module("..")` self-import fix (4 `.res` files,
`Either`/`Errors`/`Maybe`/`Strings` — same extensionless-import problem as
item 5, just on the ReScript side of the boundary via the `@module` FFI
string). Watch for the same pattern in every other ReScript package with a
`@module("..")` self-reference.

**Correction, found while converting `sdp-fs` next:** the `@module("..")`
fix above was first written as `@module("../index.js")` and that was
**wrong** — caught it because `sdp-project`'s ReScript output (`Patch.bs.js`)
deep-requires `sdp-func-tools/src/Maybe.bs.js` directly (ReScript's own
cross-package resolution reaches into a dependency's in-source `.bs.js`
output directly, bypassing `package.json` `main` entirely), which surfaced
`Cannot find module '.../sdp-func-tools/index.js'` — there is no
`src/index.js`-as-package-root file, only `dist/index.js` via the `main`
field. The original `require("..")` relied on CommonJS's directory-with-
`package.json`-`main` resolution (`".."` from `src/` → package root → `main`
→ `dist/index.js`) — ESM has no equivalent for relative specifiers, so the
correct explicit path is **`@module("../dist/index.js")`**, not
`"../index.js"`. Fixed in all 4 `.res` files and rebuilt; re-verified
`sdp-func-tools`'s own 58 tests still pass afterward. Note this makes
`src/*.bs.js`'s self-reference depend on `dist/` already being built —
same as the pre-migration behavior, not a new constraint, just now explicit
instead of implicit in the resolution algorithm.

## Phase 1 findings — `sdp-fs` (2026-08-16)

Second package converted, depends on `sdp-func-tools` (already ESM, Phase 1)
and `sdp-project` (still CommonJS, Phase 2) — good test of the mixed-module
direction the plan flagged as needing re-verification. All 52 existing tests
still pass. Diff: 174 insertions / 124 deletions across 30 files, under the
250 LOC cap.

Recipe from `sdp-func-tools` reused as-is (package.json `type: module`,
`.babelrc` `modules: false`, extensionless imports fixed, default-import +
destructure for `ramda`/`chai`). Two additional gotchas surfaced, both worth
checking on every remaining package:

1. **`fs-extra` has the same non-statically-analyzable-named-exports problem
   as `ramda`/`ramda-fantasy`/`chai`.** Its `module.exports` is built via
   object-spread of nested `require()` calls (`{ ...require('./copy'),
   ...require('./remove'), ... }`), which `cjs-module-lexer` can only
   partially resolve — empirically `outputFile` got detected but
   `removeSync` did not (inconsistent, don't rely on partial detection).
   Fixed the same way: `import fse from 'fs-extra'; const { removeSync } =
   fse;` instead of `import { removeSync } from 'fs-extra'`. Add `fs-extra`
   to the "always use default import" list alongside `ramda`, `ramda-fantasy`,
   `chai`.
2. **New failure mode, worse than the named-export problem: deep-importing
   a *raw, unbuilt* source file from another package (bypassing that
   package's `main`/`dist`) loses named exports entirely, even though the
   same file transforms correctly when built.** `sdp-fs`'s tests import
   `sdp-project/test/helpers.js` directly (a test helper that's never run
   through `babel src -d dist`, only exists as source). Once `sdp-fs` became
   `"type": "module"`, `import { defaultizeProject } from
   'sdp-project/test/helpers.js'` failed with `does not provide an export
   named 'defaultizeProject'`, even though `sdp-project`'s own `.babelrc`
   (unchanged, still `modules: "commonjs"`) transforms that exact file
   correctly when run through the Babel CLI by hand. Root cause (confirmed
   via direct probing, not just inference): when Node's ESM loader resolves
   an `import` of a file whose nearest `package.json` says `"type":
   "commonjs"`, it runs `cjs-module-lexer`'s static named-export detection
   against the **raw file on disk** — the actual `export const` source, not
   the `@babel/register`-transformed-in-memory version — before handing off
   execution to the CJS loader (which is the only place `@babel/register`'s
   `require.extensions` hook lives). Since the raw source uses ESM `export`
   syntax rather than CJS `exports.x =`, the lexer finds nothing, so only a
   synthetic `default` (equal to the whole eventually-transformed
   `module.exports`) is exposed. This does **not** affect normal
   package-entry imports (`import { X } from 'sdp-project'`), because those
   resolve to `dist/index.js`, which is pre-built (real `exports.x =` on
   disk already, from running the build ahead of time) — only deep imports
   of never-built raw source, like test helpers, hit this. Fixed the same
   default-import way: `import SdpProjectTestHelpers from
   'sdp-project/test/helpers.js'; const { defaultizeProject } =
   SdpProjectTestHelpers;` (single-wrapped here, unlike the `hm-def` double-
   wrap case in the `sdp-func-tools` findings above — check empirically per
   file which shape applies rather than assuming). **Action item for later
   phases:** grep every package for deep `require`/`import` of another
   package's non-`main` source files (test helpers are the known case here;
   there may be others) and apply this fix, or consider building test
   helpers to `dist/` too so they don't need it.

## Phase 1 findings — `sdp-deploy-bin` (2026-08-16)

Third package, small (4 files), **no test suite** (`arduino-cli` and `fs`
touch real hardware/filesystem state — no `test` script, no `test/` dir
exists). Depends only on already-converted `sdp-func-tools`/`sdp-fs` plus
the internal `arduino-cli` package (still CommonJS) and external `which`.
Verification here was necessarily weaker than the first two packages:
built the package and smoke-loaded `dist/index.js` directly (checked every
named export resolves and is the right type, called the one pure function
(`patchFqbnWithOptions`) with a fixture board). No way to exercise
`createCli`/`compile`/`upload` without a real `arduino-cli` binary and
board — flagging that as a real coverage gap carried over from before the
migration, not one this migration introduced.

Same recipe again (`type: module`, `modules: false`, extensionless imports,
default-import fixes). Two more findings:

1. **`arduino-cli` (the internal package, not `fs-extra`) has the same
   Babel-double-default problem as `hm-def`.** Its `dist/index.js` has
   `exports.default = ArduinoCli` (a factory function). `import arduinoCli
   from 'arduino-cli'` binds to the whole `{ default: ArduinoCli,
   __esModule: true }` object, not the function — confirmed by probing
   `m.default.default` was the function, `m.default` was not. Fixed with
   the same `import ArduinoCliModule from 'arduino-cli'; const arduinoCli =
   ArduinoCliModule.default;` pattern. **This means every not-yet-migrated
   internal package with a single default export (built by this repo's own
   Babel config) is a candidate for the same bug** — not just `hm-def`.
   Check every internal-package default import during every future phase,
   not just external deps.
2. **Bigger finding, not about ESM mechanics at all: native ESM's strict,
   static export resolution turned two pre-existing dead-code bugs in
   `sdp-fs/src/index.js` into hard load-time crashes**, discovered only
   because `sdp-deploy-bin` (a *different* package) imports `sdp-fs`.
   `sdp-fs`'s own test suite never caught these because nothing exercises
   `sdp-fs`'s barrel `index.js` re-export surface directly — tests import
   straight from the individual source files. Found:
   - `export { spawnWorkspaceFile, spawnStdLib, spawnDefaultProject } from
     './spawn.js'` — `spawnStdLib` was never defined in `spawn.js`, dead
     stale re-export, no other file in the repo references it. Removed.
   - `export { scanWorkspaceForLibNames, loadLibsFromWorkspaceList } from
     './loadLibs.js'` — `loadLibsFromWorkspaceList` doesn't exist either;
     the real, currently-used name is `loadLibs` (confirmed via
     `src/load.js` and `test/loadLibs.spec.js`, both import `loadLibs`).
     Corrected the re-export to the real name.

   Under CommonJS this was completely silent: `require('sdp-fs').spawnStdLib`
   just resolves to `undefined`, and nothing happened to read it. Under
   native ESM, an unresolvable named export in *any* `export { x } from
   './y'` statement is a **hard `SyntaxError` at module-link time for the
   entire module graph** — it doesn't matter that nothing actually calls
   the missing export, the whole import chain refuses to load. **Action
   item, high priority for every remaining package:** audit every
   `index.js` (or other barrel file)'s named re-export list against the
   actual exports of its source files *before* converting, not after —
   this class of bug won't surface via that package's own tests, only via
   some other package's `import` of it (as happened here), which means it
   can hide until a much later phase if not checked proactively. A quick
   per-package check: for every `export { a, b, c } from './x.js'` line,
   grep `x.js` for `export const a`/`export function a`/etc. and confirm
   each name is real.

## Phase 1 findings — `sdp-patch-search` (2026-08-16)

Fourth package, small (2 src files), has tests (mocha). Converted with the
established recipe only — no new gotchas, everything from the
`sdp-func-tools`/`sdp-fs`/`sdp-deploy-bin` findings applied directly and it
worked first try: 16/16 tests passing, matches baseline. Diff stayed small.
Including this mainly to record that **not every package surfaces a new
problem** — the recipe is converging, most packages should be this easy now
that the CJS-interop and extensionless-import gotchas are known in advance.

## Phase 1 — `belt-holes` blocked, reverted (2026-08-16)

Attempted next (zero internal deps, ReScript-only, looked like the easiest
remaining candidate) and hit a real blocker, **reverted, not converted**:

**`belt-holes` uses Jest, not mocha — and Jest's `require()` does not have
Node's native `require(esm)` interop.** Flipped `bsconfig.json` to
`esmodule` and added `"type": "module"` exactly as with every other
package; `rescript build` regenerated the `.bs.js` files correctly (as
real `import`/`export` ESM syntax, same as always — ReScript itself even
switched the `@rescript/runtime` import paths from `lib/js/` to `lib/es6/`
automatically, no manual fix needed there). But `yarn test` (`jest`) failed
immediately on every suite:
```
SyntaxError: Cannot use import statement outside a module
> 3 | const BeltHoles_List = require('../src/BeltHoles_List.bs.js');
```
Root cause: this package has **no Babel config at all** (pure ReScript +
Jest, nothing else) — Jest's default transform pipeline for a
Babel-config-less project does effectively no transformation, and more
fundamentally, **Jest's `require()` is Jest's own implementation
(`jest-runtime`), not Node's** — it does not gain Node's newer
`require(esm)` capability just because the host Node version supports it.
The interop that made every other Phase 1 package work (a CJS-format
caller `require()`-ing a real ESM-format file, confirmed safe back in the
Phase 0 probe and re-confirmed for real code in the `sdp-func-tools`
findings) is a Node runtime feature, not a JavaScript-engine-wide one —
Jest's module system doesn't inherit it.

**This means every Jest-based package in this migration is a distinct
sub-case from the mocha-based ones**, needing one of these before
conversion (not decided yet, needs its own scoping pass, do not just
retry the mechanical recipe):
- Enable Jest's experimental ESM support
  (`NODE_OPTIONS=--experimental-vm-modules`, `extensionsToTreatAsEsm` in
  Jest config, etc.) — keeps this package Babel-free but is Jest's
  "experimental" tier, stability/compatibility with the installed Jest
  version not yet checked.
- Add a `babel-jest` transform so Jest transpiles through Babel like the
  mocha packages do — works but adds a new dependency (Babel) to a package
  that currently has none, and duplicates the `modules: false` config
  decision made everywhere else.
- Newer Jest major versions have improved native ESM support — check the
  currently-installed Jest version's capabilities before picking either
  option above; this may be simpler than either workaround if the version
  already installed supports it well.

**Action item:** confirmed by grepping every package's `scripts.test` —
three packages use Jest: `belt-holes`, `sdp-tabtest`, `sdp-tethering-inet`
(all three are ReScript-backed, all in the original Phase 1/2 candidate
list). All three will hit this exact blocker. Also noted in passing:
`sdp-client-electron` uses `electron-mocha`, a third test runner — not
urgent (that's a Phase 3 package) but worth a similar sanity check before
converting it rather than assuming the mocha recipe transfers unchanged.

## Phase 1 — Jest packages retried with `babel-jest`, all three converted (2026-08-16)

User call: use `babel-jest` (the proven, already-everywhere-else pattern)
over Jest's experimental ESM mode. Retried and completed all three —
`belt-holes`, `sdp-tethering-inet`, `sdp-tabtest` — same session. Baseline
counts (re-confirmed per package before/after): `belt-holes` 13/13,
`sdp-tethering-inet` 61/67 (6 pre-existing failures — real network/TCP
tests, timeout with no internet in this sandbox, confirmed identical via
`git stash` against the unmodified baseline, not a migration regression),
`sdp-tabtest` 14/14 (one of its two suites was already failing before this
session touched it at all — see below).

**The recipe, once dialed in, applied uniformly to all three:**
1. `bsconfig.json` → `esmodule`, `package.json` → `"type": "module"`, same
   as every other package.
2. Add a **test-only** `.babelrc` (not used for any build step — these
   packages have none — only for `babel-jest` to discover):
   ```json
   { "presets": [["@babel/preset-env", { "modules": "commonjs", "targets": { "node": "current" } }]] }
   ```
   Deliberately `modules: "commonjs"` here, the *opposite* of every other
   package's `modules: false`. The goal for a Jest package is different:
   make `babel-jest` transform ESM syntax back to CommonJS at test-load
   time, sidestepping Jest's lack of `require(esm)` entirely, rather than
   preserving ESM for Node to interpret natively. The files on disk stay
   real ESM either way — this only affects Jest's in-memory transform, not
   what real consumers (Node, other converted packages) see.
3. Add `@babel/core`, `@babel/preset-env`, `babel-jest` as `devDependencies`
   (versions matched to what's already installed/hoisted:
   `babel-jest@^24.9.0` — pinned to the Jest 24 line already in use, since a
   newer `babel-jest` wasn't verified compatible and wasn't needed).
4. **`transformIgnorePatterns` must explicitly un-ignore any dependency
   that's already been converted to ESM** — Jest's default ignores all of
   `node_modules`, but a workspace-symlinked sibling package (`belt-holes`,
   `sdp-func-tools`) needing its own ESM-to-CJS transform lives there too.
   Pattern used: `"/node_modules/(?!belt-holes/|sdp-func-tools/)"` (list
   grows per package's actual converted dependencies).
5. **Babel's own per-file `.babelrc` discovery does not reliably cross
   package boundaries inside `transformIgnorePatterns`-unignored
   `node_modules` deps** — un-ignoring `belt-holes/` alone wasn't enough;
   `babel-jest` still didn't apply a transform to `belt-holes`'s files
   pulled in via `sdp-tethering-inet`'s test run (same class of
   root/rootMode config-boundary issue as the `sdp-fs`/`sdp-project` finding
   above, different manifestation). Fix: don't rely on file-tree config
   discovery at all — pass the babel config **inline** via Jest's own
   `transform` option instead of a discoverable `.babelrc`:
   ```json
   "transform": {
     "^.+\\.js$": ["babel-jest", { "presets": [["@babel/preset-env", { "modules": "commonjs", "targets": { "node": "current" } }]] }]
   }
   ```
   This applies unconditionally to every matched file regardless of which
   package's directory it lives in. (The plain `.babelrc` file is till
   useful/kept as documentation + a fallback, but the inline `transform`
   is what's actually load-bearing.)
6. `@rescript/runtime`'s `esmodule`-mode output (`lib/es6/*.js`) is real,
   unbuilt ESM shipped inside `node_modules` — same class of problem as
   point 4, but for a dependency with no CommonJS-vs-ESM package-level
   toggle of its own (Jest can't be told to just transform it, its own
   internal cross-file imports keep pointing at `lib/es6/` regardless).
   The transform+ignore-pattern approach doesn't reach into `@rescript/
   runtime`'s own internals cleanly. Fixed instead with `moduleNameMapper`,
   redirecting to the CommonJS build that already ships alongside it:
   ```json
   "moduleNameMapper": { "^@rescript/runtime/lib/es6/(.*)$": "@rescript/runtime/lib/js/$1" }
   ```
   Only affects Jest's module resolution during tests — real consumers
   still get the genuine `es6/` build via Node's normal resolution.

**Package-specific findings on top of the shared recipe:**

- **`sdp-tethering-inet` — `%raw` embedding a bare `require(...)` call —
  fixed (2026-08-16).** `src/nodejs/Net.res` had `%raw(\`
  require("internet-available") \`)`, compiling to a literal
  `require("internet-available")` call inside otherwise-ESM output —
  invisible under Jest (transformed to CommonJS) but would throw
  `ReferenceError: require is not defined` under real Node ESM. First
  attempt used a plain `@module external ... = "internet-available"`
  binding instead — **that was also wrong**: ReScript's whole-module
  `@module` binding (no field name) compiles to a *namespace* import
  (`import * as X from "..."`) under `esmodule` target, and a namespace
  object is never callable even when the underlying CJS export was a bare
  function — same root cause as the `events`/`EventEmitter` fix earlier in
  this doc, but this time there's no named-export escape hatch
  (`internet-available`'s `module.exports` is *just* a function, no
  self-referencing property to bind to instead). Fixed by keeping `%raw`
  but replacing the embedded `require()` with a lazy dynamic `import()` —
  valid in both real ESM and Babel-transformed CommonJS, and free since
  `isAvailable` already returns a promise (no signature change needed):
  ```rescript
  let isAvailable = %raw(`
    function () {
      return import('internet-available').then(function (mod) {
        var fn = mod.default || mod;
        return fn();
      });
    }
  `)
  ```
  Verified two ways: Jest suite still 61/67 (same pre-existing network
  failures as before, unrelated), and a direct native-ESM smoke test
  calling `isAvailable()` in isolation — resolves with `undefined`
  (confirmed this matches the underlying `internet-available` library's
  own behavior exactly: it resolves with no value and rejects on failure,
  by design — not a regression from this fix, verified by calling the raw
  library function directly for comparison).
- **`sdp-tabtest` — bare JSON import — fixed (2026-08-16).** `src/Tabtest.res`
  had `@module external tabtestLibPatches: array<...> =
  "../lib/tabtestLibPatches.json"`, compiling to `import * as
  TabtestLibPatchesJson from "../lib/tabtestLibPatches.json"` — real Node
  ESM requires an import attribute for JSON (`with { type: "json" }`),
  missing here, would throw under native ESM despite passing under Jest
  (transformed to `require`, which natively handles JSON). Since
  `tabtestLibPatches` is consumed synchronously at module scope (not
  awaited), a dynamic `import()` would have forced `generatePatchSuite`
  and every caller of it to become async — too big a ripple for this fix.
  Used a synchronous `fs.readFileSync` instead, resolved via
  `import.meta.url` (no `__dirname`, no `require`):
  ```rescript
  %%raw(`import { readFileSync } from "node:fs";`)
  %%raw(`import { fileURLToPath } from "node:url";`)

  let tabtestLibPatches: array<SdpProject.Patch.t> = %raw(`
    JSON.parse(
      readFileSync(fileURLToPath(new URL("../lib/tabtestLibPatches.json", import.meta.url)), "utf8")
    )
  `)
  ```
  Note the binding changed from `external` to `let` — ReScript's `external`
  requires its right-hand side to be a bare string naming a JS value, not
  an arbitrary `%raw` expression; only `let` accepts a computed value.
  `%%raw` (double-percent) injects a genuine top-level ESM `import`
  statement rather than an inline expression — used here to bring
  `readFileSync`/`fileURLToPath` into scope without `require`. Verified:
  Jest suite 14/14 (unchanged), and the `readFileSync`/`fileURLToPath`
  mechanism itself confirmed working under a standalone real-`.mjs` probe
  (full end-to-end native-ESM load of `sdp-tabtest` isn't possible yet —
  it still deep-imports the unconverted, still-CommonJS `sdp-project`,
  Phase 2 work).
- **`sdp-tabtest`'s `tools/loadTabtestLibPatches.js` is a standalone build
  script run directly via `node` (`yarn build:lib`), never through Jest —
  renamed to `.cjs`.** It uses plain `require()` syntax; under `"type":
  "module"` a `.js` file would be parsed as ESM by Node with no `require`
  global, a hard crash. `.cjs` is the standard escape hatch: always
  CommonJS regardless of the package's `"type"` field. Check every
  remaining package for standalone `node ./tools/*.js`-style scripts
  before converting — they're easy to miss since they're not part of
  `src/` or `test/` and don't show up in the require-count grep from the
  scope inventory.
- **Real cross-package regression, caught only because of the dependency
  graph, not this package's own tests: the `hm-def` double-default fix
  from the `sdp-func-tools`/`sdp-fs` findings above was WRONG for the Jest
  path.** `HMDefModule.default` (the fix that made mocha packages pass)
  returned `undefined` under `sdp-tabtest`'s Jest run, because **Babel's
  own `_interopRequireDefault` helper — used when `babel-jest` transforms
  `import HMDefModule from 'hm-def'` to CommonJS — already performs one
  layer of default-unwrapping as part of translating the import statement
  itself.** Node's native ESM interop (what mocha/`@babel/register`
  packages get) does *not* pre-unwrap — the synthetic `.default` is always
  the literal raw `module.exports`, however it's shaped. Same source line,
  two different consumption paths, two different numbers of `.default`
  layers needed — confirmed empirically by hand-running
  `babel.transformFileSync` on the file and reading the generated
  `_interopRequireDefault` output. Fixed with a shape-tolerant check in
  both `sdp-func-tools/src/types.js` and `sdp-fs/src/types.js`:
  ```js
  const HMDef = HMDefModule.create ? HMDefModule : HMDefModule.default;
  ```
  **This generalizes: any "double-default" fix applied earlier in this
  plan (`hm-def`, `arduino-cli`) needs the same tolerant-check treatment
  if the package is ever deep-imported by a Jest-based test run — not just
  its own package's test suite.** `sdp-arduino/src/types.js` and
  `sdp-project/src/types.js` have the identical `hm-def` pattern and are
  still CommonJS (Phase 2, untouched) — when converting either, apply the
  tolerant form directly rather than the plain `.default` form that had
  to be corrected here. `sdp-deploy-bin`'s `arduino-cli` double-default
  fix (mocha-only, no current Jest consumer) doesn't need it *yet*, but
  would need it the moment any Jest package deep-imports it.
- Confirmed (again) that a `rescript build` failure ("Missing dependency
  `Pin-SdpProject` in search path") hit mid-session was **stale incremental
  build cache from flipping multiple interdependent packages'
  `bsconfig.json` module targets in the same session**, not a real bug —
  resolved by `yarn rescript clean` run from the package whose build was
  failing (cleans its full dependency chain), not just the specific
  package that seemed to have changed. If a ReScript build error mentions
  a module that obviously exists, clean before investigating further.

## Phase 2 findings — `sdp-project` (2026-08-16)

First Phase 2 package (had to go before `sdp-arduino`, which depends on
it). Much bigger than anything in Phase 1 — 67 files touched, largest
single-package diff of the migration so far. All previously-known gotchas
applied directly (extensionless imports, `ramda`/`ramda-fantasy`/`chai`/
`hm-def` default-import fixes, `@module("..")` self-reference →
`@module("../dist/index.js")`). Two new findings, one of them important
enough to change the recipe for every remaining package with build-
generated JSON data:

- **Barrel-export audit is worth scripting, not eyeballing, past a certain
  file count.** `src/index.js` re-exports ~150 names across a dozen
  `export { ... } from './x.js'` blocks. Wrote a small Node script that
  parses each block and greps the target file for each name (source at
  the point this was done — re-derive rather than trust it's still
  accurate) rather than checking by hand. Found 4 genuinely dead
  re-exports this way (`haveAddedNodesOrChangedTypesOrBoundValues`,
  `convertPatchDimensionsToSlots`, `convertPatchDimensionsToPixels`,
  `cppEscape` — the last one actually lives in `sdp-func-tools`, not this
  package at all). Confirmed via repo-wide grep that nothing imports any
  of the four from `sdp-project` — removed rather than guessed at a
  rename target, same policy as the `sdp-fs` findings above. **Run this
  audit before, not after, converting every remaining package** — it's
  cheap and catches a class of bug that a package's own tests structurally
  cannot catch (see the `sdp-fs`/`sdp-deploy-bin` findings for why).
- **The JSON-import fix from the `sdp-tabtest` findings needs a
  correction: don't read the same file independently in multiple files.**
  This package has 4 separate call sites that used to do `import
  BUILT_IN_PATCHES from '../dist/built-in-patches.json'` (a build-
  generated file) — `project.js`, `patch.js`,
  `migrations/unitlessToSlots.js`, and `test/project.spec.js`. Applying
  the `sdp-tabtest` fix (independent `fs.readFileSync` + `import.meta.url`
  per file) mechanically caused 3 real test failures — same array
  lengths, different members, despite the underlying JSON being byte-
  identical. Root cause: **Node's module cache dedups `import` by resolved
  file path, so all 4 old static imports of the same JSON file were
  silently the exact same object in memory.** Something downstream
  mutates a built-in patch object in place instead of returning a new one
  (a real, pre-existing bug, out of scope to chase down here), and the
  test suite's "expected" value only ever matched the library's "actual"
  value because they were *literally the same object* — the assertion was
  accidentally tautological. Independent `readFileSync` calls each
  produce a fresh, unaliased object, breaking that accidental sharing and
  exposing the real bug as a visible test failure. Fixed by centralizing
  the read into one new module (`src/internal/builtInPatches.js`) that
  every consumer imports from — restores the original aliasing/sharing
  behavior exactly, which is the correct scope for an ESM migration (stay
  behavior-preserving; don't fix unrelated bugs a change happens to
  surface). **Action item:** the `sdp-tabtest` fix (independent read) is
  only safe when the JSON file has exactly one consumer. Before applying
  it to any remaining package, grep for every other file that imports the
  same JSON path — if there's more than one, centralize into a shared
  module like this one instead.

## Phase 2 complete (2026-08-16)

All six remaining Phase 2 candidates converted in one continuous session
after `sdp-project`: `sdp-arduino`, `sdp-deploy`, `sdp-pm`,
`sdp-cloud-compile`, `sdp-wasm-compile`, `sdp-cli` (converted in
roughly that dependency order — `sdp-arduino` had to go before
`sdp-wasm-compile`/`sdp-cli`, `sdp-project` before `sdp-arduino`). Every
package's test suite (or, for the four with none, a manual smoke-load of
every export, or — for `sdp-cli` — real CLI invocation) matches its
pre-conversion baseline exactly. Remaining unconverted packages: `arduino-cli`
(small, not yet attempted, no known blocker), and the three explicitly
deferred-to-last Phase 3 packages (`sdp-client`, `sdp-client-browser`,
`sdp-client-electron` — GUI/webpack/Electron, flagged from the start of
this doc as highest-risk and needing real UI verification, not just a
green build).

**New findings from Phase 2, on top of everything in Phase 0/1:**

- **`sdp-arduino` had two genuine architectural conflicts, not mechanical
  fixes** — both stemmed from the same root cause as the earlier
  "raw-source-loaded-via-native-`import()`-bypasses-Babel" finding, just
  hitting build tooling instead of test helpers:
  - `nearleyc` (the grammar-compiler for this package's implementation-
    code parser) emits a UMD wrapper and embeds plain `require()` calls
    in its preamble. Both are syntactically valid so ESM's parser accepts
    them, but crash at runtime (no `module`/`window`/`require` globals in
    real ESM), and `nearleyc` has no ESM output mode. Fixed with a
    post-build script (`tools/fixNearleyGrammarEsm.cjs`) that rewrites
    the generated file: hoists preamble `require()`s into real top-level
    `import`s, turns the trailing `module.exports`/`window` UMD branch
    into `export default`.
  - `babel-plugin-inline-import` (inlines `.cpp`/`.h` files as string
    literals at Babel-transform time) only works when Babel actually
    processes the importing file — guaranteed under CommonJS, not under
    ESM once mocha's native `import()`-driven test loading takes over
    (see the `sdp-project`/`test/helpers.js` finding for the mechanism).
    Removed the plugin entirely; replaced with a build step
    (`tools/generateTemplateModules.cjs`) that pre-generates a real
    `export default "...";` module next to each `.cpp`/`.h` file.
  - **Both of `sdp-cloud-compile` and `sdp-wasm-compile` also use
    `babel-plugin-inline-import` and were left as-is (plugin kept, no
    generated-module rewrite)** — safe specifically because neither has a
    test suite, so nothing ever triggers mocha's native-ESM entry point
    against their source; the only consumption paths are the Babel-CLI-
    built `dist/` output (plugin always applies correctly there) and
    other packages requiring that same built output. **If either package
    ever gains a test suite, apply the `sdp-arduino` fix before trusting
    a green test run** — the plugin will silently stop working the same
    way, `require`/`.cpp` errors won't appear until something actually
    exercises the native-import path.
  - Also on `sdp-arduino`: `getEmxxEnv`/`Arduino.h`-style deep imports
    into `platform/wasmSimulation/*` from `sdp-wasm-compile` are consumed
    the same generated-module-free way as `sdp-cloud-compile`'s deep
    imports — fine for the same "no test suite" reason.
- **Mechanical ramda-fix regex bug, caught by reviewing diffs before
  moving on — a process note, not a code finding.** A regex meant to
  convert `import { a, b } from 'ramda';` to a default-import form used a
  non-greedy `[\s\S]*?` between `import {` and `} from 'ramda';`, which
  in 8 of `sdp-cli`'s command files spanned across an *earlier*,
  unrelated `import { exit } from 'process';` block and merged the two
  into invalid syntax (`const { exit } from 'process';` followed by
  `import { ...ramda names... } = R;`). Caught immediately because a
  system reminder surfaced the post-edit diff and the syntax error was
  visible on inspection — not caught by any tool. **Lesson: don't trust a
  bulk regex substitution across many files without reading at least a
  sample of the actual diffs it produced, even when the transform looks
  simple** — reverted the 8 corrupted files via `git checkout --` and
  redid them with per-file, anchored edits instead of a shared regex.
- **`sdp-cli` — real regression in a third-party dependency's root-
  detection, not this repo's code.** `@oclif/command@1.5.6`'s
  `Main.run()` determines the CLI's own root directory by walking
  `module.parent.parent.filename` — a CJS-only mechanism with no ESM
  equivalent. `bin/run` switched from `require('../lib')` to `import
  '../lib/index.js'` (required regardless, since `bin/run` has no file
  extension but is still subject to `"type": "module"` — confirmed by
  testing directly: it crashed on the old `require()` call once the
  package flipped). Once it's a real `import`, there's no `module.parent`
  chain, and `@oclif/command` silently fell back to treating *its own*
  package directory as root — `xodc --help` listed only the built-in
  `help` command, no real commands. Confirmed as an actual regression
  (not pre-existing) by stashing and re-testing against the unconverted
  baseline, which correctly listed all commands. Fixed by passing this
  file's own path explicitly (`fileURLToPath(import.meta.url)`) as
  `@oclif/command`'s `run()`'s second argument, bypassing the broken
  auto-detection entirely. **Action item:** any other package using an
  old CJS-era framework with similar "introspect my caller via
  `module.parent`" auto-configuration should be suspected of the same
  failure mode — check for `module.parent` in that framework's source
  before assuming a green build means it actually works, the same way
  `sdp-cli`'s build succeeded silently while the CLI was actually broken.
- Also on `sdp-cli`: a bare subpath import of a third-party package needs
  the extension too, same as relative imports —
  `'source-map-support/register'` → `'source-map-support/register.js'`.
- **Verification without a usable test suite:** `sdp-cli`'s `test-func`
  needs a `yarn build:bundle` step (copies `../../workspace`, vendor
  Catch2 sources, etc.) that was never run in this checkout, and fails
  identically — `ENOENT` on `bundle/workspace/__packages__` — on the
  unconverted baseline and after conversion, confirming it's an
  environment gap unrelated to module format. Used direct CLI invocation
  (`node bin/run --help`, `node bin/run <command> --help` for each of the
  10 commands) as the real verification instead — arguably a *better*
  check than the test suite would have been for this specific bug, since
  it exercises exactly the code path (`Main.run()`'s root detection) that
  broke.

## Important: re-check earlier packages' workarounds when their deps convert (2026-08-16)

Caught by re-running the *entire* suite of already-converted packages
after finishing `sdp-cli` (a full sweep — worth doing after every batch,
not just the package just touched): **`sdp-fs` and `sdp-patch-search`
both broke**, with `sdp-project/test/helpers.js does not provide an
export named 'default'`.

Cause: the `sdp-fs`/`sdp-patch-search` findings (Phase 1) documented a
default-import workaround for deep-importing `sdp-project/test/
helpers.js` — needed at the time because `sdp-project` was still
`"type": "commonjs"`, so Node's `cjs-module-lexer` analyzed the *raw*
file (real `export const` syntax, since the source was never
transformed) against a CJS-typed package and found no named exports,
synthesizing only a `default`. That workaround **silently became wrong**
the moment `sdp-project` itself was converted (Phase 2): the same file is
now genuinely parsed as real ESM with its real named exports, and there
is no `default` export at all — the old shim (`import
SdpProjectTestHelpers from '...'; const { x } = SdpProjectTestHelpers;`)
found nothing to bind to. Fixed by reverting to plain named imports
(`import { x } from '...'`), the natural/correct form now that the
target is truly ESM.

**This is a general hazard specific to this migration's incremental,
package-by-package order, not a one-off bug:** any workaround written in
an earlier phase to cope with a *not-yet-converted* dependency needs to
be re-examined — and very possibly reverted to the plain/idiomatic form —
the moment that dependency gets converted in a later phase. The build
succeeding gives no signal either way (these are runtime import-shape
mismatches, not syntax errors) — only actually running the depending
package's tests catches it, and nothing prompts you to re-run a package
you already finished and moved on from.

**Action items, both now and for the rest of this migration:**
- After converting any package, **re-run the full test suite of every
  already-converted package**, not just the one just touched — this is
  the only way this class of regression surfaces. (This was already
  informally happening via the "final full sweep" pattern in this doc's
  findings, but wasn't being done rigorously enough to catch this one
  before now — do it explicitly, every time, going forward.)
- `sdp-client`'s `test/tableLogSources.spec.js` and `test/hinting.spec.js`
  have the same kind of deep import of `sdp-project`'s (or possibly
  another package's) test helpers — not checked/fixed here since
  `sdp-client` isn't converted yet (Phase 3), but whatever workaround it
  needs when *it's* converted should be written with this exact trap in
  mind, and re-verified if any of ITS dependencies convert afterward.
- More generally: grep for `SdpProjectTestHelpers`-style default-import-
  of-a-deep-test-helper patterns (or the equivalent for any other
  package) as a matter of course whenever a new package finishes
  conversion, not just when something visibly breaks.

## `arduino-cli` and the last no-blocker package (2026-08-16)

Converted `arduino-cli` (last of the original 18 with no known blocker)
and immediately hit the same un-workaround hazard just documented above,
in the *other* direction: `sdp-deploy-bin`'s double-default fix for
`arduino-cli`'s default export (from the Phase 1 findings) became wrong
the moment `arduino-cli` itself converted — once it's genuine ESM, a
real ESM importer gets the function directly, no `.default` unwrap
needed. Fixed the same way (revert to the plain form). Also found two
more instances of already-known gotchas: `fs-extra`'s `remove` (named-
export interop, same as prior findings) and `promise-all-properties`
(Babel-compiled double-default, same class as `hm-def`). 9/9 tests pass.

All 18 originally-scoped packages plus `sdp-project` are now converted
except the three deliberately-deferred Phase 3 packages.

## Phase 3 — `sdp-client` (2026-08-16)

First and largest of the three deferred highest-risk packages (129
source files, 120 `.jsx`) — flagged from the start of this doc as
needing real UI verification, not just a green build, and that held:
several bugs here were only found by actually building through webpack
and launching the app, invisible to every mocha/build check.

**New problems, each requiring an actual decision, not a mechanical fix:**

- **`.jsx` is not a recognized extension for Node's native ESM loader —
  full stop, independent of JSX syntax support.** `import Foo from
  './Foo.jsx'` throws `Unknown file extension ".jsx"` before Node even
  attempts to parse the file. `@babel/register`'s `require()` hook
  (what makes JSX work for every other mocha-based package in this
  repo) never gets a chance to run, because mocha loads test files via
  `import()` once a package is `"type": "module"` — same mechanism as
  every other "raw source reached via native import bypasses Babel"
  finding in this doc, just hitting 120 files instead of one. Fixed
  with a genuine Node [module customization
  hook](https://nodejs.org/api/module.html#customization-hooks)
  (`tools/jsxEsmLoader.mjs`) that intercepts `.jsx` loads and pipes them
  through Babel first. **Key gotcha in the hook setup itself:** passing
  the hook file via `--import` alone does *not* install it as a
  loader — its exported `resolve`/`load` functions are silently never
  called. You must call `module.register()` explicitly from a small
  registration entry point (`tools/registerJsxLoader.mjs`), which is
  what actually gets passed via `--import`/`NODE_OPTIONS`. Confirmed via
  isolated probe before touching real code. No matching `resolve` hook
  was needed — Node's default resolver doesn't reject unknown
  extensions, only `load`'s format detection does, and this package's
  imports all carry explicit extensions after the usual fix pass.
- **`@babel/cli` silently renames `.jsx` → `.js` on output, but doesn't
  rewrite import specifier strings referencing the renamed files.** Once
  this migration's extensionless-import fix made every `.jsx` import
  explicit, `dist/`'s own compiled output broke internally: `dist/
  index.js` said `from './Foo.jsx'`, but the built file was actually at
  `dist/Foo.js`. Classic Babel-CLI-plus-JSX-plus-ESM gotcha, unrelated
  to this repo specifically. Fixed with `--keep-file-extension` (needs
  a reasonably recent `@babel/cli`, confirmed present via `babel
  --help`).
- **The real webpack build (via `sdp-client-browser`, the actual
  consumer — this package alone was never bundled by anything) surfaced
  import bugs the mocha suite structurally cannot see**, because no
  test file reaches `src/index.js`'s barrel or most `.jsx` components at
  all: several *already-broken* bare specifiers (`editor/index.js`,
  `messages/index.js`, `inspectorWidgets/index.js`, `Patch/index.jsx` —
  confirmed pre-existing by checking there's no `resolve.modules`
  config anywhere in the webpack config chain, including the dev-server
  config, that could ever have made a bare specifier like this resolve;
  fixed to explicit relative paths, same files, working specifier), and
  a genuinely new-to-ESM problem: **deep imports into third-party
  packages also need explicit extensions once the importing file is
  real ESM** — `codemirror/addon/mode/simple`,
  `throttle-debounce/debounce`, `react-redux/src/utils/storeShape`, etc.
  all needed `.js` appended, confirmed by webpack's own explicit error
  message ("BREAKING CHANGE: ... failed to resolve only because it was
  resolved as fully specified ... probably because ... a '*.js' file
  where the package.json contains '"type": "module"'"). **Action item:**
  this class of bug (deep bare imports into `node_modules` packages
  missing extensions) wasn't checked for in any earlier package's
  extensionless-import pass — only relative imports were. Worth a
  dedicated grep on any remaining package before assuming the mocha
  suite passing means the real (webpack- or browser-consumed) build is
  clean too.
- **A real runtime bug only found by actually launching the app**, not
  by any build or test check: `Cannot read properties of undefined
  (reading 'FROM_BUS_PATH')` on load, coming from `sdp-project`'s
  `Buses.bs.js`. Root cause: the `@module("../dist/index.js")` self-
  reference fix (established back in the `sdp-func-tools` findings,
  reused everywhere a ReScript file needs to call back into its own
  package's plain-JS layer) re-imports the package's own aggregating
  barrel from *within* one of the files that barrel aggregates — a real
  circular import. Node's module evaluation (what the 476-test mocha
  suite exercises) tolerated it fine; webpack's bundled ES-module live-
  binding evaluation order did not. Fixed by pointing the two affected
  bindings directly at `constants.js` (where `FROM_BUS_PATH`/
  `TO_BUS_PATH` actually live) instead of the barrel, sidestepping the
  cycle entirely — see the dedicated `sdp-project` fix commit. **~13
  other files across `sdp-project`/`sdp-func-tools`/`sdp-arduino` use
  the identical barrel-self-reference pattern and were *not* proactively
  rewritten** — confirmed working for the app paths actually exercised
  in this session (initial project load, library-tree browsing, patch
  canvas rendering), but not proven safe for every code path. If a
  similar "Cannot read properties of undefined" surfaces from a
  ReScript-compiled file during later testing, this is the first thing
  to check, and the fix is the same: point the binding at the specific
  file defining the export instead of the barrel.
- **Browser-launch verification method, for reuse:** no project skill
  existed for this repo yet. Used `yarn dev` (webpack-dev-server on
  :8080) plus a one-off Playwright script (`npm install playwright
  --no-save` in the scratchpad, launched with `executablePath:
  '/snap/bin/chromium'` pointing at the system browser rather than
  downloading Playwright's own — `chromium-cli` was not available in
  this environment). Confirmed real interactivity, not just a rendered
  shell: project-browser tree expansion loaded real nested patch lists,
  the patch canvas rendered real nodes/links from the default-loaded
  tutorial project. The webpack-dev-server warning overlay (shows on
  every recompile, not just the first) intercepts clicks even when
  visually appearing empty — `page.evaluate(() => el.remove())` the
  `#webpack-dev-server-client-overlay` iframe rather than trying to
  click its close button. Recommended `/run-skill-generator` to capture
  this as a reusable project skill; not run since it wasn't requested.
- Barrel-export audit (now a standing step for every package) found and
  fixed: two genuinely dead re-exports (`CreateNodeWidget`, `getUpload`
  — never existed anywhere, safe to remove) and one real misattribution
  (`TWEAK_PULSE_SENT` re-exported from `project/actionTypes.js` when it
  only ever existed in `editor/actionTypes.js`, already correctly
  imported earlier in the same file — silently tolerated under
  CommonJS's lenient `undefined`-property access, a hard `SyntaxError`
  under ESM). Also found and removed one dead, permanently-unreachable
  reducer case (`PROJECT_RENAME` — the action type never existed under
  any name, so the `case` branch could never have matched, even before
  this migration).
- **Explicitly not fixed:** three webpack warnings (`setMode`,
  `toggleAccountPane`, `combineEditorSelection` — namespace-property
  access on exports that don't exist anywhere in the codebase) look
  identical to the barrel-audit dead-export findings above but are not
  the same category — they're genuinely missing application features
  (a mode-toggle button, an account pane), not a misattributed or
  removed import. Fixing them would mean implementing real product
  functionality, which is out of scope for a module-system migration.
  Confirmed these are pre-existing (the same `undefined` property access
  would have occurred under the original CommonJS build too, just
  invisible instead of a build warning) — left as-is.
- `.babelrc` had no explicit `modules` option — relied on
  `@babel/preset-env`'s `"auto"` default, which already kept ESM for
  webpack specifically (its `babel-loader` caller sets
  `supportsStaticESM`) but forced CommonJS for the CLI/mocha paths.
  Made it explicit (`modules: false`) for consistency with every other
  converted package, and so dist/mocha genuinely match what webpack was
  already doing rather than relying on an implicit default.
- `sdp-client/webpack.config.js` → `webpack.config.cjs`: plain
  `require()`/`module.exports` CommonJS sitting at the package root,
  never processed by Babel, and required directly by
  `sdp-client-browser` and `sdp-client-electron`'s own webpack configs
  to extend the shared base — needed the same `.cjs` escape hatch as
  every other build-tooling script in this migration (nearley's grammar
  compiler, the template-module generators, etc.). Updated all 4
  external `require()` references across the two consuming packages.

104/104 tests pass, matching baseline exactly.

## Phase 3 — `sdp-client-browser` (2026-08-16)

Second of the three deferred packages, and the actual webpack entry
point that first exposed several `sdp-client` bugs above (that bundling
run happened here, not in `sdp-client` itself, since `sdp-client` alone
is never bundled by anything). Standard recipe otherwise: `"type":
"module"`, extensionless-import fixes (25 files), ramda default-import
fix in `App.jsx`.

- **New bug category: webpack's per-file module-type detection stops
  tolerating raw `require()` in files with zero import/export syntax,
  once the *package* (not the file) flips to `"type": "module"`.**
  Every other `require()`-survives-into-ESM finding in this doc so far
  involved a file that already had real `import`/`export` statements
  (Node/webpack's own heuristics treat such a file as unambiguously
  ESM). These two didn't:
  - `src/shim.js` — a webpack entry point with no import/export at all,
    just a bare `require('babel-runtime/regenerator')` mutation hack.
    Confirmed dead: it patched a `redux-api-middleware` + Babel 6 bug,
    and neither dependency exists in this codebase anymore. Emptied
    (left as a live but now-empty entry point — deleting it outright
    means touching the shared `sdp-client/webpack.config.cjs`, out of
    scope here).
  - `src/index.jsx` — mixed case: real top-level `import`s, but a
    conditional `require('why-did-you-update')` guarded by
    `process.env.WHY_DID_YOU_UPDATE`. Fixed with dynamic `import()`
    instead (same fix shape as the `sdp-client/src/workers/run.js`
    companion fix below).

  Both failed identically at runtime, not build time: `require is not
  defined`, only visible once the bundle actually executes in a
  browser. Neither was caught by `webpack --config webpack.config.cjs`
  succeeding, nor by any test suite — this package's own test-func
  suite doesn't boot the real entry point, and `sdp-client`'s mocha
  suite doesn't reach `sdp-client-browser` at all. **Action item for any
  remaining unconverted package with a webpack entry point:** grep
  specifically for `require(` in files that have no `import`/`export`
  statements of their own — the extensionless-import fix pass and the
  barrel-export audit both structurally skip this category, since
  neither one is triggered by "file has no ESM syntax but isn't CJS
  either."
- **Same bug, third instance, found in an already-converted and
  already-committed package (`sdp-client`, not `sdp-client-browser`
  itself):** `sdp-client/src/workers/run.js` had a deliberately-lazy
  `require('./wasm.worker')` (guarding against triggering webpack's
  worker-loader transform during mocha tests, which don't exercise this
  code path) sitting below real top-level `import`s. Fine under
  `sdp-client`'s own Node-based mocha suite; broke once actually bundled
  by `sdp-client-browser`'s webpack build, for the identical reason as
  `index.jsx` above. Fixed the same way — dynamic `import()` wrapping the
  function body, which still triggers worker-loader (matches on the
  `.worker.js` extension regardless of static-vs-dynamic import syntax)
  while staying inert until actually called. Committed separately as a
  companion fix to `sdp-client`, since the bug lived there even though
  only `sdp-client-browser`'s build could ever surface it. **This is now
  the third time a fix has had to land in an earlier package after a
  later package's real build/browser check exposed it** (previously:
  `sdp-project`'s `Buses.res` circular-import fix, caught by
  `sdp-client`'s browser launch). Reinforces the standing practice of
  re-running every already-converted package's checks after each new
  package converts — but note build/bundle-level bugs like this one
  don't show up in *that* package's own test suite at all, only in
  whichever downstream package actually bundles it for a browser.
- `webpack.config.js`/`.dev.js`/`.test.js` and
  `tools/loadTutorialProject.js` → `.cjs`, same escape hatch as
  `sdp-client`'s own webpack config.
- `test-func/bootstrap.js`: chai fixed to default-import + destructure
  (same `cjs-module-lexer` static-analysis gap as every other chai
  usage in this migration).
- `test-func/creatingBlinkPatch.spec.js`: `__dirname` no longer exists
  under ESM — reconstructed via `path.dirname(fileURLToPath(import.meta.url))`.
- **`test-func` (puppeteer E2E suite) confirmed pre-existing-broken, not
  a regression:** fails with a Babel version conflict
  (`@babel/preset-react` requires `^7.0.0-0`, but `@babel/core@8.0.1` is
  what's actually loaded). Verified via `git stash` / `git stash pop`
  that this exact failure occurs identically against the unconverted
  baseline — same mixed Babel 7/8 versions issue already documented
  since Phase 0, unrelated to this migration. Not fixed (out of scope).
- Browser-launch re-verification (same Playwright-against-system-
  Chromium method as `sdp-client`'s findings above): confirmed the
  `shim.js`/`run.js` `require is not defined` runtime error is gone, and
  the app renders/functions identically to the pre-migration baseline —
  same pre-existing `ERR_SSL_VERSION_OR_CIPHER_MISMATCH`/auth-check
  `[object Object]` `pageerror` only, no new errors.

Webpack build: 0 errors, 17 pre-existing warnings (same
`setMode`/`toggleAccountPane`/`combineEditorSelection` dead-feature
warnings documented in `sdp-client`'s findings — genuinely missing
product features, not migration fallout).

## Phase 3 — `sdp-client-electron` (2026-08-16)

Last package in the migration. Standard recipe: `"type": "module"`,
148 extensionless-import fixes across 49 files, `webpack.config.js` →
`.cjs`, `.babelrc` `modules: false` (same split as every other package
built both by `babel` CLI and webpack's `babel-loader`).

- **Electron GUI/test verification could not be completed in this
  sandbox — flagged and confirmed with the user before proceeding.**
  `node_modules/electron/dist/electron` here is a plain Node.js binary
  standing in for real Electron: `--version` reports the Node version
  (not an Electron version), and it fails on `--no-sandbox` with
  Node's own "bad option:" unrecognized-flag message, identical to
  running `node --no-sandbox` directly. Confirmed pre-existing (not
  migration fallout) by hitting the identical failure before touching
  any code in this package. No system Electron install exists as a
  fallback. Both `test` (electron-mocha) and `test-func` (Spectron)
  ultimately depend on launching a real Electron process and cannot
  run to completion here.
- **The stand-in binary turned out to be useful anyway**: running it
  directly against the compiled Main Process entry point still
  executes real Node-native strict-ESM module resolution across the
  entire reachable import graph, since it genuinely is Node under the
  hood. This caught several bugs a webpack build alone would not:
  - **Every `import * as R from 'ramda'` and `import * as fse from
    'fs-extra'` (~25 files) was silently broken.** `cjs-module-lexer`
    can't statically detect either package's named exports (same root
    cause documented for `ramda` since Phase 1), so under real ESM the
    namespace object only ever carries a `default` property —
    `R.propOr`, `fse.remove`, etc. were `undefined` at every call
    site, not a parse/import-time failure. This is a *new* variant of
    an already-known bug: every earlier fix for this issue was for
    *named* imports (`import { propOr } from 'ramda'`, which fails
    loudly at import time); a *namespace* import (`import * as R`)
    fails silently instead — the import itself succeeds, only property
    access on it is broken, and only at the specific call site that
    happens to touch a name the lexer missed. Worth checking for this
    namespace-import variant specifically if `ramda`/`fs-extra` show
    up in any future package's audit — `grep` for `import \* as` isn't
    enough on its own, since real ESM sibling packages use the same
    syntax safely. Fixed to default imports everywhere (`import R from
    'ramda'`).
  - `tetheringInetMiddleware.js`: `import AtNet from
    'sdp-tethering-inet'` (default import) never matched that
    package's real shape — it only has named exports (`create`,
    `execute`, ...), no default. Unlike the ramda/fs-extra case above,
    this fails loudly (`export 'default' ... was not found`) since
    it's a real ESM module, not a CJS-interop gap. Fixed to `import {
    create as createAtNet }`.
  - `utils.js`: `import { Maybe } from 'ramda-fantasy'` — the same
    non-statically-analyzable CJS exports problem `sdp-func-tools` hit
    in Phase 1. Fixed with the same default-import + destructure
    pattern established there.
  - **`main.js`/`utils.js` are Main Process code, compiled to real ESM
    by `babel src/app -d src-babel/app` — which has no `__dirname`
    global.** `utils.js` is the interesting case: the *same source
    file* is also webpack-bundled for the Renderer Process, where
    `__dirname` is deliberately left alone (`node: { __dirname: false
    }` in the webpack config) so Electron's renderer runtime resolves
    it to the bundle's own directory — a genuinely different value by
    design, per the file's own docblock. Fixed *only* the Main Process
    branch via `fileURLToPath(import.meta.url)`, leaving the Renderer
    Process's bare `__dirname` reference completely untouched, to
    avoid silently changing already-correct, differently-scoped
    renderer behavior.
  - `@electron/remote/main` → `@electron/remote/main/index.js`: a bare
    subpath resolved to a directory, which Node's strict ESM resolver
    rejects outright (`ERR_UNSUPPORTED_DIR_IMPORT`) — a distinct
    failure mode from the usual missing-file-extension category,
    caught only because the stand-in binary actually runs Node's real
    resolver instead of webpack's more permissive one.
  - Plus the usual bare-extensionless-deep-import category
    (`sdp-client/dist/debugger/debugProtocol`,
    `sdp-deploy/dist/download`/`unzip`/`progress`, `sdp-deploy/dist/constants`).
- `popups/reducer.js`: removed a dead `REQUEST_INSTALL_ARDUINO_IDE`
  import/case — the constant was never defined anywhere in this
  package, so the `ARDUINO_IDE_NOT_FOUND` popup could never have been
  reachable, even before this migration. Same
  silently-tolerated-under-CommonJS dead-export category documented
  repeatedly elsewhere in this doc.
- **Found and fixed one real pre-existing bug in `sdp-fs`** (already
  converted, already committed): `find.js` rejects with
  `ERROR_CODES.TRIED_TO_OPEN_NOT_XOD_FILE` when a non-`.xod` file is
  opened, but that constant was never defined in `errorCodes.js`.
  Invisible under CommonJS (silent `undefined` property access) and
  uncovered by `sdp-fs`'s own test suite; surfaced here because webpack
  statically validates named-export access through namespace imports
  once the importing chain is itself real ESM. Same "a later package's
  real build exposes a latent bug in an earlier, already-converted
  package" category as the `sdp-project`/`Buses.res` and
  `sdp-client/workers/run.js` findings — companion-fixed and committed
  separately, `sdp-fs`'s own 52/52 tests still pass.
- `src/shim.js`: same dead `babel-runtime/regenerator` patch as
  `sdp-client-browser/src/shim.js` — emptied the same way.
- `test/workspaceActions.spec.js`, `test-func/0-fs.spec.js`,
  `test-func/pageObject.js`: chai fixed to default-import +
  destructure (same `cjs-module-lexer` gap as every other chai usage
  in this migration); `__dirname` fixed via
  `fileURLToPath(import.meta.url)` (real ESM test files now);
  `pageObject.js` itself converted from plain CommonJS
  (`require`/`module.exports`) to real ESM — it has no import/export
  syntax of its own, so it would otherwise hit the same "require is
  not defined" failure documented for `shim.js`-style files elsewhere
  in this migration, just discovered via Node directly instead of
  webpack.

**What was verified, given the sandbox couldn't run real Electron:**
`babel` compile of `src/app`/`src/shared` (clean, plus `node --check`
passing on every output file), `webpack --config webpack.config.cjs`
(0 errors, 22 pre-existing warnings — same dead-feature warnings
documented for `sdp-client`/`sdp-client-browser`), and the stand-in
binary + `yarn test-func` both running cleanly through 100% of the
reachable module-resolution graph before hitting the confirmed-
pre-existing Electron-launch wall. **This should be re-verified with
real Electron (a proper desktop/CI environment) before merge** — build-
and module-resolution-level correctness is confirmed, but no actual
GUI interaction was observed for this package, unlike `sdp-client`/
`sdp-client-browser` where a real browser was available.

## Migration complete

All packages in the monorepo have been converted from CommonJS to
ESM. Every package's own test suite passes at its baseline count
(with the `sdp-client-electron` exception above, blocked purely by
sandbox tooling, not code correctness), and both GUI applications were
build-verified; `sdp-client-browser` was additionally verified via a
real browser launch. Remaining open items are tracked below (ReScript
output extension convention) and further down (`ramda-fantasy`
follow-up) rather than blocking this migration.

## Explicitly not decided yet

- Whether ReScript's `esmodule` output should use `.mjs` or `.js` +
  `package.json` `"type": "module"` — pick one and apply consistently.
- Whether to convert all 123+ require() sites mechanically in bulk per
  package, or file-by-file with test runs in between. Given how many subtle
  bugs the mechanical `.re`→`.res` converter introduced in the ReScript
  migration, bulk-then-verify is lower risk with a good test net; file-by-file
  is lower risk without one. Decide per-package based on existing test
  coverage.

## Follow-up (separate effort, not part of this migration)

`ramda-fantasy` is unmaintained (last real release years ago). Worth
replacing at some point — **Fluture** is the better target over Sanctuary or
Folktale: the codebase already leans Sanctuary-style (`sanctuary-def`,
`hm-def`), and Fluture is actively maintained, Sanctuary-compatible, and its
`Either`/`Maybe`-shaped `Result` needs minimal API churn versus what
`sdp-func-tools/src/monads.js` currently wraps. Folktale is also abandoned,
so it doesn't solve the actual problem.

Do this **after** the ESM migration finishes, as its own effort — don't mix
module-format churn with monad-library churn in the same PRs, especially
under the 250 LOC/PR cap. `ramda-fantasy` usage is currently isolated to a
handful of `import`/destructure sites (see item 6 in the Phase 1 findings
above for the current list: `errors.js`, `typeUtils.js`, `monads.js`, plus
test files) — that isolation is itself a byproduct of the ESM conversion's
import-fixing pass, so re-grep for full usage before starting rather than
trusting this list, since more packages will have gone through the same
conversion by then.
