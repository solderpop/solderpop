// Shared @babel/register bootstrap for package test suites.
//
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
require('@babel/register')({ rootMode: 'upward', ignore: [/node_modules/] });
