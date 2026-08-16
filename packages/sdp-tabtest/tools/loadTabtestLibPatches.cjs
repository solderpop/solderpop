const fs = require('fs');
const path = require('path');
const R = require('ramda');

const XP = require('sdp-project');
const { loadProject } = require('sdp-fs');

const pathToTabtestLib = path.resolve(
  __dirname,
  '../workspace/__lib__/xod/tabtest'
);
// A real .js module (named export, generated below) rather than the raw
// .json: ReScript's %%raw blocks don't parse the "with { type: 'json' }"
// / "assert { type: 'json' }" import-attribute syntax real Node ESM
// requires for bare JSON imports (confirmed empirically -- both forms are
// hard parse errors in ReScript's raw-block tokenizer), and this data
// also needs to work bundled into the browser app (sdp-tabtest is pulled
// into sdp-client-browser), where a fs.readFileSync-based workaround
// doesn't exist as an option at all. A plain module with a named export
// needs no attribute and works identically under Node, webpack, and
// ReScript's `@module("path") external x = "fieldName"` binding form
// (see Tabtest.res).
const targetPath = path.resolve(__dirname, '../lib/tabtestLibPatches.js');

loadProject([], pathToTabtestLib).then(project => {
  const tabtestLibPatches = R.compose(
    R.map(
      R.over(
        R.lens(XP.getPatchPath, XP.setPatchPath),
        R.replace('@', 'xod/tabtest')
      )
    ),
    XP.listLocalPatches
  )(project);

  const source = `export const tabtestLibPatches = ${JSON.stringify(tabtestLibPatches, null, 2)};\n`;
  fs.writeFileSync(targetPath, source);
  process.exit(0);
});
