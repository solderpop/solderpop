# Branch changelist — feature/general-improvements

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
