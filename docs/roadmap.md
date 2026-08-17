# Roadmap

Deliberately-deferred follow-up work identified during the CommonJS -> ESM
migration and the subsequent lint toolchain modernization (see
`docs/esm-migration-plan.md` for the full history). Each item here was a
real, considered trade-off, not an oversight -- deferred because it needed
its own scoped effort rather than being safe to fold into the change that
surfaced it.

## Give `builtInPatches.js` real lint coverage via an isolated Babel parser

`packages/sdp-project/src/internal/builtInPatches.js` is excluded in
`.eslintignore`. The file is correct and its `with { type: 'json' }` import
attribute is required (see the file's own comment for why -- it's the only
form that works both under real Node ESM and when bundled by webpack for
the browser app). The problem is purely that eslint@8's bundled `espree`
parser cannot parse import-attribute syntax at all, at any `ecmaVersion`
setting including `'latest'` -- confirmed by testing every value directly.

The real fix: give this file (or a broader glob, if more files end up
needing it) a different parser via an ESLint `overrides` entry --
`@babel/eslint-parser`, which delegates parsing to Babel's own parser
(which already handles this syntax fine -- it's what actually builds this
file today).

**Why not done now:** `@babel/eslint-parser` needs a real `@babel/core` as
a peer dependency, and this repo's `@babel/core` situation is already a
known, deliberately-mixed one (`sdp-project` and 14 other packages are on
`^8.0.1`; the 3 GUI packages need `^7.29.7` for `@babel/preset-react`
compatibility -- see `tools/babel-register.js`'s own comments). The
eslint-8-compatible `@babel/eslint-parser` releases (7.x line) need
`@babel/core: ^7.x` specifically; the eslint-8-incompatible ones (needing
`eslint: ^9 || ^10`) support `@babel/core: ^8.x`. Installing `@babel/core:
^7.x` as a plain root devDependency risks flipping yarn's hoisting
resolution and destabilizing the already-fragile mixed setup (this is the
same root cause as the pre-existing, already-documented `test-func` Babel
version conflict).

**The safe way to do it:** package it the same way as
`tools/eslint-plugin-sdp-fp/` -- a small, self-contained local package
(its own `package.json`, its own pinned `@babel/core: ^7.x` +
`@babel/eslint-parser: ^7.28.0` dependencies) wired in via the `file:`
protocol, so it gets its own nested `node_modules` and can't influence the
shared root hoisting at all. Then add an `.eslintrc.js` `overrides` entry
pointing `parser` at it, scoped to just the files that need it, and drop
the `.eslintignore` entry.

## Adopt the deferred Airbnb 19 / jsx-a11y rule set

`.eslintrc.js` currently disables a large cluster of rules that fire
hundreds of times across this class-component-heavy codebase --
`react/destructuring-assignment`, `react/require-default-props`,
`react/jsx-props-no-spreading`, the `jsx-a11y` accessibility rules, and
others (see the `.eslintrc.js` comment block above them for the full
list and rationale). These are all real, worthwhile conventions -- just
not something to adopt as a side effect of a lint toolchain version bump.
Revisit deliberately, file by file, especially the `jsx-a11y` rules, each
of which needs an actual UI check per element rather than a blind bulk
fix.

## React 16 -> 19 (Electron needs nothing -- already on the latest, 43.4.0)

Checked directly against npm: Electron is already current, nothing to do
there. React is a different story -- 16.2 -> 19.2.8 is real, substantial
work, not a version bump, with specific confirmed blockers:

- `ReactDOM.render()` -- used in both `sdp-client-browser` and
  `sdp-client-electron`'s entry points (`src/index.jsx`) -- is removed
  entirely in React 18+, replaced by `createRoot()` from
  `react-dom/client`. Both entry points need rewriting.
- `react-redux@^4.x` (all three GUI packages) predates React's own
  Context API entirely. A React-19-compatible version means
  `react-redux@9`, its own multi-major jump (v4 -> 5 -> 6 -> 7 -> 8 -> 9)
  with real breaking changes at nearly every step -- v6 in particular
  rewrote the whole subscription model.
- `react-codemirror@1.0.0` (the CodeMirror editor integration) has a
  peer dependency capping it at `react: >=15.5 <16` and hasn't been
  updated since -- confirmed via `npm view`. It's already technically
  incompatible with the *current* React 16.2 (silently tolerated by
  loose peer-dep enforcement). Nothing newer to bump to; needs replacing
  outright (e.g. `@uiw/react-codemirror` or similar).
- `react-skylight` is a git-pinned fork
  (`xodio/react-skylight#6dc266e...`) this project itself maintains
  against an abandoned upstream. Any React-19 compat fix has to be
  hand-patched into that fork -- no upstream release to pull.
- 9 files still use deprecated lifecycle methods (`componentWillMount`,
  `componentWillReceiveProps`, `componentWillUpdate`); 3 use string refs
  (`ref="..."`). Both still work with warnings today but need real code
  changes, not just suppression -- React 19 tightens behavior around
  both under Strict Mode.

Same shape of decision as the ESLint 9/Biome item below: a real, scoped
effort of its own, not something to fold into shipping v0.0.1.

## ESLint 9/10, or a move to Biome

Covered in detail in `docs/esm-migration-plan.md`'s discussion during the
lint toolchain bump: `eslint-config-airbnb` (even its latest `19.0.4`)
caps this repo at `eslint@8.57.1` -- no version reaches 9 or 10. Two real
paths forward, both out of scope for now:

- Drop official Airbnb for a flat-config-compatible fork
  (`eslint-config-airbnb-extended`, less battle-tested) or hand-assemble a
  flat config from the individual plugins (all of which do support
  eslint 9/10 independently), and do the mandatory flat-config rewrite
  eslint 9+ requires.
- Or replace ESLint + Prettier entirely with Biome -- a bigger, different
  kind of move (own config format, own formatter that would reformat most
  of the codebase, own plugin system requiring the `sdp-fp` rule to be
  ported a second time in a different paradigm, thinner `jsx-a11y`-
  equivalent coverage today). Arguably the more future-proof landing spot
  precisely because it carries no Airbnb-style legacy baggage, but the
  larger and riskier of the two options.

Deprioritized behind shipping v0.0.1.
