/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const R = require('ramda');

const { explodeEither } = require('sdp-func-tools');
const XP = require('..');

const targetPath = path.resolve(__dirname, '../dist/built-in-patches.json');
const solderballPath = path.resolve(
  __dirname,
  '../built-in-patches.solderball'
);

// Load solderball, convert to Map PatchPath Patch
const patches = R.compose(
  R.indexBy(XP.getPatchPath),
  R.map(
    R.over(
      R.lens(XP.getPatchPath, XP.setPatchPath),
      R.replace('@', 'xod/patch-nodes')
    )
  ),
  XP.listLocalPatches,
  explodeEither,
  XP.fromSolderball,
  p => fs.readFileSync(p, 'utf8')
)(solderballPath);

// Verify the build-in-patches.json provides all terminals, they might be
// generated automatically but it’s hard to create a good automatic
// description
R.unless(R.isEmpty, missing => {
  const msg = `${solderballPath} misses some terminal patches: ${missing.join(
    ', '
  )}`;
  console.error(msg);
  process.exit(missing.length);
})(R.difference(XP.BUILT_IN_TERMINAL_PATCH_PATHS, R.keys(patches)));

const json = JSON.stringify(patches, null, 2);

fs.writeFileSync(targetPath, json);
process.exit(0);
