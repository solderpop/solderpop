# Branch changelist — feature/general-improvements

## 2026-09-03 — React 19 migration: phases 7 and 8 finished (all 8 phases done)

Continuation of the same day's crash-fixing work, on a new branch
(`feature/migrate-to-react-19`, checkpointed off `feature/complete-rewrite`
so that branch stays a known-working reference point). Closed out the two
remaining phase-7 items and all of phase 8:

- `react-contextmenu`: no rewrite needed. The plan's original "replace it"
  call was based on its abandoned status and React-16-capped peer dep
  alone, written before this branch's read-the-actual-source-first
  discipline had been applied to it. Its Trigger/Menu components are
  plain ES6 classes using a `ref` callback (not `findDOMNode`) and a
  `window.dispatchEvent(CustomEvent)`/`addEventListener` pair for
  cross-component communication -- no hooks, no Context, nothing React 19
  removed. Confirmed with a real mount-and-open test
  (`test/reactContextmenu.spec.js`), not just source-reading.
- `rc-menu`'s `rc-trigger` dependency: 2.6.5 -> 5.3.4 (its confirmed
  `findDOMNode` submenu-positioning crash), plus patching two *more*
  `findDOMNode` calls already present in rc-menu's own code that a real
  test (not just a clean build log) caught underneath the rc-trigger fix.
- `react-autosuggest`: one deprecated-lifecycle warning, patched via
  `pnpm patch`.
- `react-custom-scroll`: three real `findDOMNode` crashes, patched via
  `pnpm patch` (caught and fixed a mistake in the first attempt at this
  patch by re-checking the edited file, not assuming a text substitution
  was correct just because it applied cleanly).

Full technical detail for each in `docs/react-19-migration-plan.md`'s
phase 7/8 write-ups. Final state: full build 18/18 with zero warnings at
all (confirmed by grepping a `.turbo`-cache-cleared rebuild directly),
lint clean, `sdp-client` unit suite 108/109 (same 1 pre-existing
unrelated failure tracked since the react-dnd work). The React 16 -> 19
migration is complete.

## 2026-09-03 — React 19: fixed every crash found by actually running the app

The React 16->19 migration (`docs/react-19-migration-plan.md`, phases 1-6)
had been verified by build/lint/test alone, since this sandbox can't run
Electron's GUI. Running the built app surfaced a chain of real, sequential
hard crashes the automated checks couldn't catch -- fixed one at a time,
each verified, each pulling forward the corresponding not-yet-started
phase-7 item since no partial fix was possible:

- `react-dnd` 2.5.1 -> 16.0.1 (HOC API removed; the app's legacy-context
  manager lookup was fully removed in React 19) -- plus a stale
  `this.appRef.refs.wrappedInstance` in `Catcher.jsx` this crash was
  masking.
- `react-sortable-hoc` -> removed, replaced with `@dnd-kit` (`Tabs.jsx`
  only) -- `ReactDOM.findDOMNode`, removed in React 19.
- `react-hotkeys` -> removed, replaced with `react-hotkeys-hook` + a new
  shared `HotkeysScope` component (14 files across `sdp-client` and both
  platform packages) -- same `findDOMNode` removal.
- A `React.memo`-drops-`defaultProps` bug (not React-19-specific, just
  never hit until the above crashes stopped blocking render) in
  `NodesLayer.jsx`/`CommentsLayer.jsx`/`DebuggerTopPane.jsx`.
- Deprecated-lifecycle and `element.ref` console warnings in vendored
  `rc-menu`, `react-remarkable`, and `react-skylight` (renamed to their
  `UNSAFE_`-prefixed equivalents; the latter two via `pnpm patch`).
- reselect v5's new dev-only input-stability check flagging this
  codebase's routine `ramda-fantasy` `Maybe`/`Either` selector outputs
  (never referentially stable by design) -- disabled via reselect's own
  `setGlobalDevModeChecks`.
- A real CSS specificity bug (not a JS/reducer bug, despite looking like
  one for several rounds of remote debugging): react-reflex's own
  stylesheet has `.reflex-container .reflex-element > div { display:
  block; ... }`, which is more specific than `.AttachmentEditors.hidden
  { display: none; }` alone (2 classes + 1 type selector beats 2
  classes), so the "hidden" attachment-editor panel stayed visible and
  reserved layout space whenever a patch tab had none open. Fixed with
  `!important` (an existing pattern elsewhere in this codebase for
  exactly this "must always win" case), plus made the panel's visibility
  derive directly from the same tab data used to render its content
  instead of a separately-computed flag.
- Also hit and fixed along the way: `sdp-client`'s `index.js` exports
  both a set of named re-exports and a separately-hand-assembled default
  object that both platform packages actually consume (`import client
  from 'sdp-client'`) -- `HotkeysScope` was only added to the former,
  so `client.HotkeysScope` was `undefined` (a hard crash rendering
  `<App>`) until added to both.
- A `.turbo` cache (921MB, accumulated across this session's many
  rebuilds) silently served a stale `bundle.js` to `pnpm start` even
  after full app restarts and confirming the fix was correct on disk --
  `turbo`'s `start` task depends on `build`, and a cache hit skips
  rebuilding entirely. Cleared it and rebuilt clean once the pattern was
  identified; worth remembering if "I rebuilt and restarted but it's
  still old" ever recurs.

Full technical detail (root causes, exact fixes, verification) for each of
these is in `docs/react-19-migration-plan.md`'s phase 7 write-up, not
duplicated here. Remaining on that plan: `react-contextmenu` replacement
(7 files) and phase-8 vendored-package warnings.

## 2026-09-01 — Security: 9 -> 1 `pnpm audit --prod` vulnerabilities

Also checked whether `feature-rebrand-continuation` (the `xodc`->`sdpc`,
"SolderPop IDE" title, `PopupAbout` branch) had anything left to bring
over first -- dry-ran the merge, then cherry-picked its actual rebrand
commit (`56b5f665`) to check. Turned out to be a no-op: every piece of it
is already present on this branch, done independently. Aborted cleanly
(`git reset --merge HEAD`), nothing to commit. That branch's only
remaining unique value is its own parallel ReScript 12 / webpack 5 /
mocha 11 migration -- a full reconciliation, not attempted here.

**`cpx` -> `cpx2`** (`sdp-cli`, `sdp-client-electron`, `sdp-deploy-bin`,
`sdp-deploy`): the original `cpx` was abandoned at 1.5.0 on an ancient
`chokidar` that pulled in vulnerable `micromatch`/`braces`/
`decode-uri-component` transitively (moderate ReDoS + high resource-
exhaustion). `cpx2` is the maintained fork, same CLI binary name (`cpx`)
and same flags, so no script changes needed -- verified with a full
`pnpm run build` (18/18) after the swap.

**`sdp-deploy`'s dependencies**, all years-stale:
- `ws` (^3.1.0) was a dead direct dependency -- grepped the whole package,
  not referenced anywhere except as a substring of a `wss://` URL
  constant. Deleted outright; removes 2 high-severity DoS CVEs for free.
- `node-fetch` ^1.7.2 -> ^2.7.0 (patches a secure-header-forwarding leak).
  Usage is a bare `fetch(url).then(res => res.body.pipe(...))`, stable
  across that range -- no code change needed.
- `extract-zip` had an unpatched symlink path-traversal CVE
  (GHSA-jmr9-qjv8-65gv, "Patched versions: None" even at its latest
  2.0.1) -- and its one call site (`unzip.js`, used by `libraryManager.js`
  to unpack downloaded Arduino libraries) is real attacker-reachable
  surface, not theoretical: a malicious library zip is exactly the kind
  of input this code processes. Replaced with a small hand-written
  extractor on top of `yauzl` (extract-zip's own zip-reading engine,
  still maintained) that rejects any entry resolving outside the target
  directory and rejects symlink entries outright rather than following
  them. Verified against 3 hand-built zips: a normal nested-directory
  archive (extracts correctly, root dir name still detected the same
  way), a `../../pwned.txt` path-traversal entry (rejected -- caught by
  `yauzl` itself before even reaching this code's own directory check),
  and a crafted symlink entry via Python's `zipfile` module with a
  synthetic Unix `external_attr` (rejected by this code's own symlink
  check). Also ran the real `test-func/libraryManager.spec.js` suite
  (3/3) to confirm the actual download-and-unzip flow still works
  end-to-end.

**pnpm overrides** (`pnpm-workspace.yaml`) for two vulnerabilities with no
direct dependent worth touching:
- `cross-spawn` -> `^7.0.6` (ReDoS fix), pulled in via `sdp-deploy`'s
  `child-process-promise`, itself capped at its latest release.
- `node-fetch` -> `^2.7.0` again, this time for the transitive chain
  through `sdp-client`/`sdp-client-browser`'s `react-event-listener` and
  `recompose` (both actively used, both long-abandoned React HOC-era
  libraries -- replacing them outright is real work that belongs with
  the upcoming React 16->19 migration, not bundled in here).

**Left as accepted risk, 1 remaining**: `ip`'s SSRF-classification bug in
`isPublic()` (GHSA-2p57-rm9w-gvfp), pulled in via `sdp-tethering-inet` ->
`internet-available` -> `dns-socket` -> `dns-packet`. No patched version
exists at all (confirmed `ip@2.0.1` is latest and still flagged). Checked
the actual call site: `internet-available` is invoked as a bare
connectivity check with no attacker-influenced IP input anywhere in this
codebase's usage, so the vulnerable code path isn't reachable here.
Documenting rather than forcing a replacement of `internet-available`
(itself a single-purpose, single-version package) for an unreachable bug.

**Verified**: `pnpm audit --prod` before/after: 9 vulnerabilities (7
high, 2 moderate) -> 1 (high, accepted-risk only). Full repo `pnpm run
build` (18/18) and `pnpm run lint` clean. `sdp-client` (104/104), `sdp-fs`
(52/52), and `sdp-deploy`'s `test-func/libraryManager.spec.js` (3/3) all
still pass.

## 2026-09-01 — Default workspace directory `~/xod` → `~/sdp`

Left out of the file-format rename above deliberately (it's a directory
*location*, not a format identifier), but asked for explicitly once the
format rename surfaced it. `DEFAULT_WORKSPACE_PATH` in
`sdp-fs/src/constants.js`: `'~/xod'` → `'~/sdp'`.

No `electron-settings` file existed on disk to migrate (confirmed by
checking `~/.config/sdp-client-electron/` directly) -- this machine has
never gone through a "switch workspace" UI flow, so every launch has
always resolved through the code default. That meant this was just the
constant plus physically moving the real directory: `mv ~/xod ~/sdp`
(already carrying the auto-migrated `.sdp-workspace` marker from the fix
above).

Verified directly against the rebuilt `dist`: `ensureWorkspacePath('')`
(simulating "no configured value") resolves to `/home/mikkel/sdp`, and
`isWorkspaceValid` on that path succeeds. `sdp-fs` suite still 52/52,
lint clean. Rebuilt `sdp-client-electron`'s GUI bundle.

## 2026-09-01 — Two follow-ups from real-world use of the rename

Caught by actually running the Electron app, not by the test suites.

**`Icon.jsx` missing `import React`**: a leftover gap from the earlier
`react-fa` → `@fortawesome/react-fontawesome` migration this session --
the file uses JSX (classic transform, this codebase is still on React 16)
but never imported `React`, so every render threw `ReferenceError: React
is not defined`. One-line fix.

**Workspace auto-migration for pre-rename workspaces**: chose "clean
break" for the XOD→SDP file-format rename above on the assumption nothing
real existed in the old format yet -- wrong assumption. My own dev
workspace at `~/xod` already had a real `.xodworkspace` marker (created
2026-08-25, well before this session), and `isWorkspaceValid` correctly
but unhelpfully treated it as "directory not empty, no valid marker" and
refused to auto-create a new one -- by design, it only auto-spawns into an
*empty* directory, never silently overwrites a non-empty one. Every
existing local workspace on any dev machine would hit the exact same
silent wall with no guidance on what to do.

Added `LEGACY_WORKSPACE_FILENAME` (`.xodworkspace`) to
`sdp-fs/src/constants.js` and a `migrateLegacyWorkspaceFile` check inside
`doesWorkspaceFileExist` (`sdp-fs/src/utils.js`): if the new
`.sdp-workspace` marker is missing but the old one is present, write the
new one alongside it (old one left in place, harmless) and treat the
workspace as valid. One-time, transparent, no user action needed --
`isWorkspaceValid` is the single choke point both `sdp-cli` and
`sdp-client-electron` call through, so both pick this up for free.

Verified: deleted the marker I'd manually created for `~/xod` earlier,
reran `isWorkspaceValid` directly against the dist build, confirmed it
auto-wrote `.sdp-workspace` from the pre-existing `.xodworkspace` and
resolved valid. `sdp-fs` test suite still 52/52. Rebuilt
`sdp-client-electron`'s GUI bundle for both fixes.

## 2026-09-01 — Rename XOD file-format identifiers to SolderPop

File-format identifiers only (scoped deliberately, not a full XOD→SDP
sweep -- that's a separate, larger effort already underway on
`feature-rebrand-continuation`, which renamed the `xodc`→`sdpc` CLI and
window title but never touched the file formats themselves):

- `.xodball` (packed single-file project) → `.solderball`
- `patch.xodp` (per-node-type patch file) → `patch.sdpp`
- `project.xod` (multifile project manifest) → `project.sdp`
- `.xodworkspace` (workspace marker file) → `.sdp-workspace`

Clean break, no dual-read of the old extensions -- pre-1.0, no real user
projects saved in the old format yet.

**Code changes**: `sdp-fs` (`constants.js`, `find.js`, `load.js`, `save.js`,
`unpack.js`, `loadLibs.js`, `utils.js`, `errorCodes.js`, `index.js` --
`getPathToXodProject`→`getPathToSdpProject`, `TRIED_TO_OPEN_NOT_XOD_FILE`→
`TRIED_TO_OPEN_NOT_SDP_FILE`, `saveProjectAsXodball`→
`saveProjectAsSolderball`); `sdp-project` (`src/xodball.js` renamed to
`src/solderball.js`, its four exports renamed
`fromSolderball(Data(Unsafe))`/`toSolderball`, `built-in-patches.xodball`
renamed to `built-in-patches.solderball` and `tools/loadBuiltinPatches.cjs`
updated to match); `sdp-pm`, `sdp-cli`, `sdp-client-browser`,
`sdp-client-electron` (incl. `nativeDialogs.js`'s save/open dialog filters
and `package.json`'s `fileAssociations`), `sdp-arduino`, plus every test
file referencing these fixtures across `sdp-fs`, `sdp-project`, `sdp-pm`,
`sdp-cli`, `sdp-patch-search`, `sdp-client`, `sdp-client-electron`.

**Data files renamed to match**: 93 tracked test fixtures outside
`workspace/`, plus all 766 real files under `workspace/` (the bundled
demo/tutorial projects) -- extensions only, file *content* untouched (node
types like `xod/core/led` are the stdlib namespace, explicitly out of
scope here).

**Bugs found via full test-suite verification, not just a read-through**:
- `sdp-cli/src/messages.js` still had the formatter keyed under
  `TRIED_TO_OPEN_NOT_XOD_FILE` after `baseCommand.js`'s error code moved to
  `TRIED_TO_OPEN_NOT_SDP_FILE` -- every "invalid path" error was hitting
  oclif's "error has no formatter, which is a bug" fallback instead of the
  real message. A blind text-substitution pass doesn't catch a bare `XOD`
  substring (only `xodball`/`xodp`/`xodworkspace` were swept mechanically);
  this one needed the full grep-and-read pass to surface.
- `sdp-cli`'s `bundle/` directory (gitignored, populated by `cpx` from
  `workspace/` and `sdp-tabtest/workspace/`) was stale from before the
  rename -- `cpx` only overlays, it doesn't delete files that no longer
  exist at the source, so the old `.xodworkspace`/`project.xod`/`.xodp`
  files were still sitting there right next to nothing (renamed source
  files don't produce old-named copies, they just vanish from the diff).
  Wiped and rebuilt clean via `build:workspace`/`build:tabtestWorkspace`.
- `sdp-fs`, `sdp-pm`, `sdp-arduino`, `sdp-cli` all publish through a
  committed `main` pointing at a gitignored `dist/`/`lib/` babel build
  output -- stale builds from before the rename were still exporting the
  old names (`getPathToXodProject`, etc.), causing `sdp-arduino`'s test
  suite to fail with `could not find project directory... must contain
  "project.xod" file` even though the actual source and fixtures were
  already renamed. Rebuilt all four.

**Verified**: full test suites for `sdp-fs` (52/52), `sdp-pm` (6/6),
`sdp-client` (104/104), `sdp-arduino` (47/47) all pass. `sdp-cli`'s
non-hardware `test-func` specs (resave/tabtest/transpile): 44/46 pass --
the other 2 fail on a pre-existing vendored-catch2-vs-modern-glibc C++
compile error (`sysconf` not `constexpr`-usable), confirmed via direct
compiler output, unrelated to this rename. `sdp-project` (476/480) and
`sdp-patch-search` (12/16) each have pre-existing failures traced via `git
log` to files untouched since the base `e39bc6f4` modernization commit --
schema/fixture drift in `flatten.spec.js` and `fuse.js`-version-dependent
search-ranking flakiness, respectively, neither touched by this change.
`sdp-client-electron`'s `electron-mocha` suite can't run at all in this
headless sandbox (documented pre-existing limitation, see the
`documentation`-migration entry above). Full repo `pnpm run build`
(18/18) and `pnpm run lint` (clean after an auto-`--fix` pass for
prettier line-wrap churn from `xodball`→`solderball` making lines longer)
both pass.

## 2026-09-01 — Storybook 3 → 10 (deprecated-dep migration, item 5 of 5): `sdp-client`

**Last item on the original deprecated-dependency list.** Checked the
React-version wall first, given `react-fontawesome` hit one earlier this
branch: `@storybook/react`'s peer range at v9 *and* current v10 both
explicitly include `^16.8.0` alongside 17/18/19 -- no forced React upgrade
needed here, unlike that earlier case. Went straight to the latest
(`10.5.10`) rather than stopping at v9.

**Scope**: `.storybook/config.js` (old `configure()` + manual
`require.context` auto-loader, removed in v6+) and `.storybook/webpack.config.js`
(merged into a package.json-external file, pre-`main.js` era) replaced by a
single ESM `.storybook/main.js`. All 17 story files (1412 lines) rewritten
from the `storiesOf('Name', module).add('variant', fn)` API (fully removed
in v7+) to CSF3 (`export default {title}` + one named export per story).

**Real API/behavior changes hit, not just mechanical renames:**
- **Compiler addon required.** `@storybook/react-webpack5` no longer
  bundles a JSX transform itself since v8ish -- needed
  `@storybook/addon-webpack5-compiler-babel` explicitly (chose Babel over
  SWC since this package already has a working `.babelrc` with
  `preset-react`; no reason to introduce a second JS-compiler toolchain).
  Without it: `Module parse failed: Unexpected token` on the very first
  JSX line in any story.
- **Story indexer requires the `.stories.` naming convention**, not just
  any file the `stories:` glob happens to match. `stories: ['../stories/**/*.jsx']`
  loaded the files fine but the indexer itself threw `Invariant failed: No
  matching indexer found` for each one -- confirmed by testing a single
  converted file this way before committing to renaming all 17. Renamed
  every file to `*.stories.jsx` and pointed the glob at that pattern
  instead of fighting the indexer with the old flat name.
- **`main.js` must be real ESM**, not `module.exports`/`require()` --
  `sdp-client`'s `"type": "module"` applies to `.storybook/` too. First
  draft (CommonJS) threw `ReferenceError: module is not defined in ES
  module scope`.
- **Per-story decorators, not just file-level ones.** `Debugger.jsx`'s old
  version created *six separate* `storiesOf('Debugger', module)` calls,
  each with its own Redux store (one seeded "uploading", one "failed", one
  with a live `setInterval` streaming fake log messages, etc.) and its own
  `.addDecorator()` wrapping that specific store's `<Provider>`. CSF3's
  `decorators` on the default export apply to *every* story in the file
  uniformly, which can't express "story A needs store A, story B needs
  store B." Used CSF3's alternate story-object form instead (`export const
  X = { decorators: [...], render: () => ... }`) to give each of the 6
  variants its own store-scoped decorator, matching the original's actual
  behavior exactly rather than collapsing them into one shared store.
- `postcss-loader`'s old `plugins: (loader) => [...]` function form (from
  the removed `webpack.config.js`) is gone -- current API is
  `postcssOptions: { plugins: [...] }`, matching what the rest of this repo
  already uses elsewhere (`sdp-client/webpack.config.cjs`).
- The old `webpack.config.js` also had a dead `font-awesome` asset rule
  (same package removed from `sdp-client` entirely during the `react-fa`
  migration earlier this branch) -- dropped rather than ported forward.
  `file-loader`-based asset handling replaced with webpack5's built-in
  `type: 'asset/resource'`, matching the same modernization already done
  in the main app's own webpack config.
- `esbuild` (pulled in by Storybook's own toolchain) needed a
  `pnpm-workspace.yaml` `allowBuilds` entry for its standard
  platform-binary-selection postinstall -- same class of approval as
  `puppeteer`/`bs-platform` elsewhere in this file, verified by reading its
  actual `package.json` script before approving.

**One incidental typo fix**: `Modals.jsx`'s `'with mixed conntent'` story
name (a typo in the original) became the export `WithMixedContent` rather
than preserving the misspelling in a newly-written identifier.

**Payoff, concretely measured**: this was the other live source of
`babel-core@6` in the lockfile (alongside `documentation`, fixed earlier
today) -- `@storybook/react@3.4.12`'s own bundled `babel-loader@7`/
`babel-register@6`/etc. Confirmed `babel-core@6` is now at **zero**
occurrences in `pnpm-lock.yaml` (was 6 before this fix), and the lockfile
shrank by ~2700 lines (28625 → 25894). This repo's dependency tree is now
genuinely Babel 7/8 only, matching what should have been true after the
ESM migration but wasn't until both this and the `documentation` fix
landed today.

**Verification**: ran the real dev server (`pnpm run storybook`, not just
`pnpm run build`) with all 17 converted files in place -- `index.json`
shows all 55 stories across all 17 titles indexed with zero errors;
spot-checked rendering via `iframe.html?id=...` for `Button`, `Debugger`
(the redux/per-story-decorator one), `Inspector` (the ramda one), and
`Modal (SkyLight)` -- all HTTP 200, webpack compiled with zero warnings
(grepped the full log for `error|warning`, only hits were plugin names
containing the word). Then full `pnpm run build` (18/18) and `pnpm run
lint` (clean) to confirm the rest of the monorepo is unaffected.

**With this, the original 5-item deprecated-dependency list from this
branch's initial audit is complete**: eslint 8→9, `react-fa`→
`@fortawesome/react-fontawesome`, oclif v1→v4 (+ full `@oclif/test`
rewrite), puppeteer 1.x→25.x, Storybook 3→10. Plus two items found and
fixed along the way that weren't on the original list: `documentation`
v4→v14 and this migration itself surfacing as "the other Babel 6 source."

## 2026-08-31 — `documentation` v4 → v14: last Babel-6 source outside Storybook

Found while investigating why `pnpm-lock.yaml` is ~28k lines: it's mostly
proportional to a genuinely large, mixed-vintage dependency graph (5832
distinct resolved package@version entries across 19 packages spanning
Babel 6/7/8 side by side) -- `pnpm dedupe` only shaved 29 lines, confirming
there was no real waste sitting there, just real duplication from packages
genuinely needing different majors of the same transitive dep. Traced one
concrete example: `babel-core@6.26.3` (and its whole `babel-preset-es2015`/
`babel-generator`/`babel-traverse`/etc. entourage) turned out to be pulled
in entirely by `documentation@4.0.0-beta12` (root devDependency, powers the
three `doc` scripts in `sdp-arduino`/`sdp-project`/`sdp-func-tools`) --
`documentation`'s own bundled Babel 6 toolchain, unrelated to anything this
repo's own build/test code uses.

**Fix**: bumped `documentation` to `^14.0.3` (10 majors, but confirmed via
`--help` that `build`'s CLI flags -- `--format`, `--output`, `--sort-order`
-- are unchanged) at root, and in `sdp-project`'s own `package.json` (which
redundantly declared it directly, matching the "each package needs its own
copy of what its own scripts call" pattern this whole branch runs on).
`sdp-arduino`/`sdp-func-tools` don't declare it themselves and resolve it
via the same root-hoisted-through-PATH mechanism as `rimraf`/`cpx`
elsewhere in this changelist.

**Real CLI-behavior break found running it for real, not just installing
it**: `--sort-order` changed from a single-string flag to an
array-accepting one (`--choices: source, alpha, kind, access, memberof`,
now `[array]`). yargs' array flags greedily consume every following
token until the next recognized `--flag` -- so the existing script shape
(`--sort-order alpha src/`) silently swallowed the `src/` input path *into*
the sort-order array, producing `Invalid values: Argument: sort-order,
Given: "src/"`. Using `--sort-order=alpha` didn't help (same greedy
consumption regardless of `=` vs space) -- the actual fix was reordering
the positional input before the array flag: `documentation build src/
--format html --output doc --sort-order alpha`.

**Bonus finding for the next migration**: `@storybook/react@3.4.12` is the
*other* live source of `babel-core@6` in the lockfile (its own
`babel-loader@7`/`babel-register@6`/etc.) -- finishing the pending
Storybook 3 → 9 migration will fully retire Babel 6 from this repo, not
just from `documentation`.

**Verification**: ran `doc` for real in all three affected packages
(`sdp-func-tools`, `sdp-project`, `sdp-arduino`) -- each produced real
`index.html`/`assets` output, cleaned up after. Full `pnpm run build`
(18/18) and `pnpm run lint` (clean).

## 2026-08-31 — puppeteer 1.x → current (deprecated-dep migration, item 4 of 5): `sdp-client-browser`

**Scope, as it turned out:** the actual puppeteer API surface needed almost
no changes (only `page.waitFor()` → `page.waitForSelector()` in
`benchmark/index.js`, plus an `__dirname`-in-ESM fix in the same file). The
real work was getting `sdp-client-browser`'s test-func harness to boot at
all -- it hadn't run successfully in a long time, for reasons entirely
unrelated to puppeteer's version.

**Bug 1 -- Babel 7-vs-8 collision, root cause found (unlike the earlier,
abandoned belt-holes/sdp-tethering-inet investigation of the same
symptom):** `sdp-client-browser` never declared its own `@babel/register`
dependency (only its siblings `sdp-client`/`sdp-client-electron` do, both
pinned `^7.29.7`) -- `tools/babel-register.js`'s `require.resolve` walked
past it to whichever `@babel/register` happened to be reachable elsewhere
(a `^8.0.1` copy), which then collided with this package's actual
`@babel/core@^7.29.7`/`@babel/preset-react@^7.29.7`. Same missing-own-
dependency bug class as everything else in this changelist. Tried adding
the missing dependency -- fixed the version error, but a *second*,
different failure appeared underneath it.

**Bug 2 -- structural, not fixable by config:** even with correct Babel
versions, mocha's own `require(file)`-then-`import()`-fallback loading
(added specifically so it can load ESM test files via Node's newer
`require(esm)` support) doesn't correctly fall back when
`@babel/register`'s pirates hook is also installed -- confirmed via a
deliberately-broken preset name in a new `.babelrc`, which produced the
*exact same* error, proving Babel's transform was never even being
consulted; Node's own module-syntax auto-detection was bypassing it
entirely. Then confirmed the reverse: running the exact same mocha command
with `--require .../babel-register.js` **removed** loaded the file
correctly via Node's native ESM path with no error at all. **Root
finding:** this test suite's `.js` files are plain modern JS (no JSX, no
old syntax) -- Node 24 can run them directly, and `babel-register` was
never actually necessary here, just present by convention (copied from
sibling packages that *do* need it for JSX). Removed
`--require ../../tools/babel-register.js` from the `test-func` script
entirely, and the now-unused `.babelrc`/`@babel/register` devDependency
added for bug 1's fix.

**Bug 3 -- `tools/staticServer.js`'s CJS→ESM interop**: `copy-save.spec.js`
imported `SERVER_URL` from `../tools/staticServer.js` (a CommonJS file,
`module.exports = {...}`), which Node couldn't expose as a clean named
export. The *real* source of truth for `SERVER_URL` is
`test-func/server.config.js` (plain ESM, used correctly everywhere else,
including `bootstrap.js`) -- computes the identical value. Fixed by
importing from the right file instead of patching the CJS interop.

**Bug 4 -- `webpack-dev-server` v3 (implicit, pre-v4-era API) → v6, in
`bootstrap.js`**: `new WebpackDevServer(compiler)` (one arg) →
`new WebpackDevServer(devServerOptions, compiler)` (options first); the
callback-based `server.listen(port, host, cb)` was removed in v4+, now
`await server.start()`; `compiler.plugin('done', fn)` (webpack 3-era) →
`compiler.hooks.done.tap('onDone', fn)` -- the file's own comment already
flagged this exact line as needing the update "after upgrading webpack to
version >4," which had already happened without this file being touched.
`server.close(cb)` → `await server.stop()` in the `after()` cleanup too.

**With all four of the above fixed, the harness boots completely**:
webpack compiles, the dev server serves the bundle, puppeteer launches and
navigates. At that point, with the *old* puppeteer 1.20.0 still installed,
every test timed out waiting for `.Workarea` to appear -- diagnosed with
temporary `page.on('console'/'pageerror')` listeners (removed after):
`PAGE ERROR: SyntaxError: Unexpected token '.'`. Puppeteer 1.x bundles a
~2018-era Chromium that can't parse the modern JS (almost certainly
optional chaining) in today's webpack output -- direct confirmation that
upgrading puppeteer was the correct next step, not a wasted one.

**The actual bump**: `puppeteer` was a *root* devDependency
(`^1.20.0`) despite being used only by `sdp-client-browser` (test-func +
`benchmark/index.js`) -- moved it to where it's actually used, at
`^25.9.0`. `pnpm install` downloaded a modern bundled Chrome (152.x)
automatically (already allowed via `pnpm-workspace.yaml`'s `allowBuilds`).
Left `tools/screenshot-xodball` alone -- it's already-dead, pre-rebrand
tooling (imports `xod-client-browser`, a package name that hasn't existed
since the rename), unrelated to this migration.

**Verification, and the real remaining gap**: reran the suite with modern
puppeteer -- the `SyntaxError` is gone, but `.Workarea` still times out.
Re-diagnosed with the same console/pageerror listeners: `PAGE ERROR:
require is not defined`, plus ~173 webpack build warnings like `export
'HintWidget' was not found in './inspectorWidgets/index.js' (module has no
exports)`, `export 'bindApi' was not found in '../modeUtils.js'`, etc. --
despite the *actual* source files genuinely exporting those names (checked
directly). This is **not** a puppeteer problem and not the regular app
build (which is warning-free -- confirmed throughout this whole session).
It traces to `webpack.config.test.cjs`'s `expose-loader` setup, which
generates test-only "`-exposed.jsx`" wrapper files (visible throughout the
warning stack traces) to expose internal React components globally for
puppeteer to drive directly -- and that mechanism appears to have its own,
separate, pre-existing bug making it see stale/empty exports for some
files. **Not investigated further this session** -- puppeteer itself is
fully migrated and verified (modern Chrome, zero deprecated API, harness
boots end-to-end); this is a distinct, real bug in test-only
infrastructure that deserves its own investigation, the same way the
Babel collision got one instead of being bundled into "puppeteer work."

**Verification**: `pnpm run build` (18/18), `pnpm run lint` (clean, after
autofixing the same class of stale-comment/formatting nits as the rest of
this branch). Full `pnpm run test-func` run: harness boots, dev server
serves, browser launches and navigates -- confirmed via direct
reproduction that the remaining failure is the `expose-loader` issue
above, not anything puppeteer-, Babel-, or webpack-dev-server-related.

## 2026-08-31 — Housekeeping: trimmed over-long comments, root `electron`, dropped debug debris

Before staging today's work, user asked for a pass over the still-unstaged
files: shorter comments where the reasoning was over-explained, and one
real design change reconsidered.

- Trimmed the `listr.js`, Electron-ESM-import (`main.js`,
  `migrateArduinoPackages.js`, `subscribeIpc.js`), `pnpm-workspace.yaml`,
  and `test-func/helpers.js` comments down to one or two lines each — same
  facts, no change in behavior.
- **`tools/match-node-version-to-electron.js`**: reverted the path-resolve
  workaround. User's call: just add `electron` as a root devDependency
  (pinned to the same exact `43.4.0` as `sdp-client-electron`) instead of
  reading its installed copy through a resolved path. Script is back to
  the original one-line `require('electron/package.json').version`.
  Re-verified: script now runs past the import (reaching the same
  pre-existing, unrelated `electron-releases` API gap noted earlier).
- Deleted `packages/sdp-cli/undefined/` — debris from an earlier manual
  debugging session (the `process.env` string-coercion bug wrote real
  files into a literal `undefined/` directory via a repro run); had been
  accidentally staged.

Rebuilt (18/18), relinted (clean), reran the `listr.js`-exercising tests
(`resave`/`transpile`, 30/30) to confirm none of this changed behavior.

## 2026-08-31 — `@oclif/test` v1 → v4: `sdp-cli`'s test-func suite (completed)

**Follow-up to the "partial" entry below** — user asked to finish all 7
remaining spec files, verifying the 4 that don't need real hardware.
Converted `resave.spec.js`, `transpile.spec.js`, `tabtest.spec.js`, and
`publish.spec.js` to the `runCommand()` API (same mechanical pattern as
`help.spec.js`: fluent `.command().it()` chains → `it(desc, async () => {
const {stdout, stderr, error} = await runCommand([...], {root}); ... })`).

**Three more real bugs found, all only visible by actually running the
converted tests, not just reading the diff:**

1. **The test files' own `process.exit` mock never worked, at any oclif
   version.** `baseCommand.js` and all 8 commands call Node's raw
   `import { exit } from 'process'; ...; return exit(255);`. The spec
   files' `beforeEach`/`afterEach` reassigning `process.exit = (code) =>
   {...}` cannot intercept this: a named import from a built-in module
   captures the function reference at import time, not a live binding.
   Proved this with a minimal standalone repro (two-file ESM script,
   `import {exit} from 'process'` in one, reassignment in the other) —
   the mock function never runs, the real process actually exits. This
   was silently killing the whole mocha process the instant a real (non-
   help/version) command ran. **Fix, per explicit direction from the
   user** (chosen over spawning a real child process per test, or leaving
   it as a blocker): refactored `baseCommand.js` and all 8 command files
   to call `this.exit(code)` (oclif's own `Command#exit`, confirmed by
   reading `@oclif/core`'s actual installed source: it just does `throw
   new ExitError(code)`) instead of the raw `process.exit`. This is a
   genuine, deliberate design property of oclif's own API — throwing
   instead of hard-exiting is exactly what makes a command's exit path
   testable in-process at all.

2. **That refactor immediately exposed a second, real bug**: every one of
   the 8 commands' `getListr(...).run().then(() => this.exit(0)).catch(
   (err) => { ...; return this.exit(100); })` chains (`boards.js` and
   `install/arch.js` use the try/catch equivalent) had their trailing
   `.catch()`/`catch{}` **catch their own success exit**. Under the old
   real-`process.exit()` behavior this was invisible — the process died
   before the `.catch()` could ever see it. Once `this.exit(0)` throws
   instead, that throw is exactly what a `.catch()` placed right after a
   `.then()` will catch, turning every successful run into a reported
   failure (`this.printError` given an `ExitError` it can't format, then
   re-exiting with code 100 instead of 0). `publish.js` had this twice —
   an inner one too, inside `publishLibraryTask`'s own nested chain,
   which additionally risked *re-wrapping* the ExitError as a bogus
   `PUBLISH_POST_LIBVERSION_OTHER_ERROR`. Fixed with an explicit guard as
   the first line of each catch: `if (err.oclif?.exit !== undefined)
   throw err;` — recognize an already-intentional exit and let it
   propagate, rather than reprocessing it as a real failure.

3. **A genuine, pre-existing bug in this project's own `src/listr.js`**,
   surfaced by `runCommand()`'s `captureOutput` swapping
   `process.stdout.write` per test (something the old fluent API's mock
   apparently didn't do in a way that exposed this): `listr.js` redirects
   stdout to stderr during listr's TTY-renderer updates by saving
   `process.stdout.write` in a **module-level constant**, captured once,
   the first time the module is ever imported in the process — then
   "restoring" to that same stale reference in every subsequent render
   cycle, no matter how many tests or commands run afterward. Once
   anything else (a test harness's per-run mock, in this case) reassigns
   `process.stdout.write` after that first capture, `listr.js`'s restore
   quietly overwrites it back to a defunct closure from run #1, corrupting
   every later test's stdout capture. Fixed by capturing/restoring per
   render-cycle on `this` (the renderer instance) instead of a shared
   module-level variable — correct regardless of what else swaps
   `process.stdout.write` around it, not just a fix for this test suite.

**One more real bug, `Object.assign`-shaped, in my own first-draft test
code**: temporarily setting env vars per test (replacing the old
`.env({...})` chain step) and restoring them in a `finally` block via
`Object.assign(process.env, savedEnv)` is broken when the var didn't exist
beforehand — `savedEnv.KEY` is then `undefined`, and `process.env` coerces
every assigned value to a string, so `process.env.KEY = undefined` doesn't
clear it, it sets the literal string `"undefined"` — which then reads as
truthy to any flag with `env: 'KEY'` in *every test that runs afterward*,
for the rest of the process. Caught via a genuinely confusing symptom
(`resave.spec.js`'s "prints xodball to stdout" test failing only in the
"no TTY" describe block, only because the "TTY" block's *later* env-
mutating tests had already run and polluted `process.env.XOD_OUTPUT`
process-wide). Fixed with a proper `withEnv(vars, fn)` helper added to
`test-func/helpers.js` — deletes a key on restore when its saved value was
`undefined`, rather than assigning `undefined` back to it. Used
consistently across all four newly-converted files instead of duplicating
the same inline (buggy, then fixed) pattern per test.

**`nock@^10.0.2` (2018-era) → `^14.0.17`**: found while converting
`publish.spec.js`'s HTTP-mocking (the fluent API's own `.nock(host, fn)`
step has no `@oclif/test` v4 equivalent — replaced with calling the same
`fn(nock(host))` setup functions directly, `nock.cleanAll()` in
`afterEach`). One test threw `Uncaught TypeError: The "stream" argument
must be an instance of ReadableStream... Received an instance of Socket` —
a known incompatibility between old nock's internal `IncomingMessage`
handling and current Node's stream internals, unrelated to the API
conversion itself. Bumped to current; all 30 tests in that file pass.

**Result**: 85 of 87 tests across all 5 non-hardware-dependent spec files
pass (`help.spec.js` 11/11, `resave.spec.js` 14/14, `transpile.spec.js`
16/16, `tabtest.spec.js` 14/16, `publish.spec.js` 30/30). The 2 failures in
`tabtest.spec.js` are a real C++ compile failure (`constexpr
sysconf(MINSIGSTKSZ)` — glibc changed this from a compile-time constant to
a runtime call in a newer release than the vendored Catch2 header expects)
in this sandbox's toolchain, confirmed via direct reproduction with `make`
outside any test harness — entirely unrelated to `@oclif/test`, not
something to fix as part of this migration.

**The remaining 3 hardware-dependent files, converted too** (same session,
same mechanical pattern) — `boards.spec.js`, `installArch.spec.js`,
`compile-upload.spec.js`. These need a real `arduino-cli`/board toolchain
this sandbox doesn't have, so "verified" doesn't fully apply here the way
it does above; what was actually confirmed:
- No syntax errors, no `ReferenceError`/`TypeError` from the conversion
  itself — ran all three for real.
- `boards.spec.js`: 6/10 pass. The 4 failures are exactly the ones needing
  a real `arduino-cli` binary (`which arduino-cli` finds nothing here); the
  "arduino-cli not found" tests, which deliberately point
  `SDP_ARDUINO_CLI` at a nonexistent path, pass correctly — proving the
  conversion mechanics work, the gap is purely the missing binary.
- `installArch.spec.js`: 8/14 pass, same pattern — exact same 6 failures,
  same root cause (`AssertionError: ... expected '...arduino-cli not
  found...' to include 'Installing'` etc.), confirming it's the same
  single missing dependency causing every failure, not 6 different bugs.
- `compile-upload.spec.js`: help/version tests (no hardware needed) pass;
  didn't run the full hardware-dependent suite (real board toolchain
  install + real `esp8266` compile), no way to verify those here at all.

**Bottom line**: all 8 spec files are now on the `runCommand()`/`this.exit()`
API. 5 of 8 fully verified (85/87 tests passing, 2 failures being an
unrelated pre-existing toolchain gap). The other 3 are mechanically
converted and confirmed not to be broken by the conversion itself, but
their actual hardware-dependent test bodies need a real `arduino-cli`
install and board toolchain to run — that verification has to happen on a
machine that has one.

## 2026-08-31 — oclif v1 → v4 (deprecated-dep migration, item 3 of 5): `sdp-cli`

**Scope:** full CLI framework rewrite. `@oclif/command` + `@oclif/config` +
`@oclif/errors` (all three merged into a single `@oclif/core` package since
v2) → `@oclif/core@^4.14.0`; `@oclif/plugin-help@^2` → `^6.3.0`;
`@oclif/plugin-not-found@^1` → `^3.3.0`; `@oclif/plugin-autocomplete@^0.1`
→ `^3.3.0`; `cli-ux` (absorbed into `@oclif/core`'s `ux` export) removed;
`@oclif/dev-cli` (superseded by the unified `oclif` package) →
`oclif@^4.24.0`; `@oclif/test@^1` → `^4.2.0`.

**Pulled current `@oclif/core` docs before touching anything** (training
data on a 3-major-version CLI-framework jump is exactly where staleness
bites) — confirmed the modern ESM bootstrap pattern, the `static flags`
(array→object was NOT this one, see args below) / `Flags` builder shape,
`Command#init` now requiring `await super.init()`, and `cli-ux` → `ux`.

**`bin/run`**: the old file did a fragile manual dance --
`command.run(undefined, fileURLToPath(import.meta.url))` -- specifically
because `@oclif/command@1`'s root-detection walked `module.parent.parent.filename`,
a CJS-only mechanism with no real-ESM equivalent (documented in the file's
own comment). `@oclif/core@4`'s `execute({dir: import.meta.url})` handles
ESM root detection natively, so the whole workaround -- and the
`src/index.js` file it lived in -- is gone; `bin/run` is now 3 lines.

**`src/baseCommand.js`**: `import { Command } from '@oclif/command'` →
`import { Command, ux } from '@oclif/core'`. Added `await super.init()`
(new requirement, confirmed via the `@oclif/core` docs' own example).
`cli.prompt(...)` → `ux.prompt(...)` (same signature, including the
`{type: 'hide'}` password-masking option).

**`src/flags.js`**: `flags.*` builders → `Flags.*` (mechanical rename, same
options shape, including `Flags.help`/`Flags.version` which still exist as
named builders in v4).

**`src/args.js`** and all **8 command files**' `static args`: v4 requires
`args` as an object keyed by name (`{fqbn: Args.string({...})}`), not the
v1 array-of-`{name, ...}` shape. Converted `args.js`'s two shared "fake"
args (`entrypoint`/`project`, used only for `--help` display under
`strict: false` commands that actually read raw `this.argv` positionally,
not `this.args` by key) and `install/arch.js`'s real `fqbn` arg.

**Real bug caught only by actually running the CLI, not just building
it**: `@oclif/core`'s `Command#parse()` is `async` (v1's was synchronous).
`baseCommand.js`'s `parseArgv(cls)` helper -- called by all 8 commands --
never awaited it, so `this.flags`/`this.args` silently became a Promise's
`undefined` properties instead of the parsed values. Babel compiled it
fine; `--help` output looked fine (help generation doesn't touch
`parseArgv` at all); only invoking a real command (`sdpc transpile
--workspace ...`) surfaced `TypeError: Cannot read properties of undefined
(reading 'workspace')`. Made `parseArgv` `async` + `await this.parse(cls)`,
and added `await` to all 8 `this.parseArgv(ThisCommand)` call sites.

**Second real bug, also only found by actually running a command**:
`src/paths.js` used bare `__dirname`, which doesn't exist in real ESM
(`"type": "module"`) -- this was **never** going to work regardless of
oclif version, a pre-existing dead code path nobody had exercised.
Surfaced immediately after the async fix above, blocking `ensureWorkspace`
→ `resolveBundledWorkspacePath`. Fixed with the same
`path.dirname(fileURLToPath(import.meta.url))` shim already used elsewhere
in this repo's ESM migration.

**Verification, in order**: `pnpm run build` (compiles clean) →
`node bin/run --help`, `compile --help`, `install:arch --help` (all flags/
args/examples/env-vars/required-markers render correctly) →
`node bin/run transpile --workspace <fresh temp dir>` (this is what caught
both real bugs above -- crashed with the undefined-flags TypeError first,
then `__dirname`, then finally reached the correct domain-level error:
"could not find project directory... must contain project.xod file" --
exactly right, since the temp dir has no XOD project in it. Confirms the
full pipeline -- init → parseArgv → ensureWorkspace → parseEntrypoint →
task execution → error formatting -- genuinely works end to end, not just
"doesn't crash at the first line").

## 2026-08-31 — `@oclif/test` v1 → v4: `sdp-cli`'s test-func suite (partial)

**Scope found while verifying the oclif migration above**: all 8
`test-func/*.spec.js` files (2365 lines total) use `@oclif/test@1`'s
fluent `test.stdout().stderr().env().command([...]).it(...)` API
("fancy-test"-based). `@oclif/test@4` dropped this entirely -- confirmed
by reading its actual shipped `lib/index.js` (only 3 exports:
`runCommand(args, loadOpts, captureOpts)`, `runHook`, `captureOutput`, all
plain async functions returning `{stdout, stderr, error, result}`). This
is a real rewrite of every spec file's test structure, not a mechanical
import swap -- substantially bigger than the command-layer migration
above, and heavy on `.env()` usage that has no direct equivalent (needs
manual `process.env` mutation per test).

**Converted one file (`help.spec.js`, the smallest, 11 assertions) as a
working template** before deciding whether to take on the rest. Caught a
real, non-obvious gotcha in the process: `runCommand()`'s default root
auto-detection (`@oclif/test`'s own `findRoot()`) walks `require.main`/
`require.cache` -- a CJS mechanism -- to find the CLI's root directory.
Under mocha + `babel-register`'s CJS/ESM interop, this resolves to
somewhere under mocha's own install, not `sdp-cli` -- every command
silently came back as `"command X not found"` with empty `stdout` (11/11
failing identically, no error surfaced to the assertion). Confirmed via a
standalone reproduction outside mocha. Fixed by passing `{root}` explicitly
(`path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')`) to
every `runCommand()` call -- **this same explicit-root pattern will be
needed in all 7 remaining spec files**, not just this one.

**Result**: `help.spec.js` -- 11/11 passing.

**Not done, real remaining scope**: `boards.spec.js` (214 lines),
`installArch.spec.js` (234), `resave.spec.js` (225), `transpile.spec.js`
(267), `tabtest.spec.js` (317), `publish.spec.js` (507), and
`compile-upload.spec.js` (553) -- roughly 2300 lines still on the old API,
all needing the same `.command().it()` → `async () => { await
runCommand(...) }` restructuring plus the `{root}` fix, plus a real design
decision for the `.env()` chains (manual save/restore of `process.env`
around each test, most likely). Many of these also drive real
`arduino-cli`/board-toolchain interactions that may not be runnable in a
sandboxed environment regardless of API version -- worth confirming
per-file before investing in the rewrite.

**Also found along the way, unrelated to `@oclif/test`**: `@oclif/core`'s
`package.json` has an `"exports"` map but no `"main"` field --
`eslint-plugin-import`'s bundled resolver (`eslint-import-resolver-node`
`^0.3.9`) predates exports-map support, so every `import ... from
'@oclif/core'` in the migrated files failed lint with `Unable to resolve
path to module` even though the app itself (Node's real resolver) had no
issue at all. Fixed via a `pnpm-workspace.yaml` override pinning
`eslint-import-resolver-node` to `^0.4.0` (confirmed via changelog that
this is where exports-map support landed) rather than switching resolver
plugins entirely.

## 2026-08-31 — eslint 8 → 9 (deprecated-dep migration, item 2 of 5): flat config

**Why this one next:** of the remaining big migrations (oclif v1, Storybook
3, puppeteer 1.x, eslint 8), this carries no shipped-app risk — it only
affects linting, never runtime behavior. Picked over the others for that
reason.

**Real risk found before writing anything:** `eslint-config-airbnb@19.0.4`'s
own `peerDependencies` cap at `"eslint": "^7.32.0 || ^8.2.0"` — it has never
been updated for flat config or ESLint 9, and hasn't shipped a release
since. Airbnb's shareable config is a large, deeply-nested rule set
(`airbnb` → `airbnb-base` + `plugin:react/*` + `plugin:jsx-a11y/*`
overrides); if it referenced any core ESLint rule actually *removed* (not
just deprecated) in v9, this migration would hard-break linting entirely,
not just show warnings. Tested this empirically before committing to an
approach: bumped `eslint` to 9 alone first (keeping the old `.eslintrc.js`)
just to confirm ESLint 9 refuses to load it at all (`ESLintIgnoreWarning` +
"couldn't find an eslint.config.js file" — confirms `.eslintrc.js` isn't a
fallback, ESLint 9 requires flat config outright), then wrote a real
`eslint.config.js` using `@eslint/eslintrc`'s `FlatCompat` to bridge
`airbnb` and the other classic-style `extends` entries, and ran it for
real. It worked — no "rule not found" crashes, Airbnb's whole rule chain
loaded and ran correctly via the compat shim.

**`eslint.config.js` (new)**, replacing `.eslintrc.js` + `.eslintignore`
(both deleted, flat config folds ignores into the config itself):
- `FlatCompat` (from `@eslint/eslintrc`) bridges the classic-style
  `extends: ['eslint:recommended', 'plugin:import/errors',
  'plugin:import/warnings', 'plugin:import/react', 'plugin:react/recommended',
  'airbnb', 'prettier']` chain — verbatim from the old config.
- `mocha`, `prettier`, and the in-repo `sdp-fp` plugins registered directly
  (flat config's `plugins: { name: require(...) }` object form) since they
  were only referenced via `plugins: [...]` + explicit rules before, never
  via `extends`. `tools/eslint-plugin-sdp-fp/index.js` already had a
  comment anticipating this exact flat-config registration shape from an
  earlier pass — used verbatim.
- `globals`/`env` → `languageOptions.globals` (own values for the previous
  `globals: {...}` block; the `globals` npm package's `.jest` set for the
  jest-package override, replacing `env: { jest: true }`).
- Every custom rule, every `overrides` entry, and all the extensive
  documented rule-offs (the React/jsx-a11y/generic-JS blocks explaining
  *why* each is off) carried over unchanged.
- Added `settings.react.version: '16.2'` (new): `eslint-plugin-react`'s
  `"detect"` looks for `react` starting from `cwd`, which is the monorepo
  root when lint runs from there — `react` is only ever a nested workspace
  package's dependency, so `"detect"` silently fell back to "assume
  latest," which could apply wrong-React-version rule behavior. Pinned
  explicitly instead.

**`package.json`'s `lint` script**: `--ext js,jsx` is gone from ESLint 9
(flat config determines matched files from `files:` patterns / CLI globs,
not a separate flag) — replaced the six bare directory arguments with
explicit `"packages/*/src/**/*.{js,jsx}"`-style globs achieving the same
file coverage.

**Two real, pre-existing dependency-resolution bugs found via the new
`import/no-unresolved` rule firing** (same class of bug as the
`@rescript/runtime`/`cpx` gaps found earlier in this changelist — something
that only worked before via yarn-era hoisting):
- `tools/generate-tutorial-docs.js` requires `ramda`, `fs-extra`, and
  `sdp-fs` — none ever declared as root dependencies. Confirmed this was a
  *real* runtime break, not just a lint false-positive: `node
  tools/generate-tutorial-docs.js` threw `Cannot find module 'fs-extra'`
  before any of today's fixes. Added `fs-extra`, `ramda`, and
  `sdp-fs: workspace:*` to root `devDependencies`.
- `tools/match-node-version-to-electron.js` (invoked directly by
  `.github/workflows/verify.yml`) requires `node-fetch` (root never
  declared it) and `electron/package.json` (root can't declare `electron`
  reasonably — it's a multi-hundred-MB Electron binary download that's
  only meaningful as `sdp-client-electron`'s dependency, not a duplicate
  root one). Added `node-fetch@^2.7.0` (the last CJS-`require`-compatible
  major; root `package.json` has no `"type": "module"`) to root
  `devDependencies`, and changed the `electron/package.json` read from a
  bare-specifier `require()` to `JSON.parse(fs.readFileSync(path.resolve(
  __dirname, '../packages/sdp-client-electron/node_modules/electron/package.json')))`
  — reads the *actual* Electron version this repo ships, rather than a
  second independently-resolved copy. (This also incidentally fixed an
  `import/no-dynamic-require` lint error the original `require(path.resolve(...))`
  form tripped.) `tools/eslint-plugin-sdp-fp`'s own `ramda` import
  (declared in its own `package.json`, but not a real pnpm workspace member
  since `pnpm-workspace.yaml` only globs `packages/*`) started resolving
  for free once `ramda` existed at root — Node's plain upward
  `node_modules` walk finds it there, no separate fix needed.

**Two ESLint-9-introduced default-behavior shifts, restored to old
behavior rather than touched file-by-file** (same stance the pre-existing
config already documents at length for the eslint-8/airbnb-19 bump):
- `no-unused-vars`'s `caughtErrors` default changed from `'none'` to
  `'all'`, newly flagging ~5 intentional `catch (error) { /* ignored */ }`
  patterns. Set `caughtErrors: 'none'` explicitly.
- `linterOptions.reportUnusedDisableDirectives` defaults to `'warn'` in
  flat config (was off by default in classic config) — surfaced ~15 stale
  `// eslint-disable-next-line` comments repo-wide that no longer suppress
  anything. Unlike the rules above, these are genuinely dead comments with
  zero behavior attached either way — ran `eslint --fix`, which removes
  them automatically, rather than adding another blanket rule-off.

**One real bug found and fixed along the way**: `eslint --fix`'s formatting
pass surfaced `import/first` in `packages/sdp-client-electron/src/app/main.js`
— caused by my own earlier edit in this session (the `electron` default-
import fix), which had placed the `const { app, BrowserWindow, ipcMain,
shell } = electron;` destructure between two import statements instead of
after all of them. Moved it below the last import.

**Verification:** `pnpm run lint` — exit 0, zero errors/warnings (down from
40 problems on the first real run: 5 prettier auto-fixes, ~15 stale
disable-directive auto-fixes, 5 `caughtErrors` config fix, 5 dependency-
resolution fixes, 1 `import/first` fix, 1 `import/no-dynamic-require`
rewrite, 1 `react.version` setting). Then `pnpm run build` (18/18) to
confirm none of the touched files broke at build time.

**Follow-up, same day: tried eslint 9 → 10, reverted.** `eslint@9.39.5`
itself now shows as deprecated (npm flags a major once the next one ships —
expected noise, not a defect) so tried bumping straight to `eslint@10.9.1`
+ `@eslint/js@10.0.1` while everything else stayed put. Hard crash, not a
warning: `TypeError: Error while loading rule 'react/jsx-filename-extension':
context.getFilename is not a function`. ESLint 10 removed the deprecated
`context.getFilename()` rule-context API outright;
`eslint-plugin-react@7.37.5` (the current latest release, checked via
`npm view`) still calls it internally. Nothing fixable on this repo's side
until `eslint-plugin-react` ships a release updated for ESLint 10's removed
APIs. Reverted both packages back to the versions above. **Ceiling: eslint
stays on the 9.x line until `eslint-plugin-react` catches up to ESLint 10 —
don't re-attempt this bump without checking that first.**

## 2026-08-31 — `react-fa` cleanup follow-up + a version ceiling worth noting

`sdp-client-electron/package.json` still declared its own `react-fa`
dependency, missed in the original migration (only `sdp-client` and
`sdp-client-browser` were checked). Confirmed unused there too (zero
`src/` references) and removed.

**Known, currently unfixable warning:** `@fortawesome/react-fontawesome@0.2.6`
itself now shows as deprecated (`npm view` confirms: "v0.2.x is no longer
supported... update to v3.1.1 or greater"). That's not fixable without also
upgrading React 16 → 18/19 first — `react-fontawesome@3.x` requires React
18+, and this repo's whole `sdp-client*` stack is still on React 16.14. A
React major-version upgrade is its own large, separate migration (touches
lifecycle methods, `ReactDOM.render` → `createRoot`, string refs like the
one in `Catcher.jsx` above, etc.) — not something to fold into a
dependency-deprecation pass. Flagging as a real ceiling on how "clean"
`sdp-client`'s dependency tree can get until that happens.

**Verification:** `pnpm run build` (18/18).

## 2026-08-31 — App crash on launch: Fuse.js weights bug, traced through to `Catcher`'s null-ref crash

**Trigger:** after the Electron ESM fix below let the renderer actually
boot, the app still crashed completely on first launch. Two errors showed
in the console:

```
Uncaught Error: Total of weights cannot exceed 1
    at createPatchSearcher (index.js:107:1)
...
Catcher.jsx:65 Uncaught TypeError: Cannot read properties of null (reading 'refs')
    at Catcher.componentDidMount (Catcher.jsx:65:1)
```

**These are one bug, not two.** Traced the causal chain:
`packages/sdp-patch-search/src/index.js`'s Fuse.js `options.keys` weights
were `0.1 + 0.2 + 0.05 + 0.3 + 0.5 = 1.15` — Fuse.js requires these to sum
to ≤ 1, and throws at `new Fuse(...)` construction otherwise. `createPatchSearcher`
gets called from the connected `<App>` component's `mapStateToProps`,
which runs during `<App>`'s first render — inside `<Catcher>`'s subtree
(`Catcher` is this app's top-level error boundary, rendering
`<Provider>{cloneElement(child, { ref: el => this.appRef = el })}</Provider>`).
When `<App>` throws during that first render, React aborts the mount
before its ref callback ever fires, so `this.appRef` stays at its
constructor-initialized `null`. `Catcher.componentDidMount` then
unconditionally does `this.appRef.refs.wrappedInstance.onFirstRun()`
(the legacy react-redux v4 `withRef: true` pattern for reaching the wrapped
instance) — crashing on the null ref. Because this throws inside the error
boundary's *own* lifecycle method, there's no boundary above `Catcher` to
catch it, so the whole app unmounts. **The Fuse.js bug was the actual root
cause; the null-ref crash was a downstream symptom of `<App>` never
successfully mounting even once.**

**Fix:** rescaled the weights proportionally to sum to 1 (`0.087 / 0.174 /
0.043 / 0.261 / 0.435`), preserving their original relative ratios.
Verified directly against the installed `fuse.js@3.6.1` in isolation (a
standalone `new Fuse([], options)` call) — confirmed the original weights
throw under this exact installed version (so this was never a version-drift
regression; the shipped config was always invalid for the currently-pinned
`fuse.js@^3.0.5`), and confirmed the new weights construct cleanly.

**Known remaining gap, not fixed here:** ran `sdp-patch-search`'s own test
suite against the fix. 12 of 16 pass — including everything structural
(path-prefixed search, `lib:` filtering, specialization-node matching).
4 fail, all "which result ranks #1 for a free-text fuzzy query" assertions
(`"number"`, `"meter"`, `"therm"`, `"ult"`). These were calibrated against
the *original* 1.15-sum weights — a configuration that cannot construct
under the installed Fuse.js at all, so no valid weight set can reproduce
the exact rankings they expect; this isn't a regression introduced by the
fix, it's a preexisting calibration gap (search-ranking quality was never
actually verified end-to-end before, since construction always threw).
One of the 4 failures' hardcoded expected path (`'@/109-thermometer'`) also
doesn't match any patch in the current standard library at all
(actual: `'xod/common-hardware/ds18b20-thermometer'`), suggesting these
specific assertions predate the current library structure independent of
this bug. This overlaps with the "Patch search modernization" item already
flagged as investigated-but-deferred earlier in this changelist — re-
calibrating these 4 assertions against current library content is separate
follow-up work, not part of this crash fix.

**Verification:** standalone Fuse construction check (throws with old
weights under `fuse.js@3.6.1`, succeeds with new) + `pnpm run build`
(18/18) + `sdp-patch-search`'s test suite (12/16 passing, gap explained
above). **Still unverified end-to-end in a real GUI** — same sandbox
limitation as the rest of this session; needs a real launch to confirm the
app actually reaches a usable window now.

## 2026-08-31 — Electron main process crash: ESM named imports from `electron` don't work

**Trigger:** after the `@rescript/runtime`/turbo-cache fixes below let the app
get further than before, it hit a hard crash on launch:
`SyntaxError: The requested module 'electron' does not provide an export
named 'ipcMain'`, thrown from `src-babel/app/subscribeIpc.js`.

**Root cause:** a documented Electron limitation, not something introduced
by any change this session — Electron's main-process module doesn't
reliably support ESM named imports (`import { ipcMain } from 'electron'`).
Only the default-import form works: `import electron from 'electron'` then
destructure at the top of the file. `src/app/utils.js` already used the
safe form (`import electron from 'electron'`) — someone on this codebase
had already hit this once, just not everywhere. Three files still used the
fragile named-import form and needed the same fix:

- `src/app/main.js` (the entry point itself — `app`, `BrowserWindow`,
  `ipcMain`, `shell`)
- `src/app/subscribeIpc.js` (`ipcMain`) — this is the one that actually
  crashed
- `src/app/migrateArduinoPackages.js` (`app`)

This was always broken; it was simply never *reached* before, because the
`@rescript/runtime` bug (below) crashed the process earlier in the same
boot sequence. Fixing that peeled back to this — same pattern as the rest
of this entry.

**Verification:** rebuilt and re-ran `pnpm --filter sdp-client-electron run
start`. The `ipcMain` `SyntaxError` is gone; the process now gets
meaningfully further, into `electron-is-dev`'s `Not running in an Electron
environment!` check — which is a sandbox-only wall (no real Electron/GUI
binary available in this environment, confirmed by the crash literally
reporting `Node.js v24.18.1` instead of an Electron version), not a code
bug. **Still needs a real launch on a machine with a working Electron/GUI
to confirm the app actually boots to a window** — this fix is verified as
far as this sandbox allows, not end-to-end.

## 2026-08-31 — `pnpm run start` crash: three real bugs surfaced by trying to run the app

**Trigger:** trying to actually run the Electron app (to visually QA the
react-fa migration below) hit `Cannot find package '@rescript/runtime'
imported from .../sdp-project/dist/Buses_Js.bs.js`. Chasing that down
surfaced two more, unrelated pre-existing bugs — all three were masked
until now by leftover state from the yarn→lerna→pnpm/turborepo migration
earlier in this branch, and only became visible once installs/caches had
fully stabilized.

**1. Three packages compile ReScript that imports `@rescript/runtime` but
never declared it as a dependency:** `sdp-project` (33 files reference it),
`sdp-arduino` (13 files), `sdp-func-tools` (5 files). Only `belt-holes`,
`sdp-tabtest`, and `sdp-tethering-inet` had it declared correctly. Under
yarn's flat hoisting this was invisible — any package could resolve any
hoisted dependency regardless of what it declared. pnpm's strict per-package
isolation doesn't allow that, so `sdp-project`'s compiled output couldn't
find the package at runtime. Fixed by adding
`"@rescript/runtime": "^12.3.0"` to all three packages' `dependencies`,
matching the version already used by the other three.

**2. `sdp-deploy`'s `copy-piomap` script called a bare `cpx` it never
declared anywhere** (only `sdp-client-electron`, `sdp-cli`, and
`sdp-deploy-bin` — none of them ancestors of `sdp-deploy` in the pnpm
isolation sense — declare it). This one actually kept working through most
of today's builds on a stray leftover `cpx` binary from an earlier
pre-pnpm-migration `node_modules` state; a full `pnpm install` reconciliation
pass finally pruned it, and the script broke. Fixed by adding
`"cpx": "^1.5.0"` to `sdp-deploy`'s `devDependencies`.

**3. The real one — `turbo.json`'s `build` task was missing
`src/**/*.bs.js` (and `test/**/*.bs.js`, `platform/**/*.cpp.js`,
`platform/**/*.h.js`) from its cached `outputs`.** Six packages
(`belt-holes`, `sdp-func-tools`, `sdp-project`, `sdp-tabtest`,
`sdp-tethering-inet`, `sdp-arduino`) compile ReScript "in-source"
(`bsconfig.json`'s `package-specs.in-source: true`), meaning `.bs.js` files
land directly next to their `.res` sources in `src/` — not in `dist/`,
which was the only thing `turbo.json` told it to cache. Confirmed this
concretely: deleted `sdp-tethering-inet/src/nodejs/*.bs.js`, reran
`pnpm run build` — turbo reported "cache hit, replaying logs" for that
package (same hash as before, since only the package.json/src `.res` files
factor into the hash, not the missing generated output) and printed the old
success log text, but never actually restored the `.bs.js` files, because
they weren't in `outputs` for turbo to have cached in the first place. Any
process that deleted those generated files out-of-band (a stray `clean`, an
interrupted build, or — per the earlier Jest/ESM investigation entry
further down this changelist — the git-checkout revert dance done on
`sdp-tethering-inet` mid-session) would silently desync the real
filesystem state from what turbo's cache believed had been built, with no
error until something downstream (webpack, in this case) tried to import
the missing file. Fixed by adding the four glob patterns above to
`turbo.json`'s `build.outputs`. Verified the fix closes the actual gap, not
just this one instance: cleared the same 4 `.bs.js` files again after the
`turbo.json` change, reran the build, and this time the cache-hit path
correctly restored them to disk before replaying its logs.

**Also fixed while diagnosing #3 (`sdp-client-electron`'s webpack build
failure, separately):** `packages/sdp-client/webpack.config.cjs` had a
`fontAwesomePath = fs.realpathSync(findup('node_modules/font-awesome'))`
line feeding an asset-loader rule for Font Awesome's font files.
`findup` walks up from the requiring package's directory; `font-awesome`
was only ever a direct dependency of `sdp-client`, never of
`sdp-client-electron` or the workspace root, so under pnpm's strict
isolation this lookup could never have legitimately resolved — it was
riding on the same kind of stray hoisted leftover as `cpx` above, and broke
the moment a full install pass pruned it. Rather than patch the lookup,
removed it entirely along with the `font-awesome` dependency itself and its
asset-loader rule: the icon-name mapping now fully lives in the react-fa
replacement below, and grepping confirmed zero remaining `className="fa
fa-*"` or raw font-awesome CSS/asset references anywhere in `sdp-client`,
`sdp-client-electron`, or `sdp-client-browser`. (The `.storybook/webpack.config.js`
config still references the same now-removed package — left untouched since
Storybook 3.x itself is a separate, already-deferred migration item below,
and that config will need a full rewrite anyway when that happens.)

**Verification:** full `pnpm run clean:dist` + `pnpm run build` from a
completely clean state: 18/18 tasks, exit 0. Then the cache-restore
regression test described in #3 above.

## 2026-08-31 — `react-fa` → `@fortawesome/react-fontawesome` (deprecated-dep migration, item 1 of 5)

**Why this one first:** of the five deprecated-dep migrations flagged in the
quick-fix triage below, this was the lowest-risk — no build-tool or
test-infra changes, confined to `sdp-client`'s icon rendering.

**What `react-fa` actually was:** an abandoned (last release ~2018) React
wrapper around Font Awesome 4's CSS-font-glyph icons. 13 files under
`packages/sdp-client/src` imported its `<Icon name="..." />` component.

**Approach — a local shim, not a per-file rewrite:** rather than editing all
13 call sites' JSX, added
`packages/sdp-client/src/core/components/Icon.jsx`: a drop-in `<Icon>` with
the exact same prop surface (`name`, `spin`, `size`, `Component`, plus
passthrough of `title`/`className`/`onClick`/etc.), backed internally by
`@fortawesome/react-fontawesome`'s `<FontAwesomeIcon>`. Only the 13 import
statements changed (`from 'react-fa'` → `from '.../core/components/Icon.jsx'`);
zero JSX call sites touched. Icon-name map covers the 14 distinct FA4 names
actually used in the codebase (`circle-o-notch`, `external-link`, `warning`,
`play`, `angle-left`, `angle-right`, `copy`, `save`, `question-circle`,
`stop`, `ban`, `gamepad`, `chevron-down`, `chevron-up`) → their FA6/7
`free-solid-svg-icons` equivalents.

**React-version constraint found along the way:** `@fortawesome/react-fontawesome`'s
current major (3.x) requires React 18/19; this repo is still on React 16.14
(`sdp-client`'s `package.json` pins `^16.2`, and a full React major upgrade
is its own separate migration, not something to fold into an icon-library
swap). Used `@fortawesome/react-fontawesome@^0.2.6` instead — the last line
of that package that still supports React ≥16.3, paired with the current
`@fortawesome/fontawesome-svg-core@^7.3.1` / `@fortawesome/free-solid-svg-icons@^7.3.1`
(0.2.6's peer range explicitly allows `~7` core).

**Real rendering-model change, flagged for visual QA:** react-fa rendered
icons as CSS-font glyphs (`::before` content on the icon element itself);
`FontAwesomeIcon` renders a real inline `<svg>` child instead. Three CSS
classes in `packages/sdp-client/src/core/styles/components/Debugger.scss`
had hand-tuned `::before` optical-centering hacks written for the old
glyph model (`.simulation-button`'s `margin-top: -4px`, `.close-button`'s
`line-height: 24px`). Removed the now-inapplicable `::before` rules;
kept `.close-button`'s `opacity: 0.4` intent by moving it to target the
`svg` child directly. **This could not be visually verified in this
session** — no GUI/display available in this sandbox to actually run the
Electron app. Build passes and `sdp-client`'s unit suite (104 tests) passes
unchanged, which confirms no import/render-crash regressions, but says
nothing about icon alignment/sizing in the Debugger panel — **needs a
visual pass** (Debugger tab's save/copy/gamepad/close buttons, Tabs'
scroll-left/right buttons, PatchGroupItem's dead-patch warning icon) before
this is considered done, not just built.

**Also removed:** the `react-fa` dependency from `sdp-client-browser`'s
`package.json` too — it was listed there but never actually imported
anywhere in that package's `src/`, pure dead weight riding along.

**Left alone:** `font-awesome@^4.6.3` (the raw FA4 CSS+font npm package) is
still a `sdp-client` dependency, still wired into both webpack configs via
a `fontAwesomePath` asset rule. Grepped for any remaining raw
`className="fa fa-*"` usage or CSS `@import`/`url()` reference to it —
found none — so it's very likely dead now too, but did not touch it or the
webpack rules this pass: confirming that fully means checking every
`.scss`/`.css` file for indirect glyph-font references, and this migration
was scoped to the `react-fa` deprecation specifically. Worth a follow-up
look once the Debugger.scss visual QA above is done.

**Verification:** `pnpm install` (exit 0, no FontAwesome peer-dependency
warnings) + `pnpm run build` (exit 0, 18/18 tasks) + `pnpm --filter
sdp-client run test` (104 passing, no failures — pre-existing "Unexpected
key \"project\"" Redux warning in the output predates this change).

## 2026-08-31 — Deprecated-dependency cleanup (quick-fix bucket)

**Trigger:** `pnpm run build` prints a wall of `[WARN] deprecated ...` lines,
including "65 deprecated subdependencies found" plus several direct ones.
Triaged the whole list into two buckets: things fixable with no API changes
(this entry) vs. things that are real breaking-change migrations (oclif v1,
Storybook 3, eslint 8→9 flat config, react-fa, and — found while triaging —
puppeteer 1.x, which is a live dependency of `sdp-client-browser`'s
`test-func` suite, not a dead one as first assumed; these are tracked as
follow-ups, one at a time, not started yet).

**Sass `@import` deprecation (`packages/sdp-client-electron/src/view/styles/main.scss`):**
Converted the single remaining `@import 'a', 'b', ...;` block to five
separate `@use` statements. `sdp-client`'s stylesheets were already fully
migrated to `@use`/`@forward` in an earlier pass; this was the last
`@import` left in the repo. Checked all 5 imported partials first — none
reference shared variables/mixins, so this was a mechanical syntax swap,
not a namespace migration. Dart Sass itself was already in use everywhere
(`sass@^1.102.0`, `sass-loader@17`) — no `node-sass` anywhere to replace.

**`rimraf` 2.x → `^6.1.3`** (root `package.json` and `sdp-cli/package.json`,
the only two places it's a direct devDependency — every other package's
`clean:dist` script resolves it from the root install via npm/pnpm's
node_modules/.bin PATH walk). CLI usage in every `clean:dist` script is
plain positional globs, unaffected by the v2→v6 jump. `.nvmrc` pins Node 24,
comfortably above rimraf 6's `20 || >=22` requirement.

**`tar` removed from `sdp-deploy`:** grepped `src/` for any `require`/`import`
of it — zero hits. Dead dependency, deleted rather than bumped.

**`devtron` removed from `sdp-client-electron`:** same story, zero usages
anywhere in the package. Deleted.

**`why-did-you-update` → `@welldone-software/why-did-you-render`**
(`sdp-client-browser`): the old package is abandoned (last release 2017);
this is its actively maintained successor. Single call site
(`src/index.jsx`, behind `process.env.WHY_DID_YOU_UPDATE`) updated to the
new API (`whyDidYouRender(React, { trackAllPureComponents: true })`),
keeping the same all-components tracking behavior and the same env var
name so the existing dev workflow (`WHY_DID_YOU_UPDATE=1 pnpm ...`) still
works unchanged.

**Verification:** `pnpm install` (exit 0, direct-dependency deprecation
warnings for rimraf/tar/devtron/why-did-you-update gone from the list;
the remaining ~66 are all transitive children of the four migrations still
pending) + `pnpm run build` (exit 0, 18/18 tasks, zero Sass deprecation
warnings in the webpack output). Ran `test`/`test-func` where scripts
exist for the touched packages; `sdp-client-electron`'s `electron-mocha`
suite fails in this sandbox with `Cannot read properties of undefined
(reading 'getPath')` — a pre-existing headless/no-GUI sandbox limitation
(same class as the earlier "no Docker daemon" gap), not caused by this
change, since the only edit to that package was deleting an unused
devDependency.

**Not touched, tracked as separate follow-ups:** oclif v1 → v4 rewrite
(`sdp-cli`), Storybook 3 → 9 (`sdp-client`, 17 story files), eslint 8 → 9
flat-config migration (root), `react-fa` → `@fortawesome/react-fontawesome`
(13 files in `sdp-client`), and puppeteer 1.x → current (`sdp-client-browser`
test-func, 8 files) — each is a real breaking-API migration, to be picked
off one at a time.

## 2026-08-31 — lerna → Changesets

**Removed:** `lerna.json`, the `lerna` devDependency, and the `"lerna":
"lerna"` root script. Nothing else depended on lerna once the pnpm/turbo
migration above landed — task-running was already turbo's job, workspace
linking was already pnpm's job. The version-bump/canary step was the only
real remaining use.

**Real gap found and fixed along the way:** none of the 18 workspace
packages had `"private": true` set (only the repo root did) — meaning
nothing currently stops an accidental `npm publish`/`changeset publish`
of an internal-only package to the real npm registry. This matters
specifically because Changesets treats `private: true` as its "don't
actually publish this" signal. Added `"private": true` to all 18.

**`.changeset/config.json` (new):** `privatePackages: {version: true, tag:
false}` — required, not optional: Changesets skips versioning `private`
packages entirely by default, so without this, adding `"private": true`
above would have silently made `changeset version` a no-op across the
whole repo. `changelog: "@changesets/cli/changelog"` (the plain
generator, not `@changesets/changelog-github` — that needs a GitHub API
token for PR/commit metadata at release time, an extra secret this pass
deliberately avoids needing). `access: "restricted"` — irrelevant in
practice since `changeset publish` is never invoked, but the safer
default if anyone ever did run it by mistake.

**Workflow change, done deliberately, confirmed with the user first:**
the old lerna flow was "push to a branch named `prerelease-(patch|minor)-
*` → automatic canary version bump," triggered by branch name. Changesets'
native flow is different: a contributor commits a changeset file
alongside their PR, and a release job batches all pending changesets into
a "Version Packages" PR on merge to `main`. Adopted the native flow as-is
rather than fight it into matching the old branch-name-triggered pattern
(Changesets' "pre" mode could approximate that, but with real added
complexity for less benefit).

**`.github/workflows/release.yml` (new):** on push to `main`, runs
`changesets/action@v1` with no `publish:` input — meaning it only ever
opens/updates the Version Packages PR, never attempts an actual `npm
publish` (matches the "private packages, version-only" design above).
Needs only the automatic `secrets.GITHUB_TOKEN` (`contents: write` +
`pull-requests: write` permissions) to create/update that PR — no new
secret to add on the account side, unlike the still-unported dist/docker
CI jobs.

**`CONTRIBUTING.md`:** added an "Adding a changeset" section (`pnpm
changeset` before opening a PR). Also fixed two stale `yarn run
lint`/`yarn run verify` references to `pnpm run` while already in this
file for an unrelated reason — found, not hunted for.

**Verified for real, not just written:**
- `pnpm exec changeset status` — config loads without error, correctly
  detects real pending changes against `baseBranch: main`.
- Wrote an actual test changeset (`sdp-func-tools`, patch bump), ran
  `pnpm exec changeset version` for real: version bumped `0.34.0` →
  `0.34.1` correctly, `CHANGELOG.md` generated with the right content.
  Confirms `privatePackages` config is doing its job — this package IS
  `private: true` and versioned fine. Reverted both (package.json version,
  the generated CHANGELOG.md) immediately after confirming — this was a
  pipeline test, not a real release.
- `.github/workflows/release.yml` — YAML valid, `actionlint` v1.7.12
  clean (checked alongside `verify.yml` together, still clean).
- Full `pnpm install` + `pnpm run build` (18/18) re-run clean after the
  lerna removal and all 18 `private: true` additions — nothing broke.

**Not done, still open:** CircleCI's `dist-*`/`upload-distros`/
`dockerize-ide` jobs (need GitHub secrets added first, see the GHA
changelist entry above) still reference the old `lerna publish --canary`
step conceptually in spirit — once those get ported to GitHub Actions,
their version-stamping needs to use whatever `changeset version` last
produced, not lerna. Not addressed here since those jobs aren't ported
yet at all.

## 2026-08-31 — CircleCI → GitHub Actions (verify pipeline only)

**Context:** separate from the pnpm/turbo migration above. CircleCI is
being retired in favor of GitHub Actions (matching what the site already
uses) with self-hosted Buildbot runners planned for later once hardware
is sorted. Scoped deliberately to just the "verify" pipeline (install/
build/lint/test/test-func across 3 platforms) for this pass — the dist/
docker/GCS-upload jobs need GitHub secrets added on the account side
before they can run at all, and the lerna canary version-bump step is
being replaced by Changesets as a separate, properly-scoped follow-up
rather than ported as-is.

**`.github/workflows/verify.yml` (new):** matrix across ubuntu-latest/
macos-latest/windows-latest. Deliberately simplifies what CircleCI needed
manual per-OS workarounds for, now that both are just standard GHA
actions: `pnpm/action-setup` + `actions/setup-node` (`node-version-file:
.nvmrc`, `cache: pnpm`) replace CircleCI's separate nvm-curl-install-on-
macOS and `npm install yarn@1.22.10 -g`-on-Windows steps entirely.

Preserved exactly from the old CircleCI behavior, not "improved" without
being asked to: the pinned arduino-cli **0.12.0** (not bumped to a newer
release — untested against a version change), the Windows job's Xvfb-less
skip of `test-func` (same reasoning as before: no equivalent virtual
display was ever configured for it), and the `verify-git-clean.sh`
checks after install/build/test-func.

**One real bug caught before it shipped:** the natural CircleCI→GHA port
of "run Xvfb in the background, then run tests" doesn't work — CircleCI's
`background: true` keeps a process alive for the whole job, but GitHub
Actions runs each step in its own separate shell invocation, so a
backgrounded process dies when its step's shell exits. Used `xvfb-run
--auto-servernum` wrapping the test-func command in a single step
instead (starts the display, runs the command, tears it down, all within
one step) rather than the naive port.

**Verified:** YAML valid, `actionlint` v1.7.12 (the authoritative GHA
linter, includes shellcheck on every `run:` block) — clean, zero
findings. Every individual command in the Linux leg (`pnpm install`,
`pnpm run build`, `pnpm run lint`, `pnpm run test`, `pnpm run test-func`,
the arduino-cli curl+tar install, `xvfb-run`) was already verified working
standalone earlier in this session on this same Linux environment.
**Not verified:** a full dynamic run — `act` (runs GHA workflows locally
via Docker) is installed but the Docker daemon isn't actually running in
this sandbox (client only, no socket), so this couldn't be executed
end-to-end here. The macOS/Windows legs mirror the original CircleCI
commands closely but are genuinely untested beyond that. Only a real push
to GitHub confirms those.

**`.circleci/` removed entirely** (`config.yml`, `cache-version`, and a
`Dockerfile` for a custom Node-12 image that was already unused/orphaned
— the config had already switched to the plain `cimg/node:24.11`
convenience image earlier, per that switch's own comment in the file
history).

**Deliberately not done this pass, tracked as follow-ups:**
- `test-cpp` job (AVR-size test, tabtest generation/build/run) — not
  ported yet.
- `dist-linux`/`dist-macos`/`dist-windows` (electron-builder distro
  builds) + `upload-distros` (GCS upload) — need `GOOGLE_CLOUD_STORAGE_
  CONFIG` added as a GitHub secret before they're even runnable.
- `dockerize-ide`/`push-docker-images` (browser IDE Docker image build +
  push) — need `DOCKER_PASS` as a GitHub secret; also still references
  the old `xodio/site-ide` image name and `xodbot` Docker Hub account,
  unrelated leftover branding not addressed here.
- Lerna's canary version-bump step (`lerna publish --skip-git --skip-npm
  --canary --cd-version X --yes`, triggered on `prerelease-(patch|minor)-*`
  branches) has no replacement wired up yet. Decided: adopt Changesets
  (`@changesets/cli`) as the replacement, but that's a real workflow
  change (PR-committed changeset files + a release job, not a branch-
  name-triggered canary bump) — scoped as its own follow-up, not bundled
  into this pass. `lerna.json` and the `lerna` devDependency are still in
  the repo, doing nothing now that turbo/pnpm cover task-running and
  workspace-linking — safe to remove once Changesets (or whatever
  replaces the version-bump step) actually lands, not before.

## 2026-08-31 — yarn/lerna → pnpm/turborepo migration

**Context:** `.turbo/cache/*` (66 files, ~13MB) had been accidentally
committed under a misleading message ("Refactor code structure for
improved readability and maintainability") with no actual `turbo.json` or
committed `pnpm-workspace.yaml` — the migration hadn't really started in
git despite two commits sounding like it had. Untracked `.turbo/` and
added it to `.gitignore` first (new commit, history not rewritten since
the original was already pushed).

**pnpm workspace setup:**
- `pnpm-workspace.yaml` (new): `packages: [packages/*]`, plus `overrides`
  (converted from the old yarn `resolutions` field — pnpm v11+ doesn't
  read `package.json`'s `pnpm` field at all anymore, this file is the only
  place these settings live now) and `allowBuilds` for every dependency
  pnpm's supply-chain gate flagged. Every entry decided by actually
  reading that package's `scripts` block, not guessed — e.g.
  `electron-chromedriver`/`puppeteer`/`spectron`/`bs-platform`/
  `@serialport/bindings-cpp`/`electron-winstaller` are real, functionally
  load-bearing install scripts (chromedriver/Chromium downloads, the
  actual ReScript compiler binary, native serial port bindings, Windows
  installer tooling); `core-js`/`core-js-pure`/`es5-ext`/`highlight.js`/
  `command-join`/`uglifyjs-webpack-plugin` have no real install step or a
  defensive no-op; `@scarf/scarf` is telemetry, blocked deliberately;
  `@parcel/watcher`/`tree-sitter*` left blocked (optional native bindings,
  unclear which actual dependency exercises them — safer default).
- Root `package.json`: added `"packageManager": "pnpm@11.24.0"`, removed
  the yarn-only `"workspaces"` field, removed `"resolutions"` (moved to
  pnpm-workspace.yaml above), added `"turbo": "^2.10.12"` devDependency.

**xodio/menu (rc-menu) fork — vendored, not git-installed:**
`packages/sdp-client/package.json`'s `"rc-menu": "git+https://github.com/
xodio/menu.git#npm"` turned into a real installation blocker: pnpm shells
out to a genuine `npm install` in a temp dir to "prepare" any git-hosted
dependency, reading that package's `package.json` straight off disk. Its
`"prepublish": "rc-tools run guard"` (a legacy pre-publish safety check,
not the real build — `lib/` is already committed, `main` points straight
at it) hard-fails under modern Node: old `graceful-fs` + the `natives`
package reference `primordials`, removed from Node's internal `fs.js`.
Tried `.pnpmfile.cjs`'s `readPackage` hook to strip the broken script —
doesn't intercept this step, pnpm's git-dependency "prepare" phase reads
the raw on-disk manifest, bypassing pnpm's own manifest-mutation hooks
entirely. Fix that actually worked: vendored the exact pinned commit at
`vendor/rc-menu/` with just that one script line removed (verified against
the real fetched tarball — same code, zero behavior change), pointed
`sdp-client`'s dependency at `"file:../../vendor/rc-menu"`. No external
repo/mirror needed.

**Circular workspace dependency (blocked turborepo's build graph):**
`sdp-client` had a **devDependency** on `sdp-client-browser` (Storybook
only) purely so one story (`stories/PatchDocs.jsx`) could import
`sdp-client-browser/tutorialProject.json`, a build-generated (gitignored)
fixture — while `sdp-client-browser` has a real, load-bearing dependency
on `sdp-client` the other way. pnpm tolerated the cycle; turborepo's build
graph can't (needs a true DAG). The story file even had its own
`// TODO: fragile import` comment already flagging this. Confirmed no
test covers the 6 story variants that used real stdlib patches from that
fixture (`flip-flop`, `map-range`, etc.) — removed those 6, kept the 4
that already work standalone via `sdp-project`'s own built-in
`xod/patch-nodes/*` patches (no external data needed), removed the
`sdp-client-browser` devDependency entirely.

**Internal cross-package dependencies → `workspace:*` protocol:** yarn
classic silently resolves `"sdp-fs": "^0.38.0"`-style ranges to the local
workspace copy regardless of registry publication; pnpm tries to fetch
from the real npm registry and 404s (`sdp-fs`, `sdp-project`, etc. were
never published there). Converted all 53 internal cross-dependency
declarations across every `packages/*/package.json` to `"workspace:*"`.

**Every internal `yarn`/`yarn run` invocation → `pnpm run`:** with
`packageManager` pinned in root `package.json`, corepack refuses to run a
different package manager from inside the workspace — every package
script that called `yarn build:re && yarn build:js`-style sibling scripts
internally needed the same swap. Found and fixed 26 occurrences across 15
package.json files (`sed 's/yarn run /pnpm run /g'` then
`'s/yarn \([a-zA-Z:_-]\)/pnpm run \1/g'`, in that order so `yarn run X`
doesn't become `pnpm run run X`).

**`turbo.json` (new):** pipeline for `build` (`dependsOn: ["^build"]`,
caches `dist/lib/bundle/src-babel`), `test`/`test-func`/`test-cpp`
(`dependsOn: ["^build", "build"]`), `dev`/`start`/`storybook`
(`persistent: true`, uncached), `clean:dist`/`doc`. Turbo silently skips
any package missing a given task, same as lerna did.

**Root `package.json` scripts:** every `lerna run X [--scope Y
--include-filtered-dependencies]` → `turbo run X [--filter=Y...]` (`...`
suffix = package + its dependencies, turbo's equivalent of lerna's
`--include-filtered-dependencies`). `bootstrap` (`lerna bootstrap`, no
real pnpm equivalent needed) → `pnpm install`. Left `"lerna": "lerna"` and
the `lerna` devDependency in place — lerna's own version/publish workflow
(`lerna publish --canary` in CI) is a separate, explicitly deferred
decision, not replaced by this pass.

**Real, unrelated ReScript bug found and fixed along the way:**
`sdp-tethering-inet/src/AtInternet.resi` declared `create: (string =>
unit, string) => unit` (flat 2-arg), but the actual implementation and its
one real caller (a test) both use the curried 1-arg-returning-a-function
shape (`create(handler)` returns a `string => unit` sender). Both files
were last touched by the same squashed "Complete modernization" commit
that isn't mine. Fixed the `.resi` to match the working implementation
and its real usage, not the other way around. This was genuinely blocking
`pnpm run build` (turborepo runs every package's build, unlike ad-hoc
lerna scoping that might not have hit it).

**Verified for real:** `pnpm run build` — 18/18 packages, exit 0
(ReScript compiles, webpack bundles for both electron and browser
targets, turbo caching confirmed working — reruns show cache hits for
unchanged packages). `pnpm run test` — 22/32 passing; the 10 not passing
are `belt-holes`/`sdp-tethering-inet`'s tasks (see below), not new
breakage -- everything else that has a test suite passes.

**Known pre-existing gap, investigated at length, NOT fixed — flagging
clearly rather than leaving it ambiguously "in progress":**
`belt-holes`/`sdp-tethering-inet` are the only two packages using Jest
(everything else uses mocha). Their pinned `babel-jest@24.9.0` +
`@babel/core@^8.0.1` combination crashes
(`ScriptTransformer._getCacheKey` calls `@babel/core`'s `loadPartialConfig`
synchronously; Babel 8 requires `loadPartialConfigSync` explicitly) — and
this is **jest core's own** integration, not babel-jest's: bumping
babel-jest to its latest release (30.5.0) didn't help, it still hard-codes
the old sync call. Spent substantial effort on this specifically because
it was blocking `pnpm run test` cleanly:
- Pinning `@babel/core`/`@babel/preset-env` back to `^7.29.x` locally for
  just these two packages (the same locally-scoped-devDependency pattern
  the "Complete modernization" commit itself used for its gradual
  per-package Babel rollout) avoids the crash, but then the `.bs.js` files
  ReScript compiles to (real ES modules — `bsconfig.json`'s
  `package-specs` intentionally targets `"esmodule"`, production code
  consumes them that way too) can't be `require()`'d at all without a
  transform, defeating the point of removing the transform.
- Tried disabling the transform entirely (`"transform": {}`) plus every
  documented native-ESM invocation of Jest 30 (`node
  --experimental-vm-modules node_modules/jest/bin/jest.js`, `NODE_OPTIONS`
  env-var form, `--runInBand` to rule out worker-process flag
  inheritance, dynamic `import()` inside `beforeAll` instead of top-level
  `import`). A **minimal, dependency-free** ESM test file reproduces
  correctly in an isolated `/tmp` directory with this exact setup, but
  fails identically inside `packages/belt-holes` even with the identical
  config passed via `--config` on the CLI (which should ignore
  package.json entirely) and with `babel.config.js` physically removed
  from the repo root during the test (ruling that out explicitly). The
  differentiator is genuinely just "is this file inside this monorepo's
  directory tree," not any config value, babel config presence, rootDir
  setting, or worker-process flag propagation I could find — not
  root-caused.
- **Reverted** all test-file and package.json changes for these two
  packages back to their last-committed state (`git checkout`) rather
  than leave a half-working experimental state in place. Confirmed via a
  full rebuild+retest afterward that this restored exactly the original,
  pre-existing failure (same two packages, same failure mode) — nothing
  worse than before, nothing silently left broken.
- **Recommendation for whoever picks this up:** switch these two packages
  from Jest to mocha, matching literally every other package in this
  monorepo (proven working with ReScript's ESM output + `tools/babel-
  register.js` for several packages already, confirmed via this session's
  real test runs). Far more likely to actually work than continuing to
  fight Jest's ESM detection, but it means rewriting Jest's
  `expect(x).toBe(y)`/`toEqual`/`toHaveLength` assertions to chai's
  `assert`/`expect` API across 7 test files (~35 assertions) — a real,
  properly-scoped task of its own, not a one-line fix.

## 2026-08-25 — CLI rename: `xodc` → `sdpc` (tier 3, item 12)

**User decision:** asked explicitly (this is a breaking CLI-command-name
change, not something to execute silently) — chose a clean rename, no
backward-compat alias. Rationale given: no IDE build has actually been
distributed under the SolderPop name yet (README still says "no hosted
build yet"), so no real external users depend on the `xodc` name today.

**Files:** `package.json` (root), `packages/sdp-cli/package.json` (`bin`
+ `oclif.bin`), `packages/sdp-cli/README.md` (regenerated + 2 hand-written
prose mentions), `packages/sdp-cli/src/flags.js`,
`packages/sdp-cli/src/commands/{compile,install/arch,publish,resave,
tabtest,transpile,upload}.js` (usage-example strings only),
`packages/sdp-cli/test-func/*.spec.js`, `.circleci/config.yml`,
`tools/publish-stdlib.sh`.

**Deliberately NOT touched:** `CHANGELOG.md` and
`docs/esm-migration-plan.md` — both are historical records referencing
what the tool was called *at the time*; rewriting history in a changelog
or a migration log is wrong regardless of what the tool is called today.

**Verified for real, not just renamed and hoped:**
- Checked for `xodc`-prefixed identifiers (e.g. `xodconfig`) that would
  need word-boundary care before doing a blanket rename — none existed,
  every occurrence was the standalone word.
- Full real build: `yarn lerna run build --scope sdp-cli
  --include-filtered-dependencies` (rebuilds `sdp-cli` and every workspace
  dependency, including the ReScript compiles for `sdp-project`/
  `sdp-arduino`/`sdp-tabtest`) — succeeded.
- Ran the actual built CLI (`node packages/sdp-cli/bin/run --help` and
  `help transpile`) — real output confirms `sdpc` throughout (`USAGE: $
  sdpc [COMMAND]`, every command's usage examples, `help for sdpc`), no
  leftover `xodc` anywhere in live output.
- Real `eslint` on `packages/sdp-cli/src` — 75 problems, all confirmed
  pre-existing via `git diff` (same `import/imports-first` pattern seen
  repo-wide all session, plus 2 unrelated prettier issues and 1 unrelated
  parse error, none on the lines I touched).
- README regenerated via the package's real `oclif-dev readme` +
  sed-postprocess (matching `yarn build:readme`), not hand-edited for the
  auto-generated sections; the two hand-written prose lines outside the
  `<!-- commands -->` markers still said `xodc` after regen (regen only
  touches the marked sections) and were fixed by hand.

## 2026-08-25 — Leftover XOD branding strings (tier 3, item 9)

**Files:**
- `packages/sdp-client/src/core/assets/index.html` — browser tab title
  `XOD IDE` → `SolderPop IDE`
- `packages/sdp-client/src/project/components/PopupProjectPreferences.jsx` —
  "XOD Cloud API Key:" label → "SolderPop Cloud API Key:"
- `packages/sdp-client/src/debugger/messages.js` — mixed-brand sentence
  "Install the desktop version of SolderPop IDE to reveal all features of
  XOD" → drops the trailing "of XOD" (the sentence is about the desktop
  app unlocking a feature, not about the language)
- `packages/sdp-cli/package.json` — `oclif.repositoryPrefix` had
  `blob/master` hardcoded; this repo's default branch is `main`
- `packages/sdp-cli/README.md` — regenerated via the package's own real
  `yarn build:readme` mechanism (`oclif-dev readme` + the repo's sed
  post-step), not hand-edited, now that `repositoryPrefix` is fixed. Picks
  up the `--api` flag's already-correct `solderpop.io` default (was
  showing stale `xod.io` because the README was never regenerated after
  `flags.js`'s default was changed) with no unrelated churn.
- `packages/sdp-deploy/README.md` — was documenting
  `XOD_CLOUD_UPLOAD_CONFIG_URL`/`XOD_CLOUD_COMPILE_URL` as live,
  overridable env vars pointing at `compile.xod.io`. Checked the actual
  source (`src/constants.js` and every file that imports from it): these
  env vars aren't read anywhere in the current code at all — the values
  are fixed constants now (`compile.solderpop.io`). This wasn't just
  stale branding, the README described a configurability mechanism that
  doesn't exist anymore (dropped at some point in the `xod`→`sdp` rename
  commit, per `git log`). Rewrote the section to describe the actual
  current (non-overridable) behavior instead of just swapping the
  hostname and leaving a false claim in place.

**Deliberately NOT changed:** `packages/sdp-cli/src/apis.js:5` --
`['solderpop.io', 'xod.show'].indexOf(apiSuffix) >= 0 ? 'https' : 'http'`.
Looks like leftover branding at a glance, but it's a protocol-selection
whitelist for the package registry host -- removing `xod.show` would make
the CLI fall back to plain `http://` for anyone still configured against
the old registry, a real security downgrade, not a cleanup. Left in
place. Also left `debugger/messages.js:25`'s "XOD runtime code" alone --
that's an accurate reference to the underlying language/generated code,
not a branding leftover (see the tier-2 report's note on "XOD" as
language name vs. cosmetic residue).

**Verified:** real `eslint` clean on every touched `.js`/`.jsx` file. The
two READMEs and `index.html` have no lint/test coverage to run (docs and
static HTML) -- read the diffs directly instead.

## 2026-08-25 — CI: Windows lint + unit tests (tier 3, item 11)

**Files:** `.circleci/config.yml`

**What:** `verify-windows` only ran `checkout`/`install`/`build` — no lint,
no unit tests, no functional tests, unlike `verify-linux`/`verify-macos`
which run all three. Added `step-lint` and `step-test` (both pure
Node/CLI, no display dependency, so safe to reason about without a real
Windows CI run to check against).

**Deliberately left out:** `step-test-func`. Functional tests drive the
actual Electron GUI; `verify-linux` sets up an Xvfb virtual framebuffer
specifically for that (`Xvfb :99 -screen 0 1280x1024x24` + `DISPLAY`
env var), and `verify-windows` has no equivalent display setup. Adding
`test-func` blind could flip this job from "silently skips tests" to
"always red" if Windows CI needs its own display setup this config
doesn't have — needs someone with real Windows CI access to check.

**Verified:** YAML parses (`js-yaml`) and the anchor/alias resolution
puts the new steps in `verify-windows` in the same shape as the already-
working `verify-linux`/`verify-macos` jobs. No CircleCI CLI available in
this environment for full schema validation or an actual pipeline run.

**Found but not touched:** `dockerize-ide`/`push-docker-images` jobs still
push to Docker Hub as `xodio/site-ide` under the `xodbot` account
(`IMAGE_NAME: "xodio/site-ide"`, `docker login -u xodbot`). Real
leftover-XOD-branding issue, but changing it needs to be paired with
whatever SolderPop's actual Docker Hub credentials/account setup is —
not something to guess at from a config file.

## 2026-08-25 — Unmaintained forked dependencies (tier 3, item 10): investigated, not changed

**Files:** none — read-only investigation.

Four packages are pinned to specific commits on the `xodio` GitHub org
instead of published npm releases: `react-skylight` (pinned in
`sdp-client-browser`, `sdp-client-electron`, and `sdp-client`, same
commit each place), `rc-menu` (as `xodio/menu.git#npm`),
`react-autosuggest`, `react-custom-scroll`. Confirmed real risk: none of
these have had a security patch land since being forked, and the whole
install chain depends on the `xodio` org staying up (checked via `gh` —
all four repos are currently still reachable, so not an active
emergency, just latent risk. `XOD Inc.`'s AGPL attribution in the root
LICENSE is dated 2017-2019, so there's no guarantee anyone is still
maintaining that org).

**Why not fixed here:**
- Swapping to the real upstream npm packages is the "obvious" fix, but
  these are UI-critical (modals, the menu system, autocomplete,
  scrollbars) and I have no way to visually verify a UI regression in
  this environment — Electron doesn't have a real display here (see the
  earlier session's `yarn start:electron` attempt). Whatever bug the
  original XOD team forked these for a fix to is also unknown without
  diffing against upstream at that commit.
- The "properly fix it" path — mirroring these 4 repos under the
  `solderpop` GitHub org at the same pinned commits, then repointing the
  git URLs — is something I could technically execute (`gh` is
  authenticated with `repo` write scope), but creating public
  repositories under the org is a real, externally-visible action that
  commits the org to hosting them going forward. That's a call for a
  human to make explicitly, not something to do silently as part of a
  "cleanup" pass.

**Recommendation:** mirror the 4 repos under `solderpop-org` at their
exact currently-pinned commits (zero behavior change, just removes the
"depends on xodio's GitHub org" risk), then separately -- as real,
visually-tested work -- evaluate swapping each for its actively
maintained upstream/equivalent.

## 2026-08-25 — Compile pipeline test coverage (tier 2, item 8)

**Files:**
- `packages/sdp-cloud-compile/src/compile.js` — `compile` given an
  injectable `fetchImpl` param (defaults to real `node-fetch`), exported
  for testing; `compileTabtest`/`compileSimulation` given the same,
  threaded through
- `packages/sdp-cloud-compile/package.json` — added `"test"` script,
  `@babel/register` devDependency
- `packages/sdp-cloud-compile/test/compile.spec.js` (new) — 13 tests
- `packages/sdp-wasm-compile/src/compile.js` — `writeSources` and
  `wrapCompileError` exported (were private)
- `packages/sdp-wasm-compile/package.json` — added `"test"` script
- `packages/sdp-wasm-compile/test/compile.spec.js` (new) — 4 tests

**What:** both packages were previously untested (the original review
flagged this as the riskiest, least-verified part of the whole
ClickClack-differentiation story — these are the actual WASM-in-browser
and cloud-compile pipelines, not stubs).

**sdp-cloud-compile** (`compile.js`, the `fetch()`-based HTTP client to
`api.<hostname>/compile/enqueue`): covers request building (URL, method,
base64-encoded payload per file, Authorization header present/absent),
every status-code branch (200 success, 401/402/422 mapped to their
specific error codes, unknown status falls back to
`WASM_UNKNOWN_COMPILATION_ERROR`, a malformed error body falls back to
`COMPILATION_SERVICE_ERROR`, and the request itself failing falls back to
`WASM_COMPILATION_RESULTS_FETCH_ERROR`), and that `compileTabtest`/
`compileSimulation` set the right `fqbn` and bundle the right files.

To make this testable without hitting a real server, `compile` (and its
two exported wrappers) now accept an injectable `fetchImpl`, defaulting to
the real `node-fetch` import. This had a real correctness trap:
`compileTabtest` is *partially applied* at its one real call site
(`sdp-client/src/editor/actions.js:770`, `XCC.compileTabtest(HOSTNAME,
accessToken)` — called with 2 of its args, relying on `R.curry` to return
a function awaiting the rest). A first pass dropped `R.curry` entirely to
add the new param, which would have silently broken that call site (partial
application on a plain function just executes early with the remaining
params undefined). Fixed by keeping `R.curry` and giving the new
`fetchImpl` param a default value — default-valued params are excluded
from `fn.length`, so `R.curry`'s auto-detected arity stays at the
original count, and calling with more args than that arity still forwards
all of them through to the wrapped function. Verified this specific
behavior empirically with a standalone Ramda script (three cases: original
call pattern, new 5-arg test pattern, and the actual partial-application
pattern) before relying on it, not just from memory of how `R.curry` works.

**sdp-wasm-compile** (`compile.js`, shells out to a local `emcc` and reads
back compiled WASM artifacts): only `writeSources` (writes the sketch +
bundled Arduino/WasmSerial/main.cpp shim files into a build dir) and
`wrapCompileError` (wraps a failed `execFile` error into the package's
error-code shape) are covered. The actual `emcc` invocation
(`execFileAsync(emxx, ...)`) is **not** covered — that needs either a real
installed Emscripten toolchain (multi-hundred-MB SDK, not available here)
or the same fetchImpl-style injection applied to `execFileAsync`, which
wasn't attempted this pass. Flagging as a follow-up, not silently skipping
it.

**A real toolchain got working this session**, which is why these tests
could actually be run and not just syntax-checked:
- No `node_modules` existed at all initially. `yarn` itself isn't on PATH
  in this environment; `npx yarn@1.22 install` hit
  `error The engine "node" is incompatible... Expected >=22.12.0, Got
  20.19.4` — this environment's Node is below the repo's engine floor.
  Re-ran with `--ignore-engines` (install-only, doesn't change anything in
  the repo) and it succeeded.
- Discovered a genuine pre-existing gap: `compile.js` in both packages
  `import`s raw `.h`/`.cpp`/`.inl` files, which only resolves via Babel's
  `babel-plugin-inline-import` transform — a **build-time** step.
  `@babel/register` (used by every other package's test script) hooks
  Node's CommonJS `require()`; it can't intercept the native ESM
  `import()` that mocha uses to load `"type": "module"` test files, so
  loading these two packages' raw `src/` directly threw
  `ERR_UNKNOWN_FILE_EXTENSION` on the `.h` file. No prior test suite in
  this repo had ever hit this combination, because these are the *only*
  two packages using inline-import for `.h`/`.cpp` files, and neither had
  tests before now. Fixed by having both new test files import from
  `../dist/compile.js` (built via plain `babel src/ -d dist/`) instead of
  `../src/compile.js` — matches how the repo's own `yarn verify` already
  sequences `build` before `test` anyway.
- Real `eslint` now runs too (was checking with `esbuild` parse-only
  before). Found and fixed one genuine new issue
  (`class-methods-use-this` in the new `PopupAbout.jsx`, see that entry);
  everything else flagged was confirmed pre-existing via `git diff`.

**Verified for real, not just asserted:** `13 passing` for
sdp-cloud-compile, `4 passing` for sdp-wasm-compile, both via
`XOD_HM_DEF=true mocha --require ../../tools/babel-register.js`, actually
executed in this session.

## 2026-08-25 — Patch search modernization (tier 2, item 7): investigated, not changed

**Files:** none — read-only investigation of
`packages/sdp-patch-search/src/index.js`.

**Why no change:** the two things flagged in the original review turned
out to both be unsafe to fix blind, for different reasons:

1. **Ramda pin.** `ramda: "^0.24.1"` isn't just pinned in
   `sdp-patch-search` — it's the exact same pin in every package.json in
   the monorepo that depends on Ramda (263 files import it across
   `packages/*/src`). The `R.join('')` workaround at `index.js:169` (with
   the comment "cause it will work fine with strings... Can not update now
   on 0.25.0, cause it have performance issues") can only be removed by
   bumping Ramda repo-wide, which is a real cross-cutting dependency
   upgrade (API changes like `R.contains` → `R.includes` in later
   versions), not a one-package cleanup. No `node_modules` installed in
   this environment (see earlier entries) means no way to run the actual
   test suite and confirm nothing broke. Not doing a repo-wide dependency
   bump on faith.
2. **Ranking TODO at `index.js:82`.** `R.unless(() => query.trim().split('
   ').length > 1, ...)` means multi-word search queries currently get no
   path-based score refinement at all (only single-word queries do). The
   original `// TODO` doesn't say what the intended fix is, and "fixing"
   search ranking is a relevance/UX judgment call that needs real testing
   against real query data to know if a change is actually better — not
   something to guess at blind.

**Recommendation:** both are real, worth doing, but need to happen with a
working `yarn install` + test run available (Ramda bump), or with a way to
manually try queries against the node picker and compare before/after
(ranking fix) — neither of which is available in this session.

## 2026-08-25 — Autosave (tier 2, item 5)

**Files:** `packages/sdp-client-electron/src/view/containers/App.jsx`

**What:** IDE had zero autosave — matched the original review finding.
Added a 2-minute interval (`AUTOSAVE_INTERVAL_MS`) started in
`componentDidMount`, cleared in `componentWillUnmount`. Each tick
(`onAutosaveTick`) reuses the exact same `saveAs()` path manual Save uses,
guarded so it never surprises the user or races itself:
- Skips if there are no unsaved changes.
- Skips if the project has never been saved yet (no known `projectPath`) —
  never pops a Save As dialog unprompted.
- Skips if a save (manual or autosave) is already in flight
  (`this.props.saveProcess` truthy), so ticks can't pile up.
- On failure, surfaces the error via the existing `showError`/`addError`
  path rather than swallowing it — silent failure of the thing protecting
  against data loss seemed worse than a manual Save's existing
  `.catch(noop)`.

No new UI: reuses the existing `SaveProgressBar` (already driven by
`saveProcess`) for feedback instead of adding a toast on every tick.

**Verification:** re-linted with the real `eslint` later in this session —
clean except pre-existing issues (confirmed via diff, same method as the
About dialog entry). No automated test coverage (no existing test harness
for this container component) and no manual run — this environment's Node
(20.19.4) is below the repo's engine requirement (>=22.12.0), and Electron
itself was never actually launched this session.

**Not done:** no settings toggle to disable autosave. Scoped out to keep
this shippable; flagging as a natural follow-up if 2 minutes turns out to
be the wrong interval or someone wants it off entirely.

## 2026-08-25 — About dialog (tier 2, item 6)

**Files:**
- `packages/sdp-client/src/popups/constants.js` — new `POPUP_ID.ABOUT`
- `packages/sdp-client/src/popups/actionTypes.js` — new `SHOW_ABOUT`/`HIDE_ABOUT`
- `packages/sdp-client/src/popups/actions.js` — new `showAbout`/`hideAbout`
- `packages/sdp-client/src/popups/reducer.js` — reducer cases for the above
- `packages/sdp-client/src/core/containers/App.jsx` — `showAbout`/`hideAbout`
  added to the shared `App.actions` map and `App.propTypes.actions`
- `packages/sdp-client/src/utils/menu.js` — new `items.about` menu entry
- `packages/sdp-client-electron/src/view/containers/App.jsx` — wired
  `about` into `mapStateToProps.popups`, added `renderPopupAbout()`, added
  "About SolderPop IDE..." to the Help menu (opens the dialog instead of
  just showing the disabled version label)
- `packages/sdp-client-electron/src/view/components/PopupAbout.jsx` (new)
- `packages/sdp-client-electron/src/view/styles/components/PopupAbout.scss` (new)
- `packages/sdp-client-electron/src/view/styles/main.scss` — import the new scss

**What:** Help menu previously only showed a static, disabled "Version:
x.x.x" label. Added an actual About dialog (SolderPop logo, version,
Documentation/Forum links) reusing the existing `.theme-window*` popup
chrome and `SolderpopLockup` component already proven by
`ThemeSettingsPopup`/`WelcomeDialog` — no new dialog primitives introduced.
Electron-only (matches where `WelcomeDialog` lives): the render call and
component live in `sdp-client-electron`, not the shared base `App.jsx`
used by the browser client too, since it needs `shell.openExternal`.

**Verification:** initially only `esbuild` parse + standalone `sass`
compile (no `node_modules` installed yet at that point). Later in this
session got a real toolchain working (see the compile-pipeline test entry
below for how) and re-ran real `eslint` against every file touched here —
clean except pre-existing issues already present before this change
(confirmed via `git diff` hunks not overlapping the flagged lines, and by
running eslint against an untouched file with the same pre-existing
`import/no-unresolved` on `sdp-client`). One genuine new issue
(`class-methods-use-this` in the new `PopupAbout.jsx`) found and fixed by
making `openDocs`/`openForum` module-level functions instead of instance
methods, since neither used `this`. No project build/test harness exists
for UI popups, so still no automated coverage or manual click-through of
the actual rendered dialog.

**Dropped from scope:** a "License" link — would have needed an unverified
`solderpop.io/license` marketing-site path; not worth guessing at, so the
dialog only links to the two routes already proven elsewhere in this file
(`/docs/` and the forum).

Running log of every change made on this branch, kept so the work can be
split into smaller PRs later. Newest entries on top. Each entry: what
changed, why, and which "tier" it maps to from the initial codebase-review
pass (tier 1 = ClickClack hardware differentiation, tier 2 = quick UX wins,
tier 3 = branding/dep cleanup).

## 2026-08-25 — ClickClack pin-mapping Arduino library (tier 1, item 1)

**Files:**
- `workspace/__ardulib__/ClickClack/` (new) — `library.properties`,
  `keywords.txt`, `README.md`, `src/ClickClack.h`,
  `src/ClickClack_Spark.h`, `src/ClickClack_Horizon.h`,
  `src/ClickClackAddresses.h`, `examples/ReadPrimaryBus/ReadPrimaryBus.ino`
- `workspace/__ardulib__/README.md` — added ClickClack to the library index

**What:** Named pin constants (`CC_SDA`, `CC_SCL`, `CC_INT`, etc.) and I2C
address constants (`CC_ADDR_TEMPSENSE_SHT40`, etc.) for ClickClack boards,
sourced from `clickclack-hardware/docs/ClickClack_Pin_Allocation.ods`
("Connector Spec v3" and "Master I2C Address Map" sheets).

**Scope actually shipped vs. original tier-1 ask:** the original review
recommendation was "add a ClickClack board manifest (`package_index.json` +
`boards.txt`/`platform.txt`)" so ClickClack shows up as a selectable board in
Arduino Boards Manager. On investigation that requires forking Espressif's
`esp32` platform and Adafruit's `nRF52` platform (each is hundreds to tens
of thousands of lines of build recipes/toolchain config, actively
maintained upstream) — a real, ongoing engineering commitment, not a
self-contained change, and getting a build recipe wrong silently breaks
compiles for every user. Reframed (confirmed with user) to: target the
existing upstream boards ("ESP32C3 Dev Module" for Spark, "Adafruit Feather
nRF52840 Express" for Horizon) and ship the pin-naming layer instead.

**Spark (ESP32-C3): fully implemented.** ESP32 Arduino core GPIO numbers are
chip-level, not devkit-numbering-scheme dependent, so this is safe on real
hardware regardless of which ESP32-C3 devkit entry is selected.

**Horizon (nRF52840): intentionally NOT implemented.** Two independent
blockers, documented in `src/ClickClack_Horizon.h`:
1. The source spreadsheet's nRF52840 column is almost entirely unfilled
   placeholder text, and where filled, contains a real contradiction
   (primary UART and "alt/second UART" both listed on the same physical
   pins P0.06/P0.08).
2. Even a complete P0.xx map couldn't safely become Arduino pin numbers via
   the stock "Adafruit Feather nRF52840 Express" variant, because nRF52
   Arduino pin numbers index into a per-board pin table
   (`g_ADigitalPinMap`), not the chip's physical port/pin — and Horizon is
   a custom PCB, not a Feather. Needs a real Horizon-specific Arduino
   variant to do correctly.

Including this header on a board other than the two above (or on Horizon)
is a compile-time `#error`, by design — wrong-but-plausible pin values
would be worse than a build failure.

**Known spec issues found while transcribing (need a hardware-team fix in
the source `.ods`, not a code fix):**
- Connector pin 8 (`GPIO_B`) and pin 13 (`GPIO_A/LED`) both assigned GPIO5
  on Spark.
- Connector pin 4 (`SPI_CS1`) and pin 10 (`AIN1`) both assigned GPIO3;
  pin 6 (`SPI_CS2`) and pin 26 (`SDA2`) both assigned GPIO10. (All Reserved
  status, so left undefined in the header rather than picking one.)
- Software-SPI pins (14/16/18) have a chosen bit-bang strategy but no
  chosen GPIO numbers yet.

**Follow-ups this uncovered (not started):**
- Real `solderpop:esp32` / `solderpop:nrf52` Boards Manager platform, if
  first-class board selection (vs. picking a generic devkit + this header)
  is wanted later.
- Pin the two upstream boards above as defaults/recommended in the IDE's
  board picker UI, instead of showing the full generic Arduino board list.
- ClickClack-specific visual-language stdlib nodes (tier 1, item 2) —
  natural next step once a board is selectable; can reuse the I2C address
  constants from this library.
- User-facing ClickClack docs (tier 1, item 3) — `docs/` currently has only
  an internal ESM-migration log.

## 2026-08-25 — caveman-init rule files + .gitignore

**Files:** `.cursor/rules/caveman.mdc`, `.windsurf/rules/caveman.md`,
`.clinerules/caveman.md`, `.github/copilot-instructions.md`,
`.opencode/AGENTS.md`, `AGENTS.md` (all new, then added to `.gitignore`)

**What:** Ran `caveman-init` to drop the caveman activation rule into every
supported IDE-agent rule file. Then gitignored all of them per user request
— these are local dev-tooling config, not meant to be committed.

**Tier:** not part of the codebase-improvement review; unrelated tooling
housekeeping done earlier in this session.
