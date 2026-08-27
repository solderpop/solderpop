// Node's native ESM loader only recognizes a fixed set of extensions
// (.js, .mjs, .cjs, .json, .wasm, .node) and hard-errors on anything else
// -- including .jsx -- before it even gets to parsing content. That check
// happens in Node's own module-format detection, which @babel/register's
// require.extensions hook (used everywhere else in this repo to transform
// JSX for mocha) cannot reach: that hook only fires for CommonJS
// require(), and mocha loads test files (and everything they reach via
// static `import`) through Node's native `import()` now that this package
// is "type": "module".
//
// This is a Node module customization hook (see
// https://nodejs.org/api/module.html#customization-hooks): it intercepts
// loading of any .jsx file and pipes it through Babel first, handing Node
// back real JS. Doesn't need a matching `resolve` hook -- Node's default
// resolver doesn't reject unknown extensions, only `load`'s format
// detection does, and every .jsx import in this package's source is
// written with the extension explicit (no extension-guessing needed).
import { transformSync } from '@babel/core';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

export async function load(url, context, nextLoad) {
  if (url.endsWith('.jsx')) {
    const filePath = fileURLToPath(url);
    const source = readFileSync(filePath, 'utf8');
    const { code } = transformSync(source, {
      filename: filePath,
      presets: ['@babel/preset-react', ['@babel/preset-env', { modules: false }]],
      babelrc: false,
      configFile: false,
    });
    return { format: 'module', source: code, shortCircuit: true };
  }
  return nextLoad(url, context);
}
