// babel-plugin-inline-import turns `import X from './y.cpp'` into
// `const X = "...file content...";` at Babel-transform time. That only
// works when Babel actually processes the importing file -- true under
// CommonJS (every file went through @babel/register's require() hook,
// no exceptions), false under ESM: mocha's native-import()-driven test
// loading resolves the whole static `import` graph via Node's own ESM
// loader, which never runs Babel at all and chokes on the unknown .cpp/.h
// extension outright. Rather than depend on "does Babel happen to touch
// this file", pre-generate real, plain .js modules from the .cpp/.h
// sources as a build step -- ordinary `export default "...";`, valid
// under any loader, no plugin required at import time.
const fs = require('fs');
const path = require('path');

const platformDir = path.resolve(__dirname, '../platform');

function walk(dir) {
  let out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out = out.concat(walk(full));
    else if (/\.(cpp|h)$/.test(entry.name)) out.push(full);
  }
  return out;
}

for (const sourcePath of walk(platformDir)) {
  const content = fs.readFileSync(sourcePath, 'utf8');
  const outPath = `${sourcePath}.js`;
  fs.writeFileSync(outPath, `export default ${JSON.stringify(content)};\n`);
}
