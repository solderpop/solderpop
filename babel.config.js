// Babel 7+ only; babel-core@6 (still used by unmigrated packages) never
// looks for this file, so it has no effect until a package's own toolchain
// is on @babel/core 7.
//
// Lets each package's own .babelrc keep applying even when a file is
// required across a package boundary (e.g. a test importing another
// package's raw, untranspiled test helpers) -- see tools/babel-register.js.
module.exports = {
  babelrcRoots: ['.', 'packages/*'],
};
