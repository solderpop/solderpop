// Rewrites relative `./x.ts(x)` import specifiers to `./x.js` in every
// file the Babel CLI compiles. @babel/preset-typescript's
// rewriteImportExtensions only covers .ts files, but .js/.jsx files import
// TS modules too. Skipped under webpack, which resolves the .ts sources.
const TS_SPECIFIER = /^\.{1,2}\/.*\.tsx?$/;

const rewrite = (source) => {
  if (source && TS_SPECIFIER.test(source.value)) {
    source.value = source.value.replace(/\.tsx?$/, '.js');
  }
};

const isWebpack = (caller) => caller?.name === 'babel-loader';

module.exports = (api) => {
  if (api.caller(isWebpack)) {
    return { name: 'rewrite-ts-imports', visitor: {} };
  }

  return {
    name: 'rewrite-ts-imports',
    visitor: {
      ImportDeclaration(path) {
        rewrite(path.node.source);
      },
      ExportNamedDeclaration(path) {
        rewrite(path.node.source);
      },
      ExportAllDeclaration(path) {
        rewrite(path.node.source);
      },
      CallExpression(path) {
        const [arg] = path.node.arguments;
        if (
          path.node.callee.type === 'Import' &&
          arg?.type === 'StringLiteral'
        ) {
          rewrite(arg);
        }
      },
    },
  };
};
