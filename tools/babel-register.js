// Shared @babel/register bootstrap for package test suites.
//
// Resolved from process.cwd() (the invoking package's directory), not from
// this file's own location: this file lives at the repo root, so a plain
// require('@babel/register') would always load whichever version is
// hoisted to the root -- silently ignoring a package's own locally-pinned
// @babel/register (e.g. a package on Babel 8 while most of the repo is
// still on Babel 7). require.resolve's `paths` option walks up from cwd
// first, finding the package-local install before falling back to root.
const registerPath = require.resolve('@babel/register', {
  paths: [process.cwd()],
});

// rootMode: 'upward' makes Babel search up from the package's cwd for the
// repo-root babel.config.js, so cross-package requires of another
// workspace package's raw source (e.g. shared test helpers) still get
// transformed via that package's own .babelrc instead of being skipped.
//
// ignore (explicit): @babel/register defaults to only transforming files
// under its own cwd when neither `only` nor `ignore` is set, which would
// silently skip -- not transform -- any file required from a sibling
// workspace package. Setting `ignore` here (matching the repo-wide
// convention of excluding node_modules) turns that default off.
//
// cache disabled: a cross-package file transformed (or skipped) under one
// package's config can otherwise be served stale to a different package
// requiring the same file under a different root/config.
process.env.BABEL_DISABLE_CACHE = '1';
// See the require.resolve comment above for why this can't be a static path.
// eslint-disable-next-line import/no-dynamic-require, global-require
const registerModule = require(registerPath);
// Babel 7's @babel/register exports the register function directly
// (callable, with .default pointing back at itself for interop). Babel 8's
// is ESM-compiled-to-CJS, so the callable lives under .default instead.
const register =
  typeof registerModule === 'function'
    ? registerModule
    : registerModule.default;
register({ rootMode: 'upward', ignore: [/node_modules/] });
