# React 16 → 19 migration plan

Status: all 8 phases done (2026-09-03). Phase 7's real rewrites
(react-dnd, react-sortable-hoc, react-hotkeys) were pulled forward out
of necessity, ahead of phases 5-6 -- all three turned out to be hard
crashes, not deferrable; react-contextmenu (also phase 7) turned out to
need no rewrite at all once actually tested. Phase 8's vendored/forked
packages (rc-menu's rc-trigger dependency, react-autosuggest,
react-custom-scroll) are patched and verified. Written 2026-09-01 after
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
5. **DONE (2026-09-01). `react-codemirror` -> `@uiw/react-codemirror`.**
   Bigger than the plan's "2 files" estimate once actually attempted --
   the CM5 `.scss` theme (480+ lines, entirely built on CM5's DOM
   structure and CSS class scheme like `.CodeMirror-gutters`/`cm-keyword`/
   `cm-variable-2`) doesn't apply to CM6 at all, which themes via
   `EditorView.theme()` plus a Lezer-tag-based `HighlightStyle` --
   deleted the whole file and ported the actual XOD color values (pulled
   from `abstracts/colors.scss`) into JS.

   The tokenizer port (`codemirrorXodMode.js`): CM5's
   `CodeMirror.simpleMode`+`CodeMirror.overlayMode(cpp)` pair has no CM6
   equivalent -- CM6 has no overlay-mode concept at all. Rebuilt as one
   `StreamLanguage.define()`-based tokenizer that tries the XOD regex
   rules first (now gated on an actual word-boundary check the CM5
   original didn't have -- see below) and falls through to
   `@codemirror/legacy-modes/mode/clike`'s `cpp` parser for everything
   else. Two real bugs caught only by *running* the result, not by
   reading it:

   - `HighlightStyle.define`'s tag API isn't a property path
     (`t.variableName.function` -- what a first pass used) but a
     function-call composition (`t.function(t.variableName)`). Crashed
     immediately (`Cannot read properties of undefined (reading 'id')`)
     the first time anything tried to render. Found the *correct*
     mapping for the legacy `'builtin'` token-name string
     (`variableName.standard`, i.e. `t.standard(t.variableName)`, not
     the guessed `t.standard(t.name)`) by reading
     `@codemirror/language`'s own source for its CM5-compat token table
     rather than guessing twice -- confirmed empirically afterward via
     `highlightTree` against real source strings (`digitalWrite`,
     `getValue`, `node`, `input_a`, etc.), not just "it doesn't throw."
   - **Two duplicate package instances**: `@codemirror/state` (6.7.1 vs
     6.7.2) and `@codemirror/view` (6.43.9 vs 6.43.10) both had two
     copies installed simultaneously -- `@uiw/react-codemirror`'s own
     dependency tree resolved a slightly older patch than this package's
     direct pin. CM6 breaks with "Unrecognized extension value" if two
     instances of these packages load at once (its extension system
     relies on `instanceof` checks). Caught by a direct Node script
     trying to actually build an `EditorState`, not by the build (pnpm
     had silently installed both side by side; webpack would have
     bundled whichever one resolved per import site with no error).
     Fixed with two `pnpm-workspace.yaml` overrides forcing one instance
     of each.

   Editor behavior (Tab/Shift-Tab/Enter/comment-toggle) needed the same
   direct-execution discipline. `@codemirror/commands`' `insertTab`
   command unconditionally inserts a literal `"\t"` -- CM6 has no
   unit-aware "soft tab" command at all, unlike CM5's `insertSoftTab`
   that the original code relied on by default (this codebase never sets
   `indentWithTabs`). Missing this would have silently inserted hard tabs
   everywhere the original inserted 4 spaces. Fixed by reading the
   `indentUnit` facet (now explicitly set to 4 spaces -- `@uiw`'s own
   `basicSetup.tabSize` option only controls cosmetic tab-rendering
   width, a different facet, not indent behavior) and inserting that
   string directly. `EditorView` itself can't run in this repo's headless
   test environment (needs DOM Selection/ResizeObserver APIs older
   `jsdom` doesn't implement), so the keymap's `run` functions are
   exported unwrapped (`xodKeyBindings`) specifically so they can be
   exercised against a DOM-free fake view backed by real
   `EditorState.update()` calls -- verified all four bindings
   (full-line-selection indent, cursor-only soft-tab insert, blank-lines-
   above-cursor clearing on Enter, and `Mod-/` comment toggling) produce
   exactly the documents expected, not just "doesn't throw."

   Verified: full build (18/18, same pre-existing `rc-trigger` warnings
   as phase 4, no new ones), lint clean, `sdp-client` unit suite 103/104
   (same pre-existing failure, unrelated). Tag resolution verified via
   `highlightTree` against real source text; all 4 keymap bindings
   verified via direct `EditorState.update()` round-trips. Still
   genuinely unverified: the *rendered, visual* result -- font, exact
   colors on screen, cursor behavior, scrolling -- needs a human actually
   opening the C++ implementation editor in the running app.
6. **DONE (2026-09-01). `react-skylight` fork -- turned out to need no
   patch at all.** Read the fork's actual `lib/` source (what's really
   consumed, not just `src/`) for React-19-removed APIs first: no
   `findDOMNode`, no string refs, no legacy Context API. The one hit --
   `componentWillUpdate` in the stateful `SkyLight` class (`lib/
   skylight.js`; the other 4 of 6 call sites use `SkyLightStateless`,
   which has none of this) -- is still functional in React 19, just
   deprecated, per React's own docs.

   Didn't stop at reading the source, though: this package has never
   been touched by this repo's test suite (grepped for it -- zero
   hits), so "no removed APIs in the source" wasn't enough to call it
   done on its own. Verified by actually mounting and updating both
   components for real: `react-dom/server`'s `renderToStaticMarkup`
   first (catches import/construction errors, no DOM needed), then a
   real `createRoot` + jsdom mount-then-update cycle for each (catches
   anything that only breaks during reconciliation, like the
   `componentWillUpdate` path, which only fires on an update, not an
   initial mount). Also caught a real interop gotcha along the way,
   unrelated to React 19 itself: the package's CJS exports use
   `Object.defineProperty(exports, name, { get: ... })`, which Node's
   ESM `import` can't statically detect (`SkyLightStateless` resolved to
   `undefined` when dynamic-`import()`-ed directly) -- but this repo
   only ever consumes it through webpack or plain `require()`, both of
   which resolve it correctly, so it's not a real bug in the shipped
   app. `SkyLightStateless` mounted and updated with zero warnings;
   `SkyLight` mounted and updated with exactly the expected
   `componentWillUpdate` deprecation warning and nothing else. No code
   changes needed for this phase.
7. **The real rewrites.** `react-dnd`, `react-sortable-hoc`, and
   `react-hotkeys` all done out of order (2026-09-01/03, see below) --
   all three turned out to be hard crashes, not deferrable.
   `react-contextmenu` turned out not to need a rewrite at all -- see
   below.

   **DONE (2026-09-01, pulled forward). `react-dnd` 2.5.1 -> 16.0.1.**
   Wasn't a "whenever we get to it" item -- actually running the app under
   the phase-4 React 19 bump crashed hard:
   `DragDropContext`/`DragLayer`/`DropTarget`/`DragSource`'s legacy
   `childContextTypes`/`contextTypes`-based manager propagation is fully
   removed in React 19 (not deprecated), so `CustomDragLayer` couldn't
   find the drag-and-drop manager at all and threw on mount, which then
   exposed a second, independent bug (see below). No partial fix exists --
   the context mechanism is shared across all 4 files simultaneously, so
   this became phase 7's react-dnd item done now instead of later.

   v16 dropped the `DropTarget`/`DragSource`/`DragLayer`/`DragDropContext`
   HOC-factory API entirely (hooks only: `useDrag`/`useDrop`/
   `useDragLayer`/`DndProvider`) -- confirmed by checking the actual
   package's `dist/index.d.ts`, not assuming from memory. But the
   connector functions returned by the new hooks (`connectDropTarget`
   etc.) still accept being called with a JSX element the same way the
   old HOC's collect-function connectors did (confirmed by reading
   `wrapConnectorHooks.js` in the installed package: "If passed a
   ReactElement, clone it and attach this function as a ref") -- so
   `Patch/index.jsx`'s and the rewritten `PatchGroupItem.jsx`'s render()
   methods needed zero changes to their existing
   `connectDropTarget(<div>...)` / `connectDragSource(<div>...)` JSX.

   `Editor.jsx`: `DragDropContext(HTML5Backend)(Editor)` -> wrapped the
   class's own render() output in `<DndProvider backend={HTML5Backend}>`
   instead (`HTML5Backend` also changed from a default to a named
   export). `DragLayer.jsx`: converted `CustomDragLayer` fully to a
   function component using `useDragLayer` -- clean, no wrapper needed,
   it was already a simple presentational component.
   `PatchGroupItem.jsx`: also converted fully to a function component
   (`useDrag` + `useEffect` for the old `componentDidMount`'s drag-preview
   setup + `React.memo` for the old `shouldComponentUpdate`) -- small and
   self-contained enough that a full conversion was cleaner than a
   wrapper. `Patch` itself could not follow suit (400+ lines, deeply
   stateful, depended on by the mode-handler code for its instance
   methods) -- `dropTarget.jsx` (renamed from `.js`, now contains JSX)
   instead wraps it in a thin `forwardRef` function component that calls
   `useDrop` and keeps a `ref` to the real `Patch` instance, so `drop`/
   `hover` can still reach `dropTargetRootRef`/`addNode`/
   `goToDefaultMode`/`setModeStateThrottled` the same way the old HOC's
   `component` spec argument used to -- just via a ref instead of a
   direct argument.

   **A second, independent bug surfaced by the same crash**:
   `Catcher.jsx`'s `componentDidMount` called
   `this.appRef.refs.wrappedInstance.onFirstRun()` -- v4/v5 react-redux's
   `withRef: true` access pattern, stale since phase 4 renamed that
   option to `forwardRef: true` on the wrapped `App` (which makes the ref
   resolve directly to the instance, no `.refs.wrappedInstance`
   indirection needed). Missed updating this one consumer when phase 4
   did the rename elsewhere. Fixed to `this.appRef.onFirstRun()`; grepped
   the whole tree for `refs.wrappedInstance`/`getWrappedInstance` to
   confirm no other stale sites exist.

   **Verified, not just built clean**: this area had zero test coverage
   before (grepped -- confirmed), so build-passes-and-doesn't-crash
   wasn't enough on its own. Added a real regression test
   (`test/reactDnd.spec.js`) that mounts a real `useDrag` source and the
   actual `withDropTarget`-wrapped component (a minimal stand-in for
   `Patch`, since the real class is too large to instantiate in
   isolation) under `react-dnd-test-backend`, then *simulates an actual
   drag-hover-drop sequence* end to end and asserts `addNode`/
   `goToDefaultMode` were reached on the stand-in instance through the
   forwarded ref -- not just that nothing threw. Getting this test
   working surfaced two more real API details worth remembering: (1)
   `TestBackend`'s `simulateBeginDrag` requires an explicit
   `getSourceClientOffset` function in its options whenever a
   `clientOffset` is also given (`dnd-core`'s own `beginDrag` action
   throws `"getSourceClientOffset must be defined"` otherwise); (2)
   there's no registry method to enumerate all registered target ids up
   front (only a monitor-scoped `getTargetIds()` that's only meaningful
   *during* an active drag) -- the standard, idiomatic fix was adding
   `dropTargetHandlerId: monitor.getHandlerId()` to `withDropTarget`'s own
   `collect` function and forwarding it as a prop, which is also just a
   reasonable thing to have in the production code (react-dnd's own docs
   recommend exactly this pattern for exposing a handler id).
   Also: mocha's default recursive test discovery is `.js`-extension only
   (no `.mocharc` override in this repo) -- a `.jsx`-named version of the
   same test silently never ran at all under the real `pnpm test` script,
   caught by checking the passing count against expectations rather than
   trusting a green run.

   Verified: full build (18/18, same known `rc-trigger` warnings, no
   new ones), lint clean, `sdp-client` unit suite 104/104 (added 1, same
   1 pre-existing unrelated failure as every other phase). Still
   genuinely unverified: real mouse-driven dragging in the actual running
   app (node dragging from the sidebar, live drag-layer preview,
   drop-position snapping) -- the automated test proves the wiring is
   correct, not that it feels right at 60fps with a real pointer.

   **DONE (2026-09-03, pulled forward). `react-sortable-hoc` 1.6.1 ->
   removed, replaced with `@dnd-kit/core` + `@dnd-kit/sortable` +
   `@dnd-kit/utilities` + `@dnd-kit/modifiers`.** Also not a "whenever we
   get to it" item -- running the app surfaced a second hard crash
   alongside `react-hotkeys`'s (see below): `WithSortableElement`/
   `WithSortableContainer` call `ReactDOM.findDOMNode` internally, which
   React 19 removed outright. `react-sortable-hoc` itself is unmaintained
   (no release since the HOC-era API), so there's no version bump that
   fixes this -- a real replacement was the only option, same situation
   `react-dnd` was in. `Tabs.jsx` is the only consumer (confirmed by
   grep).

   Rewrote `Tabs.jsx` from a class (`sortableContainer`/`sortableElement`
   HOCs, `this.shouldComponentUpdate = deepSCU.bind(this)`) to a function
   component: `<DndContext sensors={...} collisionDetection={closestCenter}
   modifiers={[restrictToHorizontalAxis, restrictToParentElement]}
   onDragEnd={...}>` wrapping `<SortableContext items={...}
   strategy={horizontalListSortingStrategy}>`, with each tab a
   `useSortable({id: value.id})` consumer. `PointerSensor`'s
   `activationConstraint: {distance: 10}` matches the original's
   `distance={10}` (a plain click shouldn't register as a drag);
   `restrictToHorizontalAxis`/`restrictToParentElement` match
   `lockAxis="x"`/`lockToContainerEdges`. `onSortEnd`'s exact Ramda
   reindexing pipeline (`sortTabs`/`indexById`/`assocIndexes`/`R.insert`/
   `R.remove`) carried over unchanged, now driven off `active.id`/`over.id`
   instead of `oldIndex`/`newIndex`. `deepSCU`'s props-and-state deep-equal
   semantics don't map 1:1 onto a function component (there's no separate
   "state" to gate the way `shouldComponentUpdate` does -- `useState`
   updates always need to re-render), so the redux-facing half of it
   (skip re-render when connected props are unchanged) was replicated with
   `React.memo(Tabs, R.equals)` on the inner component, same pattern as
   phase 2's `pureDeepEqual` conversions.

   One layout bug caught before it shipped: `dnd-kit`'s `useSortable`
   wants its ref/attributes/listeners/style on the actual sortable
   element. Wrapping `<TabsItem>` in an extra `<div>` to hold them broke
   the tab bar's layout (`.TabsItem` is `display: inline-block`, a block
   `<div>` around it forces every tab onto its own line) -- fixed by
   threading `dndRef`/`style`/`dndAttributes`/`dndListeners`/`isSorting`
   through as props and applying them directly to `TabsItem`'s own `<li>`,
   no wrapper element.

   Verified: full build (18/18, same known warnings, no new ones), lint
   clean, `sdp-client` unit suite 104/105 (same 1 pre-existing unrelated
   failure as every other phase -- this area has no test coverage before
   or after, unlike react-dnd's). Still genuinely unverified: real
   mouse-driven tab reordering in the running app.

   **DONE (2026-09-03, pulled forward). `react-hotkeys` 1.1.4 -> removed,
   replaced with `react-hotkeys-hook` 5.3.3 + a new shared
   `HotkeysScope` component.** Third crash from the same running-the-app
   session as the other two: `HotKeys.componentDidMount` calls
   `ReactDOM.findDOMNode` directly, gone in React 19. react-hotkeys is
   abandoned (last release 2022); its own v2 is still effectively
   React-16-only despite a loosely-permissive peer dep, so -- same as the
   other two -- no version bump exists, only a real replacement. Scope
   turned out to be 14 files, not the plan's original estimate of 13:
   besides the 12 in `sdp-client` (`Editor.jsx`, `Sidebar.jsx`,
   `ProjectBrowser.jsx`, 9 Patch mode files), the root `<HotKeys
   keyMap={...}>` wrapping the *entire* app lives one level up, once each
   in `sdp-client-browser/containers/App.jsx` and
   `sdp-client-electron/view/containers/App.jsx` -- confirmed by matching
   the crash's own stack trace (`App.jsx:1115`) directly to the electron
   file.

   The real complexity wasn't the library swap itself, it was the
   app's existing keyboard-shortcut architecture: a `COMMAND` enum
   decoupled from actual key combos (`HOTKEY[COMMAND.X]`, Mousetrap
   syntax), consumed three different ways -- (1) most Patch mode files
   pass `handlers={{}}` and only ever used `<HotKeys>` as a focusable
   `<div tabIndex="-1">` wrapper (confirmed by reading react-hotkeys'
   own source: `HotKeys` renders `FocusTrap`, which renders exactly
   that div) -- these 6 files plus `Editor.jsx`/`Sidebar.jsx`'s bare
   `FocusTrap` usages needed nothing but a mechanical div swap, no new
   library at all; (2) 4 Patch mode files (`selecting`, inherited by
   `debugging`, `linking`, `marqueeSelecting`) and `ProjectBrowser.jsx`
   have real per-mode `handlers`, scoped to their own DOM subtree, mirror
   -ing react-hotkeys' per-instance Mousetrap-on-a-div binding; (3) both
   platform root `App.jsx` files merge a shared cross-platform
   `defaultHotkeyHandlers` (defined once in `sdp-client`'s base `App`
   class) with their own platform-specific additions, and Electron
   additionally filters out any command already bound to a native menu
   accelerator (except `SELECT_ALL`, deliberately double-bound) via a
   `getKeyMap()` static method.

   Also discovered along the way: the mode objects' `render(api)` methods
   are plain functions called directly from `Patch`'s own class
   `render()` (`MODE_HANDLERS[currentMode].render(api, project)`) -- not
   components themselves, so hooks (including `useHotkeys`) can't be
   called inside them at all. Same hooks-vs-plain-render-prop conflict
   `withDropTarget` solved for react-dnd, solved the same way here:
   `HotkeysScope` (`src/utils/components/HotkeysScope.jsx`, exported from
   `sdp-client`'s index as `HotkeysScope` for the two platform packages
   to consume) is itself a real function component wrapping a `<div>`,
   so it -- not the mode object -- is what actually calls the hooks.

   `HotkeysScope` preserves the app's exact `{ [COMMAND.X]: handler }`
   API and `HOTKEY`-driven combo resolution: it calls `useHotkeys` once
   per entry in the *entire* `COMMAND` enum (not just the active
   `handlers`), every render, unconditionally, gating each individually
   via its own `enabled` option. This isn't a hack -- `COMMAND` is a
   static import that never changes shape, so it's always the same
   fixed-length, fixed-order set of hook calls across renders of a given
   `HotkeysScope` instance, which is exactly what Rules of Hooks
   requires (it forbids a call count/order that *varies* between
   renders, not a `.map()` over a structurally-static array). Element
   scoping is preserved by merging every hook's returned ref callback
   onto the wrapper `<div>`. A `disabledCommands` prop lets Electron's
   `App.jsx` keep its native-menu-accelerator filtering (renamed
   `getKeyMap()` -> `getDisabledCommands()`, same underlying Ramda
   pipeline, just returning the filtered-out list directly instead of
   `R.omit`-ing it from a keyMap).

   Two translation/behavior details, found by reading actual sources
   rather than assuming: (1) `HOTKEY`'s Mousetrap-flavored combo syntax
   needed exactly two token translations for react-hotkeys-hook's own
   vocabulary -- `'CmdOrCtrl'` -> `'mod'` (its own cross-platform
   Cmd-or-Ctrl modifier, which made the app's separate manual
   `isMacOS()`-based OS branching in `utils/menu.js` unnecessary for this
   path) and `'del'` -> `'delete'`; single keys, `'ctrl'`/`'shift'`/
   `'alt'`, and array-of-alternatives all pass through unchanged. (2)
   react-hotkeys-hook's element-scoped mode additionally requires the
   *focused* element to be the scoped element or a descendant of it (not
   just that the keydown bubbled through it) -- reading its source
   turned up the exact check (`!a.contains(e.activeElement)`). This
   isn't actually a behavior change from Mousetrap's per-instance
   binding: native keydown bubbling only ever reaches an ancestor
   listener when the focused element is inside that ancestor's subtree
   in the first place, so the two are equivalent -- confirmed by the
   regression test needing an explicit `.focus()` call to pass, which
   simply mirrors focus management the real app already does elsewhere
   (e.g. `Patch` focusing its work area).

   One pre-existing bug found, not fixed silently: `ProjectBrowser.jsx`'s
   `getHotkeyHandlers()` had a `[COMMAND.ESCAPE]` entry, but `COMMAND` has
   no `ESCAPE` key -- it evaluated to `handlers.undefined`, which never
   matched any real key and so never fired, under react-hotkeys either.
   Dropped rather than guessing which real command/key was intended, and
   left noted in the code.

   **Verified, not just built clean**: this area also had zero test
   coverage before (grepped -- confirmed), so a new regression test
   (`test/hotkeysScope.spec.js`) mounts a real `HotkeysScope`, focuses
   it, and dispatches actual `KeyboardEvent`s matching a bound command's
   real resolved combo, asserting the handler fires -- and that a
   command listed in `disabledCommands` never fires despite having both
   a handler and a real combo. Writing it surfaced one more real
   detail: react-hotkeys-hook's focus-containment check references the
   bare globals `Document`/`ShadowRoot` (true ambient globals in a real
   browser), not `window.Document` -- jsdom only puts them on `window`,
   so the test environment needs `global.Document`/`global.ShadowRoot`
   shimmed explicitly; production code needs no such shim since real
   browsers already have them.

   Verified: full build (18/18, same known warnings, no new ones), lint
   clean, `sdp-client` unit suite 105/106 (added 1, same 1 pre-existing
   unrelated failure as every other phase). Still genuinely unverified:
   every actual keyboard shortcut in the running app (undo/redo, delete,
   select-all, the Patch mode shortcuts, ProjectBrowser's add/rename/
   delete) -- the automated test proves one real combo resolves and
   fires correctly end to end, not that all ~20 of them feel right under
   a real keyboard.

   **DONE (2026-09-03). Deprecated-lifecycle and `element.ref` console
   warnings, once the app was running crash-free enough to see all of
   them clearly.** Not crashes -- React 19 still calls these old
   lifecycle names, just logs once per component type -- but asked for
   by name once the bigger crashes were fixed, and cheap/safe to clear
   since each is a mechanical, behavior-preserving rename. None are our
   own `sdp-client` source (grepped -- confirmed zero hits); all three
   live in dependencies:
   - `rc-menu` (vendored at `vendor/rc-menu`, fully owned): `Menu.jsx`/
     `MenuMixin.js`'s `createReactClass()` objects used
     `componentWillReceiveProps` -- confirmed `create-react-class@15.7.0`
     (the actual installed version) recognizes the `UNSAFE_` prefix
     before renaming, per its own `factory.js`. Renamed in `src`, and in
     the pre-built `es`/`lib` output that's actually what package.json's
     `main`/`module` point to (this vendored package ships build output
     checked into the repo, not rebuilt from `src` on install). Also
     found and fixed, same file: `MenuMixin.js` read `child.ref` directly
     off a cloned element to chain it with its own ref callback -- the
     exact pattern React 19's "Accessing element.ref was removed" warning
     targets. Changed to `child.props.ref` (ref is a regular prop now),
     confirmed correct since the warning itself says the old accessor
     still returns the right value today, just deprecated.
   - `react-remarkable` (plain npm dependency): `componentWillUpdate` in
     its compiled `dist/index.js`. Fixed via `pnpm patch` (`patches/
     react-remarkable@1.1.3.patch`) so the fix survives a fresh install
     rather than editing `node_modules` directly.
   - `react-skylight` (git-hosted fork, pinned commit): same
     `componentWillUpdate`, in both `lib/skylight.js` (what `main`
     resolves to) and `src/skylight.jsx`. Also fixed via `pnpm patch`
     (`patches/react-skylight@0.4.2.patch`) -- a git dependency still
     resolves to a real version pnpm can patch, same mechanism as the
     npm one.

   One real gotcha hit verifying the `rc-menu` fix: `pnpm run build`
   kept showing the *old*, unrenamed code even after multiple rebuilds
   (`--force` included) -- traced to pnpm having copied `vendor/rc-menu`
   into its content-addressable store at the last install rather than
   symlinking it, so edits to the vendored files directly didn't
   propagate until a real `pnpm install` re-synced the copy. Confirmed
   fixed by grepping the actual built `bundle.js` for the new code
   (`UNSAFE_componentWillReceiveProps`, `child.props.ref`) after
   reinstalling, not just trusting a clean build log -- the exact kind of
   "verify by reading the artifact, not by assuming" discipline used
   throughout this plan. (That reinstall separately surfaced an unrelated
   `fsevents` build-script-approval prompt pnpm auto-inserted into
   `pnpm-workspace.yaml` as a placeholder; resolved the same way
   `@parcel/watcher` already was in that file -- `false`, since it's a
   macOS-only optional native accelerator with a standard JS fallback,
   irrelevant on this Linux dev machine.)

   Separately, not a lifecycle warning: reselect v5 (bumped in this
   migration's react-redux phase) added a dev-only "input stability
   check" that calls each `createSelector`'s input selectors twice and
   warns if they return different references -- and much of this
   codebase's selectors return fresh `ramda-fantasy` `Maybe`/`Either`
   wrapper instances by design (e.g. `getCurrentTabId`), which are never
   referentially stable even when the underlying value hasn't changed.
   Rather than refactor every such selector (real scope creep for a
   dev-only console message with zero production effect), called
   reselect's own documented escape hatch once, in `Root.jsx` before the
   store/any selector is ever used: `setGlobalDevModeChecks({
   inputStabilityCheck: 'never' })`.

   Verified: full build (18/18, same known warnings, no new ones -- the
   one remaining `rc-trigger` `findDOMNode` warning is the *other*,
   still-open rc-menu issue below, unrelated to what was fixed here),
   lint clean, `sdp-client` unit suite 105/106 (same 1 pre-existing
   unrelated failure). Confirmed via grepping both the electron and
   browser `bundle.js` output directly for the renamed methods, not just
   a clean build log.

   **DONE (2026-09-03). The "AttachmentEditor panel stays visible/takes
   up half the workspace" bug**, reported once the app was running well
   enough for the user to actually click around. Not a React 19 issue at
   all -- took several rounds of remote debugging (a red herring
   `HotkeysScope` default-export miss that turned out unrelated, a real
   `.turbo` staleness problem below that masked whether fixes were even
   being tested) before the user found the actual cause directly in
   devtools: react-reflex's own stylesheet has `.reflex-container
   .reflex-element > div { display: block; width: 100%; }`.
   `Editor.jsx`'s `.AttachmentEditors` div is a direct child of the
   Workarea `ReflexElement`, so it matches that selector too -- and
   `.reflex-container .reflex-element > div` (2 classes + 1 type
   selector) is *more specific* than `.AttachmentEditors.hidden` (2
   classes, no type selector) alone, so react-reflex's `display: block`
   won regardless of the `hidden` class being correctly present on the
   element the whole time. Fixed with `display: none !important` (an
   existing pattern elsewhere in this codebase, e.g. `Node.scss`, for
   exactly this "must always win over ancestor/library CSS" case) on
   `.AttachmentEditors.hidden`. Separately, also made the panel's
   `hidden` class derive directly from whether `attachmentEditorTabs`
   has an entry for the current tab, instead of a separately-computed
   `currentTab.editedAttachment` check -- the two should always agree,
   but deriving visibility from the same data that decides content
   removes a category of drift risk regardless.

   Also surfaced and fixed along the way: a `.turbo` build cache (921MB,
   accumulated across many rebuilds this session) was silently serving a
   stale `bundle.js` to `pnpm start` -- `turbo`'s `start` task depends on
   `build`, and a cache hit skips rebuilding, so even a full Electron
   quit-and-relaunch kept loading old code. This is what made the actual
   CSS bug look unfixable for several rounds: verifying a fix by
   rebuilding and grepping the bundle in one terminal doesn't guarantee a
   *separate* `pnpm start` invocation rebuilds too, if turbo believes its
   cache is still valid. Cleared `.turbo` and rebuilt clean (`0 cached`)
   once identified.

   Verified: full build (18/18), lint clean, `sdp-client` unit suite
   105/106 (same 1 pre-existing unrelated failure). Confirmed via
   grepping the actual rebuilt `bundle.js` for the compiled
   `!important` rule, not just a clean build log -- given the `.turbo`
   staleness issue just found, treating "the build succeeded" as proof
   of anything stopped being good enough this session.
   **DONE (2026-09-03, no rewrite needed). `react-contextmenu` 2.14.0,
   verified compatible with React 19 as-is.** The plan's original
   estimate (7 files, replace it) was written from its abandoned status
   and React-16-capped peer dep alone, before this branch's "verify
   empirically, don't assume" discipline had actually been applied to it.
   Reading its real source first: its `Trigger`/`Menu`/`MenuItem`
   components are plain ES6 classes (no hooks, so the separate `react@16`
   peer instance pnpm resolves for it -- visible in its own
   `node_modules/.pnpm` folder name -- can't cause an "Invalid hook call"
   cross-version bug; webpack's own `resolve.alias.react` forces every
   `import React` in the whole bundle to the same real instance anyway,
   regardless of what any package's peer dep claims), a `ref` callback
   for popup positioning (not `findDOMNode`), and Trigger<->Menu
   communication via a plain `window.dispatchEvent(new CustomEvent(...))`
   / `addEventListener` pair -- entirely React-version-agnostic, no
   Context involved at all. Grepped its `es6` build for every
   React-19-removed/deprecated API name -- zero hits.

   Verified, not just inferred: `test/reactContextmenu.spec.js` mounts a
   real `ContextMenuTrigger`/`ContextMenu`/`MenuItem` set under React 19
   and fires an actual native `contextmenu` DOM event on the trigger,
   asserting the popup's `nav[role="menu"]` gains the
   `react-contextmenu--visible` class and that clicking the rendered
   `MenuItem` fires its `onClick`. Two real gotchas surfaced writing it:
   its CJS build uses the same getter-based named-export pattern already
   hit with `react-skylight` (`import { ContextMenu } from
   'react-contextmenu'` doesn't statically resolve; default-import the
   module object and destructure at runtime instead); and its
   `globalEventListener` module is a singleton
   (`export default new GlobalEventListener()`) that binds
   `window.addEventListener` as an import-time side effect, so the usual
   "set `global.window` inside the test body" pattern doesn't work here
   -- needed a dynamic `import()` inside a `before()` hook, deferred
   until after the jsdom globals are set, instead of a static top-level
   import.

   Verified: full build (18/18), lint clean, `sdp-client` unit suite
   107/108 (added 1, same 1 pre-existing unrelated failure as every other
   phase). No source changes at all for this item -- the fix was
   recognizing a fix wasn't needed.
8. **Vendored/forked packages**: `rc-menu`, `react-autosuggest`,
   `react-custom-scroll`.

   **DONE (2026-09-03). `rc-menu`'s `rc-trigger` dependency: 2.6.5 ->
   5.3.4, plus patching two of rc-menu's own `findDOMNode` calls
   underneath it.** The confirmed-since-phase-4 build warning
   (`rc-trigger`'s submenu-positioning code calling the removed
   `ReactDOM.findDOMNode`) turned out to need two layers of fixing, both
   found by writing a real test rather than trusting a clean build log:

   First, rc-trigger itself: bumped from 2.6.5 (rc-menu's original pin)
   to the latest 5.3.4 (peer dep `react: >=16.9.0`, and its `TriggerProps`
   type still has every prop rc-menu's `SubMenu.jsx` passes -- confirmed
   by reading the actual `.d.ts`, not assumed). This made the build
   warning disappear, but a real mount-and-open test still crashed at
   runtime: rc-trigger 5's own `getRootDomNode()` falls back to the real
   `ReactDOM.findDOMNode` whenever its internal `triggerRef` isn't set
   yet at call time (a timing edge case on first open) -- fixed by
   passing its own documented escape hatch, `getTriggerDOMNode={node =>
   node}`, in `SubMenu.jsx` (`title`, the element it wraps, is always a
   plain DOM node already).

   That surfaced a *second*, unrelated `findDOMNode` call already
   present in rc-menu's own code (not rc-trigger's): `SubMenu.jsx`'s
   `componentDidUpdate` used `ReactDOM.findDOMNode(this.menuInstance)`
   for a min-width layout adjustment, and `MenuMixin.js`'s `onKeyDown`
   used it twice more (`findDOMNode(activeItem)`, `findDOMNode(this)`)
   for scroll-into-view on arrow-key navigation. Fixed by adding a
   `domRef` prop to `DOMWrap` (rc-menu's internal `<ul>`/`<div>` wrapper,
   itself a class component that can't forward a bare `ref` the way a
   function component could) so `MenuMixin.renderRoot` can save
   `this.rootDomNode` directly, and a plain `ref` callback on
   `MenuItem`'s own `<li>` saving `this.rootDomNode` the same way --
   replacing every `findDOMNode(instance)` call with
   `instance.rootDomNode`, the pattern already used for `withDropTarget`
   (react-dnd) and `TabsItem` (react-sortable-hoc) earlier in this plan.
   Edited in all three of rc-menu's shipped forms (`src`, the `es`/`lib`
   builds `package.json` actually points at) since this vendored package
   ships pre-built output rather than rebuilding from `src` on install.

   Verified: `test/rcMenuSubmenu.spec.js` mounts a real horizontal
   `Menu`+`SubMenu` (matching `Menubar.jsx`'s actual usage) and opens the
   submenu via a real native `mouseover` event (React's synthetic
   `onMouseEnter` is implemented on top of the bubbling `mouseover`
   event, not the non-bubbling `mouseenter` -- dispatching the latter
   silently does nothing, an easy mistake caught by the assertion still
   failing after the real fix was in). Confirms the popup's `MenuItem`
   content actually renders, not just that nothing throws. Writing it
   also surfaced one more test-environment-only gap: `rc-align` (used by
   rc-trigger for popup positioning) checks `instanceof Element` --
   real ambient global in a browser, but jsdom only puts it on `window`
   (same class of gap as `Document`/`ShadowRoot` in the `HotkeysScope`
   test) -- needed `global.Element`/`HTMLElement`/`Node` set explicitly.

   **DONE (2026-09-03). `react-autosuggest`: one deprecated-lifecycle
   warning, patched.** `componentWillReceiveProps` in its compiled
   `dist/Autosuggest.js` -- a warning only, not a crash, since React 19
   still calls old-named lifecycle methods. Renamed to
   `UNSAFE_componentWillReceiveProps` via `pnpm patch`
   (`patches/react-autosuggest@9.3.2.patch`), same mechanism already used
   for `react-skylight`/`react-remarkable` (a git-hosted dependency still
   resolves to a real version pnpm can patch).

   **DONE (2026-09-03). `react-custom-scroll`: three real
   `ReactDOM.findDOMNode` calls, patched.** Unlike `react-autosuggest`'s
   warning, this one crashes: `isMouseEventOnCustomScrollbar` and
   `calculateNewScrollHandleTop` called `findDOMNode(this)` for the
   component's own root element, and `isMouseEventOnScrollHandle` called
   `findDOMNode(this.scrollHandle)` -- redundant even before React 19,
   since `scrollHandle` is already a real DOM node (saved via the
   component's own `setRefElement` ref helper, the same pattern already
   used for `innerContainer`/`contentWrapper`). Read the package's own
   readable `src/main/customScroll.js` (shipped alongside the minified
   `dist/reactCustomScroll.js` that's actually consumed) to get the exact
   semantics right before hand-editing the minified file: added
   `ref={this.setRefElement('rootDomNode')}` to the component's own outer
   `<div>` (reusing its existing ref helper, no new pattern needed) and
   replaced all three `findDOMNode` calls with the already-saved
   `this.rootDomNode` / `this.scrollHandle` directly. Patched via `pnpm
   patch` (`patches/react-custom-scroll@3.2.2.patch`; a first sed-based
   edit accidentally referenced a constructor-local variable (`o`) from
   inside `render()`, where it doesn't exist -- caught before committing
   the patch by re-grepping the edited file, not assumed correct just
   because the substitution succeeded).

   Verified: `test/reactCustomScroll.spec.js` mounts a real `CustomScroll`
   with tall content and dispatches a real `mousedown` on its outer
   container (jsdom computes no real layout, so `getBoundingClientRect`
   needed stubbing -- same workaround as the react-dnd test) -- asserts
   the handler completes without the synchronous crash the old code threw
   immediately. This package's own UMD wrapper also reads `window` as a
   module-load-time side effect, needing the same dynamic-`import()`-in-
   `before()` pattern as `react-contextmenu`'s `globalEventListener`.

   All three verified together: full build (18/18, **zero warnings at
   all** -- confirmed by grepping the fresh, `.turbo`-cache-cleared build
   log directly, not trusting a summary line), lint clean, `sdp-client`
   unit suite 108/109 (added 2 more since the rc-menu test, same 1
   pre-existing unrelated failure as every phase before it).

## A separate, unrelated bug class found along the way: `React.memo` silently drops `defaultProps`

**FIXED (2026-09-03) for the 3 instances that had a live crash/behavior
risk.** Not a React 19 regression -- verified this is true under React
19.2.8 too, but would have behaved identically under React 16: when a
function component sets `Component.defaultProps = {...}` and is then
exported as `React.memo(Component, ...)` (this codebase's `pureDeepEqual`
helper does exactly this), React never applies the defaults, because they
live on the pre-memo function object, not on the `React.memo()` wrapper
object that actually gets used as the JSX `type`. Confirmed empirically
with a minimal repro (`React.memo(Foo, ...)` where `Foo.defaultProps =
{value: 'DEFAULT'}` renders `undefined`, not `'DEFAULT'`) before assuming
this was a new React 19 break -- it is not; plain function components
(unwrapped) still fully support `defaultProps` in React 19.2.8, also
confirmed empirically.

Surfaced as a real crash once the react-hotkeys fix let the app render
far enough to reach it: `NodesLayer.jsx` (wrapped in `pureDeepEqual`) had
`defaultProps = { nodeValues: {} }`, and `selecting.jsx`'s `<Layers.Nodes>`
call never passes `nodeValues` -- so it was `undefined`, not `{}`, and
`R.prop(node.id, nodeValues)` threw `Cannot read properties of undefined
(reading '<nodeId>')`.

Grepped the whole `sdp-client` src for every `.defaultProps =` assignment
(40 files) and cross-referenced against `React.memo`/`pureDeepEqual`
wrapping to find which ones are actually silently broken (most of the 40
are plain function or class components, unaffected). Found and fixed 3:
`NodesLayer.jsx` (the crash above), `CommentsLayer.jsx` (`areDragged`
defaulting to `undefined` instead of `false` -- no crash, just a
prop-type/behavior nuance), and `debugger/containers/DebuggerTopPane.jsx`
(defaulted props never actually exercised by its one caller, which always
passes all of them explicitly -- fixed anyway as dead-but-wrong code found
in the same sweep). All three fixed the same way: moved the defaults from
`Component.defaultProps` into JS default parameters on the destructured
function signature, which works regardless of any later `memo`/HOC
wrapping since it's resolved by the JS call itself, not by React's
element-creation-time prop merging.

Verified: full build (18/18, same known warnings, no new ones), lint
clean, `sdp-client` unit suite 105/106 (same 1 pre-existing unrelated
failure as every other phase -- none of these 3 components had prior test
coverage exercising the missing-prop path). Not otherwise touched: the
other 37 files with `.defaultProps` -- confirmed not wrapped in
`memo`/`pureDeepEqual`, so their defaults apply correctly as-is.

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
