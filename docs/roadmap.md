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

Full scope written up separately: `docs/react-19-migration-plan.md`. The
short version -- this list (`ReactDOM.render`, `react-redux`,
`react-codemirror`, `react-skylight`, lifecycle methods, string refs) was
the first pass, found by grepping for the well-known React-18-removal
landmines. A full pass over `sdp-client`'s dependency list turned up a much
longer tail: `react-dnd` (decorator API, needs a hooks rewrite),
`react-contextmenu` and `react-hotkeys` (both abandoned, capped at React
16, need replacing or careful major-version verification), `react-sortable-hoc`,
`react-event-listener`, `recompose`, plus 3 files still on the legacy
Context API (`contextTypes`, fully removed in React 19, not just
deprecated). Multi-week effort, not a single session -- see the plan doc
for the phase order and per-library detail.

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
