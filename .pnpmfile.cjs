// Forked xodio git dependencies (rc-menu, react-autosuggest,
// react-custom-scroll, react-skylight) all carry pre-2016 `rc-tools`-era
// build scripts (prepublish/prepare) that use the ancient `natives`
// package to monkeypatch `fs` -- incompatible with Node >=12's internal
// module loader ("primordials is not defined"). Their git trees already
// ship pre-built lib/ output (the reason git-installable forks of that
// era commit build artifacts at all), so the scripts are unnecessary,
// not just broken. Strip them here instead of trying to get pnpm to run
// them.
const FORKED_XODIO_DEPS = new Set([
  'rc-menu',
  'react-autosuggest',
  'react-custom-scroll',
  'react-skylight',
]);

function readPackage(pkg) {
  if (FORKED_XODIO_DEPS.has(pkg.name) && pkg.scripts) {
    delete pkg.scripts.prepublish;
    delete pkg.scripts.prepare;
    delete pkg.scripts.preinstall;
  }
  return pkg;
}

module.exports = {
  hooks: { readPackage },
};
