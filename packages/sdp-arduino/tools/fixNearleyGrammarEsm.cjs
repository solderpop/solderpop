// nearleyc emits a UMD wrapper ("typeof module !== 'undefined' ? ... :
// window.grammar = grammar"). It's valid JS syntax, so ESM's parser
// accepts it, but it crashes at runtime under real Node ESM -- `window`
// is a browser-only global, not defined in Node, and the `module`
// CommonJS global doesn't exist in an ES module either. nearleyc has no
// ESM output option (checked: `nearleyc --help`), so post-process its
// output instead of fighting the generator. Turns:
//   (function () { ... ; if (typeof module ...) { module.exports = grammar; } else { window.grammar = grammar; } })();
// into:
//   const parserGrammar = (function () { ... ; return grammar; })();
//   export default parserGrammar;
//
// The .ne source's `@{% %}` preamble also plain `require()`s its deps
// (implementationGrammar.ne uses moo/ramda) -- copied verbatim into the
// generated file by nearleyc, same "valid syntax, crashes under real
// ESM" problem, since `require` isn't a global there either. Hoists any
// `const X = require("Y");` lines found just inside the IIFE into real
// top-level `import X from "Y";` statements above it -- the IIFE still
// sees X via closure, so nothing inside the grammar body needs to change.
const fs = require('fs');

const targetPath = process.argv[2];
if (!targetPath) {
  console.error('Usage: node fixNearleyGrammarEsm.cjs <path-to-generated-grammar.js>');
  process.exit(1);
}

let content = fs.readFileSync(targetPath, 'utf8');

const openPattern = '(function () {';
const openIndex = content.indexOf(openPattern);
if (openIndex === -1) {
  throw new Error(`Expected nearleyc's UMD opening "${openPattern}" not found in ${targetPath}`);
}

const requireRe = /^const (\w+) = require\("([^"]+)"\);\n/gm;
const imports = [];
const bodyStart = openIndex + openPattern.length;
const bodyAfterOpen = content.slice(bodyStart);
const bodyWithoutRequires = bodyAfterOpen.replace(requireRe, (m, varName, pkg) => {
  imports.push(`import ${varName} from '${pkg}';`);
  return '';
});

content =
  (imports.length ? imports.join('\n') + '\n\n' : '') +
  content.slice(0, openIndex) +
  'const parserGrammar = (function () {' +
  bodyWithoutRequires;

const closeRe =
  /if \(typeof module !== 'undefined'&& typeof module\.exports !== 'undefined'\) \{\n {3}module\.exports = grammar;\n\} else \{\n {3}window\.grammar = grammar;\n\}\n\}\)\(\);\n?$/;
if (!closeRe.test(content)) {
  throw new Error(`Expected nearleyc's UMD closing block not found in ${targetPath}`);
}
content = content.replace(closeRe, 'return grammar;\n})();\n\nexport default parserGrammar;\n');

fs.writeFileSync(targetPath, content);
