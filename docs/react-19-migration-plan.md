# React 16 → 19 migration plan

Status: phases 1-2 of 8 done (see below). Written 2026-09-01 after
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
- `react-collapsible`, `react-highlight-words`, `react-resize-detector`,
  `react-reflex` -- current majors already declare `react: ^19.0.0` support.
  Straightforward bumps.
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
- 2 files on string refs (`ref="name"` instead of a ref object/callback):
  `Catcher.jsx`, `sdp-client-electron/src/view/containers/App.jsx`.
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
3. **Deprecated lifecycle methods + string refs** (11 files combined) --
   still just warnings under 19 today, but blocking for whatever comes
   after 19; do it in the same pass while touching these files anyway.
4. **`react`/`react-dom`/`react-redux`/`redux`/`redux-thunk`/`reselect` bump
   + `createRoot`** -- the actual version flip. Everything above should
   land first so this isn't compiling against a pile of known-broken code
   simultaneously. This is also the point where every library in the
   "likely just needs a bump" table gets its real verification, and where
   the redux subscription-model behavior change becomes checkable.
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
   actually runs on React 19 far enough to exercise them.

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
