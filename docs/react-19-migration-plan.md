# React 16 → 19 migration plan

Status: phases 1-4 of 8 done (see below). Written 2026-09-01 after
`docs/roadmap.md`'s "React 16 -> 19" entry turned out to significantly
undersell the real scope -- that entry
listed 4 blockers (`ReactDOM.render`, `react-redux`, `react-codemirror`,
`react-skylight`) found by grepping for the well-known React-18-removal
landmines. A full pass over `sdp-client`'s actual dependency list turned up a
much longer tail of React-16-era component libraries, several pinned to
pre-hooks-era major versions with completely different APIs than their
current ones. This is a full-stack rebuild of the app's component layer, not
a version bump -- multi-week, not a single session.

## Why this is a separate effort

Every other modernization series this branch has done (eslint, oclif,
puppeteer, Storybook, the ESM migration, the XOD->SDP rename) touched
tooling or file formats -- verifiable by running a build, a test suite, or a
grep. This one touches the actual rendered UI of a desktop app, in a sandbox
that cannot run Electron's GUI at all (`electron-mocha` fails headlessly --
confirmed and documented earlier this branch, see the changelist's "Two
follow-ups" entry). Verification for most of this plan has to be: build
compiles clean, lint clean, the non-GUI unit tests still pass, *and a human
runs the app and clicks around* -- the last step can't be automated away
here the way it has been for everything else this session.

## Scope inventory (as of this writing)

All three GUI packages (`sdp-client`, `sdp-client-browser`,
`sdp-client-electron`) are on `react@^16.2`, `react-dom@^16.2`. `sdp-client`
is the shared component library both apps consume via the pnpm workspace,
so its migration gates both.

### Libraries that need a real rewrite, not just a version bump

| Library | Pinned | Latest | Files | Why it's a rewrite |
|---|---|---|---|---|
| `react-dnd` + `react-dnd-html5-backend` | `^2.5.1` | `16.0.1` | 4 | v2's `@DragSource`/`@DropTarget`/`DragDropContext` decorator API was fully replaced by hooks (`useDrag`/`useDrop`) around v10. Core to the patch editor's node dragging. |
| `react-contextmenu` | `^2.9.1` | `2.14.0` (2022, abandoned) | 7 | Latest release's own peer dep caps at `react: ^16.0.1` -- never went further. No upgrade path; needs replacing with a different library entirely. |
| `react-hotkeys` | `^1.1.4` | `2.0.0` (2022, abandoned) | 13 | v1->v2 is a real API generation gap (v2 added hooks alongside the old HOC/component API). Last release 2022; peer dep (`>=0.14.0`) is unmaintained-permissive, not a verified React-19 claim. Core to the Patch editor's whole keyboard-mode system (`selecting`, `linking`, `panning`, `moving`, etc. -- 8 of the 13 files are these mode handlers). |
| `react-sortable-hoc` | `1.6.1` | check at migration time | 1 (`Tabs.jsx`) | HOC-era, uses `contextTypes` internally in older versions -- confirm current major's React-19 story before committing to it over a replacement (e.g. `dnd-kit`'s sortable preset). |
| `react-codemirror` | `^1.0.0` | abandoned, capped `react <16` | 2 | Wraps CodeMirror 5. Already silently broken today (loose peer-dep enforcement is the only reason it still runs). Decision made: replace with `@uiw/react-codemirror` (CodeMirror 6). `codemirrorXodMode.js` is a **custom CM5 syntax-highlighting mode** (`CodeMirror.simpleMode` + `CodeMirror.overlayMode`, defining a `text/x-c++xod` MIME type with XOD-specific keyword/type/builtin highlighting layered over C-like syntax) -- CM6 has no equivalent APIs at all. Port plan: `@codemirror/language`'s `StreamLanguage.define({ token(stream, state) {...} })` primitive was built specifically to ease this kind of CM5->CM6 port and has a largely compatible `StringStream` API, combined with `@codemirror/legacy-modes/mode/clike`'s existing stream parser as the base to layer the XOD overlay logic on top of (one combined `token()` that checks XOD regexes first, falls through to the clike tokenizer otherwise) -- not a full Lezer grammar rewrite. |
| `react-skylight` | git fork, pinned commit | n/a (abandoned upstream) | 7 | Decision made: hand-patch the existing `xodio/react-skylight` fork for whatever breaks under React 19, rather than replacing the library. Scope of the patch itself unknown until attempted -- likely lifecycle-method and/or `findDOMNode`-adjacent (though no `findDOMNode` calls exist in *our* code; need to check the fork's own source). |
| `react-event-listener` | `^0.5.3` | `0.6.7`, peer dep caps `react ^16.3.0` | 6 | Abandoned, no React-19-compatible release. Trivial replacement: a `useEffect` adding/removing a native `window`/`document` event listener. Low risk, high file count. |
| `recompose` | `^0.25.0` | `0.30.0`, peer dep caps `react ^16.0.0` | 3 | Officially deprecated by its own maintainers (React team recommends hooks). `shouldUpdate` -> `React.memo` with a custom comparator; `withState`/`withHandlers`/`lifecycle` (used together in `StringPinWidget.jsx`) -> `useState` + inline handlers + `useEffect`. Low risk, low file count. |

### Libraries that likely just need a version bump (verify, don't assume)

- `react-datasheet`: pinned `^1.3.10`, latest `1.4.12`'s peer dep is
  `react: '>=16'` with no ceiling -- probably fine, but "probably" isn't
  "verified"; it's old and simple enough that a real runtime check
  (`TabtestEditor.jsx`, `TableLog.jsx`) shouldn't take long.
- `react-collapsible`, `react-highlight-words`, `react-reflex` -- current
  majors already declare `react: ^19.0.0` support. Straightforward bumps
  (done in phase 4, see below).
- ~~`react-resize-detector`~~ -- turned out **not** to be a safe bump, see
  phase 4: the current major dropped its component export entirely
  (hook-only now), which the "likely fine" assessment missed by only
  checking peer-dep support, not the actual API surface across an
  8-major jump. Rewritten onto native `ResizeObserver` instead (phase 4).
- Vendored/forked packages already living in this repo:
  `rc-menu` (`vendor/rc-menu`), `react-autosuggest` and `react-custom-scroll`
  (both `xodio/*` git forks, 2 and 3 files respectively) -- being
  hand-maintained already, same "patch what breaks" treatment as
  `react-skylight`, just not yet investigated for what that entails.

### The redux stack itself

`redux@^3.0.5` -> `5.0.1`, `react-redux@^4.0.6`/`^4.4.5` -> `9.x`,
`redux-thunk@^2.1.0` -> `3.x`, `reselect@^2.5.4` -> `5.x`. 21 files
(`sdp-client` + `sdp-client-browser` + `sdp-client-electron` combined) call
`connect(`. Spot-checked for the riskier `connect()` options
(`mergeProps`, `areStatesEqual`, `pure: false`) -- none found, so the
`connect()` call sites themselves are likely mechanical. The real risk is
behavioral, not syntactic: react-redux v6 rewrote the whole subscription
model around React's Context API (replacing the old manual store-subscribe
tree-walk), which changes *when* connected components re-render relative to
each other -- exactly the kind of thing that only shows up by actually using
the app, not by reading a diff.

### Legacy Context API (`contextTypes`/`childContextTypes`)

Fully removed in React 19, not just deprecated (unlike the lifecycle
methods, which still work with warnings under 19 but not under some
stricter future major). 3 files, independent of any library choice above:
`project/components/NodePinsOverlay.jsx`, `project/components/Node.jsx`,
`editor/containers/Patch/index.jsx`. Needs conversion to
`React.createContext` regardless of what else lands first.

### Everything already known from `docs/roadmap.md` (unchanged, still accurate)

- `ReactDOM.render()` -> `createRoot()` from `react-dom/client`: 2 entry
  points, `sdp-client-browser/src/index.jsx` and
  `sdp-client-electron/src/index.jsx`.
- 9 files on deprecated lifecycle methods (`componentWillMount`,
  `componentWillReceiveProps`, `componentWillUpdate`):
  `Autoscroll.jsx`, `PopupShowCode.jsx`, `PopupProjectPreferences.jsx`,
  `ColorPicker/index.jsx`, `SnackBar.jsx`, `Sidebar.jsx`,
  `ThemeSettingsPopup.jsx`, `Patch/index.jsx`, `PopupInstallApp.jsx`.
- ~~2 files on string refs~~ -- false alarm, see phase 3 below: the
  original grep matched `href="..."` substrings, not `ref="..."`.
- No `ReactDOM.findDOMNode` call sites found anywhere in this codebase's own
  source -- one less thing to worry about, though some of the libraries
  above may use it internally.

## Suggested phase order

Ordered by dependency (later phases assume earlier ones landed) and by
risk (mechanical-and-verifiable first, runtime-behavior-only-verifiable
last):

1. **DONE (2026-09-01). Legacy Context API removal** (3 files) --
   independent prerequisite, React 19 hard-fails without it regardless of
   anything else. `nodeHoverContextType.js` now exports a real
   `React.createContext(...)` instead of a bare PropTypes shape. The two
   consumers (`Node.jsx`, `NodePinsOverlay.jsx`) use
   `static contextType = NodeHoverContext` -- a clean 1:1 swap since both
   only ever consumed this one context (`this.context.nodeHover.x` ->
   `this.context.x`, dropping the namespacing `contextType` doesn't need).
   The provider (`Patch/index.jsx`) turned out to also read the redux
   store straight out of legacy context (`this.context.store.getState()`
   -- react-redux v4/v5's own internal store-provisioning mechanism, not
   something we put there) alongside its own `nodeHover` context -- fixed
   by adding `project: ProjectSelectors.getProject` to the container's
   existing `mapStateToProps` instead of reaching into context, which
   also removes a dependency on react-redux's legacy internals ahead of
   the phase-4 version bump. `getChildContext()` became a
   `<NodeHoverContext.Provider value={...}>` wrapped around the existing
   render output. Verified: full build (18/18), lint clean, `sdp-client`
   unit suite (104/104).
2. **DONE (2026-09-01). `react-event-listener` + `recompose` removal**
   (9 files combined). `react-event-listener`'s 6 sites: the 3 simple
   function-component popups (`PopupAlert`/`PopupForm`/`PopupConfirm`)
   moved their single `document` `keydown` listener into a `useEffect`;
   the class-based `PopupPrompt` moved it into
   `componentDidMount`/`componentWillUnmount`; the two app shells
   (`sdp-client-browser` and `sdp-client-electron`'s `App.jsx`, both
   already class components with existing `componentDidMount`/
   `componentWillUnmount` pairs) got their `window` `resize`/`keydown`
   (and, browser-only, `beforeunload`) listeners folded into those same
   methods instead of a separate `<EventListener>` element. `recompose`'s
   3 sites: `shouldUpdate(test)` -> `React.memo(Component, (a, b) =>
   !test(a, b))` (memo's comparator is inverted from recompose's --
   "props equal, skip re-render" vs. recompose's "props differ, do
   re-render") in `pureDeepEqual.js` (a HOC factory, so this fix alone
   covers its own 5 downstream consumers unchanged) and
   `DebuggerTopPane.jsx`; `StringPinWidget.jsx`'s
   `compose(withState, withState, withState, withState, lifecycle,
   withHandlers)` chain rewritten as a plain function component with
   `useState`/`useRef`/`useEffect` (the `inputRef` piece changed from
   `withState` to `useRef`, which doesn't trigger a re-render on ref
   attach the way the old state-based version did -- strictly more
   correct, not a behavior change worth preserving). Verified: full
   build (18/18), lint clean, `sdp-client` unit suite (104/104), and a
   `grep` confirming zero remaining references to either package before
   removing them from all 3 package.jsons and reinstalling.
3. **DONE (2026-09-01). Deprecated lifecycle methods + string refs.**
   String refs turned out to be a false alarm -- the original grep
   (`ref="`) matched `href="..."` substrings; a stricter pass (`grep '
   ref="[a-zA-Z]'` plus a check for `this.refs.`) found zero real ones.
   Lifecycle methods, 9 files: `Autoscroll.jsx`'s `componentWillUpdate`
   was the one genuine `getSnapshotBeforeUpdate` case in the whole set --
   it reads `scrollHeight` from the DOM right before the update, which is
   exactly what that lifecycle method exists for (its return value now
   flows into `componentDidUpdate`'s third `snapshot` argument instead of
   an instance field). The other 8 were all `componentWillReceiveProps`
   -> `componentDidUpdate`, mostly a mechanical `nextProps` -> `this.props`
   / `this.props` -> `prevProps` swap, except two real gotchas worth
   remembering for the rest of this migration:
   - `PopupProjectPreferences.jsx` called `setState` **unconditionally**
     on every `componentWillReceiveProps`. That's safe there (still
     inside the same pre-commit update cycle) but becomes an infinite
     loop in `componentDidUpdate` (`setState` there triggers a whole new
     render -> `componentDidUpdate` -> `setState` -> ...). Added the
     `prevProps.project !== this.props.project` guard the original never
     needed.
   - `SnackBar.jsx`'s `addMessages` doesn't call `setState` at all -- it
     mutates a plain instance field (`this.messages`) that `render()`
     reads directly, relying on `componentWillReceiveProps` running
     *before* the commit so the same render sees the mutation.
     `componentDidUpdate` runs *after* the commit, so a newly-added
     message wouldn't appear until some unrelated re-render happened to
     fire later. Fixed with an explicit `this.forceUpdate()`, gated on
     whether `addMessages` actually added anything (it's idempotent --
     already-tracked ids are skipped -- so this can't loop either).
   - `ColorPicker/index.jsx`'s original condition compared **state**
     against the incoming prop (`this.state.color` vs `nextProps.color`),
     not old-prop against new-prop -- worth a second look on anything
     using `this.state` inside `componentWillReceiveProps`, since a
     blind `prevProps`/`this.props` swap silently changes the comparison
     basis on those. Also touched `Patch/index.jsx` (`sdp-client`) again,
     merging its `componentWillReceiveProps` logic into the
     `componentDidUpdate` phase 1 already added there.
   Verified: full build (18/18), lint clean, `sdp-client` unit suite
   (104/104).
4. **DONE (2026-09-01). `react`/`react-dom`/`react-redux`/`redux`/
   `redux-thunk`/`reselect` bump + `createRoot`.** react 16.2 -> 19.2.8,
   react-dom same, react-redux 4.x -> 9.3.0, redux 3.0.5 -> 5.0.1,
   redux-thunk 2.1.0 -> 3.1.0, reselect 2.5.4 -> 5.3.0, across all 3 GUI
   packages. `ReactDOM.render` -> `createRoot(...).render` in both entry
   points as planned. Real fallout, beyond what the plan anticipated:

   - **`redux-thunk@3` dropped its default export** (`thunk` is now a
     named export only). One real site (`sdp-client/src/core/
     middlewares.js`) plus three test files
     (`test/project.spec.js`, `test/reducers/editor.spec.js`,
     `test/hinting.spec.js`) all had the same
     `typeof thunkModule === 'function' ? thunkModule : thunkModule.default`
     interop shim -- a defensive pattern from some earlier CJS/ESM
     transition that never actually needed to survive this far. Replaced
     with a plain `import { thunk } from 'redux-thunk'` everywhere and
     deleted the shim.
   - **`react-redux/src/utils/storeShape.js` doesn't exist any more**
     (`Catcher.jsx` imported this internal file directly -- never part of
     react-redux's public API to begin with, and v9's `exports` field
     blocks deep imports like this entirely). Replaced with an explicit
     `PropTypes.shape({ getState, subscribe, dispatch })`.
   - **`connect()`'s `withRef: true` option was renamed `forwardRef: true`**
     in react-redux v6 (3 sites: `Patch/index.jsx`,
     `sdp-client-browser` and `sdp-client-electron`'s `App.jsx`). No
     `.getWrappedInstance()` call sites existed to go with it (the old
     v4/v5 way of reading the ref), so this was a clean rename with
     nothing downstream to fix.
   - **`react-resize-detector` needed a full rewrite, not a bump** --
     the plan's "likely just needs a bump" table was wrong about this
     one specifically (didn't check the version-jump *magnitude*, only
     that the peer dep claimed React 19 support). Checked the actual
     package contents: v12 exports `useResizeDetector` only, no default
     component export at all -- the existing `<ReactResizeDetector
     handleWidth handleHeight onResize={fn} />` render pattern (2 sites:
     `TabsContainer.jsx`, `Patch/index.jsx`, both class components that
     can't call a hook directly) would have resolved to `undefined` as a
     component and crashed immediately. Replaced both with a native
     `ResizeObserver` set up in `componentDidMount`/disconnected in
     `componentWillUnmount`, observing the same DOM node the old
     component implicitly watched. Dropped the dependency entirely.
   - **`react-reflex` (2.2.9 -> 6.0.2, four majors) and
     `react-highlight-words` (0.8.1 -> 0.21.0) bumped and build-verified**
     -- component names/props for both still match what's actually used
     (`ReflexContainer`/`ReflexElement`/`ReflexSplitter` with the same
     prop shapes; `Highlighter`'s `className`/`searchWords`/
     `textToHighlight` API has been stable across its whole history) --
     but a version jump that size deserves real UI verification before
     calling it done, not just a clean build. Flagging both for the
     manual-verification pass along with everything in phase 7-8's
     territory. `react-collapsible` (2.0.3 -> 2.10.0) and `react-datasheet`
     (1.3.10 -> 1.4.12) are same-major, lower-risk bumps.
   - **Confirmed, reproducible, real**: `rc-trigger` (a dependency of the
     vendored `rc-menu` fork) calls `ReactDOM.findDOMNode`, fully removed
     in React 19. Webpack only warns at build time (doesn't fail the
     build), but this **will throw at runtime** the moment a submenu
     actually opens. This is exactly the vendored-fork territory phase 8
     already reserved -- now scoped concretely instead of "patch what
     breaks, TBD": patch `rc-trigger` itself (external, not the vendored
     package) or replace the `findDOMNode`-dependent positioning logic.

   Verified: full build (18/18, only the known `rc-trigger` warnings
   above), lint clean. `sdp-client` unit suite: 103/104 -- the 1 failure
   (`Editor reducer > working with tabs > should add new tab`) is
   pre-existing and unrelated: `createTabsStore` in that test file only
   combines `{ editor: editorReducer }`, but the `switchPatch` action it
   dispatches reads `state.project` -- `state.project` is `undefined`
   regardless of redux version, confirmed by reading the test setup
   directly (not something a redux-version bump could have caused).
   Both the test file and the action have been untouched since the base
   `e39bc6f4` modernization commit, matching the pattern of the other
   pre-existing failures found earlier this branch (`sdp-project`,
   `sdp-patch-search`). `sdp-client-electron`'s `electron-mocha` suite
   still fails with the same pre-existing headless-sandbox error as
   before (confirmed unchanged, not a new React-19 issue) -- this
   sandbox genuinely cannot verify GUI behavior; every item flagged
   above (`react-reflex`, `react-highlight-words`, the `ResizeObserver`
   rewrites, `createRoot`, `forwardRef`, the whole redux subscription
   timing change) needs a human running the actual app before this
   phase can be called fully verified, not just build-clean.
5. **`react-codemirror` -> `@uiw/react-codemirror`** (2 files, 1 of them a
   real tokenizer port) -- self-contained (C++ implementation editor only),
   can happen in parallel with phase 4 once React itself is on 19.
6. **`react-skylight` fork patch** (7 call sites, 1 vendored fork to patch)
   -- likely small once attempted, but unknown until attempted.
7. **The real rewrites**: `react-dnd` (4 files, decorator->hooks), then
   `react-contextmenu` replacement (7 files), `react-hotkeys` major-version
   verification or replacement (13 files, includes the entire Patch editor
   mode system), `react-sortable-hoc` verification or replacement
   (1 file). Do these last and one at a time -- each is its own scoped
   effort with its own risk, not a batch.
8. **Vendored/forked packages**: `rc-menu`, `react-autosuggest`,
   `react-custom-scroll` -- patch whatever breaks, same treatment as
   `react-skylight`. Left last because they can't be scoped until the app
   actually runs on React 19 far enough to exercise them. One is no
   longer speculative as of phase 4: `rc-menu`'s own dependency
   `rc-trigger` calls `ReactDOM.findDOMNode` (fully removed in React 19)
   for submenu positioning -- confirmed via a real build warning, will
   throw at runtime the first time a submenu opens. Needs either patching
   `rc-trigger` itself or replacing its positioning logic.

## Verification strategy

Same discipline as every other migration this branch: build + lint clean
after every phase, non-GUI test suites (`sdp-client`'s 104 unit tests,
`sdp-fs`, etc.) passing throughout. But phases 4 onward need an actual
human running the actual Electron app and exercising the actual feature
(drag a node, open the context menu, use a keyboard shortcut mid-drag,
open the C++ editor, trigger a Skylight modal) -- flag each phase's
"needs manual verification" checklist explicitly when the work happens,
don't claim a phase done on build-passes alone once UI behavior is on the
line.
