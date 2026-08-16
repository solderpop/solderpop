// Babel 7+ only; babel-core@6 configs never look for this file. Every
// package's own toolchain is on @babel/core 7 or 8 now (see
// docs/esm-migration-plan.md), so this always applies.
//
// Lets each package's own .babelrc keep applying even when a file is
// required across a package boundary (e.g. a test importing another
// package's raw, untranspiled test helpers) -- see tools/babel-register.js.
module.exports = {
  babelrcRoots: ['.', 'packages/*'],
};
